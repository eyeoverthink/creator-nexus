import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  CREATIVE_CATEGORIES,
  ABSTRACTED_METHOD_PILLARS,
  BUILTIN_BLUEPRINT_TEMPLATES,
  compileBlueprintToMarkdown,
} from '@/components/nexus/blueprint/blueprintTemplates';
import {
  Sparkles,
  Wand2,
  Save,
  Copy,
  Check,
  Plus,
  Trash2,
  Rocket,
  Layers,
  FileText,
  Film,
  Music,
  Image as ImageIcon,
  Code2,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
} from 'lucide-react';

const SECTION_TABS = [
  { id: 'all', label: 'All Sections (Streamlined)' },
  { id: 'spec', label: '0. Spec & Grid Lock' },
  { id: 'thesis', label: '1. Thesis & Iconic Anchor' },
  { id: 'rules', label: '2. Sensory Rules & Never-Show' },
  { id: 'sections', label: '3. Section-by-Section Plan' },
  { id: 'escalation', label: '4. Escalation Matrix' },
  { id: 'closing', label: '5. Closing Frame' },
  { id: 'markdown', label: 'Compiled Master Markdown' },
];

export default function UniversalCreativeBlueprintStudio({
  workspaceId,
  onLaunchInFactory,
}) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customTemplates, setCustomTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(BUILTIN_BLUEPRINT_TEMPLATES[0].id);
  const [blueprint, setBlueprint] = useState(() => structuredClone(BUILTIN_BLUEPRINT_TEMPLATES[0]));
  const [activeSectionTab, setActiveSectionTab] = useState('all');
  const [showMethodDna, setShowMethodDna] = useState(true);
  const [aiInstruction, setAiInstruction] = useState('');
  const [saveAsName, setSaveAsName] = useState('');
  const [showSaveAsInput, setShowSaveAsInput] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [copiedMd, setCopiedMd] = useState(false);

  // Load saved custom templates from NexusAsset
  useEffect(() => {
    let mounted = true;
    base44.entities.NexusAsset.filter(
      { project: 'Creative Blueprint Templates' },
      { sort: '-created_date', limit: 30 }
    )
      .then((res) => {
        if (!mounted) return;
        const items = Array.isArray(res) ? res : res?.items || [];
        const parsed = [];
        for (const item of items) {
          try {
            const data = JSON.parse(item.body || '{}');
            if (data && data.spec) {
              parsed.push({
                ...data,
                id: item.id,
                assetId: item.id,
                name: item.title || data.name || 'Saved Blueprint',
                isCustom: true,
              });
            }
          } catch {
            // ignore non-json
          }
        }
        setCustomTemplates(parsed);
      })
      .catch(() => null);
    return () => {
      mounted = false;
    };
  }, []);

  const allTemplates = useMemo(
    () => [...BUILTIN_BLUEPRINT_TEMPLATES, ...customTemplates],
    [customTemplates]
  );

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return allTemplates;
    return allTemplates.filter((t) => t.category === selectedCategory);
  }, [allTemplates, selectedCategory]);

  const currentCategoryMeta = useMemo(() => {
    return (
      CREATIVE_CATEGORIES.find((c) => c.id === (blueprint.category || 'video')) ||
      CREATIVE_CATEGORIES[1]
    );
  }, [blueprint.category]);

  const compiledMarkdown = useMemo(() => compileBlueprintToMarkdown(blueprint), [blueprint]);

  const handleSelectTemplate = (tpl) => {
    setActiveTemplateId(tpl.id);
    setBlueprint(structuredClone(tpl));
    toast({
      title: `Loaded Template: ${tpl.name}`,
      description: `Category: ${(tpl.category || 'video').toUpperCase()} · Ready to edit, AI-augment, or Save As.`,
    });
  };

  const handleStartBlankForCategory = (catId) => {
    const targetCat = catId === 'all' ? 'video' : catId;
    const blank = {
      id: `draft_${Date.now().toString(36)}`,
      name: `New ${targetCat.toUpperCase()} Blueprint`,
      category: targetCat,
      description: 'Streamlined creative blueprint — type a rough idea above and click AI Auto-Fill!',
      spec: {
        title: '',
        subtitle: '',
        duration: targetCat === 'video' || targetCat === 'music' ? '217.9s' : '',
        grid: targetCat === 'video' || targetCat === 'music' ? 'E minor · 138 BPM (beat ≈ 0.435s, bar ≈ 1.74s)' : '',
        format: targetCat === 'video' ? '16:9 · photoreal' : '',
      },
      thesis: {
        coreThesis: '',
        iconicAnchor: '',
      },
      rules: {
        palette: '',
        light: '',
        world: '',
        entity: '',
        human: '',
        lensing: '',
        textPolicy: '',
        neverShow: '',
      },
      sections: [
        {
          id: 'sec-1',
          header: 'SECTION 1 · OPENING / INTRO',
          musicalJob: '',
          visualIdea: '',
          cameraLens: '',
          light: '',
          cutDensity: '',
          beats: '',
        },
      ],
      escalation: {
        col1Label: 'Peak 1 / Chorus 1',
        col2Label: 'Final Peak / Final Chorus',
        rows: [
          { element: 'Human Position & Agency', peak1: '', peak2: '' },
          { element: 'System / Entity Response', peak1: '', peak2: '' },
          { element: 'Scale & Pacing Density', peak1: '', peak2: '' },
        ],
        note: '',
      },
      closingFrame: '',
    };
    setActiveTemplateId(blank.id);
    setBlueprint(blank);
  };

  const handleAiAssist = async ({ mode = 'fill_empty', targetSection = 'all', customPrompt = '' }) => {
    setBusyAction(`${mode}:${targetSection}`);
    try {
      const instructionToUse =
        customPrompt ||
        aiInstruction.trim() ||
        (mode === 'fill_empty'
          ? 'Fill in any empty or brief fields with high-precision creative direction following the Awakening of AI method.'
          : `Augment, sharpen, and enrich the "${targetSection}" section with concrete sensory, mathematical, and artistic detail.`);

      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'ai_assist_blueprint',
        category: blueprint.category || 'video',
        mode,
        target_section: targetSection,
        instruction: instructionToUse,
        blueprint,
      });

      if (data?.ok && data.blueprint) {
        setBlueprint((prev) => {
          if (targetSection !== 'all' && mode === 'augment_section') {
            return {
              ...prev,
              [targetSection]: data.blueprint[targetSection] || prev[targetSection],
            };
          }
          return {
            ...prev,
            ...data.blueprint,
            name: data.blueprint.name || prev.name,
          };
        });
        toast({
          title:
            mode === 'transform'
              ? 'AI Transformed Blueprint'
              : targetSection === 'all'
              ? 'AI Auto-Filled & Augmented Blueprint'
              : `AI Augmented Section: ${targetSection.toUpperCase()}`,
          description: 'All sections updated using your 6-Pillar Awakening of AI methodology.',
        });
      }
    } catch (err) {
      toast({
        title: 'AI Assist Error',
        description: err?.message || 'Could not run AI assist right now.',
        variant: 'destructive',
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleSaveTemplate = async (asNew = false) => {
    const titleToSave =
      asNew && saveAsName.trim()
        ? saveAsName.trim()
        : blueprint.name || blueprint.spec?.title || 'Custom Creative Blueprint';

    setBusyAction(asNew ? 'save_as' : 'save');
    try {
      const user = await base44.auth.me().catch(() => null);
      const ownerId = user?.id || 'default_owner';
      const wsId = workspaceId || 'ouroboros_live_ws';
      const payloadToStore = {
        ...blueprint,
        name: titleToSave,
        updatedAt: new Date().toISOString(),
      };

      if (!asNew && blueprint.isCustom && blueprint.assetId) {
        const updatedAsset = await base44.entities.NexusAsset.update(blueprint.assetId, {
          title: titleToSave.slice(0, 160),
          body: JSON.stringify(payloadToStore).slice(0, 19800),
        });
        const updatedEntry = {
          ...payloadToStore,
          id: updatedAsset.id,
          assetId: updatedAsset.id,
          isCustom: true,
        };
        setCustomTemplates((prev) =>
          prev.map((t) => (t.id === updatedEntry.id ? updatedEntry : t))
        );
        setBlueprint(updatedEntry);
        toast({
          title: 'Template Saved',
          description: `Updated "${titleToSave}" in your Blueprint Library.`,
        });
      } else {
        const createdAsset = await base44.entities.NexusAsset.create({
          owner_id: ownerId,
          workspace_id: wsId,
          title: titleToSave.slice(0, 160),
          body: JSON.stringify(payloadToStore).slice(0, 19800),
          kind: 'document',
          project: 'Creative Blueprint Templates',
          agent_ids: ['director', 'writer', 'strategist', 'researcher', 'witness'],
          favorite: true,
        });
        const newEntry = {
          ...payloadToStore,
          id: createdAsset.id,
          assetId: createdAsset.id,
          name: titleToSave,
          isCustom: true,
        };
        setCustomTemplates((prev) => [newEntry, ...prev]);
        setActiveTemplateId(newEntry.id);
        setBlueprint(newEntry);
        setSaveAsName('');
        setShowSaveAsInput(false);
        toast({
          title: 'Saved As New Template!',
          description: `"${titleToSave}" is now available in your template library across all sessions.`,
        });
      }
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err?.message || 'Could not save template.',
        variant: 'destructive',
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(compiledMarkdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
    toast({
      title: 'Copied Full Director’s Treatment & Plan Markdown',
      description: `${compiledMarkdown.length.toLocaleString()} chars copied in canonical Awakening of AI format.`,
    });
  };

  const handleLaunchProduction = async () => {
    const deliverableMap = {
      video: 'music_video',
      music: 'music_video',
      image: 'music_video',
      software: 'software_product',
      hybrid: 'hybrid_flagship',
    };
    const kind = deliverableMap[blueprint.category] || 'music_video';
    const summaryBrief = `${blueprint.spec?.title || 'Creative Production'} (${blueprint.spec?.subtitle || ''} · ${blueprint.spec?.duration || ''} · ${blueprint.spec?.grid || ''})\nThesis: ${blueprint.thesis?.coreThesis || ''}\nIconic Anchor: ${blueprint.thesis?.iconicAnchor || ''}\nPalette: ${blueprint.rules?.palette || ''}\nNever Show: ${blueprint.rules?.neverShow || ''}`.slice(
      0,
      3400
    );

    if (onLaunchInFactory) {
      onLaunchInFactory({
        brief: summaryBrief,
        deliverableKind: kind,
        compiledMarkdown,
        blueprint,
      });
      return;
    }

    setBusyAction('launch_factory');
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'create_production',
        brief: summaryBrief,
        deliverable_kind: kind,
        worker_location: 'base44_cloud',
        generate_keyframe: false,
      });
      if (data?.ok && data.production) {
        toast({
          title: 'Launched in Production Factory!',
          description: `Created "${data.production.title}" — open /factory to inspect and stitch.`,
        });
      }
    } catch (err) {
      toast({
        title: 'Launch Error',
        description: err?.message || 'Could not launch production.',
        variant: 'destructive',
      });
    } finally {
      setBusyAction('');
    }
  };

  const updateSpec = (key, val) =>
    setBlueprint((prev) => ({ ...prev, spec: { ...(prev.spec || {}), [key]: val } }));
  const updateThesis = (key, val) =>
    setBlueprint((prev) => ({ ...prev, thesis: { ...(prev.thesis || {}), [key]: val } }));
  const updateRules = (key, val) =>
    setBlueprint((prev) => ({ ...prev, rules: { ...(prev.rules || {}), [key]: val } }));

  const updateSectionItem = (idx, key, val) =>
    setBlueprint((prev) => {
      const next = [...(prev.sections || [])];
      next[idx] = { ...next[idx], [key]: val };
      return { ...prev, sections: next };
    });

  const addSectionItem = () =>
    setBlueprint((prev) => ({
      ...prev,
      sections: [
        ...(prev.sections || []),
        {
          id: `sec-${Date.now().toString(36)}`,
          header: `NEW SECTION ${(prev.sections || []).length + 1} · 8 bars`,
          musicalJob: '',
          visualIdea: '',
          cameraLens: '',
          light: '',
          cutDensity: '',
          beats: '',
        },
      ],
    }));

  const removeSectionItem = (idx) =>
    setBlueprint((prev) => ({
      ...prev,
      sections: (prev.sections || []).filter((_, i) => i !== idx),
    }));

  const updateEscalationRow = (idx, key, val) =>
    setBlueprint((prev) => {
      const rows = [...(prev.escalation?.rows || [])];
      rows[idx] = { ...rows[idx], [key]: val };
      return { ...prev, escalation: { ...(prev.escalation || {}), rows } };
    });

  const addEscalationRow = () =>
    setBlueprint((prev) => ({
      ...prev,
      escalation: {
        ...(prev.escalation || {}),
        rows: [...(prev.escalation?.rows || []), { element: '', peak1: '', peak2: '' }],
      },
    }));

  const specLabels = currentCategoryMeta.specLabels || CREATIVE_CATEGORIES[1].specLabels;
  const ruleLabels = currentCategoryMeta.ruleLabels || CREATIVE_CATEGORIES[1].ruleLabels;

  return (
    <section className="rounded-lg border border-primary/60 bg-card p-4 space-y-4 font-mono text-xs">
      {/* Top Header & Method Abstraction Toggle */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
              UNIVERSAL CREATIVE BLUEPRINT STUDIO // ABSTRACTED FROM &ldquo;THE AWAKENING OF AI&rdquo;
            </span>
            <span className="px-2 py-0.5 rounded bg-success/15 text-success border border-success/40 text-[10px] font-bold">
              ● MUSIC · VIDEO · IMAGES · SOFTWARE · HYBRID
            </span>
          </div>
          <h2 className="text-sm md:text-base font-semibold text-foreground font-heading">
            Streamlined 6-Pillar Creative Method — Pre-Filled Templates, Per-Section AI Assist &amp; Save-As Library
          </h2>
          <p className="text-[11px] text-muted-foreground font-body max-w-4xl">
            We analyzed your <em>Awakening of AI — Check the Source</em> treatment and abstracted why it produces masterwork results into 6 clean, reusable sections. Pick any category or pre-filled template below, edit only what you want, let AI fill or change any section, and Save As your own template.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setShowMethodDna((v) => !v)}
            className="h-8 px-2.5 text-[10.5px] gap-1"
          >
            {showMethodDna ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showMethodDna ? 'Hide Abstracted 6-Pillar Formula' : 'Show Abstracted 6-Pillar Formula'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleCopyMarkdown}
            className="h-8 px-2.5 text-[10.5px] gap-1"
          >
            {copiedMd ? <Check size={12} className="text-success" /> : <Copy size={12} />}
            {copiedMd ? 'Copied Markdown!' : 'Copy Full Markdown'}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleLaunchProduction}
            disabled={busyAction === 'launch_factory'}
            className="h-8 px-3 text-[10.5px] gap-1.5"
          >
            {busyAction === 'launch_factory' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Rocket size={12} />
            )}
            Launch Blueprint in Production Factory
          </Button>
        </div>
      </div>

      {/* Collapsible 6-Pillar Method Abstraction Analysis */}
      {showMethodDna && (
        <div className="p-3 rounded-lg border border-border bg-background space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-primary">
              WHY YOUR &ldquo;AWAKENING OF AI&rdquo; METHOD WORKS — THE 6 ABSTRACTED PILLARS (APPLIED ACROSS ALL MEDIA &amp; SOFTWARE)
            </span>
            <span className="text-[9.5px] text-muted-foreground">
              Every template &amp; AI Assist button below enforces this structure automatically
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {ABSTRACTED_METHOD_PILLARS.map((p) => (
              <div key={p.step} className="p-2.5 rounded border border-border bg-card space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9px] font-bold">
                    PILLAR {p.step}
                  </span>
                  <span className="text-[10px] font-bold text-foreground leading-tight">{p.name}</span>
                </div>
                <p className="text-[9.5px] text-muted-foreground font-body leading-snug">{p.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter + Pre-Filled Template Bar + Save / Save As Controls */}
      <div className="p-3 rounded-lg border border-border bg-background space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-bold mr-1">1. PICK CATEGORY:</span>
            {CREATIVE_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded border text-[10.5px] font-semibold inline-flex items-center gap-1.5 ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat.id === 'video' && <Film size={11} />}
                  {cat.id === 'music' && <Music size={11} />}
                  {cat.id === 'image' && <ImageIcon size={11} />}
                  {cat.id === 'software' && <Code2 size={11} />}
                  {cat.id === 'hybrid' && <Layers size={11} />}
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => handleStartBlankForCategory(selectedCategory)}
              className="h-7 px-2.5 text-[10px] gap-1"
            >
              <Plus size={11} /> New Blank Blueprint
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busyAction === 'save'}
              onClick={() => handleSaveTemplate(false)}
              className="h-7 px-2.5 text-[10px] gap-1"
            >
              {busyAction === 'save' ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setSaveAsName(`${blueprint.spec?.title || blueprint.name || 'Blueprint'} (Custom Copy)`);
                setShowSaveAsInput((v) => !v);
              }}
              className="h-7 px-2.5 text-[10px] gap-1 border border-primary/40 text-primary"
            >
              <Plus size={11} /> Save As Template…
            </Button>
          </div>
        </div>

        {/* Save As Modal/Inline Row */}
        {showSaveAsInput && (
          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded border border-primary/50 bg-card">
            <span className="text-[10.5px] font-bold text-primary">Save As New Reusable Template:</span>
            <input
              type="text"
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              placeholder="Enter template name (e.g. Dark Cyberpunk 140 BPM Video Template)..."
              className="flex-1 min-w-[240px] h-8 rounded border border-input bg-background px-2.5 text-xs text-foreground font-body"
            />
            <select
              value={blueprint.category || 'video'}
              onChange={(e) => setBlueprint((prev) => ({ ...prev, category: e.target.value }))}
              className="h-8 rounded border border-input bg-background px-2 text-xs text-foreground"
            >
              <option value="video">Category: Video &amp; Cinema</option>
              <option value="music">Category: Music &amp; Sonic</option>
              <option value="image">Category: Images &amp; Visual Art</option>
              <option value="software">Category: Software &amp; Apps</option>
              <option value="hybrid">Category: All Creative / Hybrid</option>
            </select>
            <Button
              type="button"
              size="sm"
              disabled={busyAction === 'save_as' || !saveAsName.trim()}
              onClick={() => handleSaveTemplate(true)}
              className="h-8 px-3 text-xs gap-1"
            >
              {busyAction === 'save_as' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Confirm Save As
            </Button>
          </div>
        )}

        {/* Pre-Filled Template Pills */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-muted-foreground font-bold block">
            2. LOAD A PRE-FILLED TEMPLATE ({filteredTemplates.length} AVAILABLE — CLICK TO LOAD, AUGMENT, OR SAVE AS):
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredTemplates.map((tpl) => {
              const isSelected = activeTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-2.5 rounded border text-left transition-colors flex flex-col justify-between gap-1 ${
                    isSelected
                      ? 'border-primary bg-primary/15 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10.5px] font-bold text-foreground truncate">{tpl.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-secondary text-[8.5px] font-bold uppercase shrink-0">
                      {tpl.isCustom ? `SAVED · ${tpl.category}` : tpl.category}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-muted-foreground font-body line-clamp-2">{tpl.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Co-Architect Bar: Fill Empty, Augment, or Transform Entire Blueprint */}
      <div className="p-3 rounded-lg border border-primary/40 bg-background space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10.5px] font-bold text-primary flex items-center gap-1.5">
            <Wand2 size={13} /> 3. AI CO-ARCHITECT — AUTO-FILL, AUGMENT, OR TRANSFORM WITHOUT MANUAL TYPING
          </span>
          <div className="flex flex-wrap gap-1">
            {[
              'Keep the Awakening of AI structure, but adapt it for a 128 BPM sci-fi oceanic discovery',
              'Add 2 more macro lens shots in the Breakdown and sharpen the Never-Show rules',
              'Convert this blueprint into an interactive Software + WASM Studio specification',
              'Fill in all empty fields with high-contrast anamorphic cinema details',
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAiInstruction(preset)}
                className="px-2 py-0.5 rounded border border-border bg-card text-[9px] text-muted-foreground hover:text-foreground"
              >
                + &ldquo;{preset.slice(0, 48)}…&rdquo;
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            placeholder='Tell AI what to fill in, augment, or change (e.g. "Make it a 140 BPM dark synthwave track + video" or leave blank to auto-fill empty fields)...'
            className="flex-1 min-w-[260px] h-9 rounded border border-input bg-card px-3 text-xs font-body text-foreground"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={Boolean(busyAction)}
            onClick={() => handleAiAssist({ mode: 'fill_empty', targetSection: 'all' })}
            className="h-9 px-3 text-xs gap-1.5 border border-primary/40"
          >
            {busyAction === 'fill_empty:all' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} className="text-primary" />
            )}
            AI Auto-Fill Empty Fields
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={Boolean(busyAction)}
            onClick={() =>
              handleAiAssist({
                mode: aiInstruction.trim() ? 'transform' : 'augment_section',
                targetSection: 'all',
              })
            }
            className="h-9 px-3.5 text-xs gap-1.5"
          >
            {busyAction === 'transform:all' || busyAction === 'augment_section:all' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Wand2 size={13} />
            )}
            {aiInstruction.trim() ? 'Have AI Apply Change' : 'AI Augment Entire Blueprint'}
          </Button>
        </div>
      </div>

      {/* Section Navigation Bar (View All Streamlined vs Focus One Section vs Compiled Markdown) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex flex-wrap items-center gap-1">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSectionTab(tab.id)}
              className={`px-2.5 py-1 rounded text-[10.5px] font-bold transition-colors ${
                activeSectionTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => handleSelectTemplate(BUILTIN_BLUEPRINT_TEMPLATES[0])}
          className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <RotateCcw size={11} /> Reset to &ldquo;The Awakening of AI&rdquo; Master Exemplar
        </button>
      </div>

      {/* SECTION 0: HEADER & TECHNICAL SPEC LOCK */}
      {(activeSectionTab === 'all' || activeSectionTab === 'spec') && (
        <div className="p-3.5 rounded-lg border border-border bg-background space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-foreground">
                SECTION 0 · HEADER &amp; MATHEMATICAL GRID LOCK
              </span>
              <p className="text-[10px] text-muted-foreground font-body">
                Locks title, medium, duration, and exact BPM/bar/beat or stack math upfront so every downstream decision aligns.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={Boolean(busyAction)}
              onClick={() => handleAiAssist({ mode: 'augment_section', targetSection: 'spec' })}
              className="h-7 px-2.5 text-[10px] gap-1"
            >
              {busyAction === 'augment_section:spec' ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Sparkles size={11} className="text-primary" />
              )}
              AI Assist Spec Lock
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <label className="space-y-1">
              <span className="text-[10px] text-muted-foreground block">Project / Work Title</span>
              <input
                type="text"
                value={blueprint.spec?.title || ''}
                onChange={(e) => updateSpec('title', e.target.value)}
                placeholder="e.g. THE AWAKENING OF AI"
                className="w-full h-8 rounded border border-input bg-card px-2.5 text-xs font-body text-foreground"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] text-muted-foreground block">{specLabels.subtitle}</span>
              <input
                type="text"
                value={blueprint.spec?.subtitle || ''}
                onChange={(e) => updateSpec('subtitle', e.target.value)}
                placeholder="e.g. Check the Source (master 1.1)"
                className="w-full h-8 rounded border border-input bg-card px-2.5 text-xs font-body text-foreground"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] text-muted-foreground block">{specLabels.duration}</span>
              <input
                type="text"
                value={blueprint.spec?.duration || ''}
                onChange={(e) => updateSpec('duration', e.target.value)}
                placeholder="e.g. 217.9s"
                className="w-full h-8 rounded border border-input bg-card px-2.5 text-xs font-body text-foreground"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] text-muted-foreground block">{specLabels.grid}</span>
              <input
                type="text"
                value={blueprint.spec?.grid || ''}
                onChange={(e) => updateSpec('grid', e.target.value)}
                placeholder="e.g. E minor · 138 BPM (beat ≈ 0.435s, bar ≈ 1.74s)"
                className="w-full h-8 rounded border border-input bg-card px-2.5 text-xs font-body text-foreground"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] text-muted-foreground block">{specLabels.format}</span>
              <input
                type="text"
                value={blueprint.spec?.format || ''}
                onChange={(e) => updateSpec('format', e.target.value)}
                placeholder="e.g. 16:9 · photoreal"
                className="w-full h-8 rounded border border-input bg-card px-2.5 text-xs font-body text-foreground"
              />
            </label>
          </div>
        </div>
      )}

      {/* SECTION 1: THESIS & THE ICONIC ANCHOR */}
      {(activeSectionTab === 'all' || activeSectionTab === 'thesis') && (
        <div className="p-3.5 rounded-lg border border-border bg-background space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-foreground">
                SECTION 1 · THESIS &amp; THE ICONIC ANCHOR IMAGE / MOMENT
              </span>
              <p className="text-[10px] text-muted-foreground font-body">
                Defines the emotional/philosophical arc and the single unmistakable frame, sonic drop, or flagship interaction that anchors the entire work.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={Boolean(busyAction)}
              onClick={() => handleAiAssist({ mode: 'augment_section', targetSection: 'thesis' })}
              className="h-7 px-2.5 text-[10px] gap-1"
            >
              {busyAction === 'augment_section:thesis' ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Sparkles size={11} className="text-primary" />
              )}
              AI Assist Thesis &amp; Iconic Anchor
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-[10.5px] font-semibold text-primary block">
                Core Thesis (What wakes up, what tension it discovers, who holds authority)
              </span>
              <textarea
                rows={5}
                value={blueprint.thesis?.coreThesis || ''}
                onChange={(e) => updateThesis('coreThesis', e.target.value)}
                placeholder="Describe the core emotional and philosophical journey..."
                className="w-full rounded border border-input bg-card p-2.5 text-xs font-body text-foreground leading-relaxed"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10.5px] font-semibold text-caution block">
                The Iconic Image / Anchor Moment (Locked symmetry, placement, when it lands &amp; escalates)
              </span>
              <textarea
                rows={5}
                value={blueprint.thesis?.iconicAnchor || ''}
                onChange={(e) => updateThesis('iconicAnchor', e.target.value)}
                placeholder="Describe the single unmistakable hero frame, sonic drop, or flagship UI threshold..."
                className="w-full rounded border border-input bg-card p-2.5 text-xs font-body text-foreground leading-relaxed"
              />
            </label>
          </div>
        </div>
      )}

      {/* SECTION 2: VISUAL, SENSORY & ARCHITECTURAL RULES + NEVER SHOW */}
      {(activeSectionTab === 'all' || activeSectionTab === 'rules') && (
        <div className="p-3.5 rounded-lg border border-border bg-background space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-foreground">
                SECTION 2 · WORLD, SENSORY RULES &amp; HARD &ldquo;NEVER SHOW&rdquo; GUARDRAILS
              </span>
              <p className="text-[10px] text-muted-foreground font-body">
                Establishes semantic color meaning (e.g. Silver = unverified, Gold = verified truth), lighting/timbre, lensing/tooling, exact text policy, and explicit negative constraints.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={Boolean(busyAction)}
              onClick={() => handleAiAssist({ mode: 'augment_section', targetSection: 'rules' })}
              className="h-7 px-2.5 text-[10px] gap-1"
            >
              {busyAction === 'augment_section:rules' ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Sparkles size={11} className="text-primary" />
              )}
              AI Assist Sensory Rules &amp; Guardrails
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              ['palette', ruleLabels.palette],
              ['light', ruleLabels.light],
              ['world', ruleLabels.world],
              ['entity', ruleLabels.entity],
              ['human', ruleLabels.human],
              ['lensing', ruleLabels.lensing],
              ['textPolicy', ruleLabels.textPolicy],
              ['neverShow', ruleLabels.neverShow],
            ].map(([key, label]) => (
              <label key={key} className="space-y-1">
                <span
                  className={`text-[10px] font-semibold block ${
                    key === 'neverShow' ? 'text-destructive' : 'text-foreground'
                  }`}
                >
                  {label}
                </span>
                <textarea
                  rows={4}
                  value={blueprint.rules?.[key] || ''}
                  onChange={(e) => updateRules(key, e.target.value)}
                  className="w-full rounded border border-input bg-card p-2 text-[11px] font-body text-foreground leading-snug"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: SECTION-BY-SECTION BEAT / EXECUTION PLAN */}
      {(activeSectionTab === 'all' || activeSectionTab === 'sections') && (
        <div className="p-3.5 rounded-lg border border-border bg-background space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-foreground">
                SECTION 3 · SECTION-BY-SECTION PLAN ({(blueprint.sections || []).length} SECTIONS)
              </span>
              <p className="text-[10px] text-muted-foreground font-body">
                Each section locks its 5 header attributes (Musical/Functional Job, Visual Idea, Camera/Lens, Light, Cut Density) plus timestamped beats and EXACT TEXT locks.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={addSectionItem}
                className="h-7 px-2.5 text-[10px] gap-1"
              >
                <Plus size={11} /> Add Section Block
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={Boolean(busyAction)}
                onClick={() => handleAiAssist({ mode: 'augment_section', targetSection: 'sections' })}
                className="h-7 px-2.5 text-[10px] gap-1"
              >
                {busyAction === 'augment_section:sections' ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Sparkles size={11} className="text-primary" />
                )}
                AI Expand &amp; Time-Lock Sections
              </Button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
            {(blueprint.sections || []).map((sec, idx) => (
              <div key={sec.id || idx} className="p-3 rounded border border-border bg-card space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <input
                    type="text"
                    value={sec.header || ''}
                    onChange={(e) => updateSectionItem(idx, 'header', e.target.value)}
                    placeholder="e.g. CHORUS 1 · 110.7–124.5 · 8 bars · DENSE"
                    className="flex-1 min-w-[240px] h-7 rounded border border-input bg-background px-2 text-xs font-bold text-primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeSectionItem(idx)}
                    className="text-muted-foreground hover:text-destructive p-1"
                    title="Remove section"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  {[
                    ['musicalJob', 'Musical / Functional Job'],
                    ['visualIdea', 'Visual / Experiential Idea'],
                    ['cameraLens', 'Camera / Lens / Mechanism'],
                    ['light', 'Light / Tone'],
                    ['cutDensity', 'Cut / Pacing Density'],
                  ].map(([k, lbl]) => (
                    <label key={k} className="space-y-0.5">
                      <span className="text-[9.5px] text-muted-foreground block">{lbl}</span>
                      <input
                        type="text"
                        value={sec[k] || ''}
                        onChange={(e) => updateSectionItem(idx, k, e.target.value)}
                        className="w-full h-7 rounded border border-input bg-background px-2 text-[10.5px] font-body text-foreground"
                      />
                    </label>
                  ))}
                </div>

                <label className="space-y-0.5 block">
                  <span className="text-[9.5px] text-muted-foreground block">
                    Timestamped Micro-Beats &amp; EXACT TEXT Locks
                  </span>
                  <textarea
                    rows={4}
                    value={sec.beats || ''}
                    onChange={(e) => updateSectionItem(idx, 'beats', e.target.value)}
                    className="w-full rounded border border-input bg-background p-2 text-[11px] font-body text-foreground leading-relaxed"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: ESCALATION MATRIX (PEAK 1 -> FINAL PEAK) */}
      {(activeSectionTab === 'all' || activeSectionTab === 'escalation') && (
        <div className="p-3.5 rounded-lg border border-border bg-background space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-foreground">
                SECTION 4 · ESCALATION MATRIX (PEAK 1 → FINAL PEAK)
              </span>
              <p className="text-[10px] text-muted-foreground font-body">
                Keeps the same camera/structural symmetry across peaks so the audience immediately recognizes the frame and sees how human agency escalated.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={addEscalationRow}
                className="h-7 px-2.5 text-[10px] gap-1"
              >
                <Plus size={11} /> Add Row
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={Boolean(busyAction)}
                onClick={() => handleAiAssist({ mode: 'augment_section', targetSection: 'escalation' })}
                className="h-7 px-2.5 text-[10px] gap-1"
              >
                {busyAction === 'augment_section:escalation' ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Sparkles size={11} className="text-primary" />
                )}
                AI Assist Escalation Table
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {(blueprint.escalation?.rows || []).map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={row.element || ''}
                  onChange={(e) => updateEscalationRow(idx, 'element', e.target.value)}
                  placeholder="Element (e.g. Reader's position)"
                  className="h-8 rounded border border-input bg-card px-2.5 text-xs font-semibold text-foreground"
                />
                <input
                  type="text"
                  value={row.peak1 || ''}
                  onChange={(e) => updateEscalationRow(idx, 'peak1', e.target.value)}
                  placeholder={`${blueprint.escalation?.col1Label || 'Chorus 1'} state`}
                  className="h-8 rounded border border-input bg-card px-2.5 text-xs font-body text-muted-foreground"
                />
                <input
                  type="text"
                  value={row.peak2 || ''}
                  onChange={(e) => updateEscalationRow(idx, 'peak2', e.target.value)}
                  placeholder={`${blueprint.escalation?.col2Label || 'Final Chorus'} escalated state`}
                  className="h-8 rounded border border-input bg-card px-2.5 text-xs font-body text-success"
                />
              </div>
            ))}
          </div>

          <label className="space-y-1 block">
            <span className="text-[10px] text-muted-foreground block">
              Symmetry &amp; Escalation Principle Note
            </span>
            <textarea
              rows={2}
              value={blueprint.escalation?.note || ''}
              onChange={(e) =>
                setBlueprint((prev) => ({
                  ...prev,
                  escalation: { ...(prev.escalation || {}), note: e.target.value },
                }))
              }
              className="w-full rounded border border-input bg-card p-2 text-xs font-body text-foreground"
            />
          </label>
        </div>
      )}

      {/* SECTION 5: CLOSING FRAME / FINAL RESOLUTION */}
      {(activeSectionTab === 'all' || activeSectionTab === 'closing') && (
        <div className="p-3.5 rounded-lg border border-border bg-background space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-foreground">
                SECTION 5 · CLOSING FRAME &amp; COMPANION RESOLUTION
              </span>
              <p className="text-[10px] text-muted-foreground font-body">
                Defines the final locked shot, resting state, and what fades last into silence.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={Boolean(busyAction)}
              onClick={() => handleAiAssist({ mode: 'augment_section', targetSection: 'closingFrame' })}
              className="h-7 px-2.5 text-[10px] gap-1"
            >
              {busyAction === 'augment_section:closingFrame' ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Sparkles size={11} className="text-primary" />
              )}
              AI Assist Closing Frame
            </Button>
          </div>
          <textarea
            rows={3}
            value={blueprint.closingFrame || ''}
            onChange={(e) => setBlueprint((prev) => ({ ...prev, closingFrame: e.target.value }))}
            className="w-full rounded border border-input bg-card p-2.5 text-xs font-body text-foreground leading-relaxed"
          />
        </div>
      )}

      {/* COMPILED MASTER MARKDOWN VIEW */}
      {(activeSectionTab === 'all' || activeSectionTab === 'markdown') && (
        <div className="p-3.5 rounded-lg border border-border bg-background space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
              <FileText size={13} /> LIVE COMPILED MASTER TREATMENT &amp; SHOT/EXECUTION PLAN MARKDOWN ({compiledMarkdown.length.toLocaleString()} CHARS)
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleCopyMarkdown}
              className="h-7 px-2.5 text-[10px] gap-1"
            >
              {copiedMd ? <Check size={11} className="text-success" /> : <Copy size={11} />}
              {copiedMd ? 'Copied!' : 'Copy Markdown'}
            </Button>
          </div>
          <pre className="p-3 rounded border border-border bg-card text-[11px] text-foreground font-mono whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
            {compiledMarkdown}
          </pre>
        </div>
      )}
    </section>
  );
}