import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const LINKEDIN_CONNECTOR_ID = '6ad536e8bd5af14b360808eb';
const OPTIMAL_UTC_HOURS = [16, 19, 0]; // 09:00, 12:00, 17:00 America/Los_Angeles (UTC-7)
const json = (obj, status = 200) => Response.json(obj, { status, headers: { 'Cache-Control': 'no-store' } });

function computeNextOptimalWindow(now = new Date()) {
  const candidate = new Date(now.getTime());
  candidate.setUTCMinutes(0, 0, 0);

  for (let offsetHours = 0; offsetHours <= 96; offsetHours++) {
    const check = new Date(candidate.getTime() + offsetHours * 3600 * 1000);
    if (check.getTime() <= now.getTime() + 60 * 1000) continue;
    const day = check.getUTCDay();
    // Skip Saturday (6) and Sunday (0) for peak LinkedIn B2B/creator feed engagement
    if (day === 0 || day === 6) continue;
    if (OPTIMAL_UTC_HOURS.includes(check.getUTCHours())) {
      const diffMinutes = Math.round((check.getTime() - now.getTime()) / 60000);
      return {
        optimal_iso: check.toISOString(),
        publish_now: diffMinutes <= 25,
        minutes_until_slot: diffMinutes,
        window_label: `${check.toISOString().slice(0, 16).replace('T', ' ')} UTC`,
      };
    }
  }

  const fallback = new Date(now.getTime() + 3600 * 1000);
  return {
    optimal_iso: fallback.toISOString(),
    publish_now: false,
    minutes_until_slot: 60,
    window_label: `${fallback.toISOString().slice(0, 16).replace('T', ' ')} UTC`,
  };
}

function parseEventBody(ev) {
  try {
    return typeof ev?.body === 'string' ? JSON.parse(ev.body) : ev?.body || {};
  } catch {
    return {};
  }
}

async function fetchLinkedInProfile(accessToken) {
  const res = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`LinkedIn profile check failed (${res.status}): ${errText.slice(0, 200)}`);
  }
  const profile = await res.json();
  return {
    sub: profile.sub,
    urn: `urn:li:person:${profile.sub}`,
    name: profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(' ') || 'LinkedIn Creator',
    picture: profile.picture || null,
  };
}

async function postToLinkedInFeed(accessToken, authorUrn, postText, mediaUrl = null, title = '') {
  const commentary = String(postText || '').trim().slice(0, 2900);
  const shareContent = mediaUrl
    ? {
        shareCommentary: { text: commentary },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            originalUrl: mediaUrl,
            title: { text: String(title || 'Creator Nexus Video Spark').slice(0, 180) },
          },
        ],
      }
    : {
        shareCommentary: { text: commentary },
        shareMediaCategory: 'NONE',
      };

  const ugcPayload = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': shareContent,
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(ugcPayload),
    signal: AbortSignal.timeout(15000),
  });

  const respText = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`LinkedIn publish failed (${res.status}): ${respText.slice(0, 300)}`);
  }
  let parsed = {};
  try {
    parsed = JSON.parse(respText);
  } catch {
    parsed = { id: res.headers.get('x-restli-id') || 'published' };
  }
  return {
    post_urn: parsed.id || res.headers.get('x-restli-id') || 'urn:li:ugcPost:published',
  };
}

function formatSparkLinkedInPost({ title, hook, narration, pitch, disclosure, tags }) {
  const lines = [];
  if (title) lines.push(title);
  if (hook && hook !== title) lines.push('', hook);
  else if (pitch && pitch !== title) lines.push('', pitch);
  if (narration) lines.push('', narration);
  if (disclosure) lines.push('', `Disclosure: ${disclosure}`);
  if (Array.isArray(tags) && tags.length) {
    const hashtags = tags
      .slice(0, 5)
      .map((t) => '#' + String(t).replace(/[^a-zA-Z0-9]/g, ''))
      .filter((h) => h.length > 1)
      .join(' ');
    if (hashtags) lines.push('', hashtags);
  }
  return lines.join('\n').trim();
}

