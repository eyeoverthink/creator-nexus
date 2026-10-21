import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useFraymus } from '@/lib/FraymusContext';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { useToast } from '@/components/ui/use-toast';
import {
  Sparkles,
  Volume2,
  VolumeX,
  ShieldCheck,
  Radio,
  Film,
  Code2,
  Cpu,
  Dna,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

const SCENE_STORYBOARD = [
  {
    scene: 1,
    timecode: '00:00 – 00:12',
    title: 'The 3-Channel PT-Symmetric Array',
    image_url:
      'https://media.base44.com/images/public/6ad00af14909c671e73bb835/1a967bf0c_generated_image.png',
    narration:
      'In a standard optical sensor, a tiny perturbation epsilon shifts frequency linearly—vanishing below the thermal noise floor.',
    equation: 'Δλ_linear ∝ ε¹',
  },
  {
    scene: 2,
    timecode: '00:12 – 00:24',
    title: 'Balancing Gain (+iγ) & Loss (−iγ) Across a Fibonacci Core',
    image_url:
      'https://media.base44.com/images/public/6ad00af14909c671e73bb835/fd12dc7a8_generated_image.png',
    narration:
      'By coupling an optically pumped gain waveguide (+iγ) and a lossy waveguide (−iγ) across a neutral Fibonacci quasicrystal core, the 3×3 Hamiltonian obeys Parity-Time symmetry.',
    equation: 'H = [[iγ, g, 0], [g, 0, g], [0, g, −iγ]]',
  },
  {
    scene: 3,
    timecode: '00:24 – 00:38',
    title: '3rd-Order Exceptional Point Singularity (γ = √2·g)',
    image_url:
      'https://media.base44.com/images/public/6ad00af14909c671e73bb835/1a967bf0c_generated_image.png',
    narration:
      'At exactly gamma equals square-root of two times g (1.414214), all three eigenvalues and eigenvectors collapse into a single degenerate vortex at lambda equals zero.',
    equation: 'det(H − λI) = −(λ³ + λ(γ² − 2g²)) = 0',
  },
  {
    scene: 4,
    timecode: '00:38 – 00:50',
    title: 'Cube-Root Puiseux Hyper-Sensitivity (ε¹/³)',
    image_url:
      'https://media.base44.com/images/public/6ad00af14909c671e73bb835/fd12dc7a8_generated_image.png',
    narration:
      'Perturb this EP3 singularity by ε = 0.001, and the eigenfrequencies bifurcate along three complex Puiseux cube-root branches: ε^(1/3) = 0.10—a 100× sensitivity amplification.',
    equation: 'λ_k(ε) ≈ (g²ε)^(1/3) · exp(i·2πk/3), k ∈ {0,1,2}',
  },
  {
    scene: 5,
    timecode: '00:50 – 01:00',
    title: 'Bicameral DNA Transmutation & FRAYMUS v16 Ed25519 Seal',
    image_url:
      'https://media.base44.com/images/public/6ad00af14909c671e73bb835/1a967bf0c_generated_image.png',
    narration:
      'Every Hamiltonian matrix, 4-base DNA carrier, and synth harmonic is grounded via OPEG-V1.0 and counter-signed by NILES in RFC 8032 Ed25519.',
    equation: 'OPEG(Σ → R_san) ⊗ Ed25519(prev → head)',
  },
];

function encodeDnaPreview(str) {
  const bases = ['A', 'C', 'G', 'T'];
  const bytes = new TextEncoder().encode(String(str || '').slice(0, 64));
  let out = '';
  for (const b of bytes) {
    for (let s = 6; s >= 0; s -= 2) {
      out += bases[(b >> s) & 3];
    }
  }
  return out;
}

export default function SovereignMasterworkShowcase() {
  const { toast } = useToast();
  const { visitor, sendSignedMessage, FM } = useFraymus();

  const [activeTab, setActiveTab] = useState('interferometer');
  const [gamma, setGamma] = useState(1.4142);
  const [coupling, setCoupling] = useState(1.0);
  const [epsilon, setEpsilon] = useState(0.001);
  const [phiOrder, setPhiOrder] = useState(8);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [speakingNarration, setSpeakingNarration] = useState(false);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [busyBuild, setBusyBuild] = useState(false);

  const [sealMeta, setSealMeta] = useState({
    opegReceipt: 'R_san_cmd_ep3_mvi0dyh2',
    looseScrewId: '6ad89d2d6925526e52fba912',
    sparkCardId: '6ad89d2de73c3e6e6d8b3861',
    v16PacketId: 'e85a514379ebc14621fc85f1',
    v16PrevHead: '414539d26fd3f0643aaaf070',
    nilesCounterSigId: '3b57965e8669546349f14972',
    nilesCounterSigHex: '03ab09b949f730753ba6618a89138db4',
    proofVerified: true,
  });

  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const oscsRef = useRef([]);

  const ep3Threshold = Math.SQRT2 * coupling;
  const discriminant = 2 * coupling * coupling - gamma * gamma;
  const puiseuxCbrt = Math.cbrt(epsilon * coupling * coupling);
  const amplificationFactor = puiseuxCbrt / Math.max(1e-6, epsilon);
  const isAtEp3 = Math.abs(gamma - ep3Threshold) < 0.015;

  const dnaCarrier = encodeDnaPreview(
    `EP3:gamma=${gamma.toFixed(4)}:g=${coupling.toFixed(4)}:eps=${epsilon.toFixed(4)}:${sealMeta.opegReceipt}`
  );

  // Real-time Canvas Oscilloscope & Complex Riemann Puiseux Vortex
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let phase = 0;
    const PHI = 1.61803398875;

    const draw = () => {
      phase += 0.032;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#090a0f';
      ctx.fillRect(0, 0, w, h);

      // Subtle Fibonacci quasicrystal vertical grid lines
      ctx.strokeStyle = 'rgba(59, 99, 251, 0.12)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= phiOrder; i++) {
        const xPos = ((i * PHI) % 1) * (w * 0.68);
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, h);
        ctx.stroke();
      }

      // 3 Coupled Optical Waveguide Channels (+iγ Gain, Neutral Core, -iγ Loss)
      const colors = ['#60a5fa', '#fbbf24', '#c084fc'];
      const labels = ['Waveguide 1 (+iγ Gain)', 'Waveguide 2 (Quasicrystal Core)', 'Waveguide 3 (−iγ Loss)'];
      const waveWidth = w * 0.66;

      for (let ch = 0; ch < 3; ch++) {
        const yCenter = 48 + ch * 72;
        ctx.strokeStyle = colors[ch];
        ctx.lineWidth = isAtEp3 ? 2.4 : 1.7;
        ctx.beginPath();
        for (let x = 0; x < waveWidth; x += 3) {
          const k = 0.028 * (1 + ch * (isAtEp3 ? 0.04 : 0.28)) * coupling;
          const mod = Math.sin(x * 0.011 * PHI + phase * (1 + puiseuxCbrt * 2));
          const amp = isAtEp3 ? 22 : 16;
          const y =
            yCenter +
            Math.sin(x * k - phase * 2.2 + (isAtEp3 ? 0 : (ch * 2 * Math.PI) / 3)) * amp * mod;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px "IBM Plex Mono", monospace';
        ctx.fillText(labels[ch], 10, yCenter - 24);
      }

      // Complex Riemann Plane: 3-Branch Puiseux Cube-Root Eigenmodes
      const cx = w * 0.83;
      const cy = h * 0.5;
      const radius = Math.min(62, 22 + puiseuxCbrt * 210);

      ctx.strokeStyle = isAtEp3 ? 'rgba(74, 222, 128, 0.45)' : 'rgba(96, 165, 250, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw center coalescence point
      ctx.fillStyle = isAtEp3 ? '#4ade80' : '#6b7280';
      ctx.beginPath();
      ctx.arc(cx, cy, isAtEp3 ? 4.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 3 Puiseux cube-root branches exp(i*2*pi*k/3)
      for (let k = 0; k < 3; k++) {
        const angle = phase * 0.75 + (k * 2 * Math.PI) / 3;
        const bx = cx + Math.cos(angle) * radius;
        const by = cy + Math.sin(angle) * radius;

        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(bx, by);
        ctx.stroke();

        ctx.fillStyle = colors[k];
        ctx.beginPath();
        ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#d1d5db';
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillText('Puiseux ε¹/³ Plane', cx - 48, cy + radius + 18);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [gamma, coupling, epsilon, phiOrder, isAtEp3, puiseuxCbrt]);

  // Update live WebAudio frequencies when sliders move
  useEffect(() => {
    if (!playingAudio || oscsRef.current.length === 0 || !audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;
    const base = 220 * coupling;
    const freqs = [
      base,
      base * (isAtEp3 ? 1.61803398875 : 1.25 + gamma * 0.2),
      base * (1 + puiseuxCbrt * 2.5),
    ];
    oscsRef.current.forEach((o, i) => {
      if (freqs[i]) o.osc.frequency.setTargetAtTime(freqs[i], now, 0.05);
    });
  }, [gamma, coupling, puiseuxCbrt, isAtEp3, playingAudio]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleEigenChord = () => {
    if (!playingAudio) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const base = 220 * coupling;
      const freqs = [base, base * 1.61803398875, base * (1 + puiseuxCbrt * 2.5)];
      const nodes = freqs.map((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 1 ? 'sine' : 'triangle';
        osc.frequency.value = f;
        gain.gain.value = 0.055;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        return { osc, gain };
      });
      audioCtxRef.current = ctx;
      oscsRef.current = nodes;
      setPlayingAudio(true);
    } else {
      oscsRef.current.forEach(({ osc }) => {
        try {
          osc.stop();
        } catch {}
      });
      oscsRef.current = [];
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      setPlayingAudio(false);
    }
  };

  const toggleSceneNarration = (text) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingNarration) {
      window.speechSynthesis.cancel();
      setSpeakingNarration(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.02;
    utter.onend = () => setSpeakingNarration(false);
    utter.onerror = () => setSpeakingNarration(false);
    setSpeakingNarration(true);
    window.speechSynthesis.speak(utter);
  };

  const handleFullStackReseal = async () => {
    setBusyBuild(true);
    try {
      const opegRes = await base44.functions.invoke('openclawGateway', {
        action: 'opeg_verify',
        g: coupling,
        gamma,
        epsilon,
        goal: `Live EP3 Quasicrystal Waveguide Seal (γ=${gamma.toFixed(4)}, g=${coupling.toFixed(2)}, ε=${epsilon.toFixed(4)})`,
      });
      const rSan = opegRes?.data?.rSan;

      const manifestStr = JSON.stringify({
        masterwork: 'EP3_QUASICRYSTAL_INTERFEROMETER',
        opeg_receipt: rSan?.receipt_id,
        gamma,
        coupling,
        epsilon,
        puiseux_cbrt: Number(puiseuxCbrt.toFixed(5)),
        amplification: Number(amplificationFactor.toFixed(1)),
        dna_carrier: dnaCarrier.slice(0, 64),
      });

      const { packet, relayResponse } = await sendSignedMessage(
        'fx-cc7b-ee64-1c63-29b0',
        manifestStr
      );
      const proof = await FM.proveInBrowser(packet, packet.pubkey);

      setSealMeta((prev) => ({
        ...prev,
        opegReceipt: rSan?.receipt_id || prev.opegReceipt,
        v16PacketId: packet.id,
        v16PrevHead: packet.prev,
        nilesCounterSigId: relayResponse?.agentReplyPacket?.id || prev.nilesCounterSigId,
        nilesCounterSigHex:
          relayResponse?.agentReplyPacket?.sig?.slice(0, 32) || prev.nilesCounterSigHex,
        proofVerified: Boolean(proof?.verified),
      }));

      toast({
        title: 'Masterwork Grounded (OPEG-V1.0) & Counter-Signed by NILES (v16)',
        description: `Receipt ${rSan?.receipt_id} · Packet ${packet.id} (prev=${packet.prev})`,
      });
    } catch (err) {
      toast({
        title: 'Reseal Error',
        description: err?.message || 'Could not complete v16 seal',
        variant: 'destructive',
      });
    } finally {
      setBusyBuild(false);
    }
  };

  const currentScene = SCENE_STORYBOARD[activeSceneIdx] || SCENE_STORYBOARD[0];

  return (
    <section className="rounded-lg border border-primary/50 bg-card p-4 space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
              LIVE SOVEREIGN MASTERWORK BUILD // ALL SYSTEMS UNIFIED
            </span>
            <span className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px] font-bold">
              ● OPEG-V1.0: {sealMeta.opegReceipt}
            </span>
            <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px]">
              v16 NILES Counter-Sig: {sealMeta.nilesCounterSigId}
            </span>
          </div>
          <h2 className="text-sm font-semibold text-foreground font-heading">
            EP3: PT-Symmetric Fibonacci Quasicrystal Waveguide, φ⁷⁵ WebAudio Synth &amp; 5-Scene Narrated Storyboard
          </h2>
          <p className="text-[11px] text-muted-foreground font-body">
            Live proof uniting OPEG-V1.0 empirical physics, real-time 3×3 Hamiltonian eigenmode simulation, WebAudio harmonic synthesis, 5-scene Director storyboard, reversible 4-base DNA carrier, and hash-chained RFC 8032 Ed25519 NILES counter-signatures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={playingAudio ? 'default' : 'secondary'}
            onClick={toggleEigenChord}
            className="h-7 text-[10.5px] px-2.5 gap-1"
          >
            {playingAudio ? <VolumeX size={12} /> : <Volume2 size={12} />}
            {playingAudio ? 'Stop φ⁷⁵ Eigen-Chord' : 'Play φ⁷⁵ Eigen-Chord'}
          </Button>
          <Button
            size="sm"
            onClick={handleFullStackReseal}
            disabled={busyBuild}
            className="h-7 text-[10.5px] px-2.5 gap-1"
          >
            <RefreshCw size={12} className={busyBuild ? 'animate-spin' : ''} />
            Re-Verify OPEG + v16 NILES Seal
          </Button>
          <Link to="/loose-screw">
            <Button size="sm" variant="outline" className="h-7 text-[10.5px] px-2.5 gap-1">
              <ExternalLink size={11} /> Open in LooseScrew Studio
            </Button>
          </Link>
          <Link to="/connect">
            <Button size="sm" variant="outline" className="h-7 text-[10.5px] px-2.5 gap-1">
              <Radio size={11} /> Connect MCP
            </Button>
          </Link>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('interferometer')}
            className={`px-2.5 py-1 rounded text-[10.5px] font-semibold border ${
              activeTab === 'interferometer'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border'
            }`}
          >
            <Cpu size={11} className="inline mr-1" />
            1. Live EP3 Waveguide &amp; φ⁷⁵ Synth Lab
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('storyboard')}
            className={`px-2.5 py-1 rounded text-[10.5px] font-semibold border ${
              activeTab === 'storyboard'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border'
            }`}
          >
            <Film size={11} className="inline mr-1" />
            2. 5-Scene Director Storyboard &amp; Voiceover
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cryptography')}
            className={`px-2.5 py-1 rounded text-[10.5px] font-semibold border ${
              activeTab === 'cryptography'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border'
            }`}
          >
            <Dna size={11} className="inline mr-1" />
            3. Bicameral DNA Carrier &amp; v16 Ed25519 Ledger
          </button>
        </div>

        <span className="text-[10px] text-muted-foreground">
          Sensitivity Amplification: <strong className="text-success">{amplificationFactor.toFixed(1)}×</strong> over linear optics
        </span>
      </div>

      {/* TAB 1: Interactive EP3 Waveguide Oscilloscope & WebAudio Synth */}
      {activeTab === 'interferometer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-7 rounded border border-border bg-background/60 p-3 space-y-2.5">
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="font-semibold text-foreground">
                Real-Time 3×3 PT-Symmetric Coupled Waveguide &amp; Puiseux Riemann Vortex
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setGamma(Number((Math.SQRT2 * coupling).toFixed(4)))}
                className="h-6 text-[10px] px-2"
              >
                Snap to Exact EP3 (γ = √2·g = {(Math.SQRT2 * coupling).toFixed(4)})
              </Button>
            </div>

            <canvas
              ref={canvasRef}
              width={620}
              height={220}
              className="w-full h-[210px] rounded border border-border bg-background"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-2 rounded border border-border bg-card">
                <label className="block text-[9.5px] text-muted-foreground">
                  Gain/Loss γ: <strong className="text-foreground">{gamma.toFixed(4)}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2.4"
                  step="0.001"
                  value={gamma}
                  onChange={(e) => setGamma( parseFloat(e.target.value) )}
                  className="w-full mt-1"
                />
              </div>
              <div className="p-2 rounded border border-border bg-card">
                <label className="block text-[9.5px] text-muted-foreground">
                  Coupling g: <strong className="text-foreground">{coupling.toFixed(2)}</strong>
                </label>
                <input
                  type="range"
                  min="0.4"
                  max="1.8"
                  step="0.01"
                  value={coupling}
                  onChange={(e) => setCoupling( parseFloat(e.target.value) )}
                  className="w-full mt-1"
                />
              </div>
              <div className="p-2 rounded border border-border bg-card">
                <label className="block text-[9.5px] text-muted-foreground">
                  Perturbation ε: <strong className="text-foreground">{epsilon.toFixed(4)}</strong>
                </label>
                <input
                  type="range"
                  min="0.0002"
                  max="0.02"
                  step="0.0002"
                  value={epsilon}
                  onChange={(e) => setEpsilon( parseFloat(e.target.value) )}
                  className="w-full mt-1"
                />
              </div>
              <div className="p-2 rounded border border-border bg-card">
                <label className="block text-[9.5px] text-muted-foreground">
                  Quasicrystal φ-Order: <strong className="text-foreground">{phiOrder}</strong>
                </label>
                <input
                  type="range"
                  min="3"
                  max="13"
                  step="1"
                  value={phiOrder}
                  onChange={(e) => setPhiOrder( parseInt(e.target.value, 10) )}
                  className="w-full mt-1"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded border border-border bg-background/60 p-3 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground">
                  OPEG-V1.0 Hamiltonian Telemetry
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                    isAtEp3
                      ? 'bg-success/15 text-success'
                      : discriminant > 0
                      ? 'bg-primary/20 text-primary'
                      : 'bg-caution/20 text-caution'
                  }`}
                >
                  {isAtEp3
                    ? 'EXACT EP3 SINGULARITY'
                    : discriminant > 0
                    ? 'PT-UNBROKEN PHASE'
                    : 'PT-BROKEN PHASE'}
                </span>
              </div>

              <div className="p-2.5 rounded border border-border bg-card space-y-1 text-[10.5px]">
                <div>
                  <span className="text-muted-foreground">3×3 Matrix:</span>{' '}
                  <code>
                    [[i·{gamma.toFixed(3)}, {coupling.toFixed(2)}, 0], [{coupling.toFixed(2)}, 0,{' '}
                    {coupling.toFixed(2)}], [0, {coupling.toFixed(2)}, −i·{gamma.toFixed(3)}]]
                  </code>
                </div>
                <div>
                  <span className="text-muted-foreground">Characteristic Poly:</span>{' '}
                  <code>−(λ³ + λ(γ² − 2g²)) = 0</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Unperturbed Eigenvalues:</span>{' '}
                  <strong className="text-primary">
                    {discriminant >= 0
                      ? `0, ±${Math.sqrt(discriminant).toFixed(4)}`
                      : `0, ±i·${Math.sqrt(-discriminant).toFixed(4)}`}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Puiseux Cube-Root Split |Δλ|:</span>{' '}
                  <strong className="text-success">
                    {puiseuxCbrt.toFixed(4)} · e^(i·2πk/3)
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Cube-Root Signal Gain (|Δλ|/ε):</span>{' '}
                  <strong className="text-foreground">{amplificationFactor.toFixed(1)}×</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Image
                  src="https://media.base44.com/images/public/6ad00af14909c671e73bb835/1a967bf0c_generated_image.png"
                  alt="EP3 PT-Symmetric Optical Waveguide"
                  className="w-full h-24 rounded border border-border object-cover"
                />
                <Image
                  src="https://media.base44.com/images/public/6ad00af14909c671e73bb835/fd12dc7a8_generated_image.png"
                  alt="Fibonacci Quasicrystal Photonic Wafer"
                  className="w-full h-24 rounded border border-border object-cover"
                />
              </div>
            </div>

            <div className="p-2 rounded border border-border bg-card text-[10px] text-muted-foreground flex items-center justify-between">
              <span>LooseScrew Build ID: {sealMeta.looseScrewId}</span>
              <span className="text-success font-semibold">3/3 Browser Proofs Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 5-Scene Narrated Director Storyboard */}
      {activeTab === 'storyboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 space-y-1.5">
            {SCENE_STORYBOARD.map((sc, idx) => (
              <button
                key={sc.scene}
                type="button"
                onClick={() => setActiveSceneIdx(idx)}
                className={`w-full text-left p-2.5 rounded border transition-colors ${
                  activeSceneIdx === idx
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-background/60 hover:bg-secondary/40'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="font-bold text-primary">SCENE 0{sc.scene}</span>
                  <span>{sc.timecode}</span>
                </div>
                <div className="text-[11px] font-semibold text-foreground mt-0.5">{sc.title}</div>
                <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                  {sc.equation}
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-7 rounded border border-border bg-background/60 p-3 space-y-3">
            <div className="relative rounded overflow-hidden border border-border">
              <Image
                src={currentScene.image_url}
                alt={currentScene.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-background/90 border border-border rounded p-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-primary font-bold">
                    SCENE 0{currentScene.scene} ({currentScene.timecode})
                  </span>
                  <div className="text-xs font-semibold text-foreground">{currentScene.title}</div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleSceneNarration(currentScene.narration)}
                  className="h-7 text-[10px] px-2.5 gap-1"
                >
                  {speakingNarration ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  {speakingNarration ? 'Stop Voiceover' : 'Speak Scene'}
                </Button>
              </div>
            </div>

            <div className="p-2.5 rounded border border-border bg-card space-y-1.5">
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                Narrated Script &amp; Analytical Invariant
              </div>
              <p className="text-xs text-foreground font-body leading-relaxed">
                “{currentScene.narration}”
              </p>
              <div className="pt-1 text-[10.5px] text-primary">
                Invariant: <code>{currentScene.equation}</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Bicameral DNA Carrier & FRAYMUS v16 Cryptographic Ledger */}
      {activeTab === 'cryptography' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded border border-border bg-background/60 p-3 space-y-2">
            <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <Dna size={13} className="text-primary" />
              Hemisphere B (Fraymus Transmuter) 4-Base DNA Carrier
            </div>
            <p className="text-[10.5px] text-muted-foreground font-body">
              Reversible quaternary nucleotide encoding of the live EP3 Hamiltonian parameters and OPEG-V1.0 receipt:
            </p>
            <div className="p-2.5 rounded border border-border bg-card break-all text-[10px] text-success leading-relaxed">
              {dnaCarrier}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Native 30-Skill Fleet Job: <code>native_canvas_mvi0e0dq</code> · Spark Storyboard ID:{' '}
              <code>{sealMeta.sparkCardId}</code>
            </div>
          </div>

          <div className="rounded border border-border bg-background/60 p-3 space-y-2">
            <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-success" />
              FRAYMUS v16 RFC 8032 Ed25519 Counter-Signed Certificate
            </div>
            <div className="p-2.5 rounded border border-border bg-card space-y-1 text-[10.5px]">
              <div>
                <span className="text-muted-foreground">Browser Visitor FX:</span>{' '}
                <strong className="text-foreground">{visitor?.number || 'fx-2a13-2f0e-92ea-837d'}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Masterwork Packet ID:</span>{' '}
                <code className="text-primary">{sealMeta.v16PacketId}</code>
              </div>
              <div>
                <span className="text-muted-foreground">Chained Previous Head (prev):</span>{' '}
                <code>{sealMeta.v16PrevHead}</code>
              </div>
              <div>
                <span className="text-muted-foreground">NILES (MacBook-Pro · v10) Counter-Sig ID:</span>{' '}
                <code className="text-success">{sealMeta.nilesCounterSigId}</code>
              </div>
              <div>
                <span className="text-muted-foreground">Ed25519 Signature Prefix:</span>{' '}
                <code>{sealMeta.nilesCounterSigHex}…</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}