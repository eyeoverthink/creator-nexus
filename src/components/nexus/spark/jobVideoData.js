export const waitingForVideo='Video is still being saved to the app. It usually appears within a few minutes of Done.';
export function parseJobBody(body){
 try{const data=typeof body==='string'?JSON.parse(body):body;return data&&typeof data==='object'&&!Array.isArray(data)?data:null;}catch{return null;}
}
export function earlierEvent(left,right){
 return String(left.created_date).localeCompare(String(right.created_date))||String(left.id).localeCompare(String(right.id));
}