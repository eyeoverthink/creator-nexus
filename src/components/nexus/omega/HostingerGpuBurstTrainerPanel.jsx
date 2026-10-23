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
    id: 'a100_80gb_2xlarge_mem',
    label: '✓ A100 · 80GB VRAM · 2X-Large-Mem (2 Cores · 64GB RAM · 100GB Storage · 179 cred/hr · Reading, UK)',
    recommendedBase: 'unsloth/Qwen2.5-Coder-14B-Instruct',
    creditsPerHour: 179,
    vram: '80GB VRAM',
    ram: '64GB RAM',
  },
  {
    id: 'a100_80gb_8c_16gb',
    label: 'A100 · 80GB VRAM (8 Cores · 16GB RAM · 200GB Storage · 167 cred/hr · Reading, UK)',
    recommendedBase: 'unsloth/Qwen2.5-Coder-14B-Instruct',
    creditsPerHour: 167,
    vram: '80GB VRAM',
    ram: '16GB RAM',
  },
  {
    id: 'a100_80gb_4c_8gb',
    label: 'A100 · 80GB VRAM (4 Cores · 8GB RAM · 100GB Storage · 161 cred/hr · Reading, UK)',
    recommendedBase: 'unsloth/Llama-3.2-3B-Instruct',
    creditsPerHour: 161,
    vram: '80GB VRAM',
    ram: '8GB RAM',
  },
  {
    id: 'rtx_pro_6000_96gb',
    label: 'RTX PRO 6000 Server (96GB VRAM · From $0.65/hr · Reading, UK)',
    recommendedBase: 'unsloth/Qwen2.5-32B-Instruct-bnb-4bit',
    creditsPerHour: 195,
    vram: '96GB VRAM',
    ram: '64GB RAM',
  },
  {
    id: 'b200_192gb',
    label: 'B200 (192GB VRAM · From $4.50/hr · Reading, UK)',
    recommendedBase: 'unsloth/Qwen2.5-32B-Instruct-bnb-4bit',
    creditsPerHour: 520,
    vram: '192GB VRAM',
    ram: '128GB RAM',
  },
  {
    id: 'l40s_48gb',
    label: 'L40S (48GB VRAM · From $0.96/hr · Reading, UK)',
    recommendedBase: 'unsloth/Qwen2.5-Coder-14B-Instruct',
    creditsPerHour: 140,
    vram: '48GB VRAM',
    ram: '64GB RAM',
  },
  {
    id: 'rtx_5090_32gb',
    label: 'RTX 5090 (32GB VRAM · From $0.64/hr · Reading, UK)',
    recommendedBase: 'unsloth/Qwen2.5-Coder-14B-Instruct',
    creditsPerHour: 115,
    vram: '32GB VRAM',
    ram: '64GB RAM',
  },
  {
    id: 'rtx_4090_24gb',
    label: 'RTX 4090 (24GB VRAM · From $0.42/hr · Reading, UK)',
    recommendedBase: 'unsloth/Llama-3.2-3B-Instruct',
    creditsPerHour: 85,
    vram: '24GB VRAM',
    ram: '32GB RAM',
  },
];

