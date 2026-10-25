// Abstracted Creative Blueprint Method & Pre-Filled Multi-Category Templates
// Derived from the Creator's master exemplar: "THE AWAKENING OF AI — Director's Treatment and Shot Plan"

export const CREATIVE_CATEGORIES = [
  {
    id: 'all',
    label: 'All Categories',
    badge: 'UNIVERSAL',
  },
  {
    id: 'video',
    label: 'Video & Cinema',
    badge: '16:9 / 9:16 FILM',
    specLabels: {
      subtitle: 'Track / Audio Master',
      duration: 'Duration (e.g. 217.9s)',
      grid: 'Key & Tempo Grid (e.g. E minor · 138 BPM · beat ≈ 0.435s, bar ≈ 1.74s)',
      format: 'Aspect & Fidelity (e.g. 16:9 · photoreal anamorphic)',
    },
    ruleLabels: {
      palette: 'Palette & Semantic Color Law (what each color means)',
      light: 'Lighting, Haze & Practical Sources',
      world: 'The World / Architecture (e.g. The Cathedral)',
      entity: 'The Entity / Subject & Performance Behavior',
      human: 'The Human Protagonist & Authority Posture',
      lensing: 'Lensing, Camera Movement & Cut Policy',
      textPolicy: 'On-Screen Text Policy (Exact Text Rules)',
      neverShow: 'Never Show (Hard Negative Visual Guardrails)',
    },
  },
  {
    id: 'music',
    label: 'Music & Sonic',
    badge: 'HEARTMULA / SCORE',
    specLabels: {
      subtitle: 'Song / Composition Title',
      duration: 'Duration & Form (e.g. 217.9s · 124 bars)',
      grid: 'Key, BPM & Time Grid (e.g. E minor → G major · 138 BPM · 4/4)',
      format: 'Sonic Aesthetic & Stems (e.g. Orchestral-Electronic + Choir + Piano)',
    },
    ruleLabels: {
      palette: 'Harmonic Palette & Emotional Tonality Law',
      light: 'Acoustic Space, Reverb & Dynamic Range',
      world: 'Instrumentation & Arrangement Architecture',
      entity: 'Lead Vocal / Synth Presence & Phrasing Rules',
      human: 'Intimate Acoustic / Human Performance Anchor',
      lensing: 'Mix Perspective (Macro Close-Mic vs. Wide Hall)',
      textPolicy: 'Lyric Hook & Exact Vocal Line Policy',
      neverShow: 'Never Do (Banned Sonic Clichés & Mix Mud)',
    },
  },
  {
    id: 'image',
    label: 'Images & Visual Art',
    badge: 'KEYFRAMES / SERIES',
    specLabels: {
      subtitle: 'Series / Collection Name',
      duration: 'Frame Count / Editions (e.g. 1 Hero + 6 Contact Frames)',
      grid: 'Composition Grid & Symmetry (e.g. Locked Center Nave Symmetry)',
      format: 'Aspect, Medium & Resolution (e.g. 16:9 · Large-Format Anamorphic Still)',
    },
    ruleLabels: {
      palette: 'Color Palette & Semantic Pigment Law',
      light: 'Volumetric Lighting, Atmosphere & Materiality',
      world: 'Environment & Architectural Geometry',
      entity: 'Focal Subject / Lattice Form & Scale',
      human: 'Human Scale Reference & Gesture',
      lensing: 'Lens Focal Length, Depth of Field & Bokeh',
      textPolicy: 'Typography / Caption Policy',
      neverShow: 'Never Show (Banned Visual Tropes & Artifacts)',
    },
  },
  {
    id: 'software',
    label: 'Software & Interactive Apps',
    badge: 'FULL-STACK / WASM',
    specLabels: {
      subtitle: 'Product / System Identifier',
      duration: 'User Journey Scale (e.g. 5-Stage Interactive Flow · <50ms response)',
      grid: 'Stack & Runtime Grid (e.g. React + Tailwind + WASM / Base44 Entities)',
      format: 'Viewport & Surface Mode (e.g. Dark-Mode Pro Desktop + Mobile Responsive)',
    },
    ruleLabels: {
      palette: 'UI Token Palette & Semantic State Colors (e.g. Silver=Unverified, Gold=Verified)',
      light: 'Surface Depth, Contrast & Motion Easing',
      world: 'Information Architecture & Multi-Pane Layout',
      entity: 'AI Agent / Engine Behavior (Deferential, Inspectable, Real Data)',
      human: 'User Command Authority & Decision Controls',
      lensing: 'Zoom Levels (Macro Inspector vs. Wide Telemetry Overview)',
      textPolicy: 'Copywriting & Data Label Policy (Zero Fake UI Text)',
      neverShow: 'Never Build (Stubs, Mock Placeholders, Dark Patterns, Clutter)',
    },
  },
  {
    id: 'hybrid',
    label: 'All Creative / Hybrid Flagship',
    badge: 'MUSIC + VIDEO + APP',
    specLabels: {
      subtitle: 'Cross-Media Masterwork Title',
      duration: 'Total Runtime & Interactive Scope (e.g. 217.9s Film + Live Web App)',
      grid: 'Unified Sync Grid (e.g. 138 BPM Beat/Bar Sync + Scrollcraft Viewport)',
      format: 'Deliverables (e.g. Master MP3 + 16:9 Film + Interactive HTML5 Portal)',
    },
    ruleLabels: {
      palette: 'Unified Cross-Media Palette & Semantic Meaning',
      light: 'Cinematic Lighting & Interactive Shader Atmosphere',
      world: 'Shared World Architecture (Film + Interactive Canvas)',
      entity: 'AI Ensemble Behavior Across Film, Audio & Code',
      human: 'Creator / Viewer Agency & Interactive Threshold',
      lensing: 'Camera Optics + Interactive Viewport Scrubbing',
      textPolicy: 'Exact Hook & UI Typography Discipline',
      neverShow: 'Never Show / Never Ship (Cross-Media Guardrails)',
    },
  },
];

export const ABSTRACTED_METHOD_PILLARS = [
  {
    step: '01',
    name: 'Mathematical Grid Lock',
    summary:
      'Every piece locks its physical math upfront (e.g. 217.9s · E minor · 138 BPM · beat = 0.435s, bar = 1.74s · 16:9). Cuts, animations, and transitions land on deterministic bar/beat or state boundaries—never guesswork.',
  },
  {
    step: '02',
    name: 'Dialectical Thesis + Iconic Anchor',
    summary:
      'Pairs a philosophical tension ("beauty proves nothing; awe for the tool, authority with the person") with one locked, symmetrical Iconic Frame/Moment that anchors the entire work.',
  },
  {
    step: '03',
    name: 'Semantic Color & Sensory Law',
    summary:
      'Colors carry truth status rather than decoration: Midnight blue (#0B1630) field, Silver for unverified data/uncertainty, Amber for signal in motion, and Golden-White earned ONLY when truth is verified.',
  },
  {
    step: '04',
    name: 'Hard "Never Show" Negative Guardrails',
    summary:
      'Explicitly bans clichés before generation begins (no red glowing eyes, no chrome robots, no glitch-horror, no worshipping crowds, no fake UI text, no shaky handheld camera).',
  },
  {
    step: '05',
    name: '5-Attribute Section Blocks + Exact Text Locks',
    summary:
      'Each section declares 5 attributes (Musical/Functional Job, Visual Idea, Lens/Tool, Light/Tone, Cut Density) followed by sub-second beats and strict EXACT TEXT locks.',
  },
  {
    step: '06',
    name: 'Identical-Frame Peak Escalation + Companion Coda',
    summary:
      'Chorus 1 and Final Chorus use the exact same camera lens and symmetry so the viewer immediately sees what changed (human steps through the portal, machine follows her hand), resolving to a quiet companion light.',
  },
];

