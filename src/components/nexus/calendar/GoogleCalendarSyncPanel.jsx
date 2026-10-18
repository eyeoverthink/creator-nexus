import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Plus, ExternalLink, CheckCircle2, Clock } from 'lucide-react';

export default function GoogleCalendarSyncPanel({ workspace }) {
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [title, setTitle] = useState('');
  const [startIso, setStartIso] = useState(() => {
    const d = new Date(Date.now() + 2 * 3600 * 1000);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const syncCalendar = useCallback(async () => {
    setSyncing(true);
    setErrorMsg('');
    try {
      const res = await base44.functions.invoke('googleCalendarSync', {
        action: 'sync',
        workspace_id: workspace?.id,
      });
      setCalendarData(res.data);
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || err.message || 'Failed to sync Google Calendar');
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, [workspace?.id]);

  useEffect(() => {
    syncCalendar();
  }, [syncCalendar]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      const startDate = new Date(startIso);
      const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);
      const res = await base44.functions.invoke('googleCalendarSync', {
        action: 'create_event',
        workspace_id: workspace?.id,
        summary: title.trim(),
        description: 'Creator Nexus Production & Spark Publishing Slot',
        start_iso: startDate.toISOString(),
        end_iso: endDate.toISOString(),
      });
      setStatusMsg(`Added "${res.data?.event?.summary}" to Google Calendar.`);
      setTitle('');
      setShowNewEvent(false);
      await syncCalendar();
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || err.message || 'Could not create calendar event');
    } finally {
      setCreating(false);
    }
  };

  const events = calendarData?.events || [];

  return (
    <section className="p-4 rounded-md border border-border bg-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <Calendar size={16} className="text-primary" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-sm font-semibold">
                GOOGLE CALENDAR REAL-TIME SYNC
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-success/10 border border-success/30 text-success">
                <CheckCircle2 size={11} /> Webhook + Incremental Sync Active
              </span>
              {calendarData?.calendar_summary && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  {calendarData.calendar_summary} ({calendarData.time_zone})
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Synchronizes primary Google Calendar events with Creator Nexus and lets you schedule production & LinkedIn release slots.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNewEvent((v) => !v)}
          >
            <Plus size={13} /> Schedule Event
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={syncing}
            onClick={syncCalendar}
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing…' : 'Sync Now'}
          </Button>
        </div>
      </div>

      {showNewEvent && (
        <form onSubmit={handleCreateEvent} className="p-3 rounded bg-secondary border border-border grid sm:grid-cols-12 gap-3 items-end text-xs">
          <label className="sm:col-span-6 block space-y-1">
            <span className="text-muted-foreground">Event Title</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Record Spark Video & LinkedIn Release"
              className="w-full rounded bg-card border border-input px-2.5 py-1.5 text-xs"
            />
          </label>
          <label className="sm:col-span-4 block space-y-1">
            <span className="text-muted-foreground">Start Time</span>
            <input
              type="datetime-local"
              required
              value={startIso}
              onChange={(e) => setStartIso(e.target.value)}
              className="w-full rounded bg-card border border-input px-2.5 py-1.5 text-xs font-mono"
            />
          </label>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" size="sm" disabled={creating} className="w-full">
              {creating ? 'Adding…' : 'Add to Calendar'}
            </Button>
          </div>
        </form>
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

      {loading ? (
        <div className="text-xs text-muted-foreground font-mono">Loading synced Google Calendar events…</div>
      ) : events.length === 0 ? (
        <div className="p-3 rounded bg-secondary border border-border text-xs text-muted-foreground font-mono">
          No upcoming events in the next 30 days. Use "Schedule Event" to add a production or release slot.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {events.slice(0, 9).map((ev) => (
            <div
              key={ev.id}
              className="p-3 rounded bg-secondary border border-border flex flex-col justify-between gap-2 text-xs"
            >
              <div>
                <div className="font-medium text-foreground truncate" title={ev.summary}>
                  {ev.summary}
                </div>
                <div className="text-[11px] font-mono text-primary flex items-center gap-1 mt-1">
                  <Clock size={11} />
                  <span>{String(ev.start || '').slice(0, 16).replace('T', ' ')}</span>
                </div>
              </div>
              {ev.htmlLink && (
                <a
                  href={ev.htmlLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  Open in Google Calendar <ExternalLink size={10} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}