import runner from '@/components/nexus/emotion/local/fraymus_vocal_analyze.py?raw';
import model from '@/components/nexus/emotion/local/fraymus_ser_model.py?raw';
import features from '@/components/nexus/emotion/local/fraymus_audio_features.py?raw';
import manifest from '@/components/nexus/emotion/local/manifest.json?raw';
import requirements from '@/components/nexus/emotion/local/requirements.txt?raw';
import readme from '@/components/nexus/emotion/local/README.txt?raw';
export default function downloadVocalKit(){
 const files={'fraymus_vocal_analyze.py':runner,'fraymus_ser_model.py':model,'fraymus_audio_features.py':features,'manifest.json':manifest,'requirements.txt':requirements,'README.txt':readme};
 const lines=['$ErrorActionPreference = "Stop"','$dir = Join-Path $PSScriptRoot ("fraymus-vocal-emotion-" + [Guid]::NewGuid().ToString("N"))','New-Item -ItemType Directory -Path $dir | Out-Null'];
 for(const [name,text] of Object.entries(files)){const bytes=new TextEncoder().encode(text);let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);lines.push(`[IO.File]::WriteAllBytes((Join-Path $dir '${name}'), [Convert]::FromBase64String('${btoa(binary)}'))`);}
 lines.push('Write-Host "Extracted local kit to $dir. Nothing was installed or executed."','notepad (Join-Path $dir "README.txt")','Read-Host "Review the README, then press Enter to close"');
 const url=URL.createObjectURL(new Blob([lines.join('\r\n')],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='extract-fraymus-vocal-emotion.ps1';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}