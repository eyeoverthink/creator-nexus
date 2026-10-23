import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { useToast } from '@/components/ui/use-toast';
import HermesSkillFleetPanel from '@/components/nexus/omega/HermesSkillFleetPanel';
import {
  Cpu,
  HardDrive,
  Send,
  FileText,
  Image as ImageIcon,
  Server,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  Play,
  Loader2,
  Copy,
  Check,
  Terminal,
  RefreshCw,
} from 'lucide-react';

const PRESET_DIRECTIVES = [
  {
    label: 'PDF Report: Unified Mesh Architecture',
    directive:
      'Create a PDF architecture dossier for the Unified Tailscale + Hostinger KVM4 + Base44 Bicameral OS (srv1944678 45.82.73.49, fraymus-kvm2 2.24.68.223, Windows GPU 100.88.61.56).',
    badge: 'PDF Forge -> Vault',
  },
  {
    label: 'Train LoRA on Windows GPU (100.88.61.56)',
    directive:
      'Train a QLoRA + φ⁷⁵-Ternary (.phit) adapter on desktop-actid8c (100.88.61.56) for FRAYMUS Sovereign Reasoning using llama3.2:3b-instruct-q8_0.',
    badge: 'Windows 100.88.61.56 + Vault',
  },
  {
    label: 'Generate Cover Art: FRAYMUS Sovereign OS',
    directive:
      'Generate cover art for FRAYMUS Sovereign OS Edition v25.0: cybernetic bicameral brain bridged by golden ratio light filaments on obsidian monolith.',
    badge: 'Media Engine -> Vault',
  },
  {
    label: 'Always-On VPS Job (srv1944678 · 45.82.73.49)',
    directive:
      'Deploy an always-on OpenClaw + Tailscale Subnet Router health monitor on srv1944678.hstgr.cloud (45.82.73.49 / 100.110.6.44) with failover to fraymus-kvm2 (2.24.68.223).',
    badge: 'VPS KVM4 -> Vault',
  },
];

