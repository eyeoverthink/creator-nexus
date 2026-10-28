import {lazy} from 'react';
import {Image,ScanSearch,Clapperboard,Mic2,Microscope} from 'lucide-react';
export const studioTools=[
 {id:'photocraft',label:'PhotoCraft',icon:Image,summary:'Resize, adjust, sharpen and convert images in your browser. Free.',Panel:lazy(()=>import('@/components/nexus/studiotools/photocraft/PhotoCraftPanel'))},
 {id:'hypit',label:'Hypit',icon:ScanSearch,summary:'Break a video down shot by shot and get an original script for your own version.',Panel:lazy(()=>import('@/components/nexus/studiotools/hypit/HypitPanel'))},
 {id:'hyperframes',label:'HyperFrames',icon:Clapperboard,summary:'Turn a script into a narrated motion-card video.',Panel:lazy(()=>import('@/components/nexus/studiotools/hyperframes/HyperFramesPanel'))},
 {id:'voice',label:'Voice Studio',icon:Mic2,summary:'Narration with your ElevenLabs voices, built-in voices or Kokoro on your VPS.',Panel:lazy(()=>import('@/components/nexus/studiotools/voice/VoiceStudioPanel'))},
 {id:'rea',label:'REA',icon:Microscope,summary:'Reverse engineer a website, GitHub repo or source files into an evidence-backed rebuild plan.',Panel:lazy(()=>import('@/components/nexus/studiotools/rea/ReaPanel'))},
];