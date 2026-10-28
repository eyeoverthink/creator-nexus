export const FRAYNIXBOOT={
 repo:'eyeoverthink/fraynixboot',
 sha:'d93947154a1f21dcfd8dfcc97f27439fed6e3275',
 summary:'main · 3,967 files · 1,064 Java · read-only, no repository code executed, no JVM in this environment',
 stack:'build.gradle: LWJGL 3.3.3 (glfw, opengl, stb) · JOML 1.10.5 · imgui-java 1.86.11 · mainClass fraymus.FraymusApp → jade.Window "Fraymus Engine V2", 1280×720, OpenGL 3.3 core (EGL first, native fallback)',
};

export const SOURCE_MAP=[
 ['jade/Window.java','Main loop: input → camera → DebugDraw.beginFrame → fixed 60 Hz PhiWorld.step → clear → FraymusRenderer → DebugDraw.draw → ImGui → swap','Ported to WebGL2 (draws straight to the canvas; offscreen buffer and ImGui window replaced)'],
 ['renderer/DebugDraw, Line2D, Shader · assets/shaders/debugLine2D.glsl','GL_LINES batch: 10,000-line cap, 6 floats per vertex, line lifetimes, one shader','Ported 1:1 (same GLSL, header changed to "#version 300 es")'],
 ['jade/Camera.java','Orthographic 400×225 × zoom, lookAt view matrix','Ported and checked'],
 ['fraymus/FraymusRenderer.java','Grid, trails, proximity links, consciousness/glow/role circles, spike rays, intent glyphs, energy bars, boundary','Ported (draw order kept)'],
 ['PhiWorld, Laws (8 laws), PhiNode, LivingDNA, LogicGate/LogicBrain, QuantumClock, ConsciousnessState, AdaptiveLogicEngine/StrategyGenome, SelfHealer, AntRole, ColonyCoach','Simulation state and per-tick rules','Ported'],
 ['fraymus/DNACloaker.java','SHA-256 → next prime → p×q → BigInteger.hashCode → node colour and base size','Ported; each step checked against a reference'],
 ['FraymusUI + jade/ImGuiLayer','ImGui panels, terminal, arena window','Not ported (replaced by the stats panel below)'],
 ['GenesisMemory, NerveCenter (ws://localhost:8887), EscapeFragment, MorseCircuit, ConceptArena / code generation, InfiniteMemory, PassiveLearner, PhiNeuralNet, QRGenome, SovereignMind, NEXUS_Organism','Logging, persistence, sockets and AI subsystems hanging off the loop','Not ported: they never feed back into node motion, except ColonyCoach code generation (left out)'],
];

export const VERIFIED=[
 'SHA-256 port matches Node crypto on 7 inputs, including multi-block messages',
 'Prime test and next-prime search match trial division for every value 0–5,000 (next-prime never skips a prime)',
 'BigInteger.hashCode port matches an independent reference on 500 random 512-bit values',
 'Camera: world point (100, 56.25) maps to clip (0.5, 0.5); pan + zoom case correct',
 'Line lifetimes: a lifetime-1 line survives one beginFrame and is removed on the next; the 10,000 cap drops the overflow',
 'Headless 2-minute run (seed 42, rendering every tick): no NaN values, every node stays inside the boundary, peak 3,238 lines per frame',
 'Same seed reproduces the run exactly; a different seed diverges',
];

export const NOT_VERIFIED=[
 'Number-for-number parity with the running Java app: there is no JVM here, and the Java code uses unseeded java.util.Random, so even two Java runs differ',
 'Live WebGL rendering in your browser: the build passes, but the canvas has not been watched in the preview',
];

export const FINDINGS=[
 'The colony cannot grow as written. ReproductionLaw (like BrainLaw) keeps one counter shared by every node. With 5 nodes and a 120-tick period, only the 5th node (Epsilon) is ever checked, and Epsilon’s name-derived base size of 7.1 caps its size at 14.6, below the 15 that canReproduce() requires. Across 3 seeds × 10 simulated minutes: 0 births, and 4–5 of the 5 founders died.',
 'DebugDraw keeps a lifetime-1 line until its lifetime drops below 0, so every frame also redraws the previous frame’s shapes. With a large population, the 10,000-line cap silently drops whatever is drawn last, starting with the boundary.',
 'The flee arrow points the same way as the seek arrow (both follow velocity); only the colour differs.',
 'AdaptiveLogicEngine.addProvenStrategy still appends a near-duplicate strategy when it is not fitter than its twin.',
 'Founder colours are fixed by name, so you can check parity in Java: e.g. Alpha = rgb(163, 137, 249), base size 6.7; Beta = rgb(169, 105, 183), 9.3. Print new PhiNode("Alpha", 0, 0).r × 255 to compare.',
 'There is no LICENSE file at the repo root, and replit.md says the LWJGL + ImGui layer was “adapted from MarioPhysics engine”. Confirm the rights to the jade/renderer code before redistributing it.',
];

export const DEVIATIONS=[
 'Seeded random generator in place of unseeded java.util.Random',
 '64-bit doubles in place of Java’s 32-bit floats for position, velocity and energy (tiny numeric drift)',
 'Frame time capped at 0.25 s so a background tab doesn’t trigger a catch-up burst',
 'Pan with the left or middle button, with the scene following the cursor (Java: middle button, distance × zoom)',
 'Lines render 1 px wide; browsers ignore Java’s glLineWidth(2)',
 'The loop runs on the page thread; your modernization doc §5 suggests a fixed-step worker as a later step',
];

export const NEXT=[
 'Give each node its own law counter so reproduction and brain checks reach every node (a behaviour change, so it needs your approval)',
 'Port the FraymusUI inspector: entity list, brain gates, strategies',
 'Port the GenesisMemory event chain',
 'Run Java parity locally: seed java.util.Random on a JVM and compare against this port',
];