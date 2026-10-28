// Shared helpers for studio tools: owner workspace check and saving reports to the Library.
export async function ownedWorkspace(base44, userId, workspaceId) {
  if (typeof workspaceId !== 'string' || !workspaceId) return null;
  const ws = await base44.asServiceRole.entities.NexusWorkspace.get(workspaceId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
  return ws && ws.owner_id === userId ? ws : null;
}

export async function saveLibraryDocument(base44, { ownerId, workspaceId, title, body, project }) {
  return await base44.asServiceRole.entities.NexusAsset.create({
    owner_id: ownerId,
    workspace_id: workspaceId,
    title: String(title).slice(0, 160),
    body: String(body).slice(0, 20000),
    kind: 'document',
    project,
    source_entity: project,
  });
}