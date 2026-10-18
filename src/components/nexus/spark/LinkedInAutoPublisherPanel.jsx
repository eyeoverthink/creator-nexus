import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Share2, Clock, CheckCircle2, Send, RefreshCw, LogOut, Link2 } from 'lucide-react';

const CONNECTOR_ID = '6ad536e8bd5af14b360808eb';

export default function LinkedInAutoPublisherPanel({ workspace }) {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const workspaceId = workspace?.id;

  // Rule 2: reusable fetch — doubles as connection check AND data loader
  const fetchData = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('linkedinSparkPublisher', {
        action: 'status',
        workspace_id: workspaceId,
      });
      setData(res.data);
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

  return (
    <section className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Share2 size={17} className="text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-semibold">
                LinkedIn Optimal-Time Auto-Publisher
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                Zero-Touch Workflow Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Once a Video Spark or Origin Spark is approved, our workflow automatically queues and pushes it to your LinkedIn feed at peak engagement windows (Mon–Fri 09:00, 12:00 & 17:00 PT).
            </p>
          </div>
        </div>

        {!connected ? (
          <Button size="sm" onClick={handleConnect}>
            <Link2 size={14} /> Connect LinkedIn Account
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-success font-mono px-2.5 py-1 rounded bg-success/10 border border-success/30">
              <CheckCircle2 size={13} /> {data?.profile?.name || 'LinkedIn Connected'}
            </span>
            <Button size="sm" variant="outline" onClick={fetchData}>
              <RefreshCw size={13} /> Refresh
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDisconnect}>
              <LogOut size={13} /> Disconnect
            </Button>
          </div>
        )}
      </div>

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

      {connected && data && (
        <div className="space-y-4 pt-2 border-t border-border">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-secondary border border-border">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock size={11} /> NEXT OPTIMAL SLOT
              </div>
              <div className="font-semibold text-primary mt-0.5">
                {data.next_optimal_window?.window_label || 'Next Window'}
              </div>
            </div>
            <div className="p-2.5 rounded bg-secondary border border-border">
              <div className="text-[10px] text-muted-foreground">READY VIDEO SPARKS</div>
              <div className="font-semibold text-foreground mt-0.5">
                {data.stats?.ready_video_sparks ?? 0}
              </div>
            </div>
            <div className="p-2.5 rounded bg-secondary border border-border">
              <div className="text-[10px] text-muted-foreground">APPROVED ORIGIN SPARKS</div>
              <div className="font-semibold text-foreground mt-0.5">
                {data.stats?.approved_origin_sparks ?? 0}
              </div>
            </div>
            <div className="p-2.5 rounded bg-secondary border border-border">
              <div className="text-[10px] text-muted-foreground">PUBLISHED TO LINKEDIN</div>
              <div className="font-semibold text-success mt-0.5">
                {data.stats?.published_to_linkedin ?? 0}
              </div>
            </div>
          </div>

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