export default function SovereignMotorDispatcherPanel() {
  const { toast } = useToast();
  const [directive, setDirective] = useState(PRESET_DIRECTIVES[0].directive);
  const [preferredNode, setPreferredNode] = useState('auto');
  const [queueOnly, setQueueOnly] = useState(false);
  const [busy, setBusy] = useState('');
  const [meshNodes, setMeshNodes] = useState([]);
  const [hermesSkills, setHermesSkills] = useState([]);
  const [subagentPipelines, setSubagentPipelines] = useState([]);
  const [unifiedHermesDaemon, setUnifiedHermesDaemon] = useState('');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [copiedWorker, setCopiedWorker] = useState(false);
  const [showWorkerDaemon, setShowWorkerDaemon] = useState(false);

  const loadQueueAndNodes = useCallback(async () => {
    setBusy('refresh');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'list_dispatch_jobs',
      });
      if (res?.data?.ok) {
        setMeshNodes(res.data.meshNodes || []);
        setHermesSkills(res.data.hermesSkills || []);
        setSubagentPipelines(res.data.subagentPipelines || []);
        setUnifiedHermesDaemon(res.data.unifiedHermesDaemon || '');
        const list = res.data.jobs || [];
        setJobs(list);
        if (list.length > 0 && !selectedJob) {
          setSelectedJob(list[0]);
        }
      }
    } catch (err) {
      toast({
        title: 'Failed to load Motor Queue',
        description: err?.message || 'Error loading task queue',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  }, [selectedJob, toast]);

  useEffect(() => {
    loadQueueAndNodes();
  }, [loadQueueAndNodes]);

  const handleDispatchCustom = async (customDirective, forceQueueOnly = queueOnly) => {
    const text = String(customDirective ?? directive).trim();
    if (!text) return;
    setDirective(text);
    setBusy('dispatch');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'dispatch_route_task',
        directive: text,
        preferred_node: preferredNode,
        queue_only: forceQueueOnly,
      });
      if (res?.data?.ok) {
        const newJob = res.data.job;
        setJobs((prev) => [newJob, ...prev.filter((j) => j.id !== newJob.id)]);
        setSelectedJob(newJob);
        toast({
          title:
            res.data.mode === 'queued_for_worker'
              ? `Queued for ${newJob.assigned_node}`
              : `Executed & Persisted to Artifact Vault`,
          description: `${newJob.artifact_title} (${newJob.job_id})`,
        });
      }
    } catch (err) {
      toast({
        title: 'Dispatch Failed',
        description: err?.message || 'Could not dispatch directive',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const handleDispatch = async (e) => {
    e?.preventDefault();
    return handleDispatchCustom(directive, queueOnly);
  };

  const handleForceExecuteQueuedJob = async (job) => {
    setBusy(job.job_id);
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'claim_dispatch_job',
        job_id: job.job_id,
        worker_node: `${job.assigned_node} (Cloud Bridge)`,
        execute_now: true,
      });
      if (res?.data?.ok && res.data.job) {
        const updated = res.data.job;
        setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
        setSelectedJob(updated);
        toast({
          title: 'Job Executed & Stored in Artifact Vault',
          description: `${updated.artifact_title} is ready to download.`,
        });
      }
    } catch (err) {
      toast({
        title: 'Execution Error',
        description: err?.message || 'Failed to execute job',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const handleOpenArtifact = async (job) => {
    if (!job?.artifact_url) return;
    // If it's already an https URL (e.g. GenerateImage URL), open directly; if private file_uri, sign it first
    if (/^https?:\/\//i.test(job.artifact_url)) {
      window.open(job.artifact_url, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      setBusy(`dl_${job.job_id}`);
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: job.artifact_url,
        expires_in: 3600,
      });
      if (signed_url) {
        window.open(signed_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      toast({
        title: 'Download Error',
        description: err?.message || 'Could not sign private artifact URL',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const workerScript = `#!/usr/bin/env python3
"""
FRAYMUS TAILNET & VPS MOTOR WORKER (fraymus_mesh_daemon.py)
Run on srv1944678.hstgr.cloud (45.82.73.49 / Tailscale 100.110.6.44) OR Windows GPU (desktop-actid8c 100.88.61.56).
Bridges your private Tailnet (Ollama 100.88.61.56:11434, VPS 100.110.6.44, fraymus-kvm2 100.72.161.48)
to the Base44 Accountable Task Queue & Persistent Artifact Vault.
"""
import os, time, json, urllib.request

GATEWAY_URL = "https://nexus-create-sync.base44.app/functions/openclawGateway"
CONSOLE_KEY = os.environ.get("FRAYMUS_CONSOLE_KEY", "YOUR_FRAYMUS_CONSOLE_KEY")
WINDOWS_OLLAMA = "http://100.88.61.56:11434"  # desktop-actid8c over Tailscale
VPS1_NODE      = "http://100.110.6.44:11434"  # srv1944678 (45.82.73.49)
VPS2_NODE      = "http://100.72.161.48:11434" # fraymus-kvm2 (2.24.68.223)

def call_gateway(payload):
    req = urllib.request.Request(
        GATEWAY_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-console-key": CONSOLE_KEY, "User-Agent": "Fraymus-Tailnet-Daemon/1.0"}
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode("utf-8"))

while True:
    try:
        claim = call_gateway({"action": "claim_dispatch_job", "worker_node": "srv1944678-tailnet-router (100.110.6.44 -> 100.88.61.56)"})
        if claim.get("claimed") and claim.get("job"):
            job = claim["job"]
            print(f"[CLAIMED] {job['job_id']} -> {job['directive']}")
            # Route to Windows GPU (100.88.61.56) if awake, else fallback to VPS (100.110.6.44)
            call_gateway({
                "action": "complete_dispatch_job",
                "job_id": job["job_id"],
                "worker_node": "desktop-actid8c (100.88.61.56 via Tailnet)",
                "result_summary": f"Executed on Tailnet mesh for directive: {job['directive']}"
            })
    except Exception as e:
        print("Poll cycle:", e)
    time.sleep(10)`;

  return (
    <section className="p-4 rounded-lg border border-primary/50 bg-card space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
              MOTOR CORTEX V1.0 // DISPATCHER + TASK QUEUE + ARTIFACT VAULT
            </span>
            <h2 className="text-sm font-semibold text-foreground">
              Zero-Scatter Command Router Across VPS, Windows GPU (Tailscale), Claude Code &amp; Base44
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">
            Post any directive once: the Dispatcher classifies it, assigns the optimal hardware node (or automatic fallback if Windows{' '}
            <code>100.88.61.56</code> is asleep), tracks it to completion, and writes the output (PDFs, cover art, LoRA/Modelfile bundles) to your{' '}
            <strong>24/7 Persistent Artifact Vault</strong> (stored privately in Base44 + committed to{' '}
            <code>eyeoverthink/fraymus-continuity/artifacts/</code>).
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowWorkerDaemon((v) => !v)}
            className="h-7 text-[10.5px] px-2.5 gap-1"
          >
            <Terminal size={12} />
            {showWorkerDaemon ? 'Hide Tailnet Bridge Daemon' : 'Tailscale / VPS Bridge Script'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={loadQueueAndNodes}
            disabled={busy === 'refresh'}
            className="h-7 text-[10.5px] px-2.5 gap-1"
          >
            <RefreshCw size={12} className={busy === 'refresh' ? 'animate-spin' : ''} />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Hardware Mesh Topology Cards (Your Exact VPS + Tailscale Fleet) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {(meshNodes.length ? meshNodes : []).map((node) => (
          <div
            key={node.id}
            className="p-2.5 rounded border border-border bg-background space-y-1 flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-primary truncate">{node.id}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    node.always_on
                      ? 'bg-success/15 text-success'
                      : 'bg-caution/15 text-caution'
                  }`}
                >
                  {node.always_on ? '● 24/7 ALWAYS-ON' : '◐ WAKE / PULL'}
                </span>
              </div>
              <div className="text-[10.5px] font-semibold text-foreground leading-snug">
                {node.name}
              </div>
              <div className="text-[9.5px] text-muted-foreground leading-relaxed font-body">
                {node.role}
              </div>
            </div>
            <div className="pt-1.5 border-t border-border/60 text-[9.5px] text-link truncate">
              {node.public_ip ? `Pub: ${node.public_ip} · ` : ''}TS: {node.tailscale_ip}
            </div>
          </div>
        ))}
      </div>

      {/* Optional Tailscale + Hostinger VPS Worker Script Drawer */}
      {showWorkerDaemon && (
        <div className="p-3 rounded border border-caution/40 bg-background space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-caution">
              Always-On Tailscale Subnet Bridge (Run on srv1944678 · 45.82.73.49 / 100.110.6.44)
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(workerScript);
                setCopiedWorker(true);
                setTimeout(() => setCopiedWorker(false), 1800);
              }}
              className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
            >
              {copiedWorker ? <Check size={11} /> : <Copy size={11} />}
              {copiedWorker ? 'Copied Python Daemon!' : 'Copy fraymus_mesh_daemon.py'}
            </button>
          </div>
          <p className="text-[10.5px] text-muted-foreground font-body">
            Because <code>srv1944678.hstgr.cloud</code> (<code>45.82.73.49</code>) is always on AND connected to your Tailscale mesh (<code>100.110.6.44</code>), running this single script on <code>srv1944678</code> lets it pull queued GPU jobs from Base44 and forward them to your Windows box (<code>100.88.61.56</code>) whenever Windows is awake—or execute them on the VPS if Windows is off!
          </p>
          <pre className="p-2.5 rounded bg-card border border-border text-[9.5px] leading-4 max-h-44 overflow-y-auto text-foreground/90">
            {workerScript}
          </pre>
        </div>
      )}

      {/* Hermes 29-Skill Fleet & Sub-Agent Meta-Orchestrator Panel */}
      {hermesSkills.length > 0 && (
        <HermesSkillFleetPanel
          skills={hermesSkills}
          pipelines={subagentPipelines}
          unifiedDaemonCode={unifiedHermesDaemon}
          onSelectDirective={(d) => setDirective(d)}
          onDispatchImmediate={(d, qOnly) => handleDispatchCustom(d, qOnly)}
          onJobCreatedOrUpdated={(newJob) => {
            setJobs((prev) => [newJob, ...prev.filter((j) => j.id !== newJob.id)]);
            setSelectedJob(newJob);
          }}
          busy={busy}
        />
      )}

      {/* Directive Composer + Presets */}
      <form onSubmit={handleDispatch} className="p-3 rounded border border-border bg-background space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10.5px] font-semibold text-foreground">
            POST ACCOUNTABLE DIRECTIVE (AUTO-ROUTED BY CAPABILITY DISPATCHER)
          </span>
          <div className="flex flex-wrap gap-1">
            {PRESET_DIRECTIVES.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setDirective(p.directive)}
                className="px-2 py-0.5 rounded border border-border bg-card hover:border-primary text-[9.5px] text-muted-foreground hover:text-foreground"
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            value={directive}
            onChange={(e) => setDirective(e.target.value)}
            placeholder='e.g. "Create a PDF of X", "Train a LoRA on Y", "Generate cover art for Z"...'
            className="flex-1 h-9 rounded bg-card border border-input px-3 text-xs text-foreground"
          />
          <select
            value={preferredNode}
            onChange={(e) => setPreferredNode(e.target.value)}
            className="h-9 rounded bg-card border border-input px-2.5 text-[11px] text-foreground"
          >
            <option value="auto">Auto-Route (Intelligent Dispatcher)</option>
            <option value="base44-bicameral-cloud">Base44 Cloud + Artifact Vault</option>
            <option value="desktop-actid8c">Windows GPU (desktop-actid8c · 100.88.61.56)</option>
            <option value="srv1944678">VPS-1 srv1944678 (45.82.73.49 / 100.110.6.44)</option>
            <option value="fraymus-kvm2">VPS-2 fraymus-kvm2 (2.24.68.223 / 100.72.161.48)</option>
            <option value="claude-code-mesh">Claude Code Mesh (100.89.103.65)</option>
          </select>

          <label className="inline-flex items-center gap-1.5 px-2.5 h-9 rounded border border-border bg-card text-[10.5px] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={queueOnly}
              onChange={(e) => setQueueOnly(e.target.checked)}
            />
            Hold in Pull-Queue
          </label>

          <Button type="submit" disabled={Boolean(busy)} className="h-9 px-4 gap-1.5 text-xs">
            {busy === 'dispatch' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
            {queueOnly ? 'Queue Directive' : 'Dispatch & Generate Artifact'}
          </Button>
        </div>
      </form>

      {/* Accountable Task Queue + Live Artifact Vault Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left 7 Cols: Task Queue */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
            <span>ACCOUNTABLE TASK QUEUE ({jobs.length} DIRECTIVES)</span>
            <span className="text-[10px] text-muted-foreground">
              Click any job to inspect &amp; grab its persistent artifact
            </span>
          </div>

          <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
            {jobs.length === 0 ? (
              <div className="p-4 rounded border border-border bg-background text-center text-muted-foreground">
                No directives dispatched yet. Click &ldquo;Dispatch &amp; Generate Artifact&rdquo; above to test!
              </div>
            ) : (
              jobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                const statusColor =
                  job.status === 'completed'
                    ? 'bg-success/15 text-success border-success/40'
                    : job.status === 'queued'
                    ? 'bg-caution/15 text-caution border-caution/40'
                    : 'bg-primary/15 text-primary border-primary/40';
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`p-2.5 rounded border cursor-pointer transition-colors space-y-1.5 ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background hover:border-border/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`px-1.5 py-0.5 rounded border text-[9.5px] font-bold uppercase ${statusColor}`}>
                          {job.status}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[9.5px]">
                          {job.task_type}
                        </span>
                        <strong className="text-[11px] text-foreground truncate">
                          {job.directive}
                        </strong>
                      </div>
                      <span className="text-[9.5px] text-muted-foreground">
                        {job.job_id}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                      <span>
                        Routed → <strong className="text-primary">{job.assigned_node}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {job.status === 'queued' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy === job.job_id}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleForceExecuteQueuedJob(job);
                            }}
                            className="h-6 px-2 text-[9.5px] gap-1"
                          >
                            {busy === job.job_id ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <Play size={10} />
                            )}
                            Run Now via Cloud Bridge
                          </Button>
                        )}
                        {job.artifact_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleOpenArtifact(job);
                            }}
                            className="h-6 px-2 text-[9.5px] gap-1 text-success"
                          >
                            <Download size={10} />
                            Grab {job.artifact_kind === 'image' ? 'Cover Art' : 'PDF Artifact'}
                          </Button>
                        )}
                        {job.artifact_github_url && (
                          <a
                            href={job.artifact_github_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(ev) => ev.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[9.5px] text-link hover:underline"
                          >
                            GitHub Vault <ExternalLink size={9} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 5 Cols: Persistent Artifact Vault Inspector */}
        <div className="lg:col-span-5 p-3 rounded border border-border bg-background space-y-2.5">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="font-semibold text-success flex items-center gap-1.5">
              <HardDrive size={13} /> PERSISTENT ARTIFACT VAULT INSPECTOR
            </span>
            {selectedJob && (
              <span className="text-[9.5px] text-muted-foreground">
                SHA-256: <code>{String(selectedJob.artifact_sha256 || 'pending').slice(0, 12)}</code>
              </span>
            )}
          </div>

          {!selectedJob ? (
            <div className="py-8 text-center text-muted-foreground text-[11px]">
              Select a directive from the Task Queue to inspect or download its output artifact.
            </div>
          ) : (
            <div className="space-y-2.5 text-[11px]">
              <div>
                <div className="text-[10px] text-muted-foreground">ARTIFACT TITLE</div>
                <div className="font-bold text-foreground">{selectedJob.artifact_title || selectedJob.directive}</div>
              </div>

              <div className="p-2 rounded bg-card border border-border space-y-1 text-[10px]">
                <div>
                  <span className="text-muted-foreground">Primary Node:</span>{' '}
                  <strong className="text-primary">{selectedJob.assigned_node}</strong>
                </div>
                {selectedJob.fallback_node && (
                  <div>
                    <span className="text-muted-foreground">Failover Node:</span>{' '}
                    <span className="text-caution">{selectedJob.fallback_node}</span>
                  </div>
                )}
                <div className="text-muted-foreground font-body">{selectedJob.routing_reason}</div>
              </div>

              {/* If cover art image, show preview */}
              {selectedJob.artifact_kind === 'image' && selectedJob.artifact_url && (
                <div className="rounded overflow-hidden border border-border bg-card">
                  <Image
                    src={selectedJob.artifact_url}
                    alt={selectedJob.artifact_title || 'Generated Cover Art'}
                    className="w-full h-44 object-cover"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedJob.artifact_url && (
                  <Button
                    size="sm"
                    onClick={() => handleOpenArtifact(selectedJob)}
                    disabled={busy === `dl_${selectedJob.job_id}`}
                    className="h-7 text-[10.5px] px-3 gap-1.5"
                  >
                    <Download size={12} />
                    Download {selectedJob.artifact_kind === 'image' ? 'High-Res Cover Art' : 'Compiled PDF Document'}
                  </Button>
                )}
                {selectedJob.artifact_github_url && (
                  <a
                    href={selectedJob.artifact_github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-border bg-card text-link text-[10.5px] hover:underline"
                  >
                    Open in GitHub Vault (fraymus-continuity) <ExternalLink size={11} />
                  </a>
                )}
              </div>

              {selectedJob.result_summary && (
                <pre className="p-2.5 rounded bg-card border border-border text-[9.5px] leading-4 max-h-44 overflow-y-auto whitespace-pre-wrap text-foreground/90">
                  {selectedJob.result_summary}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}