(function(root){
'use strict';
const text=(x,n=3000)=>typeof x==='string'?x.trim().slice(0,n):'';
const strings=x=>Array.isArray(x)?x.map(v=>text(v)).filter(Boolean).slice(0,12):[];
function signature(E,s,rows=E.enabled(s)){return E.fingerprint({case:s.case,rows});}
function normalize(E,s,result,runId,rows=E.enabled(s)){
 if(!result||!Array.isArray(result.problems)||result.problems.length>8)throw Error('模型輸出缺少 problems 陣列或超過八項');
 const warnings=[];
 const allowed=new Set(rows.map(e=>e.id)),ids=x=>{const a=strings(x);if(a.some(id=>!allowed.has(id)))throw Error('模型引用了未提供或已排除的 Evidence ID');return [...new Set(a)];};
 const problems=result.problems.map((v,i)=>{
 const support=ids(v.support),counter=ids(v.counter),title=text(v.title,200),description=text(v.description),why=text(v.why);
 if(!title||!description||!why||!support.length||E.overclaim(title+' '+description))throw Error('問題缺少支持、發現理由，或含確定因果宣稱');
 const id='AI-P-'+runId+'-'+(i+1),r=rows.filter(e=>support.includes(e.id)),scales=[...new Set(r.map(e=>e.scale))];
 const gaps=strings(v.gaps);if(!gaps.length)gaps.push('需人工確認分母、期間與研究重要性');
 const hs=(Array.isArray(v.hypotheses)?v.hypotheses:[]).slice(0,6).map((h,j)=>{
 const sup=ids(h.support),contra=ids(h.counter),title=text(h.title,200);if(!title||!sup.length||E.overclaim(title))throw Error('候選成因缺少支持或含確定因果宣稱');
 return {id:'AI-H-'+runId+'-'+i+'-'+j,problemId:id,title,type:'MODEL_OUTPUT',inference:'待驗證假說',status:'待驗證',support:sup,counter:contra,alternatives:strings(h.alternatives),gaps:strings(h.gaps).concat(contra.length?[]:['尚未找到反證，不代表沒有反證']),method:text(h.method)||'需研究者設計驗證',indicator:text(h.indicator)||'尚待定義',expected:'若補充資料支持，可繼續調查；不因此確認因果。',reverse:'若出現矛盾或差異消失，降低或排除假說。',limitations:'模型生成，尚未人工驗證；搜尋結果不是實證。',scales:[...new Set(rows.filter(e=>sup.includes(e.id)).map(e=>e.scale))],origin:'AI'};
 });
 const sols=(Array.isArray(v.solutions)?v.solutions:[]).slice(0,6).map((o,j)=>{
 const h=hs[Number(o.hypothesisIndex)],evidence=ids(o.evidence);if(!h||!evidence.length){warnings.push({problemId:id,stage:'方案',index:j,reason:'方案沒有有效候選成因或證據，已隔離，未建立方案或計算效果。'});return null;}
 return {id:'AI-S-'+runId+'-'+i+'-'+j,problemId:id,hypothesisId:h.id,name:text(o.name,200),objective:text(o.objective),evidence,beneficiaries:text(o.beneficiaries),risks:text(o.risks)||'尚待調查',sideEffects:text(o.sideEffects)||'尚待調查',feasibility:text(o.feasibility)||'尚待確認',strategy:'其他案例策略',riskLevel:'未評估',cost:null,effect:null,reach:null,costBasis:'尚無實際報價；請研究者填入依據',effectBasis:'尚無實測效果；不能由模型猜測係數',rationale:text(o.rationale),limitations:'AI 探索性方案；未填成本及效果假設，不執行數值模擬。',type:'MODEL_OUTPUT',origin:'AI'};
 }).filter(Boolean);
 return {id,kind:'ai',origin:'AI',title,description,why,type:'MODEL_OUTPUT',inference:'待驗證假說',support,counter,scales,aligned:new Set(r.map(e=>e.period+'|'+e.geography)).size===1,conflictIds:E.conflicts(rows).filter(a=>a.some(id=>support.includes(id))).flat(),gaps,next:text(v.next)||'人工檢查證據與補充資料',status:s.problemStates[id]||'待驗證',missing:true,method:'C',aiHypotheses:hs,aiSolutions:sols,stageWarnings:warnings.filter(w=>w.problemId===id),runId,alternatives:strings(v.alternatives)};
 });
 return {problems,warnings,summary:text(result.summary),limitations:text(result.limitations)||'模型可能錯誤；尚無獨立實驗支持優越性。'};
}
function current(E,s){return (Array.isArray(s.aiRuns)?s.aiRuns:[]).filter(r=>r&&r.status==='accepted'&&r.caseId===s.case.id&&r.inputKey===signature(E,s)&&Array.isArray(r.accepted?.problems)).at(-1);}
function qualityReasons(e,rows){return [
 {label:'來源定位',detail:e.url?'已記錄網址；並不代表已驗證內容':'缺來源網址'},
 {label:'時間',detail:e.published+' 公布；觀察 '+e.period+'；兩者須分開檢查'},
 {label:'人口分母',detail:e.population||'尚未定義'},
 {label:'原始內容',detail:e.excerpt?'保留原文摘錄與定位，仍需核對數字':'未附原文摘錄；需人工回查'},
 {label:'樣本與缺漏',detail:e.missing||'未填缺漏不代表沒有缺漏；樣本設計仍需確認'},
 {label:'獨立性',detail:rows.filter(r=>r.url&&r.url.split('#')[0]===e.url?.split('#')[0]).length>1?'同一網址有多筆指標，不能當成獨立來源':'網址不同也不一定為獨立調查'}
 ];}
const api={signature,normalize,current,qualityReasons};root.AIResearch=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
