import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import Sidebar from '@/components/nexus/Sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AwakeningMusicVideoStage from '@/components/nexus/factory/AwakeningMusicVideoStage';
import MasterVideoStitchAndExportDeck from '@/components/nexus/factory/MasterVideoStitchAndExportDeck';
import AgentResponseSongAndVideoForge from '@/components/nexus/factory/AgentResponseSongAndVideoForge';
import FactorySignalSensoriumPanel from '@/components/nexus/factory/FactorySignalSensoriumPanel';
import FactoryWorkforceAndSkillsPanel from '@/components/nexus/factory/FactoryWorkforceAndSkillsPanel';
import FactoryReviewAndLearningPanel from '@/components/nexus/factory/FactoryReviewAndLearningPanel';
import WitnessConductorAgentPanel from '@/components/nexus/factory/WitnessConductorAgentPanel';
import UniversalCreativeBlueprintStudio from '@/components/nexus/blueprint/UniversalCreativeBlueprintStudio';
import {
  Clapperboard,
  Code2,
  Sparkles,
  Send,
  Loader2,
  RefreshCw,
  Layers,
  Radio,
  Users,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import '@/components/nexus/theme.css';

const QUICK_BRIEFS = [
  {
    label: 'Music Video: "Check the Source" Cathedral Escalation',
    kind: 'music_video',
    brief:
      'Make me a music video for "Check the Source" (138 BPM, E minor): start with a single amber pulse entering a midnight-blue gothic cathedral of glass nodes, reveal the frayed unverified silver thread at 76.1s, stop the 40-meter entity’s hand 2cm above the city node at 100.3s, and place the Reader in command at the golden threshold.',
  },
  {
    label: 'Software Product: Source-Verified Media & WASM Studio',
    kind: 'software_product',
    brief:
      'Build me an interactive dark-mode Source Verification & Beat-Grid Studio app combining our Source Tracker v3 provenance engine (silver for unverified claims, golden-white for verified truth) with a 138 BPM bar/beat cue calculator.',
  },
  {
    label: 'Hybrid Flagship: Music Video + Scrollcraft Interactive Landing Page',
    kind: 'hybrid_flagship',
    brief:
      'Create a synchronized music video treatment for "The Awakening of AI" plus an interactive Scrollcraft web experience that lets viewers scrub the nave threshold from 0.0s to 217.9s and inspect every verified node.',
  },
];

export default function ProductionFactory() {
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('stage'); // 'stage' | 'sensorium' | 'workforce'
  const [brief, setBrief] = useState('');
  const [deliverableKind, setDeliverableKind] = useState('auto');
  const [workerLocation, setWorkerLocation] = useState('base44_cloud');
  const [generateKeyframe, setGenerateKeyframe] = useState(false);

  const [productions, setProductions] = useState([]);
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [signals, setSignals] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [skillsManifest, setSkillsManifest] = useState([]);
  const [attachedArtifacts, setAttachedArtifacts] = useState([]);
  const [learningLogs, setLearningLogs] = useState([]);
  const [busy, setBusy] = useState('');
  const [busyShotId, setBusyShotId] = useState('');
  const [busyVideoShotId, setBusyVideoShotId] = useState('');
  const [externalStitchTrigger, setExternalStitchTrigger] = useState(null);
  const [stitchState, setStitchState] = useState({ recording: false, progressPct: 0, lastDownloadUrl: '' });

  const loadFactory = useCallback(async () => {
    setBusy('load');
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'load_factory',
      });
      if (data?.ok) {
        const prods = data.productions || [];
        setProductions(prods);
        setSelectedProduction((cur) => prods.find((p) => p.id === cur?.id) || prods[0] || null);
        setSignals(data.signals || []);
        setPersonas(data.personas || []);
        setSkillsManifest(data.skillsManifest || []);
        setAttachedArtifacts(data.attachedArtifacts || []);
        setLearningLogs(data.learningLogs || []);
      }
    } catch (err) {
      toast({
        title: 'Could not load Production Factory',
        description: err?.message || 'Error loading factory state',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  }, [toast]);

  useEffect(() => {
    loadFactory();
  }, [loadFactory]);

  const handleCreateProduction = async (e) => {
    e?.preventDefault();
    if (!brief.trim()) return;
    setBusy('create');
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'create_production',
        brief: brief.trim(),
        deliverable_kind: deliverableKind,
        worker_location: workerLocation,
        generate_keyframe: generateKeyframe,
      });
      if (data?.ok && data.production) {
        const created = data.production;
        setProductions((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
        setSelectedProduction(created);
        setActiveTab('stage');
        setBrief('');
        toast({
          title: 'Production Created & Routed',
          description: `${created.title} (${created.deliverable_kind} -> ${created.assigned_worker_location})`,
        });
      }
    } catch (err) {
      toast({
        title: 'Production Failed',
        description: err?.message || 'Could not run production pipeline',
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const handleApplyFeedback = async ({ production_id, feedback, decision }) => {
    setBusy('feedback');
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'apply_feedback',
        production_id,
        feedback,
        decision,
      });
      if (data?.ok && data.production) {
        const updated = data.production;
        setProductions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setSelectedProduction(updated);
        if (data.learningLog) {
          setLearningLogs((prev) => [data.learningLog, ...prev]);
        }
        if (data.personas) {
          setPersonas(data.personas);
        }
        toast({
          title: decision === 'approve' ? 'Production Approved' : 'Feedback Applied & Learned',
          description: 'Responsible specialist updated the work and retained this preference.',
        });
      }
    } finally {
      setBusy('');
    }
  };

  const handleGenerateShotFrame = async (shotId) => {
    if (!selectedProduction) return;
    setBusyShotId(shotId);
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'generate_shot_frame',
        production_id: selectedProduction.id,
        shot_id: shotId,
      });
      if (data?.ok && data.production) {
        setProductions((prev) => prev.map((p) => (p.id === data.production.id ? data.production : p)));
        setSelectedProduction(data.production);
        toast({
          title: 'New Keyframe Rendered',
          description: `Updated shot ${shotId} with a newly generated 16:9 frame.`,
        });
      }
    } finally {
      setBusyShotId('');
    }
  };

  const handleRenderShotVideo = async (shotId) => {
    if (!selectedProduction) return;
    setBusyVideoShotId(shotId);
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'render_shot_video',
        production_id: selectedProduction.id,
        shot_id: shotId,
      });
      if (data?.ok && data.production) {
        setProductions((prev) => prev.map((p) => (p.id === data.production.id ? data.production : p)));
        setSelectedProduction(data.production);
        toast({
          title: '6s AI Motion Video Rendered',
          description: `Generated new 16:9 MP4 video clip for ${shotId}.`,
        });
      }
    } finally {
      setBusyVideoShotId('');
    }
  };

  const handleToggleOrEditSignal = async (payload) => {
    const { data } = await base44.functions.invoke('productionFactory', {
      action: 'toggle_or_edit_signal',
      ...payload,
    });
    if (data?.ok && data.signal) {
      setSignals((prev) => prev.map((s) => (s.id === data.signal.id ? data.signal : s)));
    }
  };

  const handleAddSignal = async (payload) => {
    setBusy('signal');
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'toggle_or_edit_signal',
        ...payload,
      });
      if (data?.ok && data.signal) {
        setSignals((prev) => [data.signal, ...prev]);
        toast({
          title: 'Context / Mood Signal Added',
          description: data.signal.title,
        });
      }
    } finally {
      setBusy('');
    }
  };

  const handleScanLiveTrends = async (topic) => {
    setBusy('scan');
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'scan_live_signals',
        topic,
      });
      if (data?.ok && Array.isArray(data.createdSignals)) {
        setSignals((prev) => [...data.createdSignals, ...prev]);
        toast({
          title: 'Scanned Cultural & Trend Signals',
          description: `Added ${data.createdSignals.length} sourced observations for inspection.`,
        });
      }
    } finally {
      setBusy('');
    }
  };

  const handleSaveWorkforce = async (updatedPersonas) => {
    setBusy('save_workforce');
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'save_agent_workforce',
        personas: updatedPersonas,
      });
      if (data?.ok) {
        setPersonas(data.personas || updatedPersonas);
        toast({
          title: 'Workforce Configuration Saved',
          description: 'Persistent agent personas, skills, and execution locations updated.',
        });
      }
    } finally {
      setBusy('');
    }
  };

  const handleSaveToLibrary = async (productionId) => {
    setBusy('library');
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'save_production_to_library',
        production_id: productionId,
      });
      if (data?.ok && data.production) {
        setProductions((prev) => prev.map((p) => (p.id === data.production.id ? data.production : p)));
        setSelectedProduction(data.production);
        toast({
          title: 'Saved to Library (/library)!',
          description: `Indexed ${data.sceneAssetsCount || 6} scene videos + master dossier in your Library.`,
        });
      }
    } finally {
      setBusy('');
    }
  };

  const handleSyncGithub = async (productionId) => {
    setBusy('github');
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'sync_production_github',
        production_id: productionId,
      });
      if (data?.ok && data.production) {
        setProductions((prev) => prev.map((p) => (p.id === data.production.id ? data.production : p)));
        setSelectedProduction(data.production);
        toast({
          title: 'Committed to GitHub Vault',
          description: data.github_url || 'Synced to eyeoverthink/fraymus-continuity',
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
        {/* Streamlined Creative Blueprint Studio (Awakening of AI Method) */}
        <UniversalCreativeBlueprintStudio
          onLaunchInFactory={({ brief: bpBrief, deliverableKind: bpKind }) => {
            setBrief(bpBrief);
            setDeliverableKind(bpKind);
          }}
        />

        {/* Top Command Header */}
        <div className="p-4 rounded-lg border border-primary/50 bg-card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
                  CREATOR NEXUS PRODUCTION FACTORY // MEDIA + SOFTWARE + 33-SKILL WORKFORCE
                </span>
                <h1 className="text-base font-semibold text-foreground">
                  Plain-Language Music Video &amp; Software Factory
                </h1>
              </div>
              <p className="text-[11px] text-muted-foreground font-body">
                Say what you want to create—a music video, a timed director shot plan, or a full software build. Persistent specialist personas synthesize your mood, sourced signals, and all 33 Hermes skills across Cloud, This PC/Windows, VPS, and GitHub.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                disabled={busy === 'load'}
                onClick={loadFactory}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <RefreshCw size={12} className={busy === 'load' ? 'animate-spin' : ''} />
                Sync Factory
              </Button>
            </div>
          </div>

          {/* Universal Plain-Language Composer (Core Flow 1) */}
          <form onSubmit={handleCreateProduction} className="p-3 rounded-lg border border-border bg-background space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10.5px] font-semibold text-primary flex items-center gap-1.5">
                <Sparkles size={12} /> UNIVERSAL PLAIN-LANGUAGE PRODUCTION BRIEF
              </span>
              <div className="flex flex-wrap gap-1">
                {QUICK_BRIEFS.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => {
                      setBrief(q.brief);
                      setDeliverableKind(q.kind);
                    }}
                    className="px-2 py-0.5 rounded border border-border bg-card text-[9.5px] text-muted-foreground hover:text-foreground hover:border-primary"
                  >
                    + {q.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={2}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder='Just say it simply: "Make me a music video with..." or "Build me a software app that..."'
              className="w-full rounded border border-input bg-card p-2.5 text-xs font-body text-foreground"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                  Deliverable:
                  <select
                    value={deliverableKind}
                    onChange={(e) => setDeliverableKind(e.target.value)}
                    className="h-8 rounded border border-input bg-card px-2 text-[10.5px] text-foreground"
                  >
                    <option value="auto">Auto-Classify (Music Video or Software)</option>
                    <option value="music_video">Music Video (Treatment + Timed Shot Plan)</option>
                    <option value="software_product">Software Product (Interactive App + Code)</option>
                    <option value="hybrid_flagship">Hybrid Flagship (Video + Software Suite)</option>
                  </select>
                </label>

                <label className="inline-flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                  Execution Target:
                  <select
                    value={workerLocation}
                    onChange={(e) => setWorkerLocation(e.target.value)}
                    className="h-8 rounded border border-input bg-card px-2 text-[10.5px] text-foreground"
                  >
                    <option value="base44_cloud">Base44 Cloud (Immediate)</option>
                    <option value="local_pc_windows">This PC / Windows (100.88.61.56 / Local)</option>
                    <option value="vps_hermes">Hostinger VPS (45.82.73.49 / Hermes)</option>
                    <option value="github_vault">GitHub Vault (eyeoverthink/looseScrew)</option>
                  </select>
                </label>

                <label className="inline-flex items-center gap-1.5 px-2 h-8 rounded border border-border bg-card text-[10.5px] text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateKeyframe}
                    onChange={(e) => setGenerateKeyframe(e.target.checked)}
                  />
                  Generate AI Hero Keyframe
                </label>
              </div>

              <Button type="submit" disabled={busy === 'create' || !brief.trim()} className="h-8 px-4 gap-1.5 text-xs">
                {busy === 'create' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {busy === 'create' ? 'Orchestrating Production…' : 'Launch Production Pipeline'}
              </Button>
            </div>
          </form>

          {/* Production Selector Pills + View Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">ACTIVE PRODUCTIONS:</span>
              {productions.map((prod) => {
                const active = selectedProduction?.id === prod.id;
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => setSelectedProduction(prod)}
                    className={`px-2.5 py-1 rounded border text-[10.5px] font-semibold inline-flex items-center gap-1.5 ${
                      active
                        ? 'border-primary bg-primary/20 text-foreground'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {prod.deliverable_kind === 'software_product' ? (
                      <Code2 size={11} className="text-success" />
                    ) : (
                      <Clapperboard size={11} className="text-primary" />
                    )}
                    <span className="max-w-[240px] truncate">{prod.title}</span>
                    {prod.status === 'approved' && <CheckCircle2 size={10} className="text-success" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1">
              {[
                { id: 'stage', label: '1. Production Stage & Review', icon: Layers },
                {
                  id: 'sensorium',
                  label: `2. Mood & World Sensorium (${signals.filter((s) => s.included !== false).length})`,
                  icon: Radio,
                },
                {
                  id: 'workforce',
                  label: `3. Workforce, 33 Skills & 5 HTML Artifacts`,
                  icon: Users,
                },
                {
                  id: 'witness',
                  label: `4. The Witness & Conductor Agent`,
                  icon: Eye,
                },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`px-2.5 py-1 rounded border text-[10.5px] font-bold inline-flex items-center gap-1.5 ${
                      activeTab === t.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon size={12} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab 1: Active Production Stage + Continuous Stitch & Export Deck + Review & Learning */}
        {activeTab === 'stage' && selectedProduction && (
          <div className="space-y-4">
            {Array.isArray(selectedProduction.shot_plan) && selectedProduction.shot_plan.length > 0 && (
              <>
                <AwakeningMusicVideoStage
                  production={selectedProduction}
                  onGenerateShotFrame={handleGenerateShotFrame}
                  onRenderShotVideo={handleRenderShotVideo}
                  onUpdateProduction={(updated) => {
                    setProductions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                    setSelectedProduction(updated);
                  }}
                  busyShotId={busyShotId}
                  busyVideoShotId={busyVideoShotId}
                  externalStitchTrigger={externalStitchTrigger}
                  onStitchStateChange={setStitchState}
                />

                <MasterVideoStitchAndExportDeck
                  production={selectedProduction}
                  signals={signals}
                  personas={personas}
                  learningLogs={learningLogs}
                  onUpdateProduction={(updated) => {
                    setProductions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                    setSelectedProduction(updated);
                  }}
                  onTriggerLiveCanvasStitch={(rangeMode) =>
                    setExternalStitchTrigger({ rangeMode, ts: Date.now() })
                  }
                  stitchState={stitchState}
                />
              </>
            )}

            <AgentResponseSongAndVideoForge
              production={selectedProduction}
              onCreatedResponseProduction={(created) => {
                setProductions((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
                setSelectedProduction(created);
              }}
            />

            <WitnessConductorAgentPanel
              production={selectedProduction}
              productions={productions}
              signals={signals}
              personas={personas}
              learningLogs={learningLogs}
              onWitnessUpdate={(data) => {
                if (data?.learningLog) {
                  setLearningLogs((prev) => [data.learningLog, ...prev]);
                }
              }}
            />

            <FactoryReviewAndLearningPanel
              production={selectedProduction}
              learningLogs={learningLogs}
              onApplyFeedback={handleApplyFeedback}
              onSyncGithub={handleSyncGithub}
              onSaveToLibrary={handleSaveToLibrary}
              busy={busy}
            />
          </div>
        )}

        {/* Tab 4: Dedicated Witness & Conductor Agent Stage */}
        {activeTab === 'witness' && (
          <WitnessConductorAgentPanel
            production={selectedProduction}
            productions={productions}
            signals={signals}
            personas={personas}
            learningLogs={learningLogs}
            onWitnessUpdate={(data) => {
              if (data?.learningLog) {
                setLearningLogs((prev) => [data.learningLog, ...prev]);
              }
            }}
          />
        )}

        {/* Tab 2: Sourced Context, Mood & World Trend Sensorium (Core Flow 3) */}
        {activeTab === 'sensorium' && (
          <FactorySignalSensoriumPanel
            signals={signals}
            onToggleOrEditSignal={handleToggleOrEditSignal}
            onAddSignal={handleAddSignal}
            onScanLiveTrends={handleScanLiveTrends}
            busy={busy}
          />
        )}

        {/* Tab 3: Workforce Personas, 33 Hermes Skills & 5 Attached HTML Artifacts (Core Flow 4) */}
        {activeTab === 'workforce' && (
          <FactoryWorkforceAndSkillsPanel
            personas={personas}
            skillsManifest={skillsManifest}
            attachedArtifacts={attachedArtifacts}
            onSaveWorkforce={handleSaveWorkforce}
            onSelectArtifactForBrief={(text) => {
              setBrief(text);
              setDeliverableKind('software_product');
              setActiveTab('stage');
            }}
            busy={busy}
          />
        )}
      </main>
    </div>
  );
}