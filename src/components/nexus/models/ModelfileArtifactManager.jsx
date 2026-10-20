import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import TernaryWeightMatrixEditor from '@/components/nexus/models/TernaryWeightMatrixEditor';
import {
  Upload,
  Sparkles,
  Sliders,
  Download,
  Trash2,
  FileCode2,
  Loader2,
  CheckCircle2,
  Plus,
} from 'lucide-react';

const KIND_LABELS = {
  modelfile: 'Ollama Modelfile',
  model: 'Model Spec / GGUF Manifest',
  prompt_template: 'Prompt Template',
  ternary_adapter: 'Ternary {-1,0,+1} Adapter',
  fine_tune_dataset: 'Fine-Tune JSONL Dataset',
};

export default function ModelfileArtifactManager({
  artifacts = [],
  onArtifactsChange,
  onSelectForTest,
}) {
  const [selectedId, setSelectedId] = useState(artifacts[0]?.id || '');
  const selected = artifacts.find((a) => a.id === selectedId) || artifacts[0] || null;

  const [kind, setKind] = useState('modelfile');
  const [name, setName] = useState('');
  const [baseModel, setBaseModel] = useState('llama3.2:3b-instruct');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [content, setContent] = useState('');
  const [ternaryState, setTernaryState] = useState(1);
  const [weight, setWeight] = useState(1.15);
  const [ternaryMatrix, setTernaryMatrix] = useState([1, 1, 1, 1, 1, 1, -1, 1]);
  const [aiGoal, setAiGoal] = useState('');
  const [fileUri, setFileUri] = useState('');
  const [fileName, setFileName] = useState('');

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fineTuneReport, setFineTuneReport] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  const loadIntoEditor = (art) => {
    if (!art) return;
    setSelectedId(art.id);
    setKind(art.artifact_kind || 'modelfile');
    setName(art.name || '');
    setBaseModel(art.base_model || 'llama3.2:3b-instruct');
    setSystemPrompt(art.system_prompt || '');
    setContent(art.content || '');
    setTernaryState(Number(art.ternary_state ?? 1));
    setWeight(Number(art.weight ?? 1.0));
    setTernaryMatrix(
      Array.isArray(art.ternary_matrix) && art.ternary_matrix.length === 8
        ? art.ternary_matrix
        : [1, 1, 1, 1, 1, 1, -1, 1]
    );
    setFileUri(art.file_uri || '');
    setFileName(art.file_name || '');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const textPreview = await file.text().catch(() => '');
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setFileUri(file_uri);
      setFileName(file.name);
      if (!name) setName(file.name);
      if (file.name.toLowerCase().includes('modelfile') || textPreview.includes('FROM ')) {
        setKind('modelfile');
      } else if (file.name.endsWith('.jsonl')) {
        setKind('fine_tune_dataset');
      } else if (textPreview.includes('{{')) {
        setKind('prompt_template');
      }
      if (textPreview) {
        setContent(textPreview.slice(0, 18000));
      }
      setStatusMsg(`Uploaded "${file.name}" (stored privately) and parsed content into editor.`);
    } catch (err) {
      setError(err.message || 'Private file upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveArtifact = async (asNew = false) => {
    if (!name.trim() && !content.trim()) {
      setError('Provide a name or content for the artifact.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { data } = await base44.functions.invoke('nexusEvolution', {
        action: 'save_model_artifact',
        id: asNew ? '' : selectedId,
        artifact_kind: kind,
        name: name.trim() || `Fraymus-${kind}-${Date.now().toString().slice(-4)}`,
        base_model: baseModel,
        system_prompt: systemPrompt,
        content,
        file_uri: fileUri,
        file_name: fileName,
        weight,
        ternary_state: ternaryState,
        ternary_matrix: ternaryMatrix,
      });
      if (data?.error) throw new Error(data.error);
      if (Array.isArray(data?.artifacts)) {
        onArtifactsChange?.(data.artifacts);
      }
      if (data?.artifact) {
        loadIntoEditor(data.artifact);
        setStatusMsg(`Saved ${data.artifact.name} [Ternary ${data.artifact.ternary_state > 0 ? '+1' : data.artifact.ternary_state} · Weight ${data.artifact.weight}x].`);
      }
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const handleQuickTernaryUpdate = async (art, nextState, nextWeight, nextMatrix) => {
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke('nexusEvolution', {
        action: 'update_ternary_weights',
        id: art.id,
        ternary_state: nextState ?? art.ternary_state,
        weight: nextWeight ?? art.weight,
        ternary_matrix: nextMatrix ?? art.ternary_matrix,
      });
      if (Array.isArray(data?.artifacts)) {
        onArtifactsChange?.(data.artifacts);
      }
    } catch (err) {
      setError(err.message || 'Could not update ternary weights');
    } finally {
      setBusy(false);
    }
  };

  const handleAiGenerate = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await base44.functions.invoke('nexusEvolution', {
        action: 'ai_generate_artifact_or_prompt',
        artifact_kind: kind,
        base_model: baseModel,
        goal:
          aiGoal.trim() ||
          'High-retention technical storytelling with >1.4 bits/beat information surprise and <15w hooks',
        ternary_matrix: ternaryMatrix,
        save: true,
      });
      if (data?.error) throw new Error(data.error);
      if (Array.isArray(data?.artifacts)) {
        onArtifactsChange?.(data.artifacts);
      }
      if (data?.artifact) {
        loadIntoEditor(data.artifact);
        setStatusMsg(`AI generated & saved "${data.artifact.name}" (${KIND_LABELS[data.artifact.artifact_kind]}).`);
      }
    } catch (err) {
      setError(err.message || 'Automated generation failed');
    } finally {
      setBusy(false);
    }
  };

  const handleFineTune = async (artId) => {
    setBusy(true);
    setError('');
    try {
      const { data } = await base44.functions.invoke('nexusEvolution', {
        action: 'fine_tune_ternary_model',
        artifact_id: artId || selected?.id,
      });
      if (data?.error) throw new Error(data.error);
      if (Array.isArray(data?.artifacts)) {
        onArtifactsChange?.(data.artifacts);
      }
      if (data?.fineTuneReport) {
        setFineTuneReport(data.fineTuneReport);
        setStatusMsg(
          `Fine-tuned "${data.fineTuneReport.artifactName}" to Gen ${data.fineTuneReport.generation} (Final Loss ${data.fineTuneReport.finalLoss} · Projected Retention ${data.fineTuneReport.projectedRetentionPct}%).`
        );
      }
    } catch (err) {
      setError(err.message || 'Fine-tune calibration failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke('nexusEvolution', {
        action: 'delete_model_artifact',
        id,
      });
      if (Array.isArray(data?.artifacts)) {
        onArtifactsChange?.(data.artifacts);
        if (data.artifacts[0]) loadIntoEditor(data.artifacts[0]);
      }
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadModelfile = async (art) => {
    const target = art || selected;
    if (!target) return;
    if (target.file_uri) {
      try {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: target.file_uri,
        });
        if (signed_url) {
          window.open(signed_url, '_blank');
          return;
        }
      } catch {}
    }
    const blob = new Blob([target.content || target.system_prompt || ''], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(target.name || 'Fraymus.Modelfile').replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Automated AI Prompt / Modelfile Generator + Private Upload Bar */}
      <div className="p-3 rounded-lg border border-border bg-card space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCode2 size={14} className="text-primary" />
            <span className="font-semibold text-foreground">
              MODELFILE, MODEL &amp; PROMPT TEMPLATE REGISTRY (UPLOAD · AI CREATE · TERNARY WEIGHT · FINE-TUNE)
            </span>
          </div>
          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-primary/50 bg-selection text-primary cursor-pointer text-[11px]">
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            <span>{uploading ? 'Uploading…' : 'Upload Modelfile / Model / Template (stored privately)'}</span>
            <input
              type="file"
              accept=".Modelfile,.modelfile,.txt,.md,.json,.jsonl,.yaml,.gguf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="md:col-span-3 h-8 rounded bg-background border border-input px-2 text-xs"
          >
            {Object.entries(KIND_LABELS).map(([k, lbl]) => (
              <option key={k} value={k}>
                {lbl}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={aiGoal}
            onChange={(e) => setAiGoal(e.target.value)}
            placeholder="AI Goal (e.g. 'Create a BitNet Modelfile & prompt template for viral deep-tech explainers')..."
            className="md:col-span-6 h-8 rounded bg-background border border-input px-2.5 text-xs"
          />
          <Button
            size="sm"
            disabled={busy}
            onClick={handleAiGenerate}
            className="md:col-span-3 h-8 text-[11px] font-mono gap-1"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            AI Auto-Generate {kind === 'modelfile' ? 'Modelfile' : 'Template'}
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div className="px-3 py-1.5 rounded bg-success/15 border border-success/40 text-success text-[11px] flex items-center gap-2">
          <CheckCircle2 size={13} />
          <span>{statusMsg}</span>
        </div>
      )}
      {error && <div className="text-destructive text-[11px]">{error}</div>}

      {/* Registered Artifacts + Editor Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left List of Managed Artifacts */}
        <div className="lg:col-span-5 space-y-2 max-h-96 overflow-y-auto pr-1">
          {artifacts.map((art) => {
            const isSel = selected?.id === art.id;
            const tState = Number(art.ternary_state ?? 1);
            return (
              <div
                key={art.id}
                onClick={() => loadIntoEditor(art)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-colors space-y-1.5 ${
                  isSel ? 'border-primary bg-selection' : 'border-border bg-card hover:bg-secondary/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground truncate">{art.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      tState === 1
                        ? 'bg-success/15 border-success/40 text-success'
                        : tState === -1
                        ? 'bg-destructive/15 border-destructive/40 text-destructive'
                        : 'bg-secondary border-border text-muted-foreground'
                    }`}
                  >
                    {tState === 1 ? '+1 EXCITATORY' : tState === -1 ? '-1 INHIBITORY' : '0 NEUTRAL'} · {art.weight}x
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-foreground">
                    {KIND_LABELS[art.artifact_kind] || art.artifact_kind}
                  </span>
                  <span>Base: {art.base_model || 'llama3.2'}</span>
                  <span>· Gen {art.evolution_generation || 1}</span>
                  {art.preflight_score && (
                    <span className="text-primary">· Pre-Flight: {art.preflight_score}%</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1 pt-1">
                  {[1, 0, -1].map((tVal) => (
                    <button
                      key={tVal}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickTernaryUpdate(art, tVal, art.weight, art.ternary_matrix);
                      }}
                      className={`px-1.5 py-0.5 rounded border text-[9.5px] ${
                        tState === tVal
                          ? 'border-primary bg-primary/20 text-primary font-bold'
                          : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      Set {tVal > 0 ? '+1' : tVal}
                    </button>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFineTune(art.id);
                    }}
                    className="h-6 px-2 text-[9.5px] ml-auto gap-1"
                  >
                    <Sliders size={10} /> Fine-Tune
                  </Button>
                  {onSelectForTest && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectForTest(art);
                      }}
                      className="h-6 px-2 text-[9.5px]"
                    >
                      Test in Simulator
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(art.id);
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive"
                    title="Delete artifact"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Editor + Ternary Matrix + Fine-Tune Telemetry */}
        <div className="lg:col-span-7 p-3 rounded-lg border border-border bg-card space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Artifact name..."
              className="sm:col-span-2 h-8 rounded bg-background border border-input px-2.5 text-xs"
            />
            <input
              type="text"
              value={baseModel}
              onChange={(e) => setBaseModel(e.target.value)}
              placeholder="Base model (e.g. llama3.2:3b)..."
              className="h-8 rounded bg-background border border-input px-2.5 text-xs"
            />
          </div>

          <TernaryWeightMatrixEditor
            ternaryState={ternaryState}
            weight={weight}
            ternaryMatrix={ternaryMatrix}
            onChangeState={setTernaryState}
            onChangeWeight={setWeight}
            onChangeMatrix={setTernaryMatrix}
            disabled={busy}
          />

          <input
            type="text"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="System directive / Evolved counterfactual rule..."
            className="w-full h-8 rounded bg-background border border-input px-2.5 text-xs"
          />

          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or edit Modelfile (FROM, PARAMETER, SYSTEM), Prompt Template ({{topic}}, {{hook_title}}), or Ternary Adapter spec..."
            className="w-full rounded bg-background border border-input p-2.5 text-[11px] font-mono"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                disabled={busy}
                onClick={() => handleSaveArtifact(false)}
                className="h-7 text-[10.5px] font-mono"
              >
                Save Changes
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => handleSaveArtifact(true)}
                className="h-7 text-[10.5px] font-mono gap-1"
              >
                <Plus size={11} /> Save as New Artifact
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => handleFineTune(selected?.id)}
                className="h-7 text-[10.5px] font-mono gap-1"
              >
                <Sliders size={11} /> Run Ternary Fine-Tune
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownloadModelfile(selected)}
                className="h-7 text-[10.5px] font-mono gap-1"
              >
                <Download size={11} /> Export
              </Button>
            </div>
          </div>

          {fineTuneReport && (
            <div className="p-2.5 rounded border border-primary/40 bg-selection space-y-1.5 text-[10.5px]">
              <div className="flex items-center justify-between font-semibold text-primary">
                <span>
                  ⚡ TERNARY FINE-TUNE CALIBRATION REPORT: {fineTuneReport.artifactName} (Gen{' '}
                  {fineTuneReport.generation})
                </span>
                <span>{fineTuneReport.quantizationScheme}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {fineTuneReport.epochs.map((ep) => (
                  <div key={ep.epoch} className="p-1.5 rounded bg-background border border-border">
                    <div className="text-muted-foreground">Epoch {ep.epoch}</div>
                    <div className="font-bold text-foreground">Loss: {ep.loss}</div>
                    <div className="text-success">Ret: {ep.retentionProjection}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}