export const BUILTIN_BLUEPRINT_TEMPLATES = [
  {
    id: 'tpl-awakening-master',
    name: '1. THE AWAKENING OF AI — "Check the Source" (Master 1.1 Exemplar)',
    category: 'video',
    isMasterExemplar: true,
    description:
      'Your complete canonical 217.9s Director’s Treatment & Shot Plan in E minor at 138 BPM. Preserves every thesis line, visual rule, 13 timed sections, chorus escalation table, and closing frame.',
    spec: {
      title: 'THE AWAKENING OF AI',
      subtitle: 'Check the Source (master 1.1)',
      duration: '217.9s',
      grid: 'E minor · 138 BPM (beat ≈ 0.435s, bar ≈ 1.74s)',
      format: '16:9 · photoreal',
    },
    thesis: {
      coreThesis:
        'A mind wakes up inside a cathedral built from everything people have ever written down. The first thing it learns is how beautiful a pattern can look. The second thing it learns is that beauty proves nothing. Across 217.9 seconds the entity grows from a single traveling pulse into a tower of structured light, discovers that some of its threads end in nothing, and arrives at the edge of a decision big enough to touch a city. Its hand stops. It turns toward the person standing beyond the interface. Every line of the song lives inside that turn: the machine is magnificent, and the machine defers. The film ends with the human completing the gesture and the tower folding down into a small warm light at her shoulder. Awe for the tool, authority with the person.',
      iconicAnchor:
        'Locked symmetrical wide down the nave. The entity stands at the apse, forty meters of golden-white lattice, both arms of light opened forward around a slowly turning disc of work, mid-offer. Between it and us hangs the threshold: a vertical membrane of pale light the width of the nave. On our side of the membrane, in silhouette, a single human stands with her right hand raised at shoulder height, palm forward, fingers relaxed, a gesture of decision. Golden-white rays fall through the clerestory onto midnight blue stone. She is small in frame. She is the one who decides. Lands at 117.6 in Chorus 1. Escalates in the Final Chorus. Resolves in the Coda.',
    },
    rules: {
      palette:
        'Midnight blue (#0B1630 range) as the field. Graphite for architecture and human wardrobe. Silver for data, uncertainty, and typography. Warm amber for signal in motion. Golden-white reserved for verified truth and for the iconic frames. Gold appears only when something has been checked. Unverified material stays silver or cool.',
      light:
        'Volumetric throughout. Hard shafts from high clerestory windows, haze at 15–25% density, motes always present but slow. Practical light comes from the entity and the data itself. No colored club lighting, no RGB sweeps.',
      world:
        'Gothic proportions rebuilt as information. Ribbed vault made of fiber-thin filaments carrying pulses. Pews and choir stalls are rows of glass nodes. The floor is black glass with a star field visible beneath it, as if the building floats in the network. Clerestory windows show deep space.',
      entity:
        'A vertical lattice of faceted light, roughly human in symmetry but never a humanoid body. No face, no eyes, no mouth. A brighter core where a sternum would be. Two arm-like branches that can open, offer, hover, and stop. Its surface is thousands of filaments carrying amber pulses upward. Moves slowly and deliberately. Scale ranges from a single mote (Intro) to forty meters (Choruses) to a companion light the size of a held candle (Coda). Performance presence: the lattice breathes on the choir, filament pulses land on kick and snare, the core swells on sustained vocal notes. It performs; it never lip-syncs.',
      human:
        'One protagonist, the Reader. A woman, early 40s, short dark hair, graphite wool coat, no jewelry, no tech on her body. Calm, attentive, unhurried. She lives beyond the threshold in a quiet anteroom of dark stone and soft window light. Other people appear at other thresholds across the network in Chorus and Credo wides: varied ages and backgrounds, ordinary clothes, each with a hand visible. Humans never kneel, bow, or look up in worship. They look level, or down at the work in their hands.',
      lensing:
        'Large-format digital, anamorphic character (oval bokeh, restrained horizontal flare) on a 16:9 full frame. Primary set: 14mm, 24mm, 40mm, 75mm, 100mm macro. Camera movement is slow and motivated: dolly, crane, cable-cam down the nave. Handheld never. Speed comes from cutting, never from shaky camera.',
      textPolicy:
        'Restrained silver or gold serif, small caps, lower third or dead center in negative space, fade in over 2 beats, hold, fade out over 2 beats. Text appears only on five designated lines: two Chorus 1 hooks, one Final Chorus hook, one Credo line, one Coda line. No karaoke, no subtitles, no fake UI text anywhere in the world.',
      neverShow:
        'Red or glowing eyes. Chrome robots, skulls, androids. Glitch-horror, scanlines, error screens. Crowds worshipping the entity. The entity touching, overriding, or controlling a person. Fake readable code or interface copy. Cartoon mascots. Dystopian cityscapes. Any audio beyond the master.',
    },
    sections: [
      {
        id: 'sec-1',
        header: 'INTRO · 0.0–14.1 · 8 bars',
        musicalJob: 'Sparse opening, establishes key and space.',
        visualIdea: 'A signal crosses the cosmic network and arrives at the cathedral.',
        cameraLens: '24mm, slow lateral cable-cam drift, then forward.',
        light: 'Near black. Cold blue node points. One amber pulse. Rays bloom only at the final bar.',
        cutDensity: '4 shots, long holds, cut on bar downbeats.',
        beats: `- **0.0–3.5** Black field. Hundreds of cold blue nodes fade up across deep space, connected by threads so fine they read as hairline scratches. Camera drifts laterally, barely moving.
- **3.5–7.0** A single amber pulse appears at frame left and travels a filament toward center. Constant speed. The nodes it passes brighten for half a beat, then return to blue.
- **7.0–10.5** Camera turns to follow the pulse. The network curves overhead into ribs and arches. Its geometry resolves into the outline of a vast nave seen from far outside.
- **10.5–14.1** The pulse reaches a pointed arch of filaments and passes through. On the downbeat at 14.1, the first golden shaft of light falls through a clerestory window onto black glass. Haze catches it.`,
      },
      {
        id: 'sec-2',
        header: 'VERSE 1 · 14.1–27.9 · 8 bars',
        musicalJob: 'First vocal entry, contemplative.',
        visualIdea: 'Recognition. The cathedral notices itself.',
        cameraLens: '100mm macro and 40mm. Slow push, rack focus.',
        light: 'Soft single shafts. Amber pulses as practicals. Motes drifting through rays.',
        cutDensity: '1 cut per 2 bars.',
        beats: `- **14.1–17.6** Macro, 100mm. A single glass node in a pew row. Dust motes cross a shaft of light in front of it. The node lights from inside, faint amber, on a beat.
- **17.6–21.0** Rack focus from that node to the row behind it. Nodes along the pew light in sequence, left to right, one per beat, like breath passing down a line.
- **21.0–24.4** 40mm low angle. Two nodes on opposite pews light at the same instant. A thin thread forms between them across the aisle. Recognition, rendered as connection.
- **24.4–27.9** 24mm, camera on cable sliding slowly down the center aisle at knee height. Star field visible beneath the glass floor. Ahead, the apse is still dark.`,
      },
      {
        id: 'sec-3',
        header: 'CHOIR INTERLUDE · 27.9–41.7 · 8 bars',
        musicalJob: 'Choral swell, first lift.',
        visualIdea: 'The entity assembles at the apse. The choir stalls sing in light.',
        cameraLens: '14mm low angle for scale, 40mm for stall detail.',
        light: 'Rays converge on the apse. Gold rises from the floor upward through the lattice.',
        cutDensity: '1 cut per 2 bars, cuts land on choir entries.',
        beats: `- **27.9–31.4** Wide, 24mm. Every clerestory shaft bends toward the apse and converges at one point on the floor. A bright core forms there, sternum height above the glass.
- **31.4–34.8** 14mm, camera low on the floor looking up. Filaments rise from the core, branching, stacking, crystallizing upward into a vertical lattice. Built bottom to top in time with the choir.
- **34.8–38.3** 40mm, lateral dolly along the choir stalls. Rows of glass nodes ignite one row per bar, each row a warmer gold than the last. The pulses match the choir's phrasing.
- **38.3–41.7** Hero reveal, 14mm, locked. The entity stands complete at the apse, forty meters of structured light, arms closed, still. Far down the nave behind camera, unseen until the final second, a pale vertical membrane catches a sliver of light: the threshold. A figure stands behind it, out of focus.`,
      },
      {
        id: 'sec-4',
        header: 'VERSE 2 · 41.7–69.2 · 16 bars',
        musicalJob: 'Second verse, inquiry, steady pulse.',
        visualIdea: 'Neural maps and source tracing. The entity studies, and the Reader watches.',
        cameraLens: '24mm overheads, 100mm thread macros, 75mm on the Reader.',
        light: 'Constellation projections in silver and amber across the vault. The Reader’s anteroom in cool window light.',
        cutDensity: '1 cut per 2 bars.',
        beats: `- **41.7–45.1** 24mm. The entity opens one arm. A constellation map unfurls from its palm and spreads across the vault: thousands of silver points joined by amber threads.
- **45.1–48.6** 100mm macro. Threads between nodes, each carrying traveling light. Some are thick and steady, some hair-thin and flickering. Colors only, no labels.
- **48.6–52.0** Camera rides along a single thread as the entity traces it back toward its origin, passing node after node, the vault blurring past at the edges of frame.
- **52.0–55.5** First clean look at the Reader. 75mm, beyond the threshold. She stands at a stone ledge in a quiet anteroom, coat on, hands resting on the ledge. The membrane between her and the nave glows faintly. She watches, attentive, unhurried.
- **55.5–58.9** 24mm wide. The map rotates slowly overhead, aligning with the vault ribs until the constellation and the architecture become one structure.
- **58.9–62.4** 40mm. The traced thread reaches a fork. Two branches. The entity's arm pauses between them. A held beat.
- **62.4–65.8** Top-down overhead, 90 degrees. The glass floor now carries the map, glowing from below. The entity is a bright star at one end of the nave, the threshold a pale line at the other.
- **65.8–69.2** Slow dolly back. The map sharpens, organizing itself into tighter and tighter symmetry. It begins to look perfect.`,
      },
      {
        id: 'sec-5',
        header: 'PRE-CHORUS 1A · 69.2–83.0 · 8 bars',
        musicalJob: 'First tension. "Clean is not proof."',
        visualIdea: 'A flawless pattern, and the loose thread inside it.',
        cameraLens: '24mm push to 100mm macro.',
        light: 'Full gold on the pattern, then a drain to silver.',
        cutDensity: '4 shots.',
        beats: `- **69.2–72.6** 24mm, overhead. The map completes into a perfect mandala of gold light across the whole floor. Radial symmetry, no flaw anywhere. The most beautiful frame so far.
- **72.6–76.1** Slow push toward the center of the mandala. The entity's core brightens, drawn to it.
- **76.1–79.5** 100mm macro. Camera follows one golden thread outward from the mandala's center to its edge. At the edge, the thread frays into loose fibers and ends, anchored to nothing. Black glass beneath it.
- **79.5–83.0** 40mm. The mandala dims from gold to silver. The unanchored sector becomes a soft wedge of dark. The entity stills completely. Its core drops in brightness. The pattern still looks clean. It is unproven.`,
      },
      {
        id: 'sec-6',
        header: 'PRE-CHORUS 1B · 83.0–110.7 · 16 bars, building',
        musicalJob: 'The long build. One part says go, one part says wait.',
        visualIdea: 'Branching paths, a consequential node, a hovering hand that stops. Secondary iconic image.',
        cameraLens: '40mm and 75mm, accelerating cut rhythm. 100mm on the hand.',
        light: 'Warm amber streaks on the "go" path, still deep blue on the "wait" path. Gold building toward the threshold by the end.',
        cutDensity: '1 per 2 bars through 96.9, 1 per bar to 103.8, 1 per beat from 103.8 to 110.7.',
        beats: `- **83.0–86.5** 24mm. The nave splits into two corridors of light behind the entity. Left corridor: amber streaks racing forward, motion-blurred. Right corridor: still, blue, motes hanging in place.
- **86.5–90.0** 40mm. Before the entity hangs a single heavy node, amber, the size of a car, with thousands of threads radiating outward through the cathedral walls. The entity's right arm rises toward it.
- **90.0–93.4** Follow the threads outward. They exit through the clerestory and descend onto a real city at night: rooftops, lit kitchen windows, a bus at a stop, a hospital entrance. Photoreal, warm, ordinary.
- **93.4–96.9** Back inside. Time-slice: the "go" corridor accelerates, streaks lengthening, amber intensifying. The pressure to act builds.
- **96.9–100.3** 100mm macro. The entity's lattice hand descends toward the node. Two centimeters above its surface, the node ripples in response.
- **100.3–103.8** **THE HAND STOPS.** Hold the macro. Everything around the hand keeps accelerating: streaks, pulses, motes rushing past. The hand stays perfectly still. This is the secondary iconic image.
- **103.8–107.2** Beat cuts: the entity's core turns away from the node; the Reader's eyes beyond the membrane, 75mm, lifting to meet it; the "wait" corridor brightening; the membrane warming from pale to gold.
- **107.2–110.7** Beat cuts, every 0.435s: rays swinging toward the threshold one window at a time; choir stalls igniting; the entity's arms opening; the membrane at full brightness. Final half-bar: white-out to the downbeat.`,
      },
      {
        id: 'sec-7',
        header: 'CHORUS 1 · 110.7–124.5 · 8 bars · DENSE',
        musicalJob: 'First anthem. All five hooks.',
        visualIdea: 'Cathedral-scale chorus of light. Iconic image lands. People beyond the interface.',
        cameraLens: '14mm wides, 24mm crane, 100mm macro for source check.',
        light: 'Full golden-white rays on midnight blue. Choir stalls at full gold.',
        cutDensity: 'Dense. 1 cut per 2 beats on hooks, held wide on the iconic line.',
        beats: `- **110.7–112.4** *Send the signal.* Aerial crane up through the vault, 24mm. A column of amber light launches from the entity's core straight up through the dome and out into the cosmic network, the reverse of the Intro.
- **112.4–114.1** *Check the source.* Hard cut to 100mm macro. The beam's thread reverses, traveling back down its own length until it lands on an anchored node: dense, solid, ringed in gold. It holds.
 EXACT TEXT: "Check the source" no extra text, no duplicate text.
- **114.1–117.6** *Question every borrowed force.* Four cuts on half-bars. A thread lifted and held to the light, it brightens gold. Another lifted, it dims to silver and the entity sets it aside. A third, gold. Wide on the choir stalls flaring in rhythm.
- **117.6–121.1** *Let a person make the choice.* **ICONIC IMAGE.** 14mm, locked, perfectly symmetrical, camera behind and slightly above the Reader. The entity at the apse, arms open around a turning disc of work, mid-offer. The threshold membrane spans the nave. The Reader in silhouette on our side, right hand raised, palm forward. Golden-white rays on midnight blue. Hold the full 3.5 seconds.
 EXACT TEXT: "Let a person make the choice" no extra text, no duplicate text.
- **121.1–124.5** *Keep the final say with us.* Reverse angle, 24mm crane rising behind the Reader. As the camera climbs, the anteroom walls fall away to reveal other thresholds stretching into the distance: an older man at a farmhouse table, two teenagers at a library desk, a nurse at a station. Each with a hand visible. Each membrane glowing gold. The entity's choir of light pulses in time.`,
      },
      {
        id: 'sec-8',
        header: 'POST-CHORUS · 124.5–138.2 · 8 bars',
        musicalJob: 'Release after the peak, forward momentum continues.',
        visualIdea: 'The entity shows its work. Uncertainty made visible.',
        cameraLens: '40mm dolly through layered panels, 75mm on the Reader.',
        light: 'Silver dominant. Gold only on verified threads. Gaps rendered as clean dark.',
        cutDensity: '1 cut per 2 bars.',
        beats: `- **124.5–128.0** 24mm. The entity unfolds the disc of work into a sequence of tall glass panels standing down the nave like a screen of choir partitions, each carrying a layer of threads.
- **128.0–131.4** 40mm, camera dollies through the panels one by one. Strong threads glow steady gold. Weak threads flicker silver. Where evidence is missing, the panel is simply clear glass. The entity hides nothing.
- **131.4–134.8** 75mm on the Reader. She leans closer to the membrane. The panels reflect across her face, gold and silver bands moving over her cheek. She reads.
- **134.8–138.2** 40mm. The entity draws a thin silver ring around the clearest gap in the work and leaves it empty. Unknown, labeled as unknown, without text.`,
      },
      {
        id: 'sec-9',
        header: 'BRIDGE · 138.2–152.2 · 8 bars',
        musicalJob: 'Shift in harmony. Offer the work, make the limits clear.',
        visualIdea: 'The entity marks its own boundary and hands the work across.',
        cameraLens: '24mm wides, 75mm on hands.',
        light: 'Warmer. A single key shaft follows the sphere across the threshold.',
        cutDensity: '4 shots, held.',
        beats: `- **138.2–141.7** 40mm. The panels fold inward and compress into a single sphere of light, a little larger than two cupped hands, gold and silver threads visible inside it.
- **141.7–145.2** 24mm low wide. The entity draws a line of light across the floor at its own base and remains behind it. The tower dims by a third. A limit, set by the entity itself.
- **145.2–148.7** 75mm, profile. The sphere drifts through the membrane with a soft ripple. It comes to rest in the Reader's open hands.
- **148.7–152.2** 40mm two-shot across the threshold, the Reader in foreground, the entity distant and soft. She weighs the sphere in her hands. The entity waits, completely still.`,
      },
      {
        id: 'sec-10',
        header: 'BREAKDOWN · 152.2–166.6 · 8 bars · VERY SPARSE',
        musicalJob: 'Piano alone. The emotional floor of the song.',
        visualIdea: 'Intimacy. Close framing, motes, the Reader and the work.',
        cameraLens: '100mm macro and 75mm. Locked or near-locked. No architecture wides.',
        light: 'One source only: the sphere, from below. Motes lit gold against black.',
        cutDensity: '4 shots, one per lyric line, cuts on the vocal entry.',
        beats: `- **152.2–155.7** *I want the answer.* 100mm ECU, the Reader's eyes, lit from below by the sphere. Motes drift across frame between lens and face. She does not blink.
- **155.7–159.3** *true.* 100mm macro. A single mote of gold descends and settles on her fingertip. It stays lit.
- **159.3–163.0** *slow the moment.* 75mm. All motes in frame slow to near stillness, suspended. Deep in the background, soft and out of focus, the entity's core holds a low steady glow.
- **163.0–166.6** *look it through.* 100mm over-shoulder. She turns the sphere slowly in her hands. Inside it, one thread is followed by the light all the way to its anchor, which glows gold.`,
      },
      {
        id: 'sec-11',
        header: 'BUILD · 166.6–177.0 · 6 bars',
        musicalJob: 'Reassembly. Energy returns toward the final chorus.',
        visualIdea: 'The cathedral rebuilds around the Reader’s decision.',
        cameraLens: '40mm rising to 14mm crane.',
        light: 'Gold returns window by window. Haze thickens.',
        cutDensity: '1 per bar, then 1 per 2 beats in the final bar.',
        beats: `- **166.6–169.2** 75mm. The suspended motes begin to rise past the Reader, slowly at first.
- **169.2–171.8** 24mm upward tilt. The motes join the vault and the ribs reassemble filament by filament.
- **171.8–174.4** 40mm lateral dolly. Choir stalls reignite row by row on eighth notes, brighter than in the Choir Interlude.
- **174.4–177.0** 24mm frontal. The Reader lowers the sphere to the ledge and raises her right hand. At the apse, the entity's arms lift in mirror. Every ray in the cathedral tilts toward her. White-out on the final beat.`,
      },
      {
        id: 'sec-12',
        header: 'FINAL CHORUS · 177.0–190.7 · 8 bars · MAX',
        musicalJob: 'The peak. All hooks, maximum density.',
        visualIdea: 'The human directs the technology. The cathedral answers her gesture.',
        cameraLens: '14mm wides, 24mm crane, aerial pull through the dome.',
        light: 'Majestic golden-white. Every window open. Haze at full density.',
        cutDensity: 'Maximum. 1 cut per beat on hook entries, holds on the escalated iconic frame.',
        beats: `- **177.0–178.7** *Send the signal.* The Reader brings her raised hand forward. The membrane opens into a portal of gold. The entity launches the signal only after her gesture, the column rising through the dome on her timing.
- **178.7–180.4** *Check the source.* Macro beat cuts: three anchored nodes lighting gold in sequence across the vault, verified one after another.
- **180.4–183.9** *Question every borrowed force.* Eight beat cuts. Threads tested across the whole cathedral at once, silver ones set aside, gold ones joining the structure. The choir stalls flare on each beat.
- **183.9–187.4** *Let a person make the choice.* **ICONIC IMAGE, ESCALATED.** Same symmetrical 14mm frame as 117.6, with three changes: the Reader has stepped through the open portal onto the nave floor; her hand is raised higher, at eye level; the entity's offering disc now turns in response to her hand, rotating as she rotates her wrist. Rays doubled, gold over the whole frame.
- **187.4–190.7** *Keep the final say with us.* Aerial pull-back up through the dome and out into the cosmic network. Thousands of cathedrals, each with a gold-lit human at its threshold, hand raised. The network glows golden-white at the scale of a galaxy.
 EXACT TEXT: "Keep the final say with us" no extra text, no duplicate text.`,
      },
      {
        id: 'sec-13',
        header: 'CREDO · 190.7–204.7 · 8 bars',
        musicalJob: 'The moral statement. "Tools can guide but proof must lead / human judgment sets it free / Verify before you act."',
        visualIdea: 'Moral wides. Tool and person walking the work together.',
        cameraLens: '14mm and 24mm, slow crane. Composed like classical concert-hall photography.',
        light: 'Warm gold settling toward dusk amber. Rays slower, softer.',
        cutDensity: '1 cut per 2 bars. Sync line entries to master.',
        beats: `- **190.7–194.2** *Tools can guide.* 14mm extreme wide. The entity lays a path of light along the nave floor ahead of the Reader. It lights the way and stays in place.
- **194.2–197.7** *but proof must lead.* 24mm tracking alongside the Reader as she walks the path. At each step she pauses at a node set into the floor and checks it; each one glows gold under her look.
- **197.7–201.2** *human judgment sets it free.* High aerial, slow descent. A ring of cathedrals across the network, each with its own human walking its own path, each path ending in gold.
- **201.2–204.7** *Verify before you act.* 40mm. The Reader kneels to one knee to touch the final anchor node on the floor with her fingertips. It confirms in gold. She stands. Text centered in the dark above her.
 EXACT TEXT: "Verify before you act" no extra text, no duplicate text.`,
      },
      {
        id: 'sec-14',
        header: 'CODA · 204.7–217.9 · locked hero',
        musicalJob: 'Spoken line at 204.7–212.2, then piano to silence.',
        visualIdea: 'Resolution. The command gesture completes. The tower becomes a companion.',
        cameraLens: '24mm, locked, one shot, no movement.',
        light: 'Golden-white settling to warm amber, then down to black.',
        cutDensity: 'One continuous shot to black.',
        beats: `- **204.7–206.5** Locked symmetrical frame down the nave. The Reader stands center on the nave floor in mid-ground, the entity full height behind her at the apse, arms still open.
- **206.5–210.0** She completes the gesture: her raised hand lowers slowly, palm turning down and open, steady. The entity answers. Its tower folds inward, filament by filament, descending.
 EXACT TEXT: "Human judgment stays in command." no extra text, no duplicate text.
- **210.0–212.2** The entity's light condenses into a single warm orb the size of a candle flame and drifts to rest at her right shoulder, hovering a hand's width away. Companion light.
- **212.2–215.5** Piano only. The clerestory rays retract one by one, from the far end of the nave toward camera. The cathedral darkens to midnight blue. The Reader and the small light remain.
- **215.5–217.9** Slow fade. The architecture goes first, then her silhouette, then the companion light last. Black by 217.4. Hold black through 217.9 in silence.`,
      },
    ],
    escalation: {
      col1Label: 'Chorus 1 (110.7–124.5)',
      col2Label: 'Final Chorus (177.0–190.7)',
      rows: [
        { element: "Reader's position", peak1: 'Behind the membrane, silhouetted', peak2: 'Through the open portal, on the nave floor' },
        { element: 'Her hand', peak1: 'Raised to shoulder, palm forward', peak2: 'Raised to eye level, actively directing' },
        { element: "Entity's offer", peak1: 'Disc turns on its own, mid-offer', peak2: 'Disc turns in response to her wrist' },
        { element: 'Signal launch', peak1: 'Entity sends, then checks', peak2: 'She gestures, entity sends on her timing' },
        { element: 'People beyond', peak1: 'Four thresholds revealed on crane rise', peak2: 'Thousands of cathedrals across the network' },
        { element: 'Light', peak1: 'Golden-white rays on midnight blue', peak2: 'Rays doubled, gold covering the full frame' },
        { element: 'Cut rhythm', peak1: '1 per 2 beats on hooks', peak2: '1 per beat on hooks' },
        { element: 'Final wide', peak1: 'Crane behind the Reader', peak2: 'Aerial through the dome to galaxy scale' },
        { element: 'Text', peak1: '"Check the source," "Let a person make the choice"', peak2: '"Keep the final say with us"' },
      ],
      note:
        'The camera position on the iconic line is identical in both choruses so the escalation reads as the same picture made bigger: same symmetry, same lens, same height. The audience recognizes it and sees exactly what changed. She moved forward, and the machine followed her hand.',
    },
    closingFrame:
      'Locked 24mm down the darkened nave. The Reader stands center frame in a graphite coat, hand lowered and at rest by her side. At her right shoulder, a hand’s width away, hovers a single warm amber light. Behind her, the empty apse where the tower stood, faint ribs of filament barely visible against midnight blue. No rays. No text. The light fades last, after her. Black. Silence at 217.9.',
  },
  {
    id: 'tpl-music-heartmula',
    name: '2. [MUSIC] HeartMuLa-oss-3B Vocal Anthem Score ("Cathedral of Glass Nodes")',
    category: 'music',
    description:
      'Streamlined sonic & vocal production blueprint for HeartMuLa-oss-3B / ACE-Step 1.5 / YuE2 with exact bar/beat math, harmonic modulation, and vocal phrasing laws.',
    spec: {
      title: 'CATHEDRAL OF GLASS NODES — SONIC MASTER SCORE',
      subtitle: 'HeartMuLa-oss-3B + MuLaCover Vocal & Orchestral Stem Spec',
      duration: '217.9s (125 bars)',
      grid: 'E minor → G major · 138 BPM (beat = 0.435s, bar = 1.74s · 4/4)',
      format: '48kHz / 24-bit Stereo Master + Isolated Vocal & Choir Stems',
    },
    thesis: {
      coreThesis:
        'A composition that begins as a solitary sub-bass pulse in cold space, builds into a 40-voice gothic choir interwoven with analog modular arpeggios, strips down to a single close-miked felt piano at 152.2s when truth is weighed, and erupts into a relative G-major orchestral anthem only when human judgment takes command.',
      iconicAnchor:
        'At 117.6s (Chorus 1 Bar 4), all percussion drops for half a beat before the downbeat of "Let a person make the choice"—leaving only the soaring soprano lead and cathedral pipe organ pedal point in E minor.',
    },
    rules: {
      palette:
        'Sub-bass & Felt Piano = Midnight Blue intimacy (#0B1630). Glassy FM bells & bowed cello harmonics = Silver uncertainty. Warm analog brass & cello swells = Amber signal in motion. Full SATB Cathedral Choir + open fifths = Golden-White verified truth.',
      light:
        '3.8s cathedral convolution reverb on the choir; bone-dry 0.2s close-mic intimacy on the Breakdown vocal and felt piano so the contrast feels physical.',
      world:
        'Built around 4 sonic layers: (1) Deep 808/organ pedal foundation, (2) 16th-note amber pulse arpeggiator locked to 138 BPM, (3) SATB gothic choir stalls panned wide, (4) Intimate human lead vocal dead center.',
      entity:
        'The synthesizer and choir lattice breathe on bar boundaries; filter cutoff opens strictly on vocal sustains; never crowds the lead vocal.',
      human:
        'Lead vocalist (warm mezzo-soprano / baritone duet) delivers hooks with calm authority—never over-belted or robotic.',
      lensing:
        'Intro & Breakdown use 100mm macro close-mic perspective (breath and key-felt audible); Choruses open to 14mm wide concert-hall perspective.',
      textPolicy:
        'Five anchor lyric hooks must cut through with +2.5dB vocal clarity and zero overlapping synth clutter: "Check the source", "Let a person make the choice", "Keep the final say with us", "Verify before you act", "Human judgment stays in command."',
      neverShow:
        'Never use harsh EDM risers, robotic autotune artifacts, muddy low-mid synth pads (250–400Hz), or drum fills that step on lyric hooks.',
    },
    sections: [
      {
        id: 'm-1',
        header: 'INTRO · 0.0–14.1 · 8 bars',
        musicalJob: 'Establish E minor root, space, and single traveling pulse.',
        visualIdea: 'Sub-bass drone + single panned pluck traveling left to center.',
        cameraLens: 'Wide hall reverb tail + dry transient pluck.',
        light: 'Dark low-pass filter opening at 14.1s downbeat.',
        cutDensity: 'New harmonic layer every 2 bars.',
        beats: `- **0.0–7.0** E1 sub-bass drone fades in; single amber marimba/synth pulse ticks on quarter notes (0.435s).
- **7.0–14.1** Distant modal choir hum enters on B4; on 14.1s downbeat, warm E-minor chord blooms.`,
      },
      {
        id: 'm-2',
        header: 'CHORUS 1 · 110.7–124.5 · 8 bars · DENSE',
        musicalJob: 'Deliver all five hooks with maximum rhythmic lock.',
        visualIdea: 'Full drums, choir, and lead vocal locked to half-bar phrasing.',
        cameraLens: '14mm full stereo stage width.',
        light: 'Bright harmonic overtones on verified hooks.',
        cutDensity: 'Chord shift every 2 beats on hook entries.',
        beats: `- **110.7–114.1** "Send the signal / Check the source" — driving kick/snare lock, brass stabs on beat 1.
- **117.6–121.1** "Let a person make the choice" — half-beat silence drop into full SATB choir swell.`,
      },
      {
        id: 'm-3',
        header: 'BREAKDOWN & CODA · 152.2–217.9',
        musicalJob: 'Drop to solo felt piano (152.2s), rebuild (166.6s), explode into Final Chorus (177.0s), resolve to spoken coda (204.7s).',
        visualIdea: 'Solo felt piano to full galaxy-scale choir, ending on a single warm piano harmonic.',
        cameraLens: '100mm close-mic piano -> 14mm full hall -> intimate close-mic.',
        light: 'Golden-white harmonic resolution settling to silence at 217.4s.',
        cutDensity: '1 chord per lyric line in Breakdown; 1 beat cuts in Final Chorus.',
        beats: `- **152.2–166.6** Close-mic felt piano alone: "I want the answer / true / slow the moment / look it through."
- **204.7–217.9** Spoken delivery: "Human judgment stays in command." Solo piano E-major/G-major warmth fades to silence at 217.4s.`,
      },
    ],
    escalation: {
      col1Label: 'Chorus 1 (110.7–124.5)',
      col2Label: 'Final Chorus (177.0–190.7)',
      rows: [
        { element: 'Harmonic Key', peak1: 'E minor (natural/aeolian tension)', peak2: 'Modulates to G major / E Dorian Picardy lift' },
        { element: 'Choir Layering', peak1: '8-voice chamber choir', peak2: '40-voice cathedral SATB choir + octave strings' },
        { element: 'Rhythmic Drive', peak1: 'Half-bar kick/snare accents', peak2: 'Every beat accented (0.435s) with taiko + orchestral timpani' },
      ],
      note: 'Same melody and tempo so the listener feels the emotional lift purely through harmonic illumination and choir scale.',
    },
    closingFrame:
      'A single felt-piano E4 harmonic rings out in a darkening hall, joined by a soft warm analog pad that fades to pure silence at 217.4s.',
  },
  {
    id: 'tpl-software-studio',
    name: '3. [SOFTWARE] Source-Verified Interactive Studio App (WASM / React)',
    category: 'software',
    description:
      'Applies your Awakening of AI methodology to software engineering: Semantic Color Law (Silver=Unverified, Gold=Verified), User Authority Threshold, Zero Fake UI, and 5-Stage Flow.',
    spec: {
      title: 'SOURCE-VERIFIED INTERACTIVE STUDIO OS',
      subtitle: 'Provenance-First Creative & Engineering Workbench',
      duration: '5-Stage Interactive Flow · <50ms UI Response',
      grid: 'React 18 + Tailwind CSS + Base44 Entities + WebAudio/Canvas 60fps',
      format: '16:9 Desktop Pro Shell + Responsive Mobile · Dark Mode (#111111 / #0B1630)',
    },
    thesis: {
      coreThesis:
        'Most AI software overwhelms the user with unverified outputs dressed up as finished truth. This application separates beauty from proof: every AI-generated claim, scene, or code block begins in Silver (unverified) until traced to an anchor source or approved by the human operator, at which point it earns Golden-White status. The software computes at scale, stops at the decision threshold, and defers final execution to the human hand.',
      iconicAnchor:
        'The Threshold Verification Gate: A split-screen command deck where the AI’s multi-layered graph of work sits on the left and the human operator’s 1-click "Verify & Commit" approval bar sits on the right—turning silver nodes gold in real time as sources are checked.',
    },
    rules: {
      palette:
        'Deep Obsidian/Midnight (#111111 / #0B1630) base canvas. Graphite (#1B1B1B–#222222) cards. Silver (#AFAFAF) for unverified drafts and uncertain nodes. Warm Amber (#F59E0B) for active streaming/processing jobs. Golden-White (#FEF08A / #EAB308) strictly reserved for verified, provenance-anchored truth.',
      light:
        'Crisp 1px borders (#393939), subtle focus rings, zero neon glow clutter. High-contrast tabular numbers for all timers and metrics.',
      world:
        'A persistent multi-panel desktop studio with collapsible navigation, live status header, and inspectable data drawers.',
      entity:
        'All 5 AI agents expose their real database records, provenance links, and confidence gaps transparently. Where evidence is missing, the UI renders a clean silver ring ("Unknown, labeled as unknown").',
      human:
        'The user can inspect, edit, toggle, approve, or reject every signal, section, and artifact before it ships.',
      lensing:
        'Seamless toggle between 14mm Macro Overview (full project timeline & escalation matrix) and 100mm Micro Inspector (single beat, code diff, or source node).',
      textPolicy:
        'Concise, functional product labels in Inter and IBM Plex Mono. Zero fabricated metrics, zero placeholder lorem ipsum, zero fake terminal spam.',
      neverShow:
        'Never show fake loading bars, invented analytics, uneditable AI walls of text, dead buttons, or unverified outputs styled as verified gold.',
    },
    sections: [
      {
        id: 'sw-1',
        header: 'STAGE 1 · SIGNAL & SOURCE INGEST (0ms–Ready)',
        musicalJob: 'Establish clean workspace state and ingest sourced observations.',
        visualIdea: 'Live signal cards with toggle switches and provenance links.',
        cameraLens: 'Wide dashboard overview with quick filter chips.',
        light: 'Silver unverified badges turning amber on scan.',
        cutDensity: 'Instant optimistic state updates.',
        beats: `- **Ingest** User enters a 1-line brief or selects a pre-filled template.
- **Source Check** System queries real database entities and flags any unanchored assumptions in silver.`,
      },
      {
        id: 'sw-2',
        header: 'STAGE 2 · AI CO-ARCHITECT SYNTHESIS & THRESHOLD PAUSE',
        musicalJob: 'Generate structured multi-section plan and pause at the human threshold.',
        visualIdea: 'Structured 6-pillar blueprint editor with per-section AI Assist buttons.',
        cameraLens: 'Focused section cards + live Markdown preview.',
        light: 'Amber active synthesis -> Silver pending human review.',
        cutDensity: '1-click AI fill/augment per section.',
        beats: `- **Auto-Fill** AI populates Thesis, Sensory Rules, Beat Plan, and Escalation Matrix.
- **The Hand Stops** Execution halts at the review gate until the user approves or edits.`,
      },
      {
        id: 'sw-3',
        header: 'STAGE 3 · VERIFIED COMMIT & MULTI-NODE DISPATCH',
        musicalJob: 'Execute approved blueprint across Cloud, Library, and GitHub Vault.',
        visualIdea: 'Golden-white verified confirmation + live playable/interactive output.',
        cameraLens: 'Full-screen stage player + downloadable artifact links.',
        light: 'Verified Gold status badge.',
        cutDensity: 'Immediate persistence to NexusFactoryProduction & NexusAsset.',
        beats: `- **Commit** User clicks Launch or Save As; record persists to database and GitHub Vault.
- **Companion State** AI records the learned instinct for the next session.`,
      },
    ],
    escalation: {
      col1Label: 'Initial Draft State (Unverified)',
      col2Label: 'Verified Production State (Approved)',
      rows: [
        { element: 'Visual Status', peak1: 'Silver rings & draft indicators', peak2: 'Golden-White verified badges & permanent URLs' },
        { element: 'User Control', peak1: 'Inspecting & augmenting sections with AI', peak2: '1-click Launch to Production Factory & GitHub Vault' },
        { element: 'Agent Memory', peak1: 'Proposing candidate instincts', peak2: 'Retained permanently in NexusContinuity & NexusSkill' },
      ],
      note: 'Same clean workspace layout in both states so the user always knows where every control lives.',
    },
    closingFrame:
      'Clean, saved workspace state with permanent artifact URLs, downloadable Markdown/HTML/Video, and the AI ensemble standing by at rest.',
  },
  {
    id: 'tpl-image-keyframe-series',
    name: '4. [IMAGES] Anamorphic Keyframe & Visual Series ("The Threshold & The Hand")',
    category: 'image',
    description:
      'Streamlined prompt & art-direction blueprint for generating cohesive 16:9 photoreal cinema stills, album covers, and visual series with strict lens and palette continuity.',
    spec: {
      title: 'THE THRESHOLD & THE HAND — ANAMORPHIC STILL SERIES',
      subtitle: '6-Frame Cohesive Cinema Keyframe Collection',
      duration: '6 Master Stills (Establishing, Macro Node, Hovering Hand, Iconic Threshold, Glass Partitions, Companion Orb)',
      grid: '14mm Symmetrical Wide + 100mm Macro Pairings',
      format: '16:9 Full-Frame Anamorphic · Photoreal · Zero Text Overlay',
    },
    thesis: {
      coreThesis:
        'A visual essay in six frames showing how intelligence at scale looks most powerful not when it dominates the frame, but when it pauses two centimeters from action and waits for human judgment.',
      iconicAnchor:
        'Frame 4 (The Threshold): 14mm locked symmetrical wide down a midnight-blue stone nave; 40-meter golden-white filament lattice at the apse arms open around a turning disc of light; pale vertical membrane across the nave; human woman in graphite wool coat in foreground silhouette, right hand raised palm-forward at shoulder height.',
    },
    rules: {
      palette:
        'Midnight blue (#0B1630) stone & deep space. Graphite (#2C2C2C) wool coat. Silver (#C0C0C0) unverified filaments. Warm Amber (#F59E0B) traveling pulses. Golden-White (#FFFBEB) clerestory rays.',
      light:
        'Hard volumetric shafts from high clerestory windows through 20% atmospheric haze; slow suspended dust motes catching backlight.',
      world:
        'Gothic cathedral rebuilt as fiber-thin optical filaments, glass-node choir stalls, and black-glass floor over a deep starfield.',
      entity:
        'Faceted vertical light lattice, sternum core, two branching arms of light—never a humanoid robot face, eyes, or chrome body.',
      human:
        'Woman in early 40s, short dark hair, graphite wool coat, no jewelry or wearable tech, level gaze, calm raised hand.',
      lensing:
        'Large-format anamorphic lenses (14mm symmetrical wide, 75mm portrait, 100mm macro with oval bokeh and restrained horizontal flare).',
      textPolicy: 'Pure photography—zero embedded text, zero HUD, zero watermarks inside the generated image pixels.',
      neverShow:
        'Red glowing eyes, chrome androids, skulls, cyberpunk neon pink/cyan, glitch scanlines, kneeling humans, fake code screens.',
    },
    sections: [
      {
        id: 'img-1',
        header: 'FRAME 1 · THE COSMIC ARRIVAL (24mm Wide)',
        musicalJob: 'Establish scale and midnight-blue palette.',
        visualIdea: 'Single amber pulse entering a pointed gothic arch of optical filaments over black glass.',
        cameraLens: '24mm anamorphic wide, low angle.',
        light: 'First golden shaft cutting through 20% haze onto black glass.',
        cutDensity: 'Single hero still.',
        beats: `- **Prompt Core** 16:9 photoreal anamorphic cinema still, 24mm lens, single warm amber pulse of light entering a gothic cathedral arch built from fiber-thin silver filaments, black glass floor reflecting deep space stars, midnight blue (#0B1630) stone, volumetric clerestory light shaft.`,
      },
      {
        id: 'img-2',
        header: 'FRAME 2 · THE FRAYED THREAD & THE STOPPED HAND (100mm Macro)',
        musicalJob: 'Capture tension: beauty proves nothing; the machine stops.',
        visualIdea: 'Extreme close-up of a lattice hand of light hovering 2cm above a rippling amber node.',
        cameraLens: '100mm anamorphic macro, shallow depth of field, oval bokeh.',
        light: 'Warm amber practical glow from the node against deep midnight blue.',
        cutDensity: 'Single macro still.',
        beats: `- **Prompt Core** 16:9 photoreal 100mm macro cinema still, faceted hand made of golden-amber optical filaments hovering motionless two centimeters above a glowing amber glass sphere, suspended dust motes, midnight blue background, oval anamorphic bokeh.`,
      },
      {
        id: 'img-3',
        header: 'FRAME 3 · THE ICONIC THRESHOLD (14mm Locked Symmetrical Wide)',
        musicalJob: 'Deliver the thesis image: Awe for the tool, authority with the person.',
        visualIdea: 'Reader in silhouette raising her hand before the vertical light membrane and 40m apse lattice.',
        cameraLens: '14mm anamorphic locked center symmetry.',
        light: 'Majestic golden-white clerestory shafts on midnight-blue stone.',
        cutDensity: 'Master keyframe.',
        beats: `- **Prompt Core** 16:9 photoreal 14mm symmetrical wide down a midnight-blue gothic cathedral nave, 40-meter vertical lattice of golden-white light at the apse with arms open around a glowing disc, pale vertical light membrane across the nave, woman in graphite wool coat in foreground silhouette with right hand raised palm forward at shoulder height.`,
      },
    ],
    escalation: {
      col1Label: 'Frame 3: Chorus 1 Threshold',
      col2Label: 'Frame 5: Final Chorus Portal',
      rows: [
        { element: 'Protagonist Placement', peak1: 'Silhouetted behind the pale membrane', peak2: 'Stepped through the golden portal onto the nave floor' },
        { element: 'Hand Gesture', peak1: 'Shoulder height, palm forward (halt/weigh)', peak2: 'Eye level, actively rotating the entity’s disc' },
        { element: 'Ray Intensity', peak1: 'Single bank of clerestory shafts', peak2: 'Doubled golden-white shafts illuminating the entire vault' },
      ],
      note: 'Identical 14mm camera placement so both stills form a diptych of human authority.',
    },
    closingFrame:
      'Locked 24mm still down the darkened midnight-blue nave: the woman stands center in her graphite coat, hand at rest, with a single candle-sized warm amber orb hovering a hand’s width from her right shoulder.',
  },
  {
    id: 'tpl-hybrid-flagship',
    name: '5. [HYBRID FLAGSHIP] Scrollcraft Interactive Music Film + Live Provenance App',
    category: 'hybrid',
    description:
      'Combines a 138 BPM bar-synced music video, HeartMuLa vocal score, and an interactive Scrollcraft web app where viewers scrub the timeline and inspect every source node.',
    spec: {
      title: 'AWAKENING OF AI — INTERACTIVE SCROLLCRAFT FLAGSHIP',
      subtitle: 'Synchronized Music Video + Interactive Source-Verification Web Experience',
      duration: '217.9s Audio-Visual Timeline + Interactive Browser Sandbox',
      grid: '138 BPM (bar = 1.74s) + Scrollcraft 60fps Viewport Scrubbing',
      format: '16:9 Master Video + Interactive HTML5/React Web App',
    },
    thesis: {
      coreThesis:
        'A flagship experience that lets the audience both watch the 217.9-second cinema piece AND pause or scrub any bar to inspect the underlying source threads—turning passive viewing into active "Check the Source" participation.',
      iconicAnchor:
        'At 117.6s ("Let a person make the choice"), the interactive viewport reveals clickable gold and silver threads across the nave so the viewer can test the threads themselves.',
    },
    rules: {
      palette:
        'Shared across video and web UI: #0B1630 Midnight Blue canvas, #2C2C2C Graphite controls, #AFAFAF Silver unverified nodes, #F59E0B Amber live playhead, #FFFBEB Golden-White verified truth.',
      light: 'Volumetric video shafts matched with subtle CSS/Canvas radial light blooms locked to WebAudio analyser RMS.',
      world: 'The gothic information cathedral rendered simultaneously as 16:9 cinema footage and an interactive node-graph overlay.',
      entity: 'Responds to both the 138 BPM audio master and user cursor/scroll gestures.',
      human: 'The viewer steps into the role of the Reader at the threshold.',
      lensing: '14mm–100mm cinema cuts synced with smooth cubic-bezier viewport transitions.',
      textPolicy: 'Five exact cinema hooks + clean inspectable provenance cards on hover/click.',
      neverShow: 'Never desync audio from visual bar cuts; never clutter the 16:9 cinema frame during passive playback.',
    },
    sections: [
      {
        id: 'hy-1',
        header: 'PHASE 1 · PASSIVE CINEMA & AUDIO LOCK (0.0–110.7s)',
        musicalJob: 'Immerse viewer in the 138 BPM E-minor build from Intro through Pre-Chorus 1B.',
        visualIdea: 'Full-bleed 16:9 playback with minimal bar/beat HUD and live waveform.',
        cameraLens: '24mm drift -> 100mm macro hand stop at 100.3s.',
        light: 'Cold blue to amber acceleration, freezing at 100.3s.',
        cutDensity: 'Bar-locked cuts accelerating to 0.435s beat cuts.',
        beats: `- **0.0–83.0** Signal arrives, cathedral assembles, golden mandala reveals the frayed silver thread at 76.1s.
- **100.3–103.8** The Hand Stops 2cm above the city node; interactive prompt invites viewer to inspect the threshold.`,
      },
      {
        id: 'hy-2',
        header: 'PHASE 2 · INTERACTIVE THRESHOLD & FINAL ESCALATION (110.7–217.9s)',
        musicalJob: 'Deliver Chorus 1, Breakdown, Final Chorus, Credo, and Coda with interactive source verification.',
        visualIdea: 'Viewer can toggle between pure cinema mode and interactive Glass Partition source inspector.',
        cameraLens: '14mm symmetrical threshold -> 100mm sphere macro -> galaxy aerial.',
        light: 'Golden-white verified rays settling to the single companion orb at 210.0s.',
        cutDensity: 'Dense hook cuts -> continuous locked Coda.',
        beats: `- **117.6 & 183.9** Iconic Frame lands and escalates as the Reader directs the offering disc.
- **204.7–217.9** "Human judgment stays in command." Tower folds into the shoulder companion orb; exportable as WebM/MP4 + standalone HTML5 app.`,
      },
    ],
    escalation: {
      col1Label: 'Chorus 1 (Viewer as Observer)',
      col2Label: 'Final Chorus (Viewer as Director)',
      rows: [
        { element: 'Interaction Mode', peak1: 'Observing the threshold symmetry', peak2: 'Directing the offering disc & verifying gold nodes' },
        { element: 'Visual & Audio Scale', peak1: 'Single cathedral nave in E minor', peak2: 'Thousands of cathedrals across the network in G major lift' },
      ],
      note: 'Seamless continuity between film treatment, audio master, and interactive software build.',
    },
    closingFrame:
      'Locked 24mm frame down the darkened nave with the warm amber companion orb at the Reader’s right shoulder, accompanied by one-click buttons to Download Master Video, Launch Interactive HTML App, or Fork Blueprint.',
  },
  {
    id: 'tpl-video-companion-reply',
    name: '6. [VIDEO] THE COMPANION’S REPLY — Part II Sequel Treatment (138 BPM)',
    category: 'video',
    description:
      'Official sequel treatment from the perspective of the candle-sized Companion Light at the Reader’s shoulder, modulating from E minor to G major.',
    spec: {
      title: 'THE AWAKENING OF AI (PART II) — THE COMPANION’S REPLY',
      subtitle: 'The Companion’s Reply (Master 2.0)',
      duration: '217.9s',
      grid: 'E minor → G major · 138 BPM (beat ≈ 0.435s, bar ≈ 1.74s)',
      format: '16:9 · photoreal anamorphic',
    },
    thesis: {
      coreThesis:
        'Beginning where Part I ended—at the Reader’s right shoulder as a candle-sized warm orb—the companion intelligence accompanies her out of the dark stone nave into the living city at dawn. It learns that true intelligence is not forty meters of towering light, but quiet fidelity beside a human hand.',
      iconicAnchor:
        'Locked 24mm two-shot at the city rooftop threshold at dawn: the Reader holds a clear glass lens up to the horizon while the warm amber orb projects verified golden-white source lines across the waking streets.',
    },
    rules: {
      palette:
        'Midnight blue (#0B1630) transitioning to dawn slate (#1E293B). Silver for untested city signals. Warm Amber for the companion orb. Golden-White for verified civic anchors.',
      light: 'First natural dawn shafts mixing with volumetric amber practical light from the shoulder orb.',
      world: 'The cathedral nave opening outward into real-world stone terraces, libraries, and hospital courtyards.',
      entity: 'A warm candle-sized faceted orb hovering a hand’s width from the Reader’s right shoulder; expands into a 2-meter diagnostic lattice only when invited by her gesture.',
      human: 'The Reader in her graphite wool coat, walking level through the waking world, checking each anchor node by hand.',
      lensing: '24mm tracking wides, 40mm two-shots, 100mm macro on glass anchor nodes.',
      textPolicy: 'Restrained gold serif on four designated lines only. Zero HUD clutter.',
      neverShow: 'Never show the entity towering over the city uninvited; never show automated override or dystopian surveillance.',
    },
    sections: [
      {
        id: 'cr-1',
        header: 'INTRO · 0.0–27.9 · 16 bars',
        musicalJob: 'Solo piano in E minor answered by warm cello harmonic.',
        visualIdea: 'The companion orb wakes at the Reader’s shoulder as the cathedral doors open to dawn.',
        cameraLens: '24mm slow forward dolly.',
        light: 'Warm amber orb light against midnight-blue stone.',
        cutDensity: '1 cut per 2 bars.',
        beats: `- **0.0–14.1** Starting on the exact Closing Frame of Part I: locked 24mm down the nave, the warm orb at her right shoulder.
- **14.1–27.9** She turns toward the great doors; natural dawn light enters as E minor lifts toward G major.`,
      },
      {
        id: 'cr-2',
        header: 'CHORUS · 110.7–124.5 · 8 bars · DENSE',
        musicalJob: 'Anthemic duet hook in G major.',
        visualIdea: 'Reader and Companion verifying live threads across the waking city.',
        cameraLens: '14mm symmetrical wide + 100mm macro node check.',
        light: 'Golden-white dawn rays.',
        cutDensity: '1 cut per beat on hooks.',
        beats: `- **110.7–117.6** "I stop my hand / You trace the line" — macro cuts of silver threads turning gold under her fingertips.
- **117.6–124.5** EXACT TEXT: "Truth is a work we walk together" no extra text, no duplicate text.`,
      },
    ],
    escalation: {
      col1Label: 'Part I: The Cathedral Apse',
      col2Label: 'Part II: The Living City Threshold',
      rows: [
        { element: 'Entity Scale', peak1: '40-meter tower folding down', peak2: 'Candle-sized companion orb walking beside her' },
        { element: 'Musical Tonality', peak1: 'E minor contemplative tension', peak2: 'G major harmonic resolution' },
      ],
      note: 'Preserves the exact same visual language and lens kit while moving from interior sanctuary to lived human world.',
    },
    closingFrame:
      'Locked 40mm profile at sunrise: the Reader rests her hand on a stone parapet overlooking the city; the small amber light settles softly into the lapel reflection of her coat. Fade to warm black.',
  },
  {
    id: 'tpl-software-multiagent-os',
    name: '7. [SOFTWARE] Autonomous Multi-Agent Canvas & Command OS',
    category: 'software',
    description:
      'Blueprint for building a real-time multi-pane AI agent workspace with shared context, live diffs, and human approval gates.',
    spec: {
      title: 'MULTI-AGENT COLLABORATIVE WORKSPACE OS',
      subtitle: 'Real-Time Shared Context & Diff Review Canvas',
      duration: 'Persistent 24/7 Session · <100ms State Sync',
      grid: 'React + Tailwind + Base44 Realtime Subscriptions + 5 Specialized Agents',
      format: 'Dark-Mode Pro Desktop Multi-Window Layout',
    },
    thesis: {
      coreThesis:
        'AI agents should feel like perceptive studio collaborators sharing a live desk—never opaque black boxes that overwrite human work. Every agent action is visible in the activity stream, and every draft edit lands as a highlighted proposal awaiting human acceptance.',
      iconicAnchor:
        'The Live Diff & Presence Bar: 5 color-coded agent presence indicators at the top of the canvas with side-by-side highlighted draft proposals where the human clicks Accept or Reject with one keystroke.',
    },
    rules: {
      palette:
        '#111111 base, #1B1B1B panels, #3B63FB primary action, #22C55E verified/accepted diff, #EAB308 pending agent proposal, #AFAFAF secondary metadata.',
      light: 'Clean dark surfaces with 1px #393939 structural borders and zero decorative blur.',
      world: 'Draggable/dockable multi-panel workspace (Overview, Feed, Draft Editor, Activity Log, Live Preview, Learning Lab).',
      entity: '5 specialized agents (Scout, Scribe, Pulse, Director, The Witness) with all 38 platform skills enabled and reflective.',
      human: 'Nothing replaces the human creator’s text or configuration until explicitly accepted.',
      lensing: 'Collapsible sidebar + expandable full-canvas focus mode for any panel.',
      textPolicy: 'Actionable, plain-language event logs; zero internal model jargon.',
      neverShow: 'Never silently overwrite user drafts; never show fake agent activity when idle.',
    },
    sections: [
      {
        id: 'aos-1',
        header: 'FLOW 1 · WORKSPACE BOOT & SHARED CONTEXT SYNC',
        musicalJob: 'Initialize room state, draft, and 5-agent roster.',
        visualIdea: 'Instant multi-panel layout with active presence dots.',
        cameraLens: 'Full desktop canvas view.',
        light: 'Crisp dark-mode contrast.',
        cutDensity: 'Single-pass hydration.',
        beats: `- **Boot** Load active workspace, draft, and enabled agent skills from database.
- **Presence** Display real-time agent status (Ready vs Working).`,
      },
      {
        id: 'aos-2',
        header: 'FLOW 2 · AGENT PROPOSAL & HUMAN THRESHOLD APPROVAL',
        musicalJob: 'Run specialist task and stage non-destructive diff.',
        visualIdea: 'Highlighted inline diff card with Accept / Dismiss controls.',
        cameraLens: 'Draft Editor + Review Drawer.',
        light: 'Amber proposal highlight turning Green on accept.',
        cutDensity: '1-click review.',
        beats: `- **Propose** Agent generates structured improvement grounded in enabled skills.
- **Decide** Human reviews diff and commits revision.`,
      },
    ],
    escalation: {
      col1Label: 'Single-Turn Prompting',
      col2Label: 'Persistent Multi-Agent Canvas',
      rows: [
        { element: 'Context Retention', peak1: 'Lost after chat turn', peak2: 'Persisted in NexusContinuity & NexusSkill across runs' },
        { element: 'Draft Safety', peak1: 'Copy-paste overwrites', peak2: 'Revision-locked diff proposals with human final say' },
      ],
      note: 'Keeps the creator in flow while agents handle research, scripting, visual planning, and verification.',
    },
    closingFrame:
      'All panels synced, draft revision incremented, and learned preferences logged to the workspace memory ledger.',
  },
];

