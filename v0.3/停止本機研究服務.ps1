$ErrorActionPreference = 'Stop'
$targetFile = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'local-service/server.cjs'))
$connections = Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue
foreach ($connection in $connections) {
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)"
    if ($processInfo.Name -eq 'node.exe' -and $processInfo.CommandLine -like '*local-service/server.cjs*') {
        Stop-Process -Id $processInfo.ProcessId
        Write-Output '已停止 CrossScale 本機研究服務。Ollama 保持原狀。'
    }
}
