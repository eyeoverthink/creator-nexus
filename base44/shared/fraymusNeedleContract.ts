import {z} from 'npm:zod@4.4.3';
export const needlePinned={model:'Cactus-Compute/needle3',revision:'d6c7d6a2e9655505e0f8e23339356dd1705900eb',engine_version:'3.3.3',weights_sha256:'c9d915eca282ed42d1a09b143b592adb4cc6744ffe2d294adf5cfc5548170c38',library_sha256:'1263c6003dd88b9fcb1904a55985be66858639849309280b42f7764ee5d874d0',wheel_sha256:'b6447b2be7426b7ff3b06360b15a90a8b7870e3fa2275023e20541d5e8d81bdb'};
export function canonicalNeedle(value){if(Array.isArray(value))return '['+value.map(canonicalNeedle).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalNeedle(value[k])).join(',')+'}';return JSON.stringify(value);}
export async function needleDigest(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(typeof value==='string'?value:canonicalNeedle(value)))),b=>b.toString(16).padStart(2,'0')).join('');}
export const needleInput=z.object({prompt:z.string().trim().min(1).max(3000),system:z.string().max(1000).default('Return only a tool call grounded in the supplied input. Do not execute actions.'),max_new_tokens:z.number().int().min(32).max(512).default(256),tools:z.array(z.object({name:z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),description:z.string().max(500),parameters:z.record(z.string(),z.unknown())}).strict()).min(1).max(8)}).strict();
export function validateNeedleSchema(schema,depth=0){
 if(!schema||typeof schema!=='object'||Array.isArray(schema)||depth>4)throw new Error('Tool schema must be an object, at most four levels deep.');
 const allowed=['type','description','properties','required','additionalProperties','items','enum','minimum','maximum','minLength','maxLength','minItems','maxItems'];
 if(Object.keys(schema).some(k=>!allowed.includes(k)))throw new Error('Use simple JSON-schema types, properties, required, enum and numeric/length bounds only.');
 if(!['object','array','string','number','integer','boolean'].includes(schema.type))throw new Error('Unsupported tool schema type.');
 if(schema.description!==undefined&&(typeof schema.description!=='string'||schema.description.length>500))throw new Error('Invalid schema description.');
 if(schema.enum&&(!Array.isArray(schema.enum)||!schema.enum.length||schema.enum.length>30||schema.enum.some(v=>!['string','number','boolean'].includes(typeof v))))throw new Error('Invalid schema enum.');
 for(const k of ['minimum','maximum','minLength','maxLength','minItems','maxItems'])if(schema[k]!==undefined&&(!Number.isFinite(schema[k])||schema[k]<-1e9||schema[k]>1e9))throw new Error('Invalid schema bound.');
 if(schema.type==='object'){
  if(!schema.properties||typeof schema.properties!=='object'||Array.isArray(schema.properties)||Object.keys(schema.properties).length>20||Object.keys(schema.properties).some(k=>!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(k)))throw new Error('Object schemas require at most 20 named properties.');
  if(schema.additionalProperties!==undefined&&schema.additionalProperties!==false)throw new Error('Only additionalProperties:false is supported.');
  if(schema.required!==undefined&&(!Array.isArray(schema.required)||schema.required.some(k=>typeof k!=='string'||!Object.hasOwn(schema.properties,k))))throw new Error('Invalid required properties.');
  Object.values(schema.properties).forEach(v=>validateNeedleSchema(v,depth+1));
 }else if(schema.type==='array')validateNeedleSchema(schema.items,depth+1);
}
export function validateNeedleValue(value,schema){
 if(schema.type==='object')return !!value&&typeof value==='object'&&!Array.isArray(value)&&(schema.required||[]).every(k=>Object.hasOwn(value,k))&&Object.keys(value).every(k=>Object.hasOwn(schema.properties,k)&&validateNeedleValue(value[k],schema.properties[k]));
 if(schema.type==='array')return Array.isArray(value)&&value.length<=(schema.maxItems??32)&&value.length>=(schema.minItems??0)&&value.every(v=>validateNeedleValue(v,schema.items));
 if(schema.enum&&!schema.enum.some(v=>v===value))return false;
 if(schema.type==='string')return typeof value==='string'&&value.length<=(schema.maxLength??3000)&&value.length>=(schema.minLength??0);
 if(schema.type==='boolean')return typeof value==='boolean';
 return typeof value==='number'&&Number.isFinite(value)&&(schema.type!=='integer'||Number.isInteger(value))&&value>=(schema.minimum??-1e12)&&value<=(schema.maximum??1e12);
}
export function cleanNeedleOutput(value,input){
 if(!value||!['call','respond'].includes(value.type)||typeof value.success!=='boolean'||!Array.isArray(value.function_calls)||value.function_calls.length>8)throw new Error('Invalid native response shape.');
 const calls=value.function_calls.map(c=>{if(!c||typeof c!=='object'||Object.keys(c).some(k=>!['name','arguments'].includes(k)))throw new Error('Unapproved native call field.');const tool=input.tools.find(t=>t.name===c.name);if(!tool||!validateNeedleValue(c.arguments,tool.parameters))throw new Error('Native call did not match an approved request schema.');return {name:c.name,arguments:c.arguments};});
 if(value.type==='respond'&&calls.length)throw new Error('Respond turns cannot contain calls.');
 const out={type:value.type,success:value.success,function_calls:calls};
 if(typeof value.error==='string')out.error=value.error.slice(0,500);
 for(const k of ['confidence','prefill_tps','decode_tps','peak_ram_mb'])if(typeof value[k]==='number'&&Number.isFinite(value[k]))out[k]=value[k];
 return out;
}