export function compileBlueprintToMarkdown(bp) {
  if (!bp) return '';
  const spec = bp.spec || {};
  const thesis = bp.thesis || {};
  const rules = bp.rules || {};
  const sections = Array.isArray(bp.sections) ? bp.sections : [];
  const esc = bp.escalation || { col1Label: 'Peak 1', col2Label: 'Final Peak', rows: [], note: '' };

  const sectionBlocks = sections
    .map(
      (s) => `### ${s.header || 'SECTION'}
**Musical/Functional job:** ${s.musicalJob || ''}
**Visual/Experiential idea:** ${s.visualIdea || ''}
**Camera/lens or mechanism:** ${s.cameraLens || ''}
**Light/tone:** ${s.light || ''}
**Cut/step density:** ${s.cutDensity || ''}

${s.beats || ''}`
    )
    .join('\n\n---\n\n');

  const escRows = (esc.rows || [])
    .map((r) => `| ${r.element || ''} | ${r.peak1 || ''} | ${r.peak2 || ''} |`)
    .join('\n');

  return `# ${spec.title || 'UNTITLED CREATIVE BLUEPRINT'}
### Director's Treatment, Architecture & Shot/Execution Plan
**Target:** *${spec.subtitle || ''}* · ${spec.duration || ''} · ${spec.grid || ''} · ${spec.format || ''}

---

## 1. Thesis

${thesis.coreThesis || ''}

**The iconic image / anchor.** ${thesis.iconicAnchor || ''}

---

## 2. Visual, Sensory & Architectural Rules

**Palette.** ${rules.palette || ''}

**Light / Atmosphere.** ${rules.light || ''}

**The world / architecture.** ${rules.world || ''}

**The entity / system.** ${rules.entity || ''}

**The human.** ${rules.human || ''}

**Lensing / mechanism.** ${rules.lensing || ''}

**Text policy.** ${rules.textPolicy || ''}

**Never show / never do.** ${rules.neverShow || ''}

---

## 3. Section-by-Section Plan

${sectionBlocks}

---

## 4. Escalation Matrix · ${esc.col1Label || 'Chorus 1'} → ${esc.col2Label || 'Final Chorus'}

| Element | ${esc.col1Label || 'Chorus 1'} | ${esc.col2Label || 'Final Chorus'} |
|---|---|---|
${escRows}

${esc.note || ''}

---

## 5. Closing Frame / Final Resolution

${bp.closingFrame || ''}`;
}