import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Zap,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Database,
  Clock,
  ShieldCheck,
  Loader2,
  Download,
} from 'lucide-react';

const GPU_TIERS = [
  {
    id: 'rtx_pro_6000_96gb',
    label: 'RTX PRO 6000 Server (96GB VRAM · 32 Cores · 64GB RAM · 500GB · 525 cred/hr)',
    recommendedBase: 'unsloth/Qwen2.5-Coder-14B-Instruct',
  },
  {
    id: 'rtx_5090_32gb',
    label: 'RTX 5090 (32GB VRAM · 16/32 Cores · 300GB · 488 cred/hr)',
    recommendedBase: 'unsloth/Llama-3.2-3B-Instruct',
  },
];

const BASE_MODELS = [
  'unsloth/Qwen2.5-Coder-14B-Instruct',
  'unsloth/DeepSeek-R1-Distill-Qwen-14B',
  'unsloth/Llama-3.2-3B-Instruct',
  'unsloth/Qwen2.5-32B-Instruct-bnb-4bit',
];

export default function HostingerGpuBurstTrainerPanel({ onJobCreated }) {
  const { toast } = useToast();
  const [gpuTier, setGpuTier] = useState(GPU_TIERS[0].id);
  const [baseModel, setBaseModel] = useState(BASE_MODELS[0]);
  const [outputModelName, setOutputModelName] = useState('fraymus-sovereign-v25');
  const [busy, setBusy] = useState(false);
  const [bundle, setBundle] = useState(null);
  const [activeTab, setActiveTab] = useState('claude_prompt');
  const [copiedKey, setCopiedKey] = useState('');

  const copyText = (key, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleCompileBurstKit = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke('openclawGateway', {
        action: 'export_gpu_training_bundle',
        gpu_tier: gpuTier,
        base_model: baseModel,
        output_model_name: outputModelName,
        commit_to_github: true,
      });
      if (res?.data?.ok) {
        setBundle(res.data);
        if (res.data.job && onJobCreated) {
          onJobCreated(res.data.job);
        }
        toast({
          title: `Staged ${res.data.datasetCount} JSONL Examples to GitHub Vault`,
          description: 'Ready to paste into Claude Code / Hermes and deploy your 1-hour Hostinger GPU.',
        });
      }
    } catch (err) {
      toast({
        title: 'Failed to compile GPU Burst Kit',
        description: err?.message || 'Error compiling JSONL dataset',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const oneLinerBootstrap = `mkdir -p ~/fraymus-gpu && cd ~/fraymus-gpu && git clone --depth 1 https://github.com/eyeoverthink/fraymus-continuity.git && cp fraymus-continuity/gpu-training/* . && pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git" --no-deps trl peft accelerate bitsandbytes datasets && python3 train_fraymus_gpu_burst.py 2>&1 | tee train_burst.log`;

  return (
    <div className="p-3.5 rounded-lg border border-success/50 bg-background space-y-3 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-caution/20 text-caution border border-caution/40 text-[10px] font-bold">
              GPU RENTAL PAUSED — HOSTINGER GPUS OUT OF STOCK (0 CREDITS SPENT)
            </span>
            <span className="text-[11px] font-semibold text-foreground">
              Active GPU Burst Jobs Cancelled · JSONL Kit Preserved in GitHub Vault for Later
            </span>
          </div>
          <p className="text-[10.5px] text-muted-foreground font-body">
            Compiles your live Creator Nexus + Polar Orbit data into <code>fraymus-sovereign-sft.jsonl</code> and pushes the ready-to-run Unsloth training kit to{' '}
            <code>eyeoverthink/fraymus-continuity/gpu-training/</code> so your Hostinger GPU trains &amp; exports GGUF in ~25 minutes.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleCompileBurstKit}
          disabled={busy}
          className="h-8 px-3.5 gap-1.5 text-xs bg-primary text-primary-foreground"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
          {bundle ? 'Re-Compile & Push JSONL Kit' : '1. Compile JSONL & Stage GPU Kit Now'}
        </Button>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground">HOSTINGER GPU SELECTION (LOS ANGELES)</label>
          <select
            value={gpuTier}
            onChange={(e) => setGpuTier(e.target.value)}
            className="w-full h-8 rounded bg-card border border-input px-2 text-[11px] text-foreground"
          >
            {GPU_TIERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground">BASE MODEL (UNSLOTH 4-BIT / BF16)</label>
          <select
            value={baseModel}
            onChange={(e) => setBaseModel(e.target.value)}
            className="w-full h-8 rounded bg-card border border-input px-2 text-[11px] text-foreground"
          >
            {BASE_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground">OUTPUT MODEL ARTIFACT NAME</label>
          <input
            type="text"
            value={outputModelName}
            onChange={(e) => setOutputModelName(e.target.value)}
            className="w-full h-8 rounded bg-card border border-input px-2.5 text-[11px] text-foreground"
          />
        </div>
      </div>

      {/* 1-Liner GPU Terminal Bootstrap */}
      <div className="p-2.5 rounded border border-border bg-card space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10.5px] font-semibold text-success flex items-center gap-1.5">
            <Terminal size={12} /> ONE-LINE GPU TERMINAL BOOTSTRAP (RUN ONCE GPU BOOTS)
          </span>
          <button
            type="button"
            onClick={() => copyText('bootstrap', oneLinerBootstrap)}
            className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
          >
            {copiedKey === 'bootstrap' ? <Check size={11} /> : <Copy size={11} />}
            {copiedKey === 'bootstrap' ? 'Copied 1-Liner!' : 'Copy GPU 1-Liner'}
          </button>
        </div>
        <pre className="p-2 rounded bg-background border border-border text-[9.5px] overflow-x-auto text-foreground/90">
          {oneLinerBootstrap}
        </pre>
      </div>

      {/* Bundle Output Tabs */}
      {bundle && (
        <div className="space-y-2.5 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('claude_prompt')}
                className={`px-2.5 py-1 rounded text-[10.5px] font-semibold border ${
                  activeTab === 'claude_prompt'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border'
                }`}
              >
                Claude Code / Agent Supervisor Prompt
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('python_script')}
                className={`px-2.5 py-1 rounded text-[10.5px] font-semibold border ${
                  activeTab === 'python_script'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border'
                }`}
              >
                train_fraymus_gpu_burst.py
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('jsonl_preview')}
                className={`px-2.5 py-1 rounded text-[10.5px] font-semibold border ${
                  activeTab === 'jsonl_preview'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border'
                }`}
              >
                JSONL Dataset ({bundle.datasetCount} rows)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={bundle.githubFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10.5px] text-link hover:underline"
              >
                Open Staged Kit on GitHub <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {activeTab === 'claude_prompt' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Paste this into Claude Code or your Hermes Agent so it supervises your 1-hour GPU session &amp; guards your credits:
                </span>
                <button
                  type="button"
                  onClick={() => copyText('claude', bundle.claudeSupervisorPrompt)}
                  className="text-[10.5px] text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  {copiedKey === 'claude' ? <Check size={11} /> : <Copy size={11} />}
                  {copiedKey === 'claude' ? 'Copied Prompt!' : 'Copy Claude Code Supervisor Prompt'}
                </button>
              </div>
              <pre className="p-2.5 rounded bg-card border border-border text-[9.5px] leading-4 max-h-60 overflow-y-auto whitespace-pre-wrap text-foreground/90">
                {bundle.claudeSupervisorPrompt}
              </pre>
            </div>
          )}

          {activeTab === 'python_script' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Unsloth QLoRA + GGUF + Keyless <code>orifice_ping</code> auto-callback script:
                </span>
                <button
                  type="button"
                  onClick={() => copyText('py', bundle.trainingScript)}
                  className="text-[10.5px] text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  {copiedKey === 'py' ? <Check size={11} /> : <Copy size={11} />}
                  {copiedKey === 'py' ? 'Copied Script!' : 'Copy train_fraymus_gpu_burst.py'}
                </button>
              </div>
              <pre className="p-2.5 rounded bg-card border border-border text-[9.5px] leading-4 max-h-60 overflow-y-auto whitespace-pre-wrap text-foreground/90">
                {bundle.trainingScript}
              </pre>
            </div>
          )}

          {activeTab === 'jsonl_preview' && (
            <div className="space-y-1.5">
              <div className="text-[10px] text-muted-foreground">
                Compiled {bundle.datasetCount} ChatML training examples (Orbit Nodes: {bundle.sourceBreakdown?.polarOrbitNodes || 0}, Continuity: {bundle.sourceBreakdown?.continuityScopes || 0}, Dispatch Jobs: {bundle.sourceBreakdown?.dispatchJobs || 0}, Logs: {bundle.sourceBreakdown?.learningLogs || 0}):
              </div>
              <pre className="p-2.5 rounded bg-card border border-border text-[9.5px] leading-4 max-h-60 overflow-y-auto whitespace-pre-wrap text-foreground/90">
                {bundle.jsonlPreview}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}