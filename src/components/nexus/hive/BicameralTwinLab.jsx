import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Copy, Loader2 } from 'lucide-react';
import TwinThoughtColumn from '@/components/nexus/hive/TwinThoughtColumn';
import { readCrossTabMemory } from '@/lib/crossTabMemory';

const MODES = [['yin_yang', 'Yin / Yang'], ['left_right', 'Left / Right Brain'], ['critic_creator', 'Critic / Creator']];
const AGENTS = ['Fraymus', 'Vesper', 'Kepler', 'Polaris', 'Tycho', 'Niles'];

export default function BicameralTwinLab({ workspace }) {
  const [agent, setAgent] = useState('Fraymus');
  const [mode, setMode] = useState('yin_yang');
  const [prompt, setPrompt] = useState('');
  const [save, setSave] = useState(true);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [run, setRun] = useState(0);
  const [error, setError] = useState('');

  const spawn = async () => {
    setBusy(true); setError('');
    const cross = readCrossTabMemory();
    const ctxAdd =
      (cross.selection?.text ? `\n[Shared Selection in ${cross.selection.pageTitle}]: "${cross.selection.text.slice(0, 400)}"` : '') +
      (cross.liveEdit?.excerpt ? `\n[Live Edit in ${cross.liveEdit.pageTitle}]: "${cross.liveEdit.excerpt.slice(0, 400)}"` : '');
    try {
      const { data } = await base44.functions.invoke('nexusEvolution', {
        action: 'bicameral_twin', agent, mode, prompt: `${prompt}${ctxAdd}`, save,
        ...(workspace?.id ? { workspace_id: workspace.id } : {}),
      });
      if (!data?.ok) throw new Error(data?.error || 'Twin run failed');
      setRes(data); setRun((r) => r + 1);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <section className="p-4 rounded-lg border border-border bg-card space-y-3 font-mono text-xs">
      <div className="flex items-center gap-2"><Copy size={14} className="text-primary" /><h3 className="font-heading text-sm font-semibold">AGENT TWIN LAB: DUPLICATE AN AGENT FOR AN OPPOSING OPINION</h3></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select value={agent} onChange={(e) => setAgent(e.target.value)} className="rounded bg-secondary border border-border p-2">{AGENTS.map((a) => <option key={a}>{a}</option>)}</select>
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded bg-secondary border border-border p-2">{MODES.map(([id, l]) => <option key={id} value={id}>{l}</option>)}</select>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />Save result to Library</label>
      </div>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={1500} placeholder="Give both twins a task, e.g. 'Design the onboarding for my creator app'" className="w-full h-16 rounded bg-background border border-input p-2 resize-none" />
      <Button size="sm" disabled={busy || !prompt.trim()} onClick={spawn} className="h-7 text-[11px]">{busy ? <><Loader2 size={12} className="animate-spin" />Twins thinking…</> : 'Spawn Twin & Debate'}</Button>
      {error && <p className="text-destructive">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TwinThoughtColumn title={res?.poles?.[0] || `${agent} · Twin A`} twin={res?.twin_a} accent="text-primary" run={run} />
        <TwinThoughtColumn title={res?.poles?.[1] || `${agent} · Twin B`} twin={res?.twin_b} accent="text-caution" run={run} />
      </div>
      {res && (
        <div className="p-3 rounded bg-success/10 border border-success/30 space-y-2">
          <div className="font-semibold text-success">SYNTHESIS</div>
          <p className="text-foreground">{res.synthesis}</p>
          <ol className="list-decimal pl-5 space-y-0.5">{(res.implementation || []).map((s, i) => <li key={i}>{s}</li>)}</ol>
          {res.snippet && <pre className="p-2 rounded bg-background border border-border overflow-x-auto text-[11px]">{res.snippet}</pre>}
          {res.savedAssetId && <Link to="/library" className="text-primary underline">Saved, open in Library →</Link>}
        </div>
      )}
    </section>
  );
}