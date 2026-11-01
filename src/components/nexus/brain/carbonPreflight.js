// Prompt preparation only. No token IDs are invented from dna_start_id.
export default function carbonPreflight(sequence,policy='reject'){
 if(typeof sequence!=='string'||!sequence.length||sequence.length>60000)throw new Error('Enter 1–60,000 uppercase DNA bases.');
 if(/[^ACGT]/.test(sequence))throw new Error('Only uppercase A, C, G and T are accepted; ambiguity codes and whitespace are not silently removed.');
 if(!['reject','truncate','pad'].includes(policy))throw new Error('Choose a trailing-base policy.');
 const remainder=sequence.length%6;let prepared=sequence;
 if(remainder){
  if(policy==='reject')throw new Error(`Length ${sequence.length} is not a multiple of 6; explicitly choose truncate or pad.`);
  prepared=policy==='truncate'?sequence.slice(0,sequence.length-remainder):sequence+'A'.repeat(6-remainder);
 }
 if(!prepared.length)throw new Error('The selected policy leaves no complete six-base block.');
 return {format:'fraymus.carbon.preflight/1',model:'HuggingFaceBio/Carbon-3B',prompt:`<dna>${prepared}</dna>`,original_bases:sequence.length,prepared_bases:prepared.length,removed_bases:policy==='truncate'?remainder:0,added_bases:policy==='pad'&&remainder?6-remainder:0,six_mer_blocks:prepared.length/6,native_context:32768,dna_k:6,token_ids_available:false,inference_executed:false,notice:'Local prompt preparation, not genomic inference, medical interpretation or verification of model weights. Special tags also consume tokens. The full vocabulary and tokenizer implementation are required for exact IDs.'};
}