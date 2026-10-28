import HeadroomSignalPort from '@/components/nexus/architecture/HeadroomSignalPort';

const SHA='2716e72dbda853dc293c336d1c5cfbc4a506da30';
const ROWS=[
 ['headroom-node-python/HeadroomNode.py','OpenCV render loop: grid, thought PiP, text, glitch, scanlines, vignette; JSON stdin protocol','Verified (source) · ported below'],
 ['java/fraymus/senses/HeadroomInterface.java','Controller: launches python HeadroomNode.py, pipes {"speak","neural"} JSON','Verified (source) · not compilable alone (missing Fraymus classes)'],
 ['java/fraymus/HeadroomDemo.java, MaxHeadroomDemo.java','Scripted broadcasts calling HeadroomInterface.broadcast()','Verified (source) · requires local Java'],
 ['cpp/*.cpp','Line-by-line Java translations','Blocked · README states g++ fails'],
 ['headroom-node-python/VideoCortex.py, max_headroom_live.py','Stable Diffusion thought frames on CUDA','Local GPU runtime only'],
 ['headroom-v13-live, headroom-iphone','Ollama chat pages + bridge_v3.py','Verified (source) · local Python/Ollama'],
];

export default function HeadroomReaAudit(){
 return <div className="space-y-6">
  <div className="rounded border border-border p-4 space-y-2 text-sm">
   <h2 className="text-lg">REA audit: eyeoverthink/vaughn-headroom</h2>
   <p className="font-mono text-xs text-muted-foreground">Pinned commit {SHA} · main · 33 files · read-only, no code executed</p>
   <p className="text-caution">Finding: this commit contains zero LWJGL, OpenGL, GLFW or shader references. The visual signal is rendered by OpenCV in HeadroomNode.py, driven by Java over stdin. If the LWJGL renderer lives in another repo (e.g. fraymus-systems-standalone), link it to audit next.</p>
  </div>
  <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="p-2">Source</th><th className="p-2">Mechanism</th><th className="p-2">Status</th></tr></thead><tbody>{ROWS.map(r=><tr key={r[0]} className="border-t border-border"><td className="p-2 font-mono text-xs">{r[0]}</td><td className="p-2">{r[1]}</td><td className="p-2">{r[2]}</td></tr>)}</tbody></table></div>
  <div className="space-y-2"><h3 className="font-semibold">Integrated: browser port of the broadcast renderer</h3><p className="text-sm text-muted-foreground">Real working port of render_loop and its effects at 30 FPS. Voice uses browser speech instead of edge-tts; Stable Diffusion thoughts are replaced by a loaded image. Java launch and GPU generation stay local.</p><HeadroomSignalPort/></div>
 </div>;
}