// Fraymus VM: ISA and canonical bytecode adapted from Fraymus-OS-One frayvm.js.
// Hardened: reject unknown opcodes, malformed immediates and invalid jumps.
export const FRAYMUS_ISA = [
 ['HALT',0x00],['NOP',0x01],['EMIT',0x10],['DROP',0x20],['SWAP',0x21],['OVER',0x22],['ROT',0x23],['NIP',0x24],['TUCK',0x25],['2DUP',0x26],['2SWAP',0x27],['2OVER',0x28],['DEPTH',0x29],['PICK',0x2a],['ROLL',0x2b],['DUP',0x2c],['?DUP',0x2d],['2DROP',0x2e],
 ['ADD',0x40],['SUB',0x41],['MUL',0x42],['DIV',0x43],['MOD',0x44],['NEG',0x45],['ABS',0x46],['MIN',0x47],['MAX',0x48],['AND',0x49],['OR',0x4a],['XOR',0x4b],['SHL',0x4c],['SHR',0x4d],['NOT',0x4e],['INC',0x4f],['DEC',0x50],
 ['EQ',0x60],['NE',0x61],['LT',0x62],['GT',0x63],['GE',0x64],['LE',0x65],['ZERO?',0x66],['NOTZERO?',0x67],['EVEN?',0x68],['ODD?',0x69],['LNOT',0x6a],['BOOL',0x6b],['SIGN',0x6c],['BETWEEN',0x6d],['CLAMP',0x6e],['TRUE',0x6f],['FALSE',0x70],
 ['PUSH_IMM',0x80],['POP_PRINT',0x81],['ITOF',0x90],['FTOI',0x91],['FDUP',0x92],['FDROP',0x93],['JUMP',0xa0],['JZ',0xa1]
];
const BY_NAME = new Map(FRAYMUS_ISA), BY_OP = new Map(FRAYMUS_ISA.map(([name,op])=>[op,name]));
const ARGS = new Set([0x80,0xa0,0xa1]);
const integer = n => Number.isInteger(n) && n >= -2147483648 && n <= 2147483647;
export function validateFraymusProgram(program) {
 if (!Array.isArray(program) || !program.length || program.length>256) throw new Error('Fraymus VM requires 1–256 instructions.');
 return program.map(ins=>{
  if (!ins || !BY_OP.has(ins.op)) throw new Error('Unknown Fraymus VM opcode.');
  if (ARGS.has(ins.op)) {
   if (!integer(ins.arg)) throw new Error('Immediate must be a signed 32-bit integer.');
   if (ins.op!==0x80 && (ins.arg<0 || ins.arg>program.length)) throw new Error('Jump target is outside the program.');
   return {op:ins.op,arg:ins.arg};
  }
  if (ins.arg!==undefined) throw new Error('Unexpected opcode argument.');
  return {op:ins.op};
 });
}
export function assembleFraymus(source) {
 if (typeof source!=='string' || source.length>8000) throw new Error('Assembly must be text up to 8000 characters.');
 const tokens=source.replace(/[;#][^\n]*/g,'').split(/[\s,]+/).filter(Boolean);
 const labels=new Map(), pending=[], code=[];
 const num=t=>/^(?:-?\d+|0x[\da-f]+)$/i.test(t)?Number(t):null;
 const aliases={PUSH:'PUSH_IMM',IMM:'PUSH_IMM',PRINT:'POP_PRINT','.':'POP_PRINT'};
 for(let i=0;i<tokens.length;i++) {
  const token=tokens[i].toUpperCase();
  if(token.endsWith(':')) {const label=token.slice(0,-1);if(!/^[A-Z_][A-Z_0-9]*$/.test(label)||labels.has(label))throw new Error('Invalid or duplicate label.');labels.set(label,code.length);continue;}
  const literal=num(token);
  if(literal!==null) {code.push({op:0x80,arg:literal});continue;}
  const op=BY_NAME.get(aliases[token]||token);
  if(op===undefined) throw new Error(`Unknown Fraymus instruction: ${token}`);
  if(!ARGS.has(op)) {code.push({op});continue;}
  const next=tokens[++i];if(next===undefined)throw new Error(`${token} needs an immediate.`);
  const n=num(next);code.push({op,arg:n??0});
  if(n===null){if(op===0x80)throw new Error('PUSH requires a numeric immediate.');pending.push({index:code.length-1,label:next.toUpperCase()});}
 }
 for(const {index,label} of pending){if(!labels.has(label))throw new Error(`Unknown label: ${label}`);code[index].arg=labels.get(label);}
 return validateFraymusProgram(code);
}
export function fraymusBytecode(program) {
 const bytes=[];
 for(const {op,arg} of validateFraymusProgram(program)){bytes.push(op);if(ARGS.has(op))bytes.push(arg&255,(arg>>>8)&255,(arg>>>16)&255,(arg>>>24)&255);}
 return bytes;
}
export function decodeFraymusBytecode(bytes) {
 if(!Array.isArray(bytes)||bytes.length>1280||bytes.some(b=>!Number.isInteger(b)||b<0||b>255))throw new Error('Bytecode must be at most 1280 byte values.');
 const code=[];
 for(let i=0;i<bytes.length;){const op=bytes[i++];if(!BY_OP.has(op))throw new Error('Unknown bytecode opcode.');if(ARGS.has(op)){if(i+4>bytes.length)throw new Error('Truncated bytecode immediate.');const arg=bytes[i]|(bytes[i+1]<<8)|(bytes[i+2]<<16)|(bytes[i+3]<<24);i+=4;code.push({op,arg});}else code.push({op});}
 return validateFraymusProgram(code);
}
export function compileFraymus(input) {
 if((input.assembly!==undefined)===(input.bytecode!==undefined))throw new Error('Provide exactly one of assembly or bytecode.');
 const program=input.assembly!==undefined?assembleFraymus(input.assembly):decodeFraymusBytecode(input.bytecode);
 return {engine:'Fraymus VM',program,assembly:program.map(({op,arg})=>BY_OP.get(op)+(ARGS.has(op)?` ${arg}`:'')).join('\n'),bytecode:fraymusBytecode(program),opcode_count:FRAYMUS_ISA.length};
}