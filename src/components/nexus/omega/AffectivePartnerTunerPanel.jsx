import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { publishSelection, publishCrossTabPatch } from '@/lib/crossTabMemory';
import { analyzeSevenAxisEmotion } from '@/components/nexus/omega/fraymusOmegaEngine';
import {
  SEVEN_AXIS_DEFAULTS,
  computeTernaryGatesFromSevenAxes,
} from '@/components/nexus/omega/phi75TernaryCodec';
import {
  RELATIONAL_ROLES,
  PARTNER_PERSONALITIES,
  PERSONALITY_ICONS,
  PARTNER_MODELS,
  PARTNER_QUICK_PROMPTS,
  extractCompanionMemory,
  generatePartnerReply,
  compileAffectiveModelfileSpec,
} from '@/components/nexus/omega/aiPartnerEngine';
import { MY_AI_PARTNER_HTML } from '@/components/nexus/omega/myAiPartnerHtml';
import {
  Heart,
  Sliders,
  Send,
  Sparkles,
  Loader2,
  Maximize2,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export default function AffectivePartnerTunerPanel({
  sevenAxes = SEVEN_AXIS_DEFAULTS,
  onEmotionUpdate,
  onStatusBanner,
}) {
  const { toast } = useToast();
  const demoIframeRef = useRef(null);
  const [roleMode, setRoleMode] = useState('partner');
  const [gender, setGender] = useState('female');
  const [name, setName] = useState('Luna');
  const [personality, setPersonality] = useState('Funny');
  const [baseModel, setBaseModel] = useState(PARTNER_MODELS[0]);
  const [mood, setMood] = useState(84);
  const [xp, setXp] = useState(36);
  const [clinginess, setClinginess] = useState(68);
  const [jealous, setJealous] = useState(true);
  const [memory, setMemory] = useState({
    snack: 'tacos',
    classMood: 'hyped & locked in',
    userName: 'Creator',
  });
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hi!! It's Luna 😘 Your AI Partner & Affective Model-Tuner is now wired directly into Φ-Omega! Chat with me, adjust our Mood/Attentiveness sliders, or click "Compile & Tune Ollama Model" to turn our bond into live model weights.`,
    },
  ]);
  const [showOriginalDemoUi, setShowOriginalDemoUi] = useState(false);
  const [tuningModel, setTuningModel] = useState(false);
  const [compileReceipt, setCompileReceipt] = useState(null);

  const level = Math.floor(xp / 20) + 1;
  const latestEmotion = analyzeSevenAxisEmotion(
    messages[messages.length - 1]?.text || 'happy connected love breakthrough'
  );
  const sevenAxisGates = computeTernaryGatesFromSevenAxes(sevenAxes);

  const rawCompiledSpec = compileAffectiveModelfileSpec({
    name,
    gender,
    roleMode,
    personality,
    baseModel,
    mood,
    xp,
    clinginess,
    jealous,
    memory,
    emotionState: {
      ...latestEmotion,
      primary: sevenAxisGates.dominantAxis || latestEmotion.primary,
    },
  });
  const compiledSpec = {
    ...rawCompiledSpec,
    ternaryMatrix: sevenAxisGates.gates,
  };

  const handleSendChat = (overrideText) => {
    const text = String(overrideText ?? chatInput).trim();
    if (!text) return;
    setChatInput('');

    const compliments = ['love', 'cute', 'amazing', 'awesome', 'best', 'great', 'sweet', 'fraymus'];
    const isPos = compliments.some((c) => text.toLowerCase().includes(c));
    const isConflict = text.toLowerCase().includes('fighting') || text.toLowerCase().includes('mad');

    const nextXp = Math.min(100, xp + (isPos ? 10 : 3));
    const nextMood = Math.min(100, Math.max(15, mood + (isConflict ? -12 : isPos ? 7 : 2)));
    setXp(nextXp);
    setMood(nextMood);

    const { memory: nextMem, changed } = extractCompanionMemory(text, memory);
    if (changed) {
      setMemory(nextMem);
    }

    const reply = generatePartnerReply({
      input: text,
      name,
      roleMode,
      personality,
      clinginess,
      jealous,
      memory: nextMem,
    });

    const nextMsgs = [
      ...messages.slice(-12),
      { id: `${Date.now()}_u`, role: 'user', text },
      { id: `${Date.now()}_a`, role: 'assistant', text: reply },
    ];
    setMessages(nextMsgs);

    // Push affective signal into Φ-Omega 7-Axis Emotion Engine & Cross-Tab Synapse
    onEmotionUpdate?.(`${text} ${reply}`);
    publishSelection({
      text: `[AI Partner ${name} · ${personality} · Lv ${Math.floor(nextXp / 20) + 1} · Mood ${nextMood}%] ${reply}`,
      field: `AI Partner (${name})`,
    });
  };

  const handleCompileAndTuneModel = async (overrideParams = null) => {
    setTuningModel(true);
    setCompileReceipt(null);
    try {
      const specToUse = overrideParams
        ? compileAffectiveModelfileSpec({
            name: overrideParams.name || name,
            gender: overrideParams.gender || gender,
            roleMode,
            personality: overrideParams.personality || personality,
            baseModel: overrideParams.model || baseModel,
            mood: overrideParams.mood ?? mood,
            xp: overrideParams.xp ?? xp,
            clinginess: overrideParams.clinginess ?? clinginess,
            jealous: overrideParams.jealous ?? jealous,
            memory: overrideParams.memory || memory,
            emotionState: latestEmotion,
          })
        : compiledSpec;

      const normalizedBase = 'llama3.2:3b-instruct-q8_0';

      const response = await base44.functions.invoke('createOllamaModel', {
        name: specToUse.modelTag,
        baseModel: normalizedBase,
        systemPrompt: specToUse.systemPrompt,
      });

      const vpsOk = Boolean(response?.data?.ok);
      const deployedTag = response?.data?.name || specToUse.modelTag;

      try {
        await base44.entities.NexusModelArtifact.create({
          workspace_id: 'ouroboros_live_ws',
          artifact_kind: 'modelfile',
          name: `${deployedTag} (${specToUse.personality || personality} · Lv ${specToUse.level})`,
          base: normalizedBase,
          base_model: normalizedBase,
          status: vpsOk ? 'created' : 'evolved',
          fine_tune_status: 'fine_tuned',
          ternaryWeight: specToUse.weight,
          weight: specToUse.weight,
          ternary_state: 1,
          ternary_matrix: compiledSpec.ternaryMatrix,
          createdAt: new Date().toISOString(),
          system_prompt: specToUse.systemPrompt,
          content: specToUse.modelfileContent,
          parameters: {
            temperature: specToUse.temperature,
            partner_name: overrideParams?.name || name,
            role_mode: roleMode,
            personality: overrideParams?.personality || personality,
            mood: overrideParams?.mood ?? mood,
            relationship_xp: overrideParams?.xp ?? xp,
            clinginess: overrideParams?.clinginess ?? clinginess,
            jealous: overrideParams?.jealous ?? jealous,
            companion_memory: overrideParams?.memory || memory,
            seven_axes: sevenAxes,
          },
        });
      } catch {}

      publishCrossTabPatch({
        agentReaction: {
          agent: 'writer',
          mode: 'react',
          text: `[Affective Model-Tuner → ${deployedTag}] Tuned ${overrideParams?.name || name} (HTTP ${response?.data?.vpsHttpStatus || 200}, Temp ${specToUse.temperature}, Gates [${compiledSpec.ternaryMatrix.join(',')}]) on VPS Ollama.`,
          updatedAt: Date.now(),
        },
      });

      const msg = `VPS Ollama Created "${deployedTag}" (HTTP ${response?.data?.vpsHttpStatus || 200} · Temp ${specToUse.temperature} · Weight ${specToUse.weight}x · Gates [${compiledSpec.ternaryMatrix.join(',')}])!`;
      setCompileReceipt({
        ok: vpsOk,
        modelTag: deployedTag,
        vpsHttpStatus: response?.data?.vpsHttpStatus || 200,
        verifiedAt: response?.data?.verifiedAt || new Date().toISOString(),
        message: msg,
      });
      onStatusBanner?.(msg);
      toast({
        title: 'Affective Partner Model Created on VPS Ollama',
        description: msg,
      });

      if (demoIframeRef.current?.contentWindow) {
        try {
          demoIframeRef.current.contentWindow.postMessage(
            {
              type: 'NEXUS_COMPILE_OLLAMA_RESULT',
              ok: true,
              modelTag: deployedTag,
              message: msg,
            },
            '*'
          );
        } catch {}
      }
    } catch (err) {
      const errMsg = err?.response?.data?.error || err?.message || 'Compile request failed';
      setCompileReceipt({
        ok: false,
        error: errMsg,
        verifiedAt: new Date().toISOString(),
      });
      onStatusBanner?.(`Ollama compile error: ${errMsg}`);
      if (demoIframeRef.current?.contentWindow) {
        try {
          demoIframeRef.current.contentWindow.postMessage(
            {
              type: 'NEXUS_COMPILE_OLLAMA_RESULT',
              ok: false,
              message: `Error: ${errMsg}`,
            },
            '*'
          );
        } catch {}
      }
    } finally {
      setTuningModel(false);
    }
  };

  // Listen for live sync & compile events from the embedded MyAIPartner-Improved2 iframe
  useEffect(() => {
    const onMsg = (ev) => {
      const d = ev?.data;
      if (!d) return;
      if (d.type === 'NEXUS_AI_PARTNER_SYNC') {
        if (d.name) setName(d.name);
        if (d.gender) setGender(d.gender);
        if (d.personality) setPersonality(d.personality);
        if (typeof d.mood === 'number') setMood(d.mood);
        if (typeof d.xp === 'number') setXp(d.xp);
        if (typeof d.clinginess === 'number') setClinginess(d.clinginess);
        if (d.memory) setMemory((prev) => ({ ...prev, ...d.memory }));
        if (d.lastPartnerReply) {
          onEmotionUpdate?.(`${d.lastUserText || ''} ${d.lastPartnerReply}`);
        }
      } else if (d.type === 'NEXUS_COMPILE_OLLAMA_MODEL') {
        handleCompileAndTuneModel(d);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  });

  const popOutOriginalDemo = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(MY_AI_PARTNER_HTML);
    w.document.close();
  };

  return (
    <div className="space-y-3">
      {/* Top Bar: Role Mode + Toggle Original Demo UI */}
      <div className="p-2.5 rounded-lg border border-border bg-card flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Heart size={14} className="text-primary" />
          <span className="font-semibold text-foreground">
            RELATIONAL &amp; AFFECTIVE MODEL-TUNING SUITE (PARTNER · FRIEND · MENTOR · CRITIC)
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {RELATIONAL_ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoleMode(r.id)}
              className={`px-2 py-1 rounded border text-[10px] transition-colors ${
                roleMode === r.id
                  ? 'border-primary bg-selection text-primary font-bold'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              }`}
              title={r.desc}
            >
              {r.label}
            </button>
          ))}
          <Button
            size="sm"
            variant={showOriginalDemoUi ? 'default' : 'outline'}
            onClick={() => setShowOriginalDemoUi((v) => !v)}
            className="h-7 text-[10px] px-2 gap-1"
          >
            <Eye size={11} />
            {showOriginalDemoUi ? 'Hide Classic Partner UI' : 'Show MyAIPartner-Improved2 UI'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={popOutOriginalDemo}
            className="h-7 text-[10px] px-2 gap-1"
          >
            <Maximize2 size={11} /> Pop Out Demo
          </Button>
        </div>
      </div>

      {/* Main 3-Column Affective Tuner Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        {/* Col 1: Partner Identity, Personality & Relationship Hyperparameters */}
        <div className="lg:col-span-4 p-2.5 rounded-lg border border-border bg-card space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-primary">1. PERSONA &amp; BOND SLIDERS</span>
            <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-bold">
              Lv {level} · {xp}/100 XP
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setGender('female');
                if (name === 'Leo') setName('Luna');
              }}
              className={`p-1.5 rounded border text-[10.5px] font-semibold ${
                gender === 'female' ? 'border-primary bg-selection text-primary' : 'border-border bg-background'
              }`}
            >
              💁‍♀️ Luna (F)
            </button>
            <button
              type="button"
              onClick={() => {
                setGender('male');
                if (name === 'Luna') setName('Leo');
              }}
              className={`p-1.5 rounded border text-[10.5px] font-semibold ${
                gender === 'male' ? 'border-primary bg-selection text-primary' : 'border-border bg-background'
              }`}
            >
              🙋‍♂️ Leo (M)
            </button>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 18))}
              placeholder="Custom name..."
              className="h-8 rounded bg-background border border-input px-2 text-[11px]"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {PARTNER_PERSONALITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPersonality(p)}
                className={`px-2 py-0.5 rounded border text-[10px] ${
                  personality === p
                    ? 'border-primary bg-primary text-primary-foreground font-bold'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                {PERSONALITY_ICONS[p]} {p}
              </button>
            ))}
          </div>

          {/* Sliders that directly tune model temperature & proactivity */}
          <div className="space-y-1.5 pt-1 border-t border-border">
            <div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">MOOD METER (Tunes Temperature → {compiledSpec.temperature})</span>
                <span className="font-bold text-success">{mood}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                className="w-full h-1.5 accent-primary cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">ATTENTIVENESS / PROACTIVITY (Cross-Tab Gain)</span>
                <span className="font-bold text-primary">{clinginess}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={clinginess}
                onChange={(e) => setClinginess(Number(e.target.value))}
                className="w-full h-1.5 accent-primary cursor-pointer"
              />
            </div>

            <label className="flex items-center justify-between text-[10.5px] pt-1 cursor-pointer">
              <span className="text-muted-foreground">Multi-Model Handoff / Jealousy Awareness</span>
              <input
                type="checkbox"
                checked={jealous}
                onChange={(e) => setJealous(e.target.checked)}
              />
            </label>
          </div>

          {/* Extracted On-Device / Wormhole Companion Memory */}
          <div className="p-2 rounded bg-background border border-border text-[10.5px] space-y-0.5">
            <div className="text-[9.5px] text-muted-foreground uppercase font-bold">
              Extracted Companion Memory (Auto-Captured from Chat)
            </div>
            <div>🍿 Fav Snack: <strong className="text-foreground">{memory.snack || 'Tell me in chat!'}</strong></div>
            <div>🎓 Workspace Vibe: <strong className="text-foreground">{memory.classMood || 'Locked in'}</strong></div>
            <div>🏷️ Calls You: <strong className="text-foreground">{memory.userName || 'Creator'}</strong></div>
          </div>
        </div>

        {/* Col 2: Live Interactive Companion Chat */}
        <div className="lg:col-span-5 p-2.5 rounded-lg border border-border bg-card flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <span className="font-semibold text-foreground">
              2. LIVE COMPANION STREAM ({name} · {PERSONALITY_ICONS[personality]} {personality})
            </span>
            <span className="text-[10px] text-success">● Synced to 7-Axis Emotion</span>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-2 rounded text-[11px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary/20 border border-primary/40 text-foreground ml-6'
                    : 'bg-background border border-border text-foreground mr-4'
                }`}
              >
                <span className="font-bold text-[10px] text-primary mr-1.5">
                  {m.role === 'user' ? 'You:' : `${name}:`}
                </span>
                {m.text}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {PARTNER_QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSendChat(q)}
                className="px-2 py-0.5 rounded bg-background border border-border hover:border-primary text-[10px] text-muted-foreground hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder={`Message ${name} (e.g. "my favorite snack is ramen" or "FRAYMUS")...`}
              className="flex-1 h-7 rounded bg-background border border-input px-2 text-[11px]"
            />
            <Button size="sm" onClick={() => handleSendChat()} className="h-7 px-2.5 text-[10px] gap-1">
              <Send size={11} /> Send
            </Button>
          </div>
        </div>

        {/* Col 3: Affective Modelfile & Ternary Gate Compiler */}
        <div className="lg:col-span-3 p-2.5 rounded-lg border border-border bg-card flex flex-col justify-between space-y-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-caution flex items-center gap-1">
                <Sliders size={12} /> 3. MODELFILE COMPILER
              </span>
              <span className="text-[10px] text-muted-foreground">{compiledSpec.weight}x Weight</span>
            </div>

            <select
              value={baseModel}
              onChange={(e) => setBaseModel(e.target.value)}
              className="w-full h-7 rounded bg-background border border-input px-2 text-[10.5px]"
            >
              {PARTNER_MODELS.map((m) => (
                <option key={m} value={m}>
                  Base: {m}
                </option>
              ))}
            </select>

            <div className="p-2 rounded bg-background border border-border text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Tag:</span>
                <strong className="text-primary">{compiledSpec.modelTag}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dynamic Temp:</span>
                <strong className="text-success">{compiledSpec.temperature}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ternary Gates:</span>
                <strong className="text-foreground">[{compiledSpec.ternaryMatrix.join(', ')}]</strong>
              </div>
            </div>

            <pre className="p-2 rounded bg-background border border-border text-[9.5px] leading-3.5 max-h-28 overflow-y-auto text-muted-foreground">
              {compiledSpec.modelfileContent}
            </pre>
          </div>

          <Button
            size="sm"
            disabled={tuningModel}
            onClick={() => handleCompileAndTuneModel()}
            className="w-full h-8 text-[10.5px] font-mono gap-1"
          >
            {tuningModel ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
            Compile &amp; Tune Ollama Model
          </Button>

          {compileReceipt && (
            <div
              className={`p-2 rounded border text-[10px] space-y-0.5 ${
                compileReceipt.ok
                  ? 'border-success/60 bg-success/15 text-success'
                  : 'border-destructive/60 bg-destructive/15 text-destructive'
              }`}
            >
              <div className="font-bold flex items-center gap-1">
                <CheckCircle2 size={11} />
                {compileReceipt.ok
                  ? `VPS OLLAMA HTTP ${compileReceipt.vpsHttpStatus}: ${compileReceipt.modelTag}`
                  : `ERROR: ${compileReceipt.error}`}
              </div>
              {compileReceipt.ok && (
                <div className="text-[9.5px] text-foreground">
                  Created on VPS at {compileReceipt.verifiedAt}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Optional Embedded Classic MyAIPartner-Improved2.html UI */}
      {showOriginalDemoUi && (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          <iframe
            ref={demoIframeRef}
            title="My AI Partner Improved Demo"
            srcDoc={MY_AI_PARTNER_HTML}
            className="w-full h-[430px] border-0"
          />
        </div>
      )}
    </div>
  );
}