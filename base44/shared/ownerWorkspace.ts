// Returns the caller's workspace: the one they named (only if they own it), otherwise their first one.
export async function ownerWorkspace(db, ownerId, workspaceId) {
  const query = workspaceId ? { id: String(workspaceId), owner_id: ownerId } : { owner_id: ownerId };
  const page = await db.entities.NexusWorkspace.filter(query, { sort: 'created_date', limit: 1 });
  return page.items[0] || null;
}