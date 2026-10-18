import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Share2, Clock, CheckCircle2, Send, RefreshCw, LogOut, Link2, Settings2 } from 'lucide-react';

const CONNECTOR_ID = '6ad536e8bd5af14b360808eb';

export default function LinkedInAutoPublisherPanel({ workspace }) {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [nextWindow, setNextWindow] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hoursInput, setHoursInput] = useState('9, 12, 17');
  const [timezoneInput, setTimezoneInput] = useState('America/Los_Angeles');
  const [postingMode, setPostingMode] = useState('auto_best');
  const [weekdaysOnly, setWeekdaysOnly] = useState(true);
  const [autoPublish, setAutoPublish] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const workspaceId = workspace?.id;

  const syncScheduleForm = (wsSched, slot) => {
    if (wsSched) {
      setSchedule(wsSched);
      setAutoPublish(wsSched.linkedin_auto_publish !== false);
      setPostingMode(wsSched.linkedin_posting_mode || 'auto_best');
      setTimezoneInput(wsSched.timezone || 'America/Los_Angeles');
      setWeekdaysOnly(wsSched.linkedin_weekdays_only !== false);
      const hrs = Array.isArray(wsSched.linkedin_posting_hours)
        ? wsSched.linkedin_posting_hours.join(', ')
        : wsSched.linkedin_posting_hours || '9, 12, 17';
      setHoursInput(hrs);
    }
    if (slot) setNextWindow(slot);
  };

  // Rule 2: reusable fetch — doubles as connection check AND data loader
  const fetchData = useCallback(async () => {
    try {
      const schedRes = await base44.functions.invoke('linkedinSparkPublisher', {
        action: 'get_workspace_schedule',
        workspace_id: workspaceId,
      });
      syncScheduleForm(schedRes.data?.workspace_schedule, schedRes.data?.next_optimal_window);
    } catch {
      // Ignore schedule pre-load error
    }

    try {
      const res = await base44.functions.invoke('linkedinSparkPublisher', {
        action: 'status',
        workspace_id: workspaceId,
      });
      setData(res.data);
      syncScheduleForm(res.data?.workspace_schedule, res.data?.next_optimal_window);
      setConnected(true);
      setErrorMsg('');
    } catch {
      setConnected(false);
    }
  }, [workspaceId]);

  // Rule 1 + 2: check auth first, then fetch to detect connection status
  useEffect(() => {
    let active = true;
    base44.auth.isAuthenticated().then(async (authed) => {
      if (!active) return;
      if (authed) {
        const me = await base44.auth.me().catch(() => null);
        if (!active) return;
        setUser(me);
        await fetchData();
      }
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchData]);

  // Rule 3: open OAuth popup, poll for close, then re-fetch
  const handleConnect = async () => {
    setErrorMsg('');
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        fetchData();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
    setData(null);
    setStatusMsg('');
  };

  const handleSaveSchedule = async (overrides = {}) => {
    setSavingSchedule(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      const payload = {
        action: 'save_workspace_schedule',
        workspace_id: workspaceId,
        timezone: overrides.timezone ?? timezoneInput,
        linkedin_auto_publish: overrides.linkedin_auto_publish ?? autoPublish,
        linkedin_posting_mode: overrides.linkedin_posting_mode ?? postingMode,
        linkedin_posting_hours: overrides.linkedin_posting_hours ?? hoursInput,
        linkedin_weekdays_only: overrides.linkedin_weekdays_only ?? weekdaysOnly,
      };
      const res = await base44.functions.invoke('linkedinSparkPublisher', payload);
      syncScheduleForm(res.data?.workspace_schedule, res.data?.next_optimal_window);
      setStatusMsg(
        `Workspace LinkedIn schedule saved (${res.data?.next_optimal_window?.window_label || 'optimal windows active'}).`
      );
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || err.message || 'Could not save schedule settings.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handlePublishNow = async (item) => {
    setPublishingId(item.id);
    setErrorMsg('');
    setStatusMsg('');
    try {
      const res = await base44.functions.invoke('linkedinSparkPublisher', {
        action: 'publish_spark',
        item_id: item.id,
        item_type: item.item_type,
        workspace_id: item.workspace_id || workspaceId,
      });
      setStatusMsg(`Published "${res.data?.title || item.title}" to LinkedIn (${res.data?.post_urn || 'live'}).`);
      await fetchData();
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || err.message || 'Could not publish to LinkedIn.');
    } finally {
      setPublishingId(null);
    }
  };

  if (loading) {
    return (
      <section className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
        Checking LinkedIn automation status…
      </section>
    );
  }

  if (!user) {
    return (
      <section className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
        <div className="text-xs text-muted-foreground">
          Sign in to connect your LinkedIn account for automated optimal-time Spark publishing.
        </div>
        <Button size="sm" onClick={() => base44.auth.redirectToLogin()}>
          Sign in
        </Button>
      </section>
    );
  }

  const activeHoursLabel = Array.isArray(schedule?.linkedin_posting_hours)
    ? schedule.linkedin_posting_hours.map((h) => `${String(h).padStart(2, '0')}:00`).join(', ')
    : '09:00, 12:00, 17:00';

  return (
    <section className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Share2 size={17} className="text-primary" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-sm font-semibold">
                LinkedIn Optimal-Time Auto-Publisher
              </h2>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                  autoPublish
                    ? 'bg-success/10 border-success/30 text-success'
                    : 'bg-secondary border-border text-muted-foreground'
                }`}
              >
                {autoPublish ? 'Auto-Publish Enabled' : 'Auto-Publish Paused'}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                {schedule?.timezone || 'America/Los_Angeles'} · {activeHoursLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically pushes approved Video Sparks and Origin Sparks to your LinkedIn feed using your workspace settings’ best posting times ({nextWindow?.window_label || 'Mon–Fri 09:00, 12:00 & 17:00 PT'}).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSettings((v) => !v)}
          >
            <Settings2 size={13} /> Workspace Timing Settings
          </Button>
          {!connected ? (
            <Button size="sm" onClick={handleConnect}>
              <Link2 size={14} /> Connect LinkedIn Account
            </Button>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 text-xs text-success font-mono px-2.5 py-1 rounded bg-success/10 border border-success/30">
                <CheckCircle2 size={13} /> {data?.profile?.name || 'LinkedIn Connected'}
              </span>
              <Button size="sm" variant="outline" onClick={fetchData}>
                <RefreshCw size={13} /> Refresh
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDisconnect}>
                <LogOut size={13} /> Disconnect
              </Button>
            </>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="p-3.5 rounded-md bg-secondary border border-border space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono font-semibold text-foreground uppercase">
              Workspace Posting Schedule (Synced with Profile & Preferences)
            </span>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPublish}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAutoPublish(checked);
                  handleSaveSchedule({ linkedin_auto_publish: checked });
                }}
              />
              <span>Enable automatic LinkedIn publishing</span>
            </label>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="block space-y-1">
              <span className="text-muted-foreground">Timing Strategy</span>
              <select
                value={postingMode}
                onChange={(e) => setPostingMode(e.target.value)}
                className="w-full rounded bg-card border border-input px-2.5 py-1.5 text-xs"
              >
                <option value="auto_best">Auto-pick best times from workspace</option>
                <option value="custom_hours">Custom local hours</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-muted-foreground">Workspace Timezone</span>
              <input
                value={timezoneInput}
                onChange={(e) => setTimezoneInput(e.target.value)}
                placeholder="America/Los_Angeles"
                className="w-full rounded bg-card border border-input px-2.5 py-1.5 text-xs font-mono"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-muted-foreground">Best Local Hours (24h)</span>
              <input
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                placeholder="9, 12, 17"
                className="w-full rounded bg-card border border-input px-2.5 py-1.5 text-xs font-mono"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <label className="inline-flex items-center gap-2 text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={weekdaysOnly}
                onChange={(e) => setWeekdaysOnly(e.target.checked)}
              />
              <span>Weekdays only (Mon–Fri in {timezoneInput || 'workspace timezone'})</span>
            </label>
            <Button size="sm" disabled={savingSchedule} onClick={() => handleSaveSchedule()}>
              {savingSchedule ? 'Saving…' : 'Save Workspace Schedule'}
            </Button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div role="alert" className="p-2.5 rounded border border-destructive/40 bg-destructive/10 text-destructive text-xs">
          {errorMsg}
        </div>
      )}
      {statusMsg && (
        <div role="status" className="p-2.5 rounded border border-success/40 bg-success/10 text-success text-xs">
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-border">
        <div className="p-2.5 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock size={11} /> NEXT OPTIMAL SLOT
          </div>
          <div className="font-semibold text-primary mt-0.5 truncate" title={nextWindow?.window_label}>
            {nextWindow?.window_label || 'Mon 09:00 PT'}
          </div>
        </div>
        <div className="p-2.5 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">READY VIDEO SPARKS</div>
          <div className="font-semibold text-foreground mt-0.5">
            {data?.stats?.ready_video_sparks ?? 0}
          </div>
        </div>
        <div className="p-2.5 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">APPROVED ORIGIN SPARKS</div>
          <div className="font-semibold text-foreground mt-0.5">
            {data?.stats?.approved_origin_sparks ?? 0}
          </div>
        </div>
        <div className="p-2.5 rounded bg-secondary border border-border">
          <div className="text-[10px] text-muted-foreground">PUBLISHED TO LINKEDIN</div>
          <div className="font-semibold text-success mt-0.5">
            {data?.stats?.published_to_linkedin ?? 0}
          </div>
        </div>
      </div>

      {connected && data && (
        <div className="space-y-4">
          {Array.isArray(data.ready_items) && data.ready_items.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-mono text-muted-foreground">
                APPROVED & QUEUED SPARKS (AUTO-DISPATCHED AT NEXT OPTIMAL SLOT OR PUSH IMMEDIATELY)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.ready_items.slice(0, 6).map((item) => (
                  <div
                    key={`${item.item_type}:${item.id}`}
                    className="p-2.5 rounded bg-secondary border border-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {item.item_type === 'spark_card' ? 'Spark Video' : 'Origin Spark'} · {item.status}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={publishingId === item.id}
                      onClick={() => handlePublishNow(item)}
                    >
                      <Send size={12} /> {publishingId === item.id ? 'Posting…' : 'Push Now'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(data.recent_publications) && data.recent_publications.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-muted-foreground">RECENT LINKEDIN FEED PUBLICATIONS</div>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {data.recent_publications.map((pub) => (
                  <div
                    key={pub.id}
                    className="px-3 py-1.5 rounded bg-background border border-border text-xs font-mono flex items-center justify-between gap-2"
                  >
                    <span className="truncate text-foreground">{pub.message}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">{pub.post_urn}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}