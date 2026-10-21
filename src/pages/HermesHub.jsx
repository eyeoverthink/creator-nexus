import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Sidebar from '@/components/nexus/Sidebar';
import HermesSkillFleetPanel from '@/components/nexus/omega/HermesSkillFleetPanel';
import CloudModelTrainingDashboardPane from '@/components/nexus/omega/CloudModelTrainingDashboardPane';
import HostingerGpuBurstTrainerPanel from '@/components/nexus/omega/HostingerGpuBurstTrainerPanel';
import SovereignAmbassadorGatekeeperPanel from '@/components/nexus/omega/SovereignAmbassadorGatekeeperPanel';
import FraymusControlPlanePanel from '@/components/nexus/omega/FraymusControlPlanePanel';
import HeartMuLaLocalMusicForgePanel from '@/components/nexus/loosescrew/HeartMuLaLocalMusicForgePanel';
import NativeSkillFleetExecutorPanel from '@/components/nexus/omega/NativeSkillFleetExecutorPanel';
import BicameralCoherenceAssayPanel from '@/components/nexus/omega/BicameralCoherenceAssayPanel';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Cpu,
  Terminal,
  RefreshCw,
  Radio,
  Bot,
  Zap,
  ShieldCheck,
  GitBranch,
  ExternalLink,
} from 'lucide-react';
import '@/components/nexus/theme.css';

export default function HermesHub() {
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [busy, setBusy] = useState('');
  const [hermesSkills, setHermesSkills] = useState([]);
  const [subagentPipelines, setSubagentPipelines] = useState([]);
  const [unifiedHermesDaemon, setUnifiedHermesDaemon] = useState('');
  const [meshNodes, setMeshNodes] = useState([]);
  const [jobs, setJobs] = useState([]);

  const loadHermesManifest = useCallback(async () => {
    setBusy('refresh');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'hermes_fleet_manifest',
      });
      if (res?.data?.ok) {
        setHermesSkills(res.data.hermesSkills || []);
        setSubagentPipelines(res.data.subagentPipelines || []);
        setUnifiedHermesDaemon(res.data.unifiedHermesDaemon || '');
        setMeshNodes(res.data.meshNodes || []);
        setJobs(res.data.jobs || []);
      }
    } catch (err) {
      toast({
        title: 'Failed to load Hermes Fleet Manifest',
        description: err?.message || 'Error contacting openclawGateway',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  }, [toast]);

  useEffect(() => {
    loadHermesManifest();
  }, [loadHermesManifest]);

  const handleDispatchFromHermes = async (directive, queueOnly = false) => {
    setBusy('dispatch');
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'dispatch_route_task',
        directive,
        preferred_node: 'srv1944678',
        queue_only: queueOnly,
      });
      if (res?.data?.ok && res.data.job) {
        const newJob = res.data.job;
        setJobs((prev) => [newJob, ...prev.filter((j) => j.id !== newJob.id)]);
        toast({
          title: queueOnly ? 'Queued for Hermes VPS Worker' : 'Executed & Saved to Vault',
          description: `${newJob.artifact_title} (${newJob.job_id})`,
        });
      }
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="nexus-shell">
      <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed((v) => !v)} />
      <main className="nexus-main p-4 md:p-5 space-y-4 overflow-y-auto font-mono text-xs">
        {/* Top Command Header */}
        <div className="p-3.5 rounded-lg border border-primary/50 bg-card flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
                HERMES SOVEREIGN FLEET // 29 SKILLS + SOLO SUB-AGENT ORCHESTRATOR
              </span>
              <h1 className="text-sm font-semibold text-foreground">
                Hermes VPS Daemon (srv1944678 · 45.82.73.49 / 100.110.6.44) + Cloud GPU Burst Bridge
              </h1>
              <span className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px] font-bold">
                ● KEYLESS ORIFICE-TXRX-V1.0 VERIFIED
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-body">
              Central command deck for your 29 installed Hermes agent skills across 9 categories, zero-LLM-cost script execution (<code>/script/exec</code>), solo dual-site sub-agent DAG pipelines, and real-time cloud GPU model evolution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Link to="/openclaw">
              <Button size="sm" variant="outline" className="h-7 text-[10.5px] px-2.5 gap-1">
                <Bot size={12} /> OpenClaw Hub
              </Button>
            </Link>
            <Link to="/orifice-relay">
              <Button size="sm" variant="outline" className="h-7 text-[10.5px] px-2.5 gap-1">
                <Radio size={12} /> Orifice Relay
              </Button>
            </Link>
            <Button
              size="sm"
              variant="secondary"
              onClick={loadHermesManifest}
              disabled={busy === 'refresh'}
              className="h-7 text-[10.5px] px-2.5 gap-1"
            >
              <RefreshCw size={12} className={busy === 'refresh' ? 'animate-spin' : ''} />
              Refresh Fleet ({hermesSkills.length} Skills)
            </Button>
          </div>
        </div>

        {/* All-Hands Bicameral Coherence, Teamwork & Emotion Assay Lab */}
        <BicameralCoherenceAssayPanel
          onAssayCompleted={() => {
            loadHermesManifest();
          }}
        />

        {/* Zero-Middleman Native 30-Skill In-App Executor + Sovereign Fleet Agent */}
        <NativeSkillFleetExecutorPanel
          skills={hermesSkills}
          onJobCreated={(newJob) => {
            setJobs((prev) => [newJob, ...prev.filter((j) => j.id !== newJob.id)]);
          }}
        />

        {/* Local & Free AI Song/Vocal Forge: HeartMuLa-oss-3B + ACE-Step 1.5 + YuE2 + DiffRhythm */}
        <HeartMuLaLocalMusicForgePanel
          onDispatchedJob={(newJob) => {
            setJobs((prev) => [newJob, ...prev.filter((j) => j.id !== newJob.id)]);
          }}
        />

        {/* Canonical Fraymus Control Plane Contract v1.0 (VPS 1944678 + VPS 2067485 + Managed Hermes) */}
        <FraymusControlPlanePanel />

        {/* Sovereign Ambassador & Entry/Exit Sentinel Gatekeeper */}
        <SovereignAmbassadorGatekeeperPanel />

        {/* Hermes 29-Skill Fleet & Sub-Agent Spawner */}
        {hermesSkills.length > 0 && (
          <HermesSkillFleetPanel
            skills={hermesSkills}
            pipelines={subagentPipelines}
            unifiedDaemonCode={unifiedHermesDaemon}
            onSelectDirective={() => {}}
            onDispatchImmediate={(d, qOnly) => handleDispatchFromHermes(d, qOnly)}
            onJobCreatedOrUpdated={(newJob) => {
              setJobs((prev) => [newJob, ...prev.filter((j) => j.id !== newJob.id)]);
            }}
            busy={busy}
          />
        )}

        {/* Dedicated Cloud Model Training Progress & Active Job Manager */}
        <CloudModelTrainingDashboardPane />

        {/* 1-Hour Hostinger GPU Burst Kit Compiler */}
        <HostingerGpuBurstTrainerPanel />
      </main>
    </div>
  );
}