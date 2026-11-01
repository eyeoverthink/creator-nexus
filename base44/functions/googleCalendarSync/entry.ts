import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const json = (obj, status = 200) => Response.json(obj, { status, headers: { 'Cache-Control': 'no-store' } });

function normalizeCalendarEvent(item) {
  return {
    id: item.id,
    status: item.status || 'confirmed',
    summary: item.summary || '(Untitled Event)',
    description: (item.description || '').slice(0, 400),
    start: item.start?.dateTime || item.start?.date || '',
    end: item.end?.dateTime || item.end?.date || '',
    htmlLink: item.htmlLink || '',
    location: item.location || '',
    updated: item.updated || '',
  };
}

export default async function(req) {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));

    // 1. Real-time Webhook Handler path (invoked by GoogleCalendarRealtimeSync workflow)
    if (body?.data?._provider_meta) {
      if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const state = body.data._provider_meta['x-goog-resource-state'];
      if (state === 'sync') return json({ status: 'sync_ack' });

      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      const authHeader = { Authorization: `Bearer ${accessToken}` };

      const existing = await base44.asServiceRole.entities.SyncState.list();
      const syncRecord = existing.length > 0 ? existing[0] : null;

      let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100';
      if (syncRecord?.sync_token) {
        url += `&syncToken=${encodeURIComponent(syncRecord.sync_token)}`;
      } else {
        url += '&timeMin=' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      }

      let res = await fetch(url, { headers: authHeader, signal: AbortSignal.timeout(12000) });
      if (res.status === 410) {
        url =
          'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100' +
          '&timeMin=' +
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        res = await fetch(url, { headers: authHeader, signal: AbortSignal.timeout(12000) });
      }
      if (!res.ok) return json({ status: 'api_error', code: res.status });

      const allItems = [];
      let pageData = await res.json();
      let newSyncToken = null;
      while (true) {
        allItems.push(...(pageData.items || []));
        if (pageData.nextSyncToken) newSyncToken = pageData.nextSyncToken;
        if (!pageData.nextPageToken) break;
        const nextRes = await fetch(`${url}&pageToken=${encodeURIComponent(pageData.nextPageToken)}`, {
          headers: authHeader,
          signal: AbortSignal.timeout(12000),
        });
        if (!nextRes.ok) break;
        pageData = await nextRes.json();
      }

      const normalized = allItems
        .filter((i) => i.status !== 'cancelled')
        .map(normalizeCalendarEvent)
        .slice(0, 40);

      const previousEvents = Array.isArray(syncRecord?.synced_events) ? syncRecord.synced_events : [];
      const mergedMap = new Map();
      for (const ev of previousEvents) if (ev?.id) mergedMap.set(ev.id, ev);
      for (const item of allItems) {
        if (item.status === 'cancelled') mergedMap.delete(item.id);
        else mergedMap.set(item.id, normalizeCalendarEvent(item));
      }
      const mergedEvents = Array.from(mergedMap.values()).slice(0, 50);

      if (newSyncToken || mergedEvents.length) {
        const payload = {
          sync_token: newSyncToken || syncRecord?.sync_token || '',
          last_synced_at: new Date().toISOString(),
          synced_events: mergedEvents,
        };
        if (syncRecord) {
          await base44.asServiceRole.entities.SyncState.update(syncRecord.id, payload);
        } else {
          await base44.asServiceRole.entities.SyncState.create(payload);
        }
      }

      return json({
        status: 'synced',
        changed_count: normalized.length,
        total_cached: mergedEvents.length,
      });
    }

    // 2. Interactive Workspace Calendar Actions (list / sync / create_event)
    const action = body.action || 'sync';
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    if (action === 'create_event') {
      const summary = String(body.summary || 'Creator Nexus Video Spark Slot').trim().slice(0, 160);
      const description = String(body.description || 'Scheduled via Creator Nexus Workspace').trim().slice(0, 1000);
      const startIso = body.start_iso || new Date(Date.now() + 3600 * 1000).toISOString();
      const endIso = body.end_iso || new Date(new Date(startIso).getTime() + 30 * 60 * 1000).toISOString();

      const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          summary,
          description,
          start: { dateTime: startIso },
          end: { dateTime: endIso },
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (!createRes.ok) {
        const errText = await createRes.text().catch(() => '');
        return json({ error: `Calendar event creation failed (${createRes.status}): ${errText.slice(0, 200)}` }, 500);
      }

      const created = normalizeCalendarEvent(await createRes.json());
      if (body.workspace_id) {
        await base44.entities.NexusEvent.create({
          owner_id: String(user.id),
          workspace_id: String(body.workspace_id),
          agent: 'strategist',
          kind: 'calendar.event_created',
          message: `Synced Calendar Event: "${created.summary}" (${created.start.slice(0, 16).replace('T', ' ')})`,
          body: JSON.stringify(created),
        }).catch(() => null);
      }

      return json({ ok: true, event: created });
    }

    // Fetch upcoming + recent 7d events and update SyncState
    const timeMin = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const listUrl =
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=30&singleEvents=true&orderBy=startTime` +
      `&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`;

    const res = await fetch(listUrl, { headers: authHeader, signal: AbortSignal.timeout(12000) });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return json({ error: `Google Calendar sync failed (${res.status}): ${errText.slice(0, 200)}` }, 500);
    }

    const data = await res.json();
    const events = (data.items || [])
      .filter((i) => i.status !== 'cancelled')
      .map(normalizeCalendarEvent);

    const existing = await base44.asServiceRole.entities.SyncState.list();
    const syncRecord = existing.length > 0 ? existing[0] : null;
    const syncTime = new Date().toISOString();

    if (syncRecord) {
      await base44.asServiceRole.entities.SyncState.update(syncRecord.id, {
        last_synced_at: syncTime,
        synced_events: events,
      });
    } else {
      await base44.asServiceRole.entities.SyncState.create({
        sync_token: '',
        last_synced_at: syncTime,
        synced_events: events,
      });
    }

    return json({
      ok: true,
      calendar_summary: data.summary || 'Primary Calendar',
      time_zone: data.timeZone || 'America/Los_Angeles',
      last_synced_at: syncTime,
      events,
    });
  } catch (error) {
    return json({ error: error.message || 'Calendar sync failed' }, 500);
  }
}