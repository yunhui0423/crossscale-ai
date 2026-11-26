'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),PORT=Number(process.env.CROSSSCALE_PORT||8787),URL='http://127.0.0.1:'+PORT;
let child;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function health(url){try{const r=await fetch(url,{signal:AbortSignal.timeout(2000)});if(!r.ok)return null;return await r.json();}catch{return null;}}
async function wait(url,test){for(let n=0;n<40;n++){const d=await health(url);if(d&&test(d))return d;await delay(250);}return null;}
function executable(candidates,fallback){return candidates.find(p=>p&&fs.existsSync(p))||fallback;}
function openBrowser(){const edge=executable([process.env['ProgramFiles(x86)']&&path.join(process.env['ProgramFiles(x86)'],'Microsoft/Edge/Application/msedge.exe'),process.env.ProgramFiles&&path.join(process.env.ProgramFiles,'Microsoft/Edge/Application/msedge.exe')],'');const p=edge?spawn(edge,[URL],{windowsHide:false,detached:true,stdio:'ignore'}):spawn('cmd.exe',['/d','/c','start','',URL],{windowsHide:true,detached:true,stdio:'ignore'});p.on('error',e=>console.error('Could not open browser. Open this URL manually: '+URL+' ('+e.message+')'));p.unref();}
async function main(){console.log('CrossScale AI local startup\nThis window starts the service on THIS computer.\nKeep this window open while using the website.\n');
 let tags=await health('http://127.0.0.1:11434/api/tags');let service=await health(URL+'/api/health');
 if(process.argv.includes('--check-only')){console.log(JSON.stringify({node:process.version,ollama:!!tags,models:tags?.models?.map(x=>x.name)||[],researchService:!!service?.version,url:URL}));return;}
 if(!tags){console.log('[1/3] Starting Ollama...');const ollama=executable([process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'Programs/Ollama/ollama.exe')],'ollama.exe');const p=spawn(ollama,['serve'],{windowsHide:true,stdio:'ignore',detached:true});p.on('error',e=>console.error('Ollama could not start: '+e.message));p.unref();tags=await wait('http://127.0.0.1:11434/api/tags',d=>Array.isArray(d.models));}
 if(!tags)throw Error('Ollama is not available on this computer. Install/open Ollama from https://ollama.com/ then retry.');
 console.log('[1/3] Ollama is responding. Models: '+(tags.models||[]).map(m=>m.name).join(', '));
 if(!tags.models?.length)throw Error('No local model installed. Run: ollama pull qwen3:0.6b');
 if(!service?.version){console.log('[2/3] Starting research service on '+URL);fs.mkdirSync(path.join(ROOT,'outputs'),{recursive:true});child=spawn(process.execPath,[path.join(__dirname,'server.cjs')],{cwd:ROOT,env:process.env,windowsHide:true,stdio:['ignore','pipe','pipe']});const logs=fs.createWriteStream(path.join(ROOT,'outputs','startup.log'),{flags:'a'});child.stdout.on('data',b=>{process.stdout.write(b);logs.write(b);});child.stderr.on('data',b=>{process.stderr.write(b);logs.write(b);});child.on('error',e=>console.error(e.message));service=await wait(URL+'/api/health',d=>typeof d.version==='string'&&Array.isArray(d.models));}
 if(!service?.version)throw Error('Research service did not start. See outputs/startup.log. Do not open the browser until this check succeeds.');
 console.log('[2/3] Local research service is responding. Version: '+service.version);console.log('[3/3] READY: '+URL+'\nOpen Local AI Connection and select a model.\nKeep this window open. Press Ctrl+C to stop the service.');
 if(!process.argv.includes('--no-browser'))openBrowser();
 if(child)await new Promise(resolve=>child.once('exit',resolve));else{console.log('An existing research service is already running.');}
}
process.on('SIGINT',()=>{child?.kill();process.exit(0);});
process.on('SIGTERM',()=>{child?.kill();process.exit(0);});
main().catch(e=>{console.error('\nSTARTUP FAILED: '+e.message+'\nPlease share the text in this window.');child?.kill();process.exitCode=1;});
