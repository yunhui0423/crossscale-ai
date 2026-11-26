$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
New-Item -ItemType Directory -Path outputs -Force | Out-Null
try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 3 | Out-Null }
catch {
    $ollamaCommand = Get-Command ollama -ErrorAction Stop
    Start-Process -FilePath $ollamaCommand.Source -ArgumentList 'serve' -WindowStyle Hidden -RedirectStandardOutput 'outputs/ollama-serve.log' -RedirectStandardError 'outputs/ollama-serve-error.log'
}
$bundledPython = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
if (Test-Path -LiteralPath $bundledPython) { $env:CROSSSCALE_PYTHON = $bundledPython }
try { Invoke-RestMethod -Uri 'http://127.0.0.1:8787/api/health' -TimeoutSec 3 | Out-Null }
catch {
    $nodeCommand = Get-Command node -ErrorAction Stop
    Start-Process -FilePath $nodeCommand.Source -ArgumentList 'local-service/server.cjs' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput 'outputs/research-service.log' -RedirectStandardError 'outputs/research-service-error.log'
}
Write-Output '本機研究服務啟動中。開啟 http://127.0.0.1:8787 ，在網站選擇「本機 AI 連線」。'
Write-Output '模型運算在本機；首次載入模型可能需要一些時間。關閉電腦後服務即停止。'