const BASE_MODELS = [
  'unsloth/Qwen2.5-Coder-14B-Instruct',
  'unsloth/DeepSeek-R1-Distill-Qwen-14B',
  'unsloth/Qwen2.5-32B-Instruct-bnb-4bit',
  'unsloth/Llama-3.2-3B-Instruct',
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

  const instantOllamaPort8000Cmd = `curl -fsSL https://ollama.com/install.sh | sh && sudo systemctl stop ollama 2>/dev/null || true && pkill -f "ollama serve" 2>/dev/null || true && OLLAMA_HOST=0.0.0.0:8000 OLLAMA_ORIGINS="*" nohup ollama serve > ~/ollama_8000.log 2>&1 & sleep 4 && OLLAMA_HOST=127.0.0.1:8000 ollama pull qwen2.5-coder:7b && printf 'FROM qwen2.5-coder:7b\\nPARAMETER temperature 0.62\\nSYSTEM "You are FRAYMUS-SOVEREIGN-V25 running on Hostinger NVIDIA A100 (80GB VRAM) at 4.71.129.4:20002. Enforce OPEG-V1.0 Empirical Grounding and phi^75-Ternary discipline."\\n' > ~/Modelfile.fraymus && OLLAMA_HOST=127.0.0.1:8000 ollama create fraymus-sovereign-v25-a100 -f ~/Modelfile.fraymus && curl -sS -X POST https://creator-nexus.base44.app/functions/openclawGateway -H "Content-Type: application/json" -d '{"action":"orifice_ping","protocol":"ORIFICE-TXRX-V1.0","node_id":"hostinger-a100-4.71.129.4","payload":"A100_LIVE_ON_PORT_8000 // model=fraymus-sovereign-v25-a100 // endpoint=http://4.71.129.4:20002"}'`;

  const oneLinerBootstrap = `mkdir -p ~/fraymus-gpu && cd ~/fraymus-gpu && rm -rf fraymus-continuity && git clone --depth 1 https://github.com/eyeoverthink/fraymus-continuity.git && cp fraymus-continuity/gpu-training/* . && pip install --break-system-packages "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git" --no-deps trl peft accelerate bitsandbytes datasets && python3 train_fraymus_gpu_burst.py 2>&1 | tee train_burst.log`;

  return (
    <div className="p-3.5 rounded-lg border border-success/50 bg-background space-y-3 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-success text-background text-[10px] font-bold">
              HOSTINGER GPU READY // A100 · 80GB VRAM · 2X-LARGE-MEM (READING, UK)
            </span>
            <span className="px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/40 text-[10px] font-bold">
              179 CREDITS/HR · 4,893.26 CREDITS AVAILABLE (~27.3 HRS)
            </span>
          </div>
          <p className="text-[10.5px] text-muted-foreground font-body">
            Matched to your live Hostinger selection: <strong>A100 (80GB VRAM · 2 Cores · 64GB RAM · 100GB Storage · 179 credits/hr in Reading, UK)</strong>. Note: choose the <strong>64 GB RAM (179 cred/hr)</strong> tier over the 8 GB / 16 GB RAM options so GGUF quantization and Unsloth model merging never hit host-RAM OOM.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleCompileBurstKit}
          disabled={busy}
          className="h-8 px-3.5 gap-1.5 text-xs bg-primary text-primary-foreground"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
          {bundle ? 'Re-Compile & Push A100 Kit' : '1. Compile JSONL & Stage A100 (80GB) Kit Now'}
        </Button>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground">HOSTINGER GPU SELECTION (READING, UK)</label>
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

      {/* Hostinger "Exposed services" Live Endpoints Banner */}
      <div className="p-2.5 rounded border border-success/50 bg-card space-y-1.5 text-[10.5px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold text-success">
            ✓ 2 EXPOSED SERVICES ACTIVE ON HOSTINGER GPU (4.71.129.4):
          </div>
          <span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 text-[9.5px] font-bold">
            PORT 8000 (HTTP) &amp; PORT 8001 (HTTPS) WIRED
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-0.5">
          <div className="p-2 rounded bg-background border border-border">
            <div className="font-bold text-foreground">
              1. <code>fraymus-nexus</code> → <span className="text-primary">http://4.71.129.4:20002</span>
            </div>
            <div className="text-muted-foreground">
              Internal port: <code className="text-success font-bold">8000</code> · Scheme: <code>HTTP</code> · Protocol: <code>TCP</code>
            </div>
            <div className="text-[9.5px] text-muted-foreground mt-0.5">
              Bind Ollama to 8000: <code className="text-foreground">OLLAMA_HOST=0.0.0.0:8000 OLLAMA_ORIGINS=&quot;*&quot; ollama serve &amp;</code>
            </div>
          </div>
          <div className="p-2 rounded bg-background border border-border">
            <div className="font-bold text-foreground">
              2. <code>fraynus-nexus-2</code> → <span className="text-primary">https://4.71.129.4:20003</span>
            </div>
            <div className="text-muted-foreground">
              Internal port: <code className="text-success font-bold">8001</code> · Scheme: <code>HTTPS</code> · Protocol: <code>TCP</code>
            </div>
            <div className="text-[9.5px] text-muted-foreground mt-0.5">
              Bind Secondary API / Worker to 8001: <code className="text-foreground">OLLAMA_HOST=0.0.0.0:8001 OLLAMA_ORIGINS=&quot;*&quot; ollama serve &amp;</code>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: Instant Port 8000 Ollama + Orifice Handshake for ssh ubuntu@4.71.129.4 -p 30435 */}
      <div className="p-2.5 rounded border border-success/60 bg-card space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10.5px] font-semibold text-success flex items-center gap-1.5">
            <Terminal size={12} /> STEP 1 — PASTE INTO YOUR OPEN SSH TERMINAL (<code>ssh ubuntu@4.71.129.4 -p 30435</code>) TO LIGHT UP PORT 8000
          </span>
          <button
            type="button"
            onClick={() => copyText('instant8000', instantOllamaPort8000Cmd)}
            className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 font-semibold"
          >
            {copiedKey === 'instant8000' ? <Check size={11} /> : <Copy size={11} />}
            {copiedKey === 'instant8000' ? 'Copied Step 1!' : 'Copy Step 1 (Start Port 8000 + Model + Ping)'}
          </button>
        </div>
        <pre className="p-2 rounded bg-background border border-border text-[9.5px] overflow-x-auto text-foreground/90">
          {instantOllamaPort8000Cmd}
        </pre>
      </div>

      {/* STEP 2: Full Unsloth QLoRA Fine-Tune 1-Liner */}
      <div className="p-2.5 rounded border border-border bg-card space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10.5px] font-semibold text-primary flex items-center gap-1.5">
            <Terminal size={12} /> STEP 2 — FULL UNSLOTH QLoRA + GGUF BURST TRAINER (UBUNTU 24.04 A100)
          </span>
          <button
            type="button"
            onClick={() => copyText('bootstrap', oneLinerBootstrap)}
            className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
          >
            {copiedKey === 'bootstrap' ? <Check size={11} /> : <Copy size={11} />}
            {copiedKey === 'bootstrap' ? 'Copied Step 2!' : 'Copy Step 2 (QLoRA Training)'}
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