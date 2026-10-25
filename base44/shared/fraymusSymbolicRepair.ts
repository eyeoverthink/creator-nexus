import {parseFraymusExpression,fraymusOracle,emitFraymusExpression,probeFraymusExpression} from './fraymusSymbolicParser.ts';
import {assembleFraymus} from './fraymusVmAssembly.ts';
import {runFraymusVm} from './fraymusVmRuntime.ts';
const symbols=['+','-','*','/'],codes=['ADD','SUB','MUL','DIV'];
export function repairFraymusSymbolic(input,saved){
 const ast=parseFraymusExpression(input.expression),expected=fraymusOracle(ast);
 const opcodes={};for(const op of symbols){opcodes[op]=saved?.opcodes?.[op]??'ADD';if(!codes.includes(opcodes[op]))throw new Error('Invalid retained Fraymus opcode table.');}
 if(saved?.cases!==undefined&&(!Array.isArray(saved.cases)||saved.cases.length>32))throw new Error('Invalid retained regression cases.');
 const cases=(saved?.cases||[]).map(c=>({expr:c.expr,ast:parseFraymusExpression(c.expr)}));
 if(cases.length>=32&&!cases.some(c=>c.expr===input.expression))throw new Error('Fraymus regression memory holds 32 cases; start an explicitly separate workspace state to retain every regression.');
 const tests=[{ast,expected,label:'goal'}];
 for(let row=0;row<4;row++){const probe=probeFraymusExpression(ast,row);try{tests.push({ast:probe,expected:fraymusOracle(probe),label:`probe_${row}`});}catch(error){if(error.message!=='Expression divides by zero.')throw error;}}
 if(tests.length<4)throw new Error('Need at least three non-singular independent probes.');
 for(const c of cases)tests.push({ast:c.ast,expected:fraymusOracle(c.ast),label:'retained_regression'});
 const value=(table,node)=>{try{return runFraymusVm(assembleFraymus(emitFraymusExpression(node,table)+'HALT'),256).top;}catch{return null;}};
 const before=tests.map(t=>({...t,actual:value(opcodes,t.ast)}));
 let best=null,candidates=0;
 const search=(i,table)=>{
  if(i<symbols.length){for(const code of codes)search(i+1,{...table,[symbols[i]]:code});return;}
  candidates++;const distance=symbols.reduce((n,op)=>n+(table[op]!==opcodes[op]?1:0),0);
  if(best&&distance>=best.distance)return;
  if(tests.every(t=>value(table,t.ast)===t.expected))best={table,distance};
 };
 search(0,opcodes);
 if(!best)return {engine:'Fraymus Symbolic Repair',status:'rejected',expected,before_value:before[0].actual,reason:'No opcode-table mutation passed goal, fresh probes and retained regression cases.',candidates_evaluated:candidates};
 const state={version:1,opcodes:best.table,cases:[...cases.map(c=>({expr:c.expr})),...(!cases.some(c=>c.expr===input.expression)?[{expr:input.expression}]:[])],generation:(Number.isSafeInteger(saved?.generation)?saved.generation:0)+(best.distance?1:0)};
 return {engine:'Fraymus Symbolic Repair',status:best.distance?'repaired':'verified',expression:input.expression,expected,before_value:before[0].actual,after_value:value(best.table,ast),before_opcodes:opcodes,after_opcodes:best.table,changes:best.distance,candidates_evaluated:candidates,checks:tests.map((t,i)=>({label:t.label,expected:t.expected,before:before[i].actual,after:value(best.table,t.ast),passed:true})),assembly:emitFraymusExpression(ast,best.table)+'HALT',state,notice:'A measured symbolic opcode-table repair only; no language-model weights are modified. State is saved only with explicit commit.'};
}