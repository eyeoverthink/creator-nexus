export const STYLES={
 midnight:{canvas:'#0a0e1f',surface:'#141a36',ink:'#f6f7ff',muted:'#8f9ac8',accents:['#ffb703','#4cc9f0','#ff5d8f','#9be564']},
 paper:{canvas:'#f3ecdd',surface:'#fffaf0',ink:'#16130f',muted:'#7a6f5c',accents:['#d62828','#1d4e89','#e09f00','#2a7f62']},
 signal:{canvas:'#05070a',surface:'#10161d',ink:'#eef6f2',muted:'#7d9a8c',accents:['#00f5a0','#00d9f5','#ff4d6d','#ffe14d']},
};
export const CARD_TYPES=['title_card','hero_stat','keyword_card','bullet_build','spec_table','code_snippet','diagram_flow'];
const words=s=>s.split(/\s+/).filter(Boolean).length;
function pickType(t,i){
 if(i===0)return 'title_card';
 if(/(->|→|\bthen\b|\bleads to\b)/i.test(t))return 'diagram_flow';
 if(/`|\b\w+\([^)]*\)|[{}]|=>|\bconst\b|\bfunction\b/.test(t))return 'code_snippet';
 if(/\d+(\.\d+)?\s*(%|x\b|×|k\b|million|billion|percent)|\$\d/i.test(t))return 'hero_stat';
 if(t.includes(':')&&t.split(/[,;]/).length>=2)return 'spec_table';
 if(t.split(/,|;|\band\b/).length>=3)return 'bullet_build';
 return words(t)<=7?'keyword_card':i%2?'bullet_build':'keyword_card';
}
export function buildCards(narration){
 return narration.replace(/\s+/g,' ').trim().split(/(?<=[.!?])\s+/).filter(Boolean).slice(0,40).map((text,i)=>({index:i+1,card_type:pickType(text,i),text,duration_s:Math.max(2.5,+(words(text)*0.38).toFixed(1))}));
}
export function timeline(cards,total){
 const sum=cards.reduce((s,c)=>s+c.duration_s,0),k=total&&sum?total/sum:1;let t=0;
 return cards.map(c=>{const d=c.duration_s*k,start=t;t+=d;return {...c,duration_s:+d.toFixed(2),start,end:t};});
}