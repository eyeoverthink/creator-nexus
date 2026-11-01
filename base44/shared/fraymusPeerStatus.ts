export async function readFraymusPeerStatus(){
 const endpoint='https://fraymus-transmuter.base44.app/functions/orificeBridge';
 const started=Date.now();
 const result={peer:'Fraymus Eternal / Transmuter',checked_at:new Date().toISOString(),scope:'reachability_only',authenticated_duplex_confirmed:false};
 try{
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'status'}),signal:AbortSignal.timeout(10000)});
  const reader=response.body?.getReader();
  let size=0,text='';
  const decoder=new TextDecoder();
  if(reader){
   while(true){
    const part=await reader.read();
    if(part.done)break;
    size+=part.value.byteLength;
    if(size>65536){await reader.cancel();return {...result,http_status:response.status,reachable:response.ok,protocol_confirmed:false,note:'Peer replied, but its response exceeded the monitoring limit.'};}
    text+=decoder.decode(part.value,{stream:true});
   }
   text+=decoder.decode();
  }
  let data;
  try{data=JSON.parse(text);}catch{data={};}
  const confirmed=response.ok&&data.pong===true&&data.protocol==='ORIFICE-TXRX-V1.0'&&typeof data.hemisphere==='string'&&data.hemisphere.includes('Hemisphere B');
  return {...result,http_status:response.status,reachable:response.ok,protocol_confirmed:confirmed,round_trip_ms:Date.now()-started,protocol:confirmed?data.protocol:null,note:confirmed?'Peer protocol response received. This does not prove authenticated two-way delivery or active worker capacity.':'Peer protocol not confirmed by this response.'};
 }catch(error){
  return {...result,reachable:false,protocol_confirmed:false,http_status:null,note:error.name==='TimeoutError'?'Peer did not respond within 10 seconds.':'Peer could not be reached from this app.'};
 }
}