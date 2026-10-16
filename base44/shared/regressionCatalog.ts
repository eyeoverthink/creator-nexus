export const version='ols-v1-grouped-holdout';
export const sums=['x1','x2','x3','y','xx11','xx12','xx13','xx22','xx23','xx33','xy1','xy2','xy3','yy','t','tt','ty'];
export const catalogs={
 origin:{title:'Origin experiments',features:[{key:'x1',label:'Planned effort (minutes)',min:1,max:600},{key:'x2',label:'Observation window (hours)',min:1,max:720},{key:'x3',label:'Script length (words)',min:0,max:20000}],metrics:['views','likes','comments','clicks'],note:'Finalized, manually reported experiments. Different platforms and audiences can confound these relationships.'},
 behavior:{title:'Agent behavior',features:[{key:'x1',label:'Original draft (words)',min:0,max:20000},{key:'x2',label:'Net length change (%)',min:-100,max:2000000},{key:'x3',label:'Task length (words)',min:0,max:2000}],metrics:['acceptance'],note:'Actual accepted/rejected draft proposals, not ratings of writing quality. Acceptance is a 0/1 linear estimate, not a calibrated probability.'},
 sandbox:{title:'Learning Lab',features:[{key:'x1',label:'Training rounds',min:1,max:20},{key:'x2',label:'Baseline held accuracy',min:0,max:1},{key:'x3',label:'Baseline novel accuracy',min:0,max:1}],metrics:['held_accuracy'],note:'Browser-reported symbolic-task measurements, not language-model improvement. Vary seeds and rounds; repeated seeds share a validation group.'}
};
export function scope(input){
 const catalog=catalogs[input.source];if(!catalog)throw new Error('Choose Origin, agent behavior, or Learning Lab.');
 const metric=input.metric||catalog.metrics[0],agent=input.agent||'all';
 if(!catalog.metrics.includes(metric)||!['all','writer','researcher','strategist','director'].includes(agent))throw new Error('Invalid regression metric or agent.');
 return {catalog,query:{source:input.source,metric,...(agent==='all'?{}:{agent})},agent,metric};
}
export const words=text=>String(text||'').match(/\S+/g)?.length||0;
export function observation(values){
 const {x1,x2,x3,y}=values;
 if(![x1,x2,x3,y].every(Number.isFinite))throw new Error('Regression inputs must be finite measurements.');
 const time=Date.parse(values.measured_at);if(!Number.isFinite(time))throw new Error('The observation needs a valid measurement date.');
 const t=(time-Date.UTC(2026,0,1))/86400000;
 let hash=2166136261;for(const c of values.group_key)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
 return {...values,partition:hash%5===0?'validation':'train',xx11:x1*x1,xx12:x1*x2,xx13:x1*x3,xx22:x2*x2,xx23:x2*x3,xx33:x3*x3,xy1:x1*y,xy2:x2*y,xy3:x3*y,yy:y*y,t,tt:t*t,ty:t*y};
}