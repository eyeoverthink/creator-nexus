// Runnable entries are limited to capabilities the workflow runner actually executes.
export const BASE_CATALOG=[
 {type:'input',group:'Inputs',label:'Text input',kind:'runnable',description:'Starting text or brief you type into the node.',inputs:[],output:'text'},
 {type:'agent:researcher',group:'Agents',label:'Scout · Researcher',kind:'runnable',agent:'researcher',description:'Hosted research agent. Returns pipeline-ready angles and inspiration cards.',inputs:['text','guidance'],output:'text',hosted:true},
 {type:'agent:writer',group:'Agents',label:'Scribe · Writer',kind:'runnable',agent:'writer',description:'Hosted writing agent. Returns a complete rewritten draft proposal.',inputs:['text','guidance'],output:'text',hosted:true},
 {type:'agent:strategist',group:'Agents',label:'Pulse · Strategist',kind:'runnable',agent:'strategist',description:'Hosted analysis agent. Returns a Markdown fit report and experiments.',inputs:['text','guidance'],output:'text',hosted:true},
 {type:'output',group:'Outputs',label:'Result preview',kind:'runnable',description:'Collects the incoming text so you can read and copy the final result.',inputs:['text'],output:null},
 {type:'tool:elevenlabs',group:'App tools',label:'ElevenLabs voice',kind:'runnable',description:'Speaks the incoming text with your default ElevenLabs voice and saves the MP3 privately to your Library. Uses your ElevenLabs characters.',inputs:['text'],output:null},
 {type:'tool:tts',group:'App tools',label:'Kokoro voice (Tools panel)',kind:'catalog',description:'Text-to-speech through the VPS runner. Available in the Studio Tools panel; not yet a workflow step.',inputs:['text'],output:'audio'},
 {type:'tool:render',group:'App tools',label:'HyperFrames render (Tools panel)',kind:'catalog',description:'Narration-to-video rendering through the VPS runner. Available in the Studio Tools panel; not yet a workflow step.',inputs:['text'],output:'video'},
 {type:'tool:director',group:'App tools',label:'Director Lab scene plan',kind:'catalog',description:'Scene planning in Director Lab; not yet a workflow step.',inputs:['text'],output:'scene plan'},
];
export const skillEntry=s=>({type:`skill:${s.id}`,group:'Skills',label:s.name,kind:'guidance',skillId:s.id,agentScope:s.agent,instructions:s.instructions,enabled:s.enabled,description:s.instructions.slice(0,220),inputs:[],output:'guidance'});
export const KIND_LABEL={runnable:'Runs in workflows',guidance:'Instruction-only guidance',catalog:'Listed · not runnable yet'};
export const canConnect=(from,to)=>!!from?.output&&from!==to&&(to?.inputs||[]).includes(from.output);