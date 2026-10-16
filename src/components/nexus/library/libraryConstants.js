export const agents=[['researcher','Scout'],['writer','Scribe'],['strategist','Pulse'],['director','Director']];
export const sources=[['SparkCard','Spark Studio cards'],['NexusSpark','Origin concepts'],['NexusDraft','Drafts & scripts'],['NexusKnowledge','Knowledge documents'],['NexusChatTurn','Agent answers']];
export const fieldClass='mt-1 block w-full rounded-lg border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
export const escapeSearch=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export const assetScope=workspace=>({owner_id:workspace.owner_id,workspace_id:workspace.id});
export const maxFileSize=50*1024*1024;
export const acceptedFiles='image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/mp4,.pdf,.txt,.md,.docx';