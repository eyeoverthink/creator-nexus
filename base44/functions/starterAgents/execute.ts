const CAL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export async function sha256(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function calendarToken(base44) {
  try { return (await base44.asServiceRole.connectors.getConnection('googlecalendar')).accessToken || null; } catch { return null; }
}

// Real availability: only capabilities with a working integration are executable.
export async function capabilityStatus(base44) {
  const token = await calendarToken(base44);
  const cal = token ? 'available' : 'blocked';
  return {
    ai_brain: 'available', drafts: 'available',
    calendar_read: cal, calendar_book: cal, calendar_delete: cal,
    email_send: 'draft_only', payment: 'blocked', publish: 'draft_only',
  };
}

export async function readCalendar(base44) {
  const token = await calendarToken(base44);
  if (!token) return null;
  const min = new Date().toISOString(), max = new Date(Date.now() + 3 * 864e5).toISOString();
  const res = await fetch(`${CAL}?maxResults=25&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(min)}&timeMax=${encodeURIComponent(max)}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.items || []).filter((i) => i.status !== 'cancelled').map((i) => ({ id: i.id, summary: i.summary || '(untitled)', start: i.start?.dateTime || i.start?.date || '', end: i.end?.dateTime || i.end?.date || '' }));
}

export function validatePayload(kind, p) {
  if (kind === 'booking') {
    const s = Date.parse(p.start_iso), e = Date.parse(p.end_iso);
    if (!p.summary || !s || !e || e <= s) return 'Booking needs summary, start_iso and end_iso with end after start.';
  }
  if (kind === 'delete' && !p.event_id) return 'Deletion needs the exact event_id.';
  return '';
}

export async function executeAction(base44, action) {
  const token = await calendarToken(base44);
  if (!token) return { ok: false, error: 'Google Calendar is not connected.' };
  const p = action.payload;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (action.kind === 'booking') {
    const res = await fetch(CAL, { method: 'POST', headers, signal: AbortSignal.timeout(12000), body: JSON.stringify({ summary: String(p.summary).slice(0, 160), description: String(p.description || '').slice(0, 1000), start: { dateTime: p.start_iso }, end: { dateTime: p.end_iso } }) });
    if (!res.ok) return { ok: false, error: `Calendar returned ${res.status}: ${(await res.text()).slice(0, 200)}` };
    const ev = await res.json();
    return { ok: true, event_id: ev.id, link: ev.htmlLink || '' };
  }
  if (action.kind === 'delete') {
    const res = await fetch(`${CAL}/${encodeURIComponent(p.event_id)}`, { method: 'DELETE', headers, signal: AbortSignal.timeout(12000) });
    if (!res.ok && res.status !== 410) return { ok: false, error: `Calendar returned ${res.status}` };
    return { ok: true, deleted: p.event_id };
  }
  return { ok: false, error: 'No executable integration for this action.' };
}