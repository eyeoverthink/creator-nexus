import worker from '@/components/nexus/needle/worker/needle_worker.py?raw';
import runtime from '@/components/nexus/needle/worker/needle_runtime.py?raw';
import manifest from '@/components/nexus/needle/worker/installation.json?raw';
export default function downloadNeedleKit(workerId){
 if(!/^[A-Za-z0-9_-]{6,80}$/.test(workerId))throw new Error('Pair a worker first.');
 const files={'needle_worker.py':worker,'needle_runtime.py':runtime,'installation.json':manifest};
 const lines=['$ErrorActionPreference = "Stop"','$dir = Join-Path $PSScriptRoot "fraymus-needle"','New-Item -ItemType Directory -Force -Path $dir | Out-Null'];
 Object.entries(files).forEach(([name,text])=>{const encoded=btoa(String.fromCharCode(...new TextEncoder().encode(text)));lines.push(`[IO.File]::WriteAllBytes((Join-Path $dir '${name}'), [Convert]::FromBase64String('${encoded}'))`);});
 lines.push('$config = Get-Content -Raw (Join-Path $dir "installation.json") | ConvertFrom-Json','$python = $config.python','if (-not (Test-Path $python)) { throw "Pinned Python not found: $python. Update the local installation.json path before launching the worker manually." }',`& $python (Join-Path $dir 'needle_worker.py') --worker-id '${workerId}'`,'if ($LASTEXITCODE -ne 0) { Read-Host "Worker stopped. Review the error above, then press Enter" }');
 const url=URL.createObjectURL(new Blob([lines.join('\r\n')],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='start-fraymus-needle.ps1';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}