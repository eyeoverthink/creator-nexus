export default function diffLines(before='',after=''){
 const a=before.match(/[^\n]*\n|[^\n]+$/g)||[],b=after.match(/[^\n]*\n|[^\n]+$/g)||[];
 if(a.length>300||b.length>300)return before===after?[{kind:'same',text:before}]:[{kind:'removed',text:before},{kind:'added',text:after}];
 const table=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)table[i][j]=a[i]===b[j]?table[i+1][j+1]+1:Math.max(table[i+1][j],table[i][j+1]);
 const parts=[];let i=0,j=0;
 const push=(kind,text)=>{const last=parts[parts.length-1];if(last?.kind===kind)last.text+=text;else parts.push({kind,text});};
 while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){push('same',a[i++]);j++;}else if(j<b.length&&(i===a.length||table[i][j+1]>=table[i+1][j]))push('added',b[j++]);else push('removed',a[i++]);}
 return parts;
}