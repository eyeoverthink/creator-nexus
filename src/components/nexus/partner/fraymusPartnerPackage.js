import {downloadPartnerFile,partnerDefaults} from '@/components/nexus/partner/fraymusPartnerStore';
const encode=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
export async function buildPartnerPackage(state){
 const items=await Promise.all(state.items.map(async item=>({...item,blob:undefined,data_base64:item.blob?await encode(item.blob):null})));
 const {name,personality,mood,energy,attentiveness,memory}=state.profile;
 const packet={format:'fraymus.workspace/1',exported_at:new Date().toISOString(),profile:{name,personality,mood,energy,attentiveness,memory},messages:state.messages,emotionHistory:state.emotionHistory,items};
 return new File([JSON.stringify(packet,null,2)],'fraymus-workspace.json',{type:'application/json'});
}
export async function exportPartnerPackage(state,share=false){
 const file=await buildPartnerPackage(state);
 if(share&&navigator.canShare?.({files:[file]})){await navigator.share({title:'Fraymus workspace',files:[file]});return 'Workspace shared through your device.';}
 downloadPartnerFile(file,file.name);return share?'Device file sharing is unavailable; downloaded a portable package to share.':'Portable package downloaded, including original media, conversation and memory.';
}
function boundedText(value,max){if(typeof value!=='string'||value.length>max)throw new Error('Package contains oversized or invalid text.');return value;}
export async function readPartnerPackage(file,current){
 if(file.size>40*1024*1024)throw new Error('Workspace package must be under 40 MB.');
 const data=JSON.parse(await file.text()),defaults=partnerDefaults();
 if(data.format!=='fraymus.workspace/1'&&!(data.memory&&Array.isArray(data.messages)))throw new Error('Choose a Fraymus workspace package or a MyAIPartner state export. ZIP archives are not workspace packages.');
 const legacy=data.format!=='fraymus.workspace/1',profile=legacy?data:data.profile;
 const memory=typeof profile.memory==='string'?profile.memory:JSON.stringify(profile.memory||{},null,2);
 const cleanProfile={...current.profile,name:boundedText(profile.name||defaults.profile.name,60),personality:boundedText(profile.personality||'Supportive',40),memory:boundedText(memory,6000)};
 for(const field of ['mood','energy','attentiveness']){const value=Number(profile[field]??(field==='attentiveness'?profile.clinginess:undefined)??65);if(!Number.isFinite(value)||value<0||value>100)throw new Error('Invalid affect setting.');cleanProfile[field]=value;}
 if(!Array.isArray(data.messages)||data.messages.length>200)throw new Error('Package permits at most 200 messages.');
 const messages=data.messages.map(m=>{if(!['user','assistant'].includes(m.role))throw new Error('Invalid message role.');return {id:crypto.randomUUID(),role:m.role,content:boundedText(m.content??m.text??'',12000),created_at:typeof m.created_at==='string'?m.created_at:new Date().toISOString()};});
 if(!Array.isArray(data.items||[])||(data.items||[]).length>50)throw new Error('Package permits at most 50 content items.');
 let total=0;const items=(data.items||[]).map(item=>{if(!['text','image','audio','video','file'].includes(item.type))throw new Error('Invalid content type.');const mime=boundedText(item.mime||'application/octet-stream',150);let blob;
  if(item.data_base64){const encoded=boundedText(item.data_base64,14000000);if(!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))throw new Error('Invalid file encoding.');const raw=atob(encoded),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));if(bytes.length>10*1024*1024)throw new Error('A file exceeds 10 MB.');total+=bytes.length;blob=new Blob([bytes],{type:mime});}
  return {id:crypto.randomUUID(),title:boundedText(item.title,200),type:item.type,mime,body:boundedText(item.body||'',100000),blob,created_at:new Date().toISOString()};});
 if(total>25*1024*1024)throw new Error('Total media exceeds 25 MB.');
 const emotionHistory=(Array.isArray(data.emotionHistory)?data.emotionHistory:[]).slice(-100).map(e=>({at:boundedText(e.at||'',60),mood:Number(e.mood)||0,energy:Number(e.energy)||0}));
 return {profile:cleanProfile,messages,items,emotionHistory};
}