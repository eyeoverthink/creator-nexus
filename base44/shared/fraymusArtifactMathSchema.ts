import {z} from 'npm:zod@4.4.3';
const number=z.number().finite().min(-1e9).max(1e9),tick=z.number().int().min(0).max(1e6),text=z.string().max(8000);
export const artifactMathInput=z.discriminatedUnion('operation',[
 z.object({operation:z.literal('learning_rate'),tick,periodic:z.boolean()}).strict(),
 z.object({operation:z.literal('pattern_update'),tick,periodic:z.boolean(),rows:z.array(z.array(number).min(1).max(104)).min(1).max(5),noise:z.array(z.array(number).min(1).max(104)).min(1).max(5),eta:number}).strict(),
 z.object({operation:z.literal('fractal_levels'),last_level:z.number().int().min(0).max(12)}).strict(),
 z.object({operation:z.literal('echo'),value:number,index:z.number().int().min(0).max(32)}).strict(),
 z.object({operation:z.literal('reliability'),failure_probabilities:z.array(z.number().min(0).max(1)).min(1).max(16),assume_independent:z.literal(true)}).strict(),
 z.object({operation:z.literal('oscillation'),base_hz:z.number().min(432).max(528),time_ms:z.number().min(0).max(1e12)}).strict(),
 z.object({operation:z.literal('module_detection'),text}).strict(),
 z.object({operation:z.literal('payload_encode'),key:z.string().min(1).max(16),generation:tick,text}).strict(),
 z.object({operation:z.literal('payload_decode'),payload:z.string().max(1000)}).strict(),
 z.object({operation:z.literal('qr_capacity'),version:z.union([z.literal(1),z.literal(5),z.literal(10)]),level:z.enum(['L','M','Q','H']),text}).strict(),
 z.object({operation:z.literal('byte_round_trip'),encoding:z.enum(['hex','base64']),data:z.string().max(32768)}).strict()
]);
export const artifactForensicsInput=z.object({operation:z.enum(['outline','analyze','read','math']),commit:z.boolean().optional(),report_id:z.string().regex(/^[a-f0-9]{24}$/i).optional(),math_input:artifactMathInput.optional()}).strict().superRefine((a,c)=>{if(a.operation==='math'&&!a.math_input)c.addIssue({code:'custom',message:'Provide math_input.'});if(a.operation==='read'&&!a.report_id)c.addIssue({code:'custom',message:'Provide report_id.'});if(a.commit&&a.operation!=='analyze')c.addIssue({code:'custom',message:'Only analysis has a persistence operation.'});});