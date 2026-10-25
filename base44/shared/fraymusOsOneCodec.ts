// Wire-compatible extraction of emojiCodec.js at Fraymus-OS-One commit 2861859ad41dc51475159361946f70c585f8f686.
// Reversible representation only: neither encryption nor authorization. Never executes decoded data.
const DNA = 'ACGT';
const selectorByte = cp => cp >= 0xfe00 && cp <= 0xfe0f ? cp-0xfe00 : cp >= 0xe0100 && cp <= 0xe01ef ? cp-0xe0100+16 : null;
export function transcodeFraymusPayload({text,format='glyph',direction='encode',carrier='🧩'}) {
  if (typeof text !== 'string' || !['glyph','dna','zero'].includes(format) || !['encode','decode'].includes(direction)) throw new Error('Provide text, format (glyph/dna/zero) and direction (encode/decode).');
  if (new TextEncoder().encode(text).length > 32768) throw new Error('Input exceeds 32768 bytes.');
  let bytes;
  if (direction === 'encode') {
    bytes = new TextEncoder().encode(text);
    if (bytes.length > 4096) throw new Error('Encoding is limited to 4096 payload bytes.');
    let output;
    if (format === 'glyph') {
      const base = [...String(carrier)].filter(ch=>selectorByte(ch.codePointAt(0))===null && ch !== '\u200b').join('');
      if (!base || [...base].length > 8) throw new Error('Carrier must contain 1–8 non-selector code points.');
      output = base + Array.from(bytes,b=>String.fromCodePoint(b<16?0xfe00+b:0xe0100+b-16)).join('');
    } else if (format === 'dna') output = Array.from(bytes,b=>[6,4,2,0].map(s=>DNA[(b>>s)&3]).join('')).join('');
    else output = Array.from(bytes,b=>[7,6,5,4,3,2,1,0].map(s=>(b>>s)&1?'\u200d':'\u200b').join('')).join('');
    return {engine:'Fraymus ProtocolZero Carriers',format,direction,output,byte_length:bytes.length,notice:'Encoding is not encryption; transport may strip invisible characters.'};
  }
  if (format === 'glyph') {
    const values = [...text].map(ch=>selectorByte(ch.codePointAt(0))).filter(v=>v!==null);
    if (!values.length) throw new Error('No encoded variation selectors found.');
    bytes = Uint8Array.from(values);
  } else if (format === 'dna') {
    const bases = text.replace(/\s/g,'').toUpperCase();
    if (!/^[ACGT]+$/.test(bases) || bases.length % 4) throw new Error('DNA requires A/C/G/T only, in groups of four.');
    bytes = Uint8Array.from(bases.match(/.{4}/g),group=>[...group].reduce((v,ch)=>(v<<2)|DNA.indexOf(ch),0));
  } else {
    const bits = [...text].filter(ch=>ch==='\u200b'||ch==='\u200d');
    if (!bits.length || bits.length % 8) throw new Error('Zero-width payload must contain complete 8-bit bytes.');
    bytes = Uint8Array.from({length:bits.length/8},(_,i)=>bits.slice(i*8,i*8+8).reduce((n,ch)=>(n<<1)|(ch==='\u200d'?1:0),0));
  }
  if (bytes.length > 4096) throw new Error('Decoded payload exceeds 4096 bytes.');
  return {engine:'Fraymus ProtocolZero Carriers',format,direction,output:new TextDecoder('utf-8',{fatal:true}).decode(bytes),byte_length:bytes.length,notice:'Decoded untrusted text only. No code was executed.'};
}