// Independent bounded arithmetic parser and BigInt i32 oracle, no eval/Function.
export function parseFraymusExpression(expression){
 if(typeof expression!=='string'||!expression.trim()||expression.length>192)throw new Error('Expression must contain 1–192 characters.');
 const tokens=[];let pos=0;
 while(pos<expression.length){if(/\s/.test(expression[pos])){pos++;continue;}const match=/^(?:\d+|[+*/()\-])/.exec(expression.slice(pos));if(!match)throw new Error('Only integer arithmetic (+ - * /) and parentheses are supported.');tokens.push(match[0]);pos+=match[0].length;}
 if(tokens.length>64)throw new Error('Expression exceeds 64 tokens.');let at=0;
 const primary=(depth)=>{if(depth>32)throw new Error('Expression nesting exceeds 32.');const t=tokens[at++];if(t==='-')return {t:'neg',x:primary(depth+1)};if(t==='('){const a=expr(depth+1);if(tokens[at++]!==')')throw new Error('Missing closing parenthesis.');return a;}if(!/^\d+$/.test(t||'')||Number(t)>2147483647)throw new Error('Expected an i32 integer.');return {t:'num',n:Number(t)};};
 const term=depth=>{let a=primary(depth);while(tokens[at]==='*'||tokens[at]==='/'){const op=tokens[at++];a={t:'bin',op,l:a,r:primary(depth)};}return a;};
 const expr=depth=>{let a=term(depth);while(tokens[at]==='+'||tokens[at]==='-'){const op=tokens[at++];a={t:'bin',op,l:a,r:term(depth)};}return a;};
 const ast=expr(0);if(at!==tokens.length)throw new Error('Unexpected arithmetic token.');return ast;
}
export function fraymusOracle(ast){
 const wrap=n=>BigInt.asIntN(32,n);
 const walk=node=>{
  if(node.t==='num')return wrap(BigInt(node.n));
  if(node.t==='neg')return wrap(-walk(node.x));
  const a=walk(node.l),b=walk(node.r);
  if(node.op==='+')return wrap(a+b);if(node.op==='-')return wrap(a-b);if(node.op==='*')return wrap(a*b);
  if(b===0n)throw new Error('Expression divides by zero.');return wrap(a/b);
 };
 return Number(walk(ast));
}
export function emitFraymusExpression(ast,table){
 if(ast.t==='num')return `PUSH_IMM ${ast.n}\n`;
 if(ast.t==='neg')return emitFraymusExpression(ast.x,table)+'NEG\n';
 return emitFraymusExpression(ast.l,table)+emitFraymusExpression(ast.r,table)+table[ast.op]+'\n';
}
export function probeFraymusExpression(ast,row){
 let cursor=0;const rows=[[2,3,5,8,9,4],[9,4,3,8,1,5],[8,5,2,6,7,9],[7,2,9,3,4,6]];
 const walk=n=>n.t==='num'?{t:'num',n:rows[row][cursor++%6]}:n.t==='neg'?{t:'neg',x:walk(n.x)}:{...n,l:walk(n.l),r:walk(n.r)};
 return walk(ast);
}