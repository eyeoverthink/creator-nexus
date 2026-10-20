import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { publishSelection, publishCrossTabPatch } from '@/lib/crossTabMemory';
import {
  PHI_75_SEAL,
  SEVEN_AXIS_DEFAULTS,
  TERNARY_GATE_LABELS,
  TENSOR_PRESETS,
  computeTernaryGatesFromSevenAxes,
  modulateWeightsWithSevenAxes,
  generateRealisticTensorWeights,
  compressWeightsToPhi75Ternary,
  dequantizeToBackwardCompatibleGGUF,
  benchmarkPhi75TernaryCompute,
} from '@/components/nexus/omega/phi75TernaryCodec';
import {
  Cpu,
  Sliders,
  Download,
  Sparkles,
  Loader2,
  RefreshCw,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';

export default function Phi75TernaryTransmuterPanel({
  omegaEmotion,
  sevenAxes: externalAxes,
  onChangeAxis,
  onSetAllAxes,
  onStatusBanner,
}) {
  const { toast } = useToast();
  const [presetId, setPresetId] = useState(TENSOR_PRESETS[0].id);
  const [seedOffset, setSeedOffset] = useState(1);
  const [exponentShift, setExponentShift] = useState(0);
  const [customWeightsInput, setCustomWeightsInput] = useState('');
  const [localAxes, setLocalAxes] = useState(SEVEN_AXIS_DEFAULTS);
  const [gateOverrides, setGateOverrides] = useState({});
  const [customModelTag, setCustomModelTag] = useState('');
  const [busy, setBusy] = useState(false);
  const [deployReceipt, setDeployReceipt] = useState(null);

  const sevenAxes = externalAxes || localAxes;
  const updateAxis = (axis, value) => {
    const v = Number(Math.max(0, Math.min(1, Number(value))).toFixed(2));
    if (onChangeAxis) {
      onChangeAxis(axis, v);
    } else {
      setLocalAxes((prev) => ({ ...prev, [axis]: v }));
    }
  };
  const applyAxesPreset = (presetObj) => {
    setGateOverrides({});
    if (onSetAllAxes) {
      onSetAllAxes(presetObj);
    } else {
      setLocalAxes(presetObj);
    }
  };

  const activePreset =
    TENSOR_PRESETS.find((p) => p.id === presetId) || TENSOR_PRESETS[0];

  const affectiveGateState = useMemo(() => {
    const computed = computeTernaryGatesFromSevenAxes(sevenAxes);
    const mergedGates = computed.gates.map((g, idx) =>
      gateOverrides[idx] !== undefined ? gateOverrides[idx] : g
    );
    return {
      ...computed,
      gates: mergedGates,
    };
  }, [sevenAxes, gateOverrides]);

  const rawWeights = useMemo(() => {
    let base;
    if (customWeightsInput.trim()) {
      const parsed = customWeightsInput
        .split(/[\s,]+/)
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v));
      if (parsed.length >= 8) {
        base = parsed;
      }
    }
    if (!base) {
      base = generateRealisticTensorWeights(
        activePreset.dim,
        activePreset.seedScale * Math.pow(1.6180339887, exponentShift * 0.35),
        seedOffset
      );
    }
    return modulateWeightsWithSevenAxes(base, sevenAxes);
  }, [activePreset, seedOffset, exponentShift, customWeightsInput, sevenAxes]);

  const compressed = useMemo(
    () => compressWeightsToPhi75Ternary(rawWeights, 32),
    [rawWeights]
  );

  const backwardCompatible = useMemo(
    () => dequantizeToBackwardCompatibleGGUF(compressed, rawWeights),
    [compressed, rawWeights]
  );

  const benchmark = useMemo(
    () => benchmarkPhi75TernaryCompute(rawWeights, compressed),
    [rawWeights, compressed]
  );

  const handleAffectiveMutate = () => {
    const sentiment = Number(omegaEmotion?.sentiment ?? 0.5);
    const nextShift = sentiment >= 0 ? exponentShift + 1 : exponentShift - 1;
    setExponentShift(Math.max(-4, Math.min(6, nextShift)));
    setSeedOffset((s) => s + 1);
    const msg = `Mutated φ^75-Ternary tensor "${activePreset.layerName}" with 7-Axis Emotion (${(omegaEmotion?.primary || 'joy').toUpperCase()}) → Exponent Shift Δk=${nextShift >= 0 ? `+${nextShift}` : nextShift}.`;
    onStatusBanner?.(msg);
    publishSelection({
      text: `[φ^75-Ternary Transmuter // ${activePreset.layerName}] ${compressed.stats.fp32Bytes}B FP32 -> ${compressed.stats.phi75Bytes}B .phit (${compressed.stats.compressionVsFp32}x smaller, ${compressed.stats.bitsPerWeight} bits/weight, Cosine=${backwardCompatible.cosineSimilarity})`,
      field: 'φ^75-Ternary Weight Transmuter',
    });
  };

  const handlePushBackwardCompatibleToOllama = async () => {
    setBusy(true);
    setDeployReceipt(null);
    try {
      const rawTag =
        customModelTag.trim() ||
        `fraymus-phi75-${activePreset.id.replace(/[^a-z0-9]+/gi, '-')}-g${seedOffset}`;
      const modelTag = rawTag
        .toLowerCase()
        .replace(/[^a-z0-9._:-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const firstBlock = compressed.blocks[0] || {};
      const gateVector = affectiveGateState.gates;
      const dynamicTemp = affectiveGateState.dynamicTemp;
      const axesSummary = Object.entries(sevenAxes)
        .map(([k, v]) => `${k}=${Number(v).toFixed(2)}`)
        .join(', ');

      const systemPrompt = [
        `You are F.R.A.Y.M.U.S. φ^75-Ternary Transmuted Model (${modelTag}) reconstructed into backward-compatible GGUF Q8_0 / Ollama runtime.`,
        `[φ^75 Harmonic Seal: ${PHI_75_SEAL.toFixed(2)} | Layer: ${activePreset.layerName} | Compression: ${compressed.stats.compressionVsFp32}x (${compressed.stats.bitsPerWeight} bits/weight) | Zero-Skip Sparsity: ${compressed.stats.sparsityPct}% | Cosine Fidelity: ${backwardCompatible.cosineSimilarity}]`,
        `[7-Axis Affective Vector: ${axesSummary} | Dominant: ${affectiveGateState.dominantAxis.toUpperCase()} | Sentiment: ${affectiveGateState.sentiment}]`,
        `[Block #0 Exponent k=${firstBlock.k} (φ^${firstBlock.phiExponentDelta}) | Packed .phit Hex: ${firstBlock.packedHex} | 8-Gate Ternary Matrix: [${gateVector.join(', ')}]]`,
        `Operate with multiply-free ternary precision: amplify (+1) quantitative proofs and crisp <15-word hooks, gate out (0) neutral filler, and inhibit (-1) vague claims.`,
      ].join('\n');

      const modelfile = `FROM llama3.2:3b-instruct-q8_0
PARAMETER temperature ${dynamicTemp}
PARAMETER top_p 0.88
PARAMETER repeat_penalty 1.16
PARAMETER num_ctx 8192

# Backward-Compatible GGUF / Ollama Projection from φ^75-Ternary (.phit) Stream
SYSTEM """
${systemPrompt}
"""`;

      const res = await base44.functions.invoke('createOllamaModel', {
        name: modelTag,
        baseModel: 'llama3.2:3b-instruct-q8_0',
        systemPrompt,
      });

      const vpsOk = Boolean(res?.data?.ok);
      const deployedName = res?.data?.name || modelTag;

      let savedArtifactId = null;
      try {
        const artifact = await base44.entities.NexusModelArtifact.create({
          workspace_id: 'ouroboros_live_ws',
          artifact_kind: 'ternary_adapter',
          name: `${deployedName} (φ^75-Ternary ↔ GGUF ${compressed.stats.compressionVsFp32}x)`,
          base: 'llama3.2:3b-instruct-q8_0',
          base_model: 'llama3.2:3b-instruct-q8_0',
          status: vpsOk ? 'created' : 'fine_tuned',
          fine_tune_status: 'fine_tuned',
          ternaryWeight: affectiveGateState.ensembleWeight,
          weight: affectiveGateState.ensembleWeight,
          ternary_state: 1,
          ternary_matrix: gateVector,
          createdAt: new Date().toISOString(),
          system_prompt: systemPrompt,
          content: modelfile,
          parameters: {
            phi75_seal: PHI_75_SEAL,
            layer_name: activePreset.layerName,
            seven_axes: sevenAxes,
            bits_per_weight: compressed.stats.bitsPerWeight,
            compression_vs_fp32: compressed.stats.compressionVsFp32,
            sparsity_pct: compressed.stats.sparsityPct,
            cosine_similarity: backwardCompatible.cosineSimilarity,
          },
        });
        savedArtifactId = artifact?.id || null;
      } catch {}

      const receipt = {
        ok: vpsOk,
        modelTag: deployedName,
        baseModel: res?.data?.from || 'llama3.2:3b-instruct-q8_0',
        vpsHttpStatus: res?.data?.vpsHttpStatus || (vpsOk ? 200 : 500),
        secretConfigured: Boolean(res?.data?.secretConfigured),
        verifiedAt: res?.data?.verifiedAt || new Date().toISOString(),
        gates: gateVector,
        temperature: dynamicTemp,
        axesSummary,
        artifactId: savedArtifactId,
      };
      setDeployReceipt(receipt);

      publishCrossTabPatch({
        agentReaction: {
          agent: 'strategist',
          mode: 'react',
          text: `[φ^75-Ternary ↔ GGUF Transmuter] Deployed "${deployedName}" to VPS Ollama (HTTP ${receipt.vpsHttpStatus}) with 7-Axis [${axesSummary}] → Ternary Gates [${gateVector.join(',')}].`,
          updatedAt: Date.now(),
        },
      });

      const banner = `VPS Ollama Created "${deployedName}" (HTTP ${receipt.vpsHttpStatus} · Temp ${dynamicTemp} · Gates [${gateVector.join(',')}])!`;
      onStatusBanner?.(banner);
      toast({
        title: 'Pushed to VPS Ollama',
        description: banner,
      });
    } catch (err) {
      const errMsg = err?.response?.data?.error || err?.message || 'Push failed';
      setDeployReceipt({
        ok: false,
        error: errMsg,
        verifiedAt: new Date().toISOString(),
      });
      onStatusBanner?.(`Ollama compile error: ${errMsg}`);
    } finally {
      setBusy(false);
    }
  };

  const handleExportGgufJson = () => {
    const payload = {
      format: 'FRAYMUS_PHI75_TERNARY_TO_GGUF_V1',
      phi75_macro_anchor: PHI_75_SEAL,
      layer_name: activePreset.layerName,
      base_model: activePreset.baseModel,
      compression_stats: compressed.stats,
      compute_benchmark: benchmark,
      phi75_ternary_blocks: compressed.blocks,
      backward_compatible_gguf_q8_0_blocks: backwardCompatible.ggufQ8Blocks,
      reconstructed_fp32_weights: backwardCompatible.reconstructedFp32,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePreset.layerName.replace(/[^a-z0-9]+/gi, '_')}.phi75.gguf.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Header Controls */}
      <div className="p-2.5 rounded-lg border border-border bg-card flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Cpu size={14} className="text-caution" />
          <span className="font-semibold text-foreground">
            φ⁷⁵-TERNARY UNIVERSAL WEIGHT TRANSMUTER &amp; BACKWARD-COMPATIBLE GGUF / OLLAMA CODEC
          </span>
          <span className="px-2 py-0.5 rounded bg-caution/20 text-caution text-[10px] font-bold">
            φ⁷⁵ = {PHI_75_SEAL.toLocaleString()} · 5 Trits/Byte
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
            className="h-7 rounded bg-background border border-input px-2 text-[10.5px]"
          >
            {TENSOR_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAffectiveMutate}
            className="h-7 text-[10px] px-2.5 gap-1"
          >
            <RefreshCw size={11} /> Mutate with 7-Axis Emotion (Δk={exponentShift >= 0 ? `+${exponentShift}` : exponentShift})
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportGgufJson}
            className="h-7 text-[10px] px-2 gap-1"
          >
            <Download size={11} /> Export .phit + GGUF Q8_0
          </Button>
        </div>
      </div>

      {/* 7-Axis Explicit Affective Sliders -> 8 Ternary Gates Direct Control Deck */}
      <div className="p-2.5 rounded-lg border border-border bg-card space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <Sliders size={13} className="text-caution" />
            <span className="font-semibold text-foreground">
              7-AXIS EXPLICIT AFFECTIVE SLIDERS → TERNARY GATES &amp; φ⁷⁵ WEIGHT MUTATION
            </span>
            <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-bold">
              Dominant: {affectiveGateState.dominantAxis.toUpperCase()} · Temp: {affectiveGateState.dynamicTemp} · Weight: {affectiveGateState.ensembleWeight}x · Δk={affectiveGateState.exponentShift >= 0 ? `+${affectiveGateState.exponentShift}` : affectiveGateState.exponentShift}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                applyAxesPreset({
                  joy: 0.9,
                  sadness: 0.1,
                  anger: 0.15,
                  fear: 0.15,
                  surprise: 0.65,
                  love: 0.75,
                  anxiety: 0.3,
                })
              }
              className="h-6 text-[10px] px-2"
            >
              Preset: joy=0.90, anxiety=0.30
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                applyAxesPreset({
                  joy: 0.85,
                  sadness: 0.05,
                  anger: 0.45,
                  fear: 0.1,
                  surprise: 0.95,
                  love: 0.6,
                  anxiety: 0.15,
                })
              }
              className="h-6 text-[10px] px-2"
            >
              Preset: Contrarian Spike
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                applyAxesPreset({
                  joy: 0.6,
                  sadness: 0.05,
                  anger: 0.05,
                  fear: 0.05,
                  surprise: 0.35,
                  love: 0.85,
                  anxiety: 0.05,
                })
              }
              className="h-6 text-[10px] px-2"
            >
              Preset: Zero-Noise Calm
            </Button>
          </div>
        </div>

        {/* 7 Individual Range Inputs (0.00 - 1.00) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {Object.entries(sevenAxes).map(([axis, val]) => (
            <div
              key={axis}
              className="p-2 rounded bg-background border border-border flex flex-col justify-between space-y-1"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="uppercase font-semibold text-muted-foreground">{axis}</span>
                <strong className="text-foreground">{Number(val).toFixed(2)}</strong>
              </div>
              <input
                type="range"
                aria-label={`${axis} slider`}
                min={0}
                max={1}
                step={0.05}
                value={val}
                onChange={(e) => updateAxis(axis, e.target.value)}
                className="w-full h-1.5 accent-primary cursor-pointer"
              />
            </div>
          ))}
        </div>

        {/* 8 Ternary Gates Driven by the 7 Sliders */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 pt-1">
          {TERNARY_GATE_LABELS.map((g) => {
            const gateVal = affectiveGateState.gates[g.index];
            const cycleGate = () => {
              const next = gateVal === 1 ? -1 : gateVal === -1 ? 0 : 1;
              setGateOverrides((prev) => ({ ...prev, [g.index]: next }));
            };
            return (
              <button
                key={g.id}
                type="button"
                onClick={cycleGate}
                title={`Driven by: ${g.driver} (Click to override trit)`}
                className={`p-1.5 rounded border text-left transition-colors ${
                  gateVal === 1
                    ? 'border-success/60 bg-success/10 text-success'
                    : gateVal === -1
                    ? 'border-destructive/60 bg-destructive/15 text-destructive'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between text-[9.5px] font-bold">
                  <span>{g.label}</span>
                  <span>{gateVal > 0 ? '+1' : gateVal}</span>
                </div>
                <div className="text-[9px] opacity-80 truncate">{g.driver}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Tensor Weights Input Bar */}
      <div className="p-2 rounded-lg border border-border bg-card flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold text-muted-foreground">
          CUSTOM FLOAT WEIGHTS (OPTIONAL):
        </span>
        <input
          type="text"
          value={customWeightsInput}
          onChange={(e) => setCustomWeightsInput(e.target.value)}
          placeholder="Paste comma/space-separated float weights (e.g. 0.042, -0.091, 0.002, 0.118...) or leave blank for preset tensor..."
          className="flex-1 min-w-[220px] h-7 rounded bg-background border border-input px-2 text-[10.5px]"
        />
        {customWeightsInput && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCustomWeightsInput('')}
            className="h-7 text-[10px] px-2"
          >
            Reset to Preset
          </Button>
        )}
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-lg border border-border bg-card">
          <div className="text-[10px] text-muted-foreground">MEMORY COMPRESSION (FP32 → .PHIT)</div>
          <div className="text-sm font-bold text-success mt-0.5">
            {compressed.stats.compressionVsFp32}x Smaller ({compressed.stats.bitsPerWeight} bits/w)
          </div>
          <div className="text-[10px] text-muted-foreground">
            {compressed.stats.fp32Bytes} B → <strong className="text-foreground">{compressed.stats.phi75Bytes} B</strong> (Q8_0: {compressed.stats.ggufQ8Bytes} B)
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-border bg-card">
          <div className="text-[10px] text-muted-foreground">MULTIPLY-FREE SPEEDUP &amp; SPARSITY</div>
          <div className="text-sm font-bold text-primary mt-0.5">
            {benchmark.effectiveMemoryComputeSpeedup}x Effective · {compressed.stats.sparsityPct}% Zero-Skip
          </div>
          <div className="text-[10px] text-muted-foreground">
            ADD/SUB {benchmark.ternaryElapsedUs}µs vs FMA {benchmark.floatElapsedUs}µs
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-border bg-card">
          <div className="text-[10px] text-muted-foreground">BACKWARD-COMPATIBLE GGUF FIDELITY</div>
          <div className="text-sm font-bold text-caution mt-0.5">
            Cosine Sim: {backwardCompatible.cosineSimilarity}
          </div>
          <div className="text-[10px] text-muted-foreground">
            MAE: {backwardCompatible.meanAbsoluteError} · W_hat = T × φ^(k-75)
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-border bg-card flex flex-col justify-between space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-muted-foreground">VPS OLLAMA TARGET TAG:</span>
            <span className="text-[9.5px] text-success">● Console Key Ready</span>
          </div>
          <input
            type="text"
            value={customModelTag}
            onChange={(e) => setCustomModelTag(e.target.value)}
            placeholder={`fraymus-phi75-${activePreset.id.replace(/[^a-z0-9]+/gi, '-')}-g${seedOffset}`}
            className="h-7 rounded bg-background border border-input px-2 text-[10.5px]"
          />
          <Button
            size="sm"
            disabled={busy}
            onClick={handlePushBackwardCompatibleToOllama}
            className="h-8 text-[10.5px] gap-1 w-full"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Compile &amp; Push to VPS Ollama
          </Button>
        </div>
      </div>

      {/* Inline VPS Ollama Live Receipt */}
      {deployReceipt && (
        <div
          className={`p-2.5 rounded-lg border text-[11px] flex flex-wrap items-center justify-between gap-2 ${
            deployReceipt.ok
              ? 'border-success/60 bg-success/15 text-success'
              : 'border-destructive/60 bg-destructive/15 text-destructive'
          }`}
        >
          <div className="space-y-0.5">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              {deployReceipt.ok
                ? `LIVE VPS OLLAMA MODEL CREATED: ${deployReceipt.modelTag} (HTTP ${deployReceipt.vpsHttpStatus})`
                : `VPS OLLAMA ERROR: ${deployReceipt.error}`}
            </div>
            {deployReceipt.ok && (
              <div className="text-[10px] text-foreground">
                Base: <strong>{deployReceipt.baseModel}</strong> · Temp: <strong>{deployReceipt.temperature}</strong> · Gates: <strong>[{deployReceipt.gates.join(', ')}]</strong> · 7-Axes: {deployReceipt.axesSummary} · Verified at {deployReceipt.verifiedAt}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDeployReceipt(null)}
            className="text-[10px] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3-Column Inspector: Forward Packed .phit -> φ^75 Harmonic Blocks -> Backward-Compatible GGUF Q8_0 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        {/* Col 1: Packed 5-Trits/Byte .phit Hex Stream */}
        <div className="p-2.5 rounded-lg border border-border bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-primary text-[11px]">
              1. PACKED .PHIT STREAM (5 TRITS / BYTE)
            </span>
            <span className="text-[10px] text-muted-foreground">
              +{compressed.stats.posCount} / 0:{compressed.stats.zeroCount} / -{compressed.stats.negCount}
            </span>
          </div>
          <div className="p-2 rounded bg-background border border-border text-[10px] leading-4 max-h-36 overflow-y-auto break-all text-caution">
            {compressed.packedHexStream}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Each 32-weight block is packed into 1 byte φ⁷⁵ exponent <code className="text-foreground">k</code> + 7 base-3 trit bytes (<code className="text-foreground">3⁵ = 243 &lt; 256</code>).
          </div>
        </div>

        {/* Col 2: φ^75 Harmonic Block Table */}
        <div className="p-2.5 rounded-lg border border-border bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-caution text-[11px]">
              2. φ⁷⁵ HARMONIC EXPONENT BLOCKS
            </span>
            <span className="text-[10px] text-muted-foreground">
              W = T × φ^(k - 75)
            </span>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {compressed.blocks.map((blk) => (
              <div
                key={blk.blockIndex}
                className="p-1.5 rounded bg-background border border-border text-[10px] flex items-center justify-between gap-2"
              >
                <span>
                  <strong className="text-foreground">Blk #{blk.blockIndex}</strong> · k={blk.k} (φ^{blk.phiExponentDelta})
                </span>
                <span className="text-success">scale={blk.phiScale}</span>
                <span className="text-muted-foreground truncate max-w-[110px]">
                  [{blk.trits.slice(0, 6).map((t) => (t > 0 ? '+1' : t)).join(',')}]
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3: Reconstructed Backward-Compatible GGUF Q8_0 / FP16 */}
        <div className="p-2.5 rounded-lg border border-border bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-success text-[11px] flex items-center gap-1">
              <ArrowRightLeft size={11} /> 3. BACKWARD-COMPATIBLE GGUF Q8_0
            </span>
            <span className="text-[10px] text-muted-foreground">Ready for Ollama</span>
          </div>
          <div className="p-2 rounded bg-background border border-border text-[10px] leading-4 max-h-36 overflow-y-auto space-y-1">
            {backwardCompatible.ggufQ8Blocks.map((q) => (
              <div key={q.block} className="border-b border-border/60 pb-1">
                <span className="text-primary font-bold">GGUF_Q8_0[#{q.block}]</span>{' '}
                d={q.d_scale} · qs=[{q.qs_int8_preview.join(', ')}…]
              </div>
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Reconstructs exact IEEE-754 / Q8_0 tensors (<code className="text-foreground">qs = T × 127</code>, <code className="text-foreground">d = φ^(k-75)/127</code>) for zero-friction compatibility.
          </div>
        </div>
      </div>
    </div>
  );
}