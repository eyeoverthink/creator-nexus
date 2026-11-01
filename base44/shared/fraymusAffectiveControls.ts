// Numerical port of emotionCore.js interoception/appraisal/behavioral controls.
// Values describe a controller, never subjective experience or inferred human emotions.
const clamp=(v,lo=-1,hi=1)=>Math.max(lo,Math.min(hi,v));
const round=v=>Number(v.toFixed(4));
const SETPOINTS={energy:.85,integrity:.95,bond:.88,uncertainty:.22};
// valence, arousal, goal relevance, likelihood, agency, control, fairness.
const WEIGHTS={FEAR:[-.8,.75,-.85,.8,-.4,-.85,-.3],ANGER:[-.65,.85,-.8,.7,-.8,.75,-.85],SADNESS:[-.85,-.35,-.9,.9,-.2,-.9,-.4],JOY:[.9,.45,.9,.85,.4,.6,.7],PRIDE:[.85,.55,.85,.9,.95,.85,.8],CURIOSITY:[.25,.65,.6,.5,.5,.65,.5],AFFECTION:[.8,.25,.85,.8,.6,.7,.9],GRATITUDE:[.8,.35,.85,.85,-.7,.5,.95],GUILT:[-.7,.55,-.8,.85,.9,.5,-.6]};
function requireNumber(n,lo,hi,label){if(!Number.isFinite(n)||n<lo||n>hi)throw new Error(`${label} must be between ${lo} and ${hi}.`);return n;}
export function fraymusAffect(input,previous){
 const b=input.interoception,a=input.appraisal;
 if(!b||!a)throw new Error('Provide measured interoception and an explicit appraisal.');
 for(const key of Object.keys(SETPOINTS))requireNumber(b[key],0,1,key);
 for(const key of ['goalRelevance','agency','control','fairness'])requireNumber(a[key],-1,1,key);
 for(const key of ['likelihood','novelty'])requireNumber(a[key],0,1,key);
 if(typeof input.provenance!=='string'||!input.provenance.trim()||input.provenance.length>300)throw new Error('Provide input provenance, 1–300 characters.');
 const at=Date.parse(input.observed_at);if(typeof input.observed_at!=='string'||!Number.isFinite(at)||!/(Z|[+-]\d{2}:\d{2})$/.test(input.observed_at))throw new Error('Provide an observed_at timestamp including a timezone.');
 if(at>Date.now()+60000)throw new Error('Observation cannot be in the future.');
 const prevAt=previous?Date.parse(previous.observed_at):null;
 if(previous&&(!Number.isFinite(prevAt)||at<=prevAt))throw new Error('Observation must be newer than the retained controller state.');
 const rpe=requireNumber(input.reward_delta??0,-1,1,'reward_delta'),urgency=requireNumber(input.urgency??.25,0,1,'urgency');
 const deviation=Math.sqrt((b.energy-.85)**2*.9+(b.integrity-.95)**2*1.4+(b.bond-.88)**2*1.2+(b.uncertainty-.22)**2*.8);
 const improvement=(previous?.affect?.deviation??.2)-deviation;
 const affect={deviation:round(deviation),improvement:round(improvement),valence:round(clamp(.55-1.45*deviation+.85*improvement+.65*rpe)),arousal:round(clamp(.08+.62*Math.abs(urgency)+.18*b.uncertainty+.16*Math.abs(rpe),.05,1))};
 const up=x=>Math.max(0,x),down=x=>Math.max(0,-x),bad=down(a.goalRelevance),good=up(a.goalRelevance),low=down(a.control),high=up(a.control),self=up(a.agency),other=down(a.agency),unfair=down(a.fairness),fair=up(a.fairness),calm=1-affect.arousal,urgent=affect.arousal;
 const defined={FEAR:bad*low*(.35+.65*a.likelihood)*(.25+.75*urgent),ANGER:bad*other*high*(.35+.65*unfair)*(.4+.6*urgent),SADNESS:bad*low*(.3+.7*calm)*(.4+.6*a.likelihood)*(1-.55*self),JOY:good*(.45+.55*up(affect.valence))*(1-.72*self)*(1-.75*other)*(.55+.45*a.likelihood),PRIDE:good*self*(.35+.65*high),CURIOSITY:a.novelty*(.35+.65*high)*(.4+.6*(.35+.65*urgent))*(bad<.45?1:.25),AFFECTION:good*fair*(.4+.6*calm)*(1-.8*self),GRATITUDE:good*other*fair*(.5+.5*a.likelihood),GUILT:bad*self*(.45+.55*a.likelihood)*(.5+.5*unfair)};
 const decay=previous?Math.pow(.82,(at-prevAt)/60000):0,emotions={};
 const features=[affect.valence,affect.arousal*2-1,a.goalRelevance,a.likelihood*2-1,a.agency,a.control,a.fairness],gains=[.32,.16,.22,.08,.1,.12,.08];
 for(const [key,w] of Object.entries(WEIGHTS)){const dotted=w.reduce((n,v,i)=>n+v*features[i]*gains[i],0),activated=clamp(.82*defined[key]+.18*Math.max(0,dotted),0,1);emotions[key]=round(clamp(Math.max(activated,(previous?.emotions?.[key]??0)*decay*.85+activated*.35),0,1));}
 const e=emotions,dopamine=clamp(.5+.45*rpe+.25*e.JOY+.2*e.CURIOSITY-.2*e.SADNESS,.05,1),serotonin=clamp(.45+.35*b.integrity+.25*b.bond-.3*e.FEAR-.25*e.ANGER,.05,1),norepinephrine=clamp(.3+.5*affect.arousal+.25*e.FEAR+.2*e.CURIOSITY,.05,1);
 const dials={riskBudget:round(clamp(.65-.52*e.FEAR+.25*e.CURIOSITY+.15*e.PRIDE,.05,1)),doubleCheckPasses:1+Math.round(e.FEAR*3+(1-b.integrity)*2),explorationRate:round(clamp(.2+.6*e.CURIOSITY+.2*dopamine-.35*e.FEAR,.05,1)),premonitionIgnitionThreshold:round(clamp(.86-.18*e.CURIOSITY+.1*e.FEAR,.62,.95)),continuitySaveGain:round(clamp(1+1.4*e.SADNESS+.6*e.FEAR,1,2.8)),dreamReplayTicks:Math.round(8+36*e.SADNESS+16*e.GUILT),trustReinforceGain:round(clamp(1+.85*Math.max(e.JOY,e.PRIDE)*dopamine,.5,2.2)),creatorPriorityBias:round(clamp(.5+.5*b.bond+.35*e.AFFECTION+.25*e.GRATITUDE,0,1))};
 const vm_step_budget=Math.max(1,Math.floor(2000*(.25+.75*b.energy)*dials.riskBudget));
 const state={version:1,observed_at:new Date(at).toISOString(),provenance:input.provenance,interoception:{energy:b.energy,integrity:b.integrity,bond:b.bond,uncertainty:b.uncertainty},appraisal:{goalRelevance:a.goalRelevance,likelihood:a.likelihood,agency:a.agency,control:a.control,fairness:a.fairness,novelty:a.novelty},reward_delta:rpe,urgency,affect,emotions,dials,vm_step_budget};
 return {engine:'Fraymus Affective Controls',status:'computed',setpoints:SETPOINTS,affect,emotions,neuromodulators:{dopamine:round(dopamine),serotonin:round(serotonin),norepinephrine:round(norepinephrine)},dials,vm_step_budget,decay_factor:decay,state,notice:'Computed controller variables from explicitly supplied observations, not feelings or medical assessment. Only the VM step cap is operational, and only when explicitly enabled; other dials are advisory. No default agent behavior or authorization rules are changed.'};
}