// Room persistence uses the actor client's supported filter/create operations.
// Proposal reviews are serialized by NexusRoom, and stable keys make retries idempotent.
export async function saveRoomRecord(room,entity,key,record){
 const scope={owner_id:room.owner,workspace_id:room.workspace};
 const page=await room.client.asServiceRole.entities[entity].filter({...scope,...key},{sort:'created_date',limit:1});
 const existing=Array.isArray(page)?page[0]:page.items[0];
 if(existing)return existing;
 return await room.client.asServiceRole.entities[entity].create({...record,...scope});
}