export default async function(req) {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.id) return json({ error: 'Unauthorized' }, 401);

    const input = await req.json().catch(() => ({}));
    const action = input.action || 'status';
    const nextSlot = computeNextOptimalWindow();

    // 1. Check LinkedIn App User connection + queue state
    if (action === 'status') {
      const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(LINKEDIN_CONNECTOR_ID);
      const profile = await fetchLinkedInProfile(accessToken);

      const workspaceFilter = input.workspace_id
        ? { owner_id: String(user.id), workspace_id: String(input.workspace_id) }
        : { owner_id: String(user.id) };

      const [eventsPage, sparksPage, cardsPage] = await Promise.all([
        base44.entities.NexusEvent.filter(
          { ...workspaceFilter, kind: { $in: ['linkedin.queued', 'linkedin.published', 'job.video'] } },
          { sort: '-created_date', limit: 40 }
        ),
        base44.entities.NexusSpark.filter(
          { ...workspaceFilter, status: { $in: ['approved', 'published'] } },
          { sort: '-updated_date', limit: 20 }
        ),
        base44.entities.SparkCard.filter(
          { ...workspaceFilter, status: { $in: ['script_drafted', 'queued'] } },
          { sort: '-updated_date', limit: 20 }
        ),
      ]);

      const publishedEvents = eventsPage.items.filter((e) => e.kind === 'linkedin.published');
      const queuedEvents = eventsPage.items.filter((e) => e.kind === 'linkedin.queued');
      const videoEvents = eventsPage.items.filter((e) => e.kind === 'job.video');

      return json({
        ok: true,
        connected: true,
        connector_id: LINKEDIN_CONNECTOR_ID,
        profile,
        next_optimal_window: nextSlot,
        stats: {
          approved_origin_sparks: sparksPage.items.filter((s) => s.status === 'approved').length,
          ready_video_sparks: cardsPage.items.length,
          rendered_videos: videoEvents.length,
          queued_for_linkedin: queuedEvents.length,
          published_to_linkedin: publishedEvents.length,
        },
        recent_publications: publishedEvents.slice(0, 8).map((e) => ({
          id: e.id,
          message: e.message,
          created_date: e.created_date,
          ...parseEventBody(e),
        })),
        ready_items: [
          ...cardsPage.items.map((c) => ({
            id: c.id,
            item_type: 'spark_card',
            title: c.hook_title,
            pitch: c.one_line_pitch,
            status: c.status,
            workspace_id: c.workspace_id,
          })),
          ...sparksPage.items.map((s) => ({
            id: s.id,
            item_type: 'nexus_spark',
            title: s.title,
            pitch: s.hook,
            status: s.status,
            workspace_id: s.workspace_id,
          })),
        ].slice(0, 12),
      });
    }

    // 2. Workflow step: enqueue an approved NexusSpark or completed video event for optimal-time LinkedIn publishing
    if (action === 'auto_enqueue_spark') {
      const sparkId = input.spark_id;
      const eventId = input.event_id;
      let targetWorkspaceId = input.workspace_id || '';
      let targetOwnerId = String(user.id);
      let title = 'Approved Video Spark';

      if (sparkId) {
        const spark = await base44.asServiceRole.entities.NexusSpark.get(sparkId).catch(() => null);
        if (spark) {
          targetWorkspaceId = spark.workspace_id;
          targetOwnerId = spark.owner_id;
          title = spark.title || title;
        }
      } else if (eventId) {
        const ev = await base44.asServiceRole.entities.NexusEvent.get(eventId).catch(() => null);
        if (ev) {
          targetWorkspaceId = ev.workspace_id;
          targetOwnerId = ev.owner_id;
          title = ev.message || title;
        }
      }

      if (targetWorkspaceId) {
        await base44.asServiceRole.entities.NexusEvent.create({
          owner_id: targetOwnerId,
          workspace_id: targetWorkspaceId,
          agent: 'strategist',
          kind: 'linkedin.queued',
          message: `Scheduled "${title.slice(0, 120)}" for optimal LinkedIn window (${nextSlot.window_label})`,
          body: JSON.stringify({
            spark_id: sparkId || null,
            video_event_id: eventId || null,
            optimal_iso: nextSlot.optimal_iso,
            window_label: nextSlot.window_label,
            queued_at: new Date().toISOString(),
          }),
        });
      }

      return json({
        ok: true,
        spark_id: sparkId || null,
        event_id: eventId || null,
        ...nextSlot,
      });
    }

    // 3. Publish a specific SparkCard or NexusSpark to LinkedIn immediately (or when workflow timer expires)
    if (action === 'publish_spark') {
      const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(LINKEDIN_CONNECTOR_ID);
      const profile = await fetchLinkedInProfile(accessToken);

      const itemType = input.item_type || (input.spark_card_id ? 'spark_card' : 'nexus_spark');
      const targetId = input.item_id || input.spark_card_id || input.spark_id;

      let postText = '';
      let title = '';
      let mediaUrl = null;
      let workspaceId = input.workspace_id;
      let ownerId = String(user.id);

      if (itemType === 'spark_card') {
        const card = await base44.asServiceRole.entities.SparkCard.get(targetId);
        if (!card) return json({ error: 'SparkCard not found' }, 404);
        workspaceId = card.workspace_id;
        ownerId = card.owner_id;
        title = card.hook_title;

        // Check if there is a rendered video signed URL or public reference
        if (card.job_event_id) {
          const videoEvPage = await base44.asServiceRole.entities.NexusEvent.filter(
            { workspace_id: workspaceId, kind: 'job.video' },
            { sort: '-created_date', limit: 20 }
          );
          const matchVideo = videoEvPage.items.find((ev) => parseEventBody(ev)?.source_event_id === card.job_event_id);
          if (matchVideo) {
            const vBody = parseEventBody(matchVideo);
            mediaUrl = vBody.video_url || null;
          }
        }

        postText = formatSparkLinkedInPost({
          title: card.hook_title,
          pitch: card.one_line_pitch,
          narration: card.narration,
          disclosure: card.safe_by_default?.ai_disclosure?.caption_text || card.safe_by_default?.ai_disclosure?.spoken_line,
          tags: card.topic_tags,
        });
      } else {
        const spark = await base44.asServiceRole.entities.NexusSpark.get(targetId);
        if (!spark) return json({ error: 'NexusSpark not found' }, 404);
        workspaceId = spark.workspace_id;
        ownerId = spark.owner_id;
        title = spark.title;

        let draftBody = '';
        if (spark.draft_id) {
          const draft = await base44.asServiceRole.entities.NexusDraft.get(spark.draft_id).catch(() => null);
          if (draft?.body) draftBody = draft.body.slice(0, 1200);
        }

        postText = formatSparkLinkedInPost({
          title: spark.title,
          hook: spark.hook,
          narration: spark.caption || draftBody || (Array.isArray(spark.scenes) ? spark.scenes.join('\n\n') : ''),
          disclosure: spark.disclosure,
          tags: [spark.format].filter(Boolean),
        });

        if (spark.status === 'approved') {
          await base44.asServiceRole.entities.NexusSpark.update(spark.id, { status: 'published' });
        }
      }

      const published = await postToLinkedInFeed(accessToken, profile.urn, postText, mediaUrl, title);

      const ev = await base44.asServiceRole.entities.NexusEvent.create({
        owner_id: ownerId,
        workspace_id: workspaceId,
        agent: 'strategist',
        kind: 'linkedin.published',
        message: `Published "${title.slice(0, 120)}" to LinkedIn (${profile.name})`,
        body: JSON.stringify({
          item_id: targetId,
          item_type: itemType,
          title,
          post_urn: published.post_urn,
          author_name: profile.name,
          published_at: new Date().toISOString(),
        }),
      });

      return json({
        ok: true,
        post_urn: published.post_urn,
        author: profile.name,
        event_id: ev.id,
        title,
      });
    }

    // 4. Automated cron dispatcher: publishes all approved/final video sparks that haven't been posted to LinkedIn yet
    if (action === 'dispatch_due_sparks') {
      if (user.role !== 'admin') return json({ error: 'Forbidden: admin required for scheduled dispatch' }, 403);

      const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(LINKEDIN_CONNECTOR_ID);
      const profile = await fetchLinkedInProfile(accessToken);

      const [publishedPage, approvedSparksPage, readyCardsPage] = await Promise.all([
        base44.asServiceRole.entities.NexusEvent.filter({ kind: 'linkedin.published' }, { sort: '-created_date', limit: 200 }),
        base44.asServiceRole.entities.NexusSpark.filter({ status: 'approved' }, { sort: 'created_date', limit: 10 }),
        base44.asServiceRole.entities.SparkCard.filter({ status: 'queued' }, { sort: '-created_date', limit: 20 }),
      ]);

      const alreadyPostedIds = new Set(publishedPage.items.map((e) => parseEventBody(e)?.item_id).filter(Boolean));
      const results = [];

      // Publish up to 2 due items per optimal window so the feed is paced naturally
      for (const spark of approvedSparksPage.items) {
        if (alreadyPostedIds.has(spark.id) || results.length >= 2) continue;
        const postText = formatSparkLinkedInPost({
          title: spark.title,
          hook: spark.hook,
          narration: spark.caption || (Array.isArray(spark.scenes) ? spark.scenes.join('\n\n') : ''),
          disclosure: spark.disclosure,
          tags: [spark.format].filter(Boolean),
        });
        const pub = await postToLinkedInFeed(accessToken, profile.urn, postText, null, spark.title);
        await base44.asServiceRole.entities.NexusSpark.update(spark.id, { status: 'published' });
        await base44.asServiceRole.entities.NexusEvent.create({
          owner_id: spark.owner_id,
          workspace_id: spark.workspace_id,
          agent: 'strategist',
          kind: 'linkedin.published',
          message: `Auto-published Origin Spark "${spark.title.slice(0, 100)}" to LinkedIn`,
          body: JSON.stringify({
            item_id: spark.id,
            item_type: 'nexus_spark',
            title: spark.title,
            post_urn: pub.post_urn,
            author_name: profile.name,
            published_at: new Date().toISOString(),
          }),
        });
        alreadyPostedIds.add(spark.id);
        results.push({ id: spark.id, type: 'nexus_spark', title: spark.title, post_urn: pub.post_urn });
      }

      for (const card of readyCardsPage.items) {
        if (alreadyPostedIds.has(card.id) || results.length >= 2) continue;
        const postText = formatSparkLinkedInPost({
          title: card.hook_title,
          pitch: card.one_line_pitch,
          narration: card.narration,
          disclosure: card.safe_by_default?.ai_disclosure?.caption_text || card.safe_by_default?.ai_disclosure?.spoken_line,
          tags: card.topic_tags,
        });
        const pub = await postToLinkedInFeed(accessToken, profile.urn, postText, null, card.hook_title);
        await base44.asServiceRole.entities.NexusEvent.create({
          owner_id: card.owner_id,
          workspace_id: card.workspace_id,
          agent: 'strategist',
          kind: 'linkedin.published',
          message: `Auto-published Video Spark "${card.hook_title.slice(0, 100)}" to LinkedIn`,
          body: JSON.stringify({
            item_id: card.id,
            item_type: 'spark_card',
            title: card.hook_title,
            post_urn: pub.post_urn,
            author_name: profile.name,
            published_at: new Date().toISOString(),
          }),
        });
        alreadyPostedIds.add(card.id);
        results.push({ id: card.id, type: 'spark_card', title: card.hook_title, post_urn: pub.post_urn });
      }

      return json({
        ok: true,
        dispatched_count: results.length,
        dispatched: results,
        next_optimal_window: nextSlot,
      });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    return json({ error: error.message || 'LinkedIn operation failed' }, 500);
  }
}