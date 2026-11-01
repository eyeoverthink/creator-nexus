// Original deterministic lexical hypervectors, not pretrained semantic embeddings.
export const FRAYMUS_HDC_ENCODER='fraymus.lexical-hdc/1';
export const FRAYMUS_HDC_DIMENSIONS=4096;
function seed(text){let value=2166136261;for(const character of text){value^=character.codePointAt(0);value=Math.imul(value,16777619);}return value>>>0||1;}
function advance(value){value^=value<<13;value^=value>>>17;value^=value<<5;return value>>>0;}
export function encodeFraymusAssociative(text){
 if(typeof text!=='string'||!text.trim()||text.length>2000)throw new Error('Provide 1–2000 characters of memory text.');
 const words=text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}_]+/gu)||[];
 if(!words.length||words.length>128)throw new Error('Provide 1–128 word tokens; no text is silently truncated.');
 const features=words.map(word=>`word:${word}`);
 for(let i=1;i<words.length;i++)features.push(`pair:${words[i-1]}\u0000${words[i]}`);
 const votes=new Int16Array(FRAYMUS_HDC_DIMENSIONS);
 for(const feature of features){let state=seed(feature);for(let dimension=0;dimension<votes.length;dimension++){state=advance(state);votes[dimension]+=(state>>>31)?1:-1;}}
 const bytes=new Uint8Array(votes.length/8);
 let tie=seed('fraymus.lexical-hdc/1:tie');
 for(let dimension=0;dimension<votes.length;dimension++){tie=advance(tie);if(votes[dimension]>0||(votes[dimension]===0&&(tie>>>31)))bytes[dimension>>3]|=1<<(dimension&7);}
 return {bytes,word_count:words.length};
}
export function packFraymusAssociative(bytes){return btoa(String.fromCharCode(...bytes));}
export function unpackFraymusAssociative(code){
 if(typeof code!=='string'||code.length!==684||!/^[A-Za-z0-9+/]+=$/.test(code))throw new Error('Invalid packed hypervector.');
 const raw=atob(code);if(raw.length!==512)throw new Error('Hypervector must contain exactly 4096 bits.');
 return Uint8Array.from(raw,character=>character.charCodeAt(0));
}
export function compareFraymusAssociative(a,b){
 if(a.length!==512||b.length!==512)throw new Error('Cannot compare incompatible hypervectors.');
 let differences=0;
 for(let i=0;i<a.length;i++){let bits=a[i]^b[i];while(bits){bits&=bits-1;differences++;}}
 return 1-2*differences/FRAYMUS_HDC_DIMENSIONS;
}
export async function digestFraymusAssociative(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),value=>value.toString(16).padStart(2,'0')).join('');}