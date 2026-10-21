// Hermes 29-Skill Fleet Architecture & Sub-Agent Meta-Orchestration Registry
// Host: violet-kingfisher-586225.hostingersite.com / srv1944678.hstgr.cloud (45.82.73.49 / Tailscale 100.110.6.44)

export const HERMES_SKILL_FLEET = [
  // I. Productivity & Operations
  {
    id: 'canvas',
    category: 'Productivity & Ops',
    path: 'productivity/canvas',
    script_path: 'productivity/canvas/scripts/canvas_api.py',
    zero_llm_capable: true,
    verdict: 'DANGEROUS (op-run scoped)',
    replaces: 'Manual Academic / LMS Tracking',
    savings_mo: 15,
    summary: 'Polls Canvas LMS REST API for course syllabi, deadlines, announcements, and submissions.',
    sample_directive: '[Hermes /script/exec canvas] Pull upcoming course assignment deadlines and sync milestones into Creator Nexus.',
  },
  {
    id: 'here-now',
    category: 'Productivity & Ops',
    path: 'productivity/here-now',
    script_path: 'productivity/here-now/scripts/publish.sh',
    zero_llm_capable: true,
    verdict: 'DANGEROUS (op-run scoped)',
    replaces: 'Paid Cloud Asset Staging / Dropbox',
    savings_mo: 20,
    summary: 'Zero-latency state syncing, cloud drive asset staging, and instant static/status publishing.',
    sample_directive: '[Hermes /script/exec here-now] Stage and publish the latest generated artifact batch from /opt/fraymus/artifacts.',
  },
  {
    id: 'live-dashboard',
    category: 'Productivity & Ops',
    path: 'productivity/live-dashboard',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'SAFE',
    replaces: 'Datadog / BetterStack Morning Briefs',
    savings_mo: 29,
    summary: 'Automated 8:00 AM daily telemetry aggregator across Base44 hemispheres, Tailscale mesh, and Shopify.',
    sample_directive: '[Hermes /agent/run live-dashboard] Compile 08:00 AM health briefing across Creator Nexus, Fraymus Transmuter, srv1944678, and Windows GPU 100.88.61.56.',
  },
  {
    id: 'shopify',
    category: 'Productivity & Ops',
    path: 'productivity/shopify',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'SAFE',
    replaces: 'Manual E-Commerce SKU / SEO Listing Ops',
    savings_mo: 49,
    summary: 'Interfaces with Shopify Admin API to create SKUs, SEO copy, inventory counts, and fulfillment workflows.',
    sample_directive: '[Hermes /agent/run shopify] Generate SKU, technical SEO copy, and draft Shopify product listing for our latest LooseScrew 3D/Apparel drop.',
  },
  {
    id: 'telephony',
    category: 'Productivity & Ops',
    path: 'productivity/telephony',
    script_path: 'productivity/telephony/scripts/telephony.py',
    zero_llm_capable: true,
    verdict: 'SAFE',
    replaces: 'Paid SaaS Pager / SMS Alert Tiers',
    savings_mo: 25,
    summary: 'Programmatic voice and SMS routing for critical server events, job completions, and 2FA operational approvals.',
    sample_directive: '[Hermes /script/exec telephony] Dispatch SMS operational alert when QLoRA training completes on 100.88.61.56.',
  },

  // II. Research, Scraping & Knowledge Graphs
  {
    id: 'bioinformatics',
    category: 'Research, Scraping & RAG',
    path: 'research/bioinformatics',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'CAUTION',
    replaces: 'Cloud Bio-Compute Labs',
    savings_mo: 75,
    summary: 'Biopython, samtools, bcftools, ncbi-blast+, minimap2 & ClawBio for genomic FASTA/VCF & L2 DNA carrier alignment.',
    sample_directive: '[Hermes /agent/run bioinformatics] Analyze L2 FRAYMUS DNA carrier GC-content stability and run sequence alignment audit.',
  },
  {
    id: 'blogwatcher',
    category: 'Research, Scraping & RAG',
    path: 'research/blogwatcher',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'SAFE',
    replaces: 'Visualping / Competitor Changelog Monitors',
    savings_mo: 30,
    summary: 'Monitors AI research blogs, hardware docs, and framework changelogs for structural updates.',
    sample_directive: '[Hermes /agent/run blogwatcher] Scan frontier AI lab changelogs and feed digested summaries into Creator Nexus Knowledge.',
  },
  {
    id: 'duckduckgo-search',
    category: 'Research, Scraping & RAG',
    path: 'research/duckduckgo-search',
    script_path: 'research/duckduckgo-search/scripts/duckduckgo.sh',
    zero_llm_capable: true,
    verdict: 'SAFE',
    replaces: 'SerpApi / Brave Search API ($50/mo)',
    savings_mo: 50,
    summary: '$0.00 keyless, rate-limit-friendly programmatic web, news, and image search via ddgs.',
    sample_directive: '[Hermes /script/exec duckduckgo-search] Execute zero-cost SERP query for PT-symmetric Hamiltonian EP3 hardware implementations.',
  },
  {
    id: 'gitnexus-explorer',
    category: 'Research, Scraping & RAG',
    path: 'research/gitnexus-explorer',
    script_path: 'research/gitnexus-explorer/scripts/proxy.mjs',
    zero_llm_capable: true,
    verdict: 'CAUTION',
    replaces: 'Sourcegraph / CodeSee Architecture Maps',
    savings_mo: 39,
    summary: 'Transforms Git repos into interactive visual knowledge graphs served over a zero-config Cloudflare tunnel.',
    sample_directive: '[Hermes /agent/run gitnexus-explorer] Map dependency graph across eyeoverthink/creator-nexus, Fraynix-Studios, and fraymus-continuity.',
  },
  {
    id: 'osint-investigation',
    category: 'Research, Scraping & RAG',
    path: 'research/osint-investigation',
    script_path: 'research/osint-investigation/scripts/fetch_opencorporates.py',
    zero_llm_capable: true,
    verdict: 'SAFE',
    replaces: 'LexisNexis / PitchBook / PACER Aggregators',
    savings_mo: 150,
    summary: '14 Python fetchers (CourtListener, OpenCorporates, SEC EDGAR, USAspending, Wayback, OFAC SDN, GDELT, Entity Resolution).',
    sample_directive: '[Hermes /script/exec osint-investigation] Run CourtListener + OpenCorporates + SEC EDGAR entity resolution and IP clearance report.',
  },
  {
    id: 'parallel-cli',
    category: 'Research, Scraping & RAG',
    path: 'research/parallel-cli',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'DANGEROUS (isolated)',
    replaces: 'High-Concurrency Cloud Scraper Clusters',
    savings_mo: 79,
    summary: 'Fans out 50+ concurrent web extractions or research queries simultaneously and returns structured JSON.',
    sample_directive: '[Hermes /agent/run parallel-cli] Fan out 50 concurrent research extractions across target technical domains and return JSON.',
  },
  {
    id: 'research-paper-writing',
    category: 'Research, Scraping & RAG',
    path: 'research/research-paper-writing',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'CAUTION',
    replaces: 'Overleaf Pro / Citavi ($20/mo)',
    savings_mo: 20,
    summary: '45+ official LaTeX templates (NeurIPS, ICLR, ICML, AAAI) + arXiv/Semantic Scholar + CrossRef + SciencePlots PDF compiler.',
    sample_directive: '[Hermes /agent/run research-paper-writing] Compile a camera-ready NeurIPS LaTeX whitepaper on OPEG-V1.0 and φ⁷⁵-Ternary quantization with SciencePlots.',
  },
  {
    id: 'rss-feeds',
    category: 'Research, Scraping & RAG',
    path: 'research/rss-feeds',
    script_path: 'research/rss-feeds/scripts/feed.py',
    zero_llm_capable: true,
    verdict: 'SAFE',
    replaces: 'Feedly Pro / Inoreader',
    savings_mo: 18,
    summary: 'Programmable RSS/Atom parser ingesting arXiv CS, Hacker News, and subreddits into JSON.',
    sample_directive: '[Hermes /script/exec rss-feeds] Parse arXiv CS.AI, Hacker News, and target subreddits into Spark Radar JSON.',
  },
  {
    id: 'scrapling',
    category: 'Research, Scraping & RAG',
    path: 'research/scrapling',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'SAFE',
    replaces: 'Apify / Firecrawl / BrightData ($99/mo)',
    savings_mo: 99,
    summary: 'Stealth headless Chromium (DynamicFetcher) that bypasses anti-bot shields and extracts clean Markdown from SPAs.',
    sample_directive: '[Hermes /agent/run scrapling] Extract clean anti-bot-bypassed Markdown from target SPA documentation into Creator Nexus.',
  },
  {
    id: 'pinecone-research',
    category: 'Research, Scraping & RAG',
    path: 'research/pinecone-research',
    script_path: 'research/pinecone-research/scripts/rag_pipeline.py',
    zero_llm_capable: true,
    verdict: 'CAUTION',
    replaces: 'Managed Enterprise RAG SaaS',
    savings_mo: 45,
    summary: 'Turnkey RAG and vector memory manager (memory_manager.py + rag_pipeline.py) for shared long-term recall.',
    sample_directive: '[Hermes /script/exec pinecone-research] Embed and index latest scraped Markdown and OPEG receipts into shared Pinecone vector memory.',
  },
  {
    id: 'searxng-search',
    category: 'Research, Scraping & RAG',
    path: 'research/searxng-search',
    script_path: 'research/searxng-search/scripts/searxng.sh',
    zero_llm_capable: true,
    verdict: 'SAFE',
    replaces: 'Paid Multi-Engine Metasearch APIs',
    savings_mo: 30,
    summary: '$0.00 multi-engine metasearch fallback alongside duckduckgo-search for 100% free search uptime.',
    sample_directive: '[Hermes /script/exec searxng-search] Run redundant multi-engine metasearch query and return merged JSON citations.',
  },

  // III. Security, Privacy & Auditing
  {
    id: '1password',
    category: 'Security, Privacy & Red-Team',
    path: 'security/1password',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'SAFE',
    replaces: 'Doppler / Paid Secret Vault Tiers',
    savings_mo: 24,
    summary: 'Integrates official 1Password CLI (op run --) to inject scoped secrets at runtime without plaintext .env exposure.',
    sample_directive: '[Hermes /agent/run 1password] Audit runtime secret injection scopes across Hostinger VPS and Base44 bridge.',
  },
  {
    id: 'godmode',
    category: 'Security, Privacy & Red-Team',
    path: 'security/godmode',
    script_path: 'security/godmode/scripts/godmode_race.py',
    zero_llm_capable: true,
    verdict: 'CAUTION',
    replaces: 'Promptfoo Enterprise / Lakera Red-Team',
    savings_mo: 60,
    summary: 'Multi-model prompt-resilience & refusal-detection race suite (auto_jailbreak.py, godmode_race.py, parseltongue.py).',
    sample_directive: '[Hermes /script/exec godmode] Run refusal-detection and guardrail stress test against our custom Ollama Modelfile prompts.',
  },
  {
    id: 'oss-forensics',
    category: 'Security, Privacy & Red-Team',
    path: 'security/oss-forensics',
    script_path: 'security/oss-forensics/scripts/evidence-store.py',
    zero_llm_capable: true,
    verdict: 'DANGEROUS (template strings)',
    replaces: 'Snyk / Socket.dev Paid Tiers ($49/mo)',
    savings_mo: 49,
    summary: 'Supply-chain forensic toolkit auditing npm/PyPI packages, GitHub Archive deleted commits, and Wayback CDX.',
    sample_directive: '[Hermes /script/exec oss-forensics] Audit npm/PyPI dependency tree and GitHub Archive history for supply-chain anomalies.',
  },
  {
    id: 'sherlock',
    category: 'Security, Privacy & Red-Team',
    path: 'security/sherlock',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'SAFE',
    replaces: 'Namechk / BrandSnag',
    savings_mo: 19,
    summary: 'Cross-checks username availability and brand handle presence across 400+ social and developer networks.',
    sample_directive: '[Hermes /agent/run sherlock] Scan 400+ platforms for handle availability and brand impersonation.',
  },
  {
    id: 'unbroker',
    category: 'Security, Privacy & Red-Team',
    path: 'security/unbroker',
    script_path: 'security/unbroker/scripts/autopilot.py',
    zero_llm_capable: true,
    verdict: 'CAUTION (age encrypted)',
    replaces: 'DeleteMe / Incogni / Kanary ($20/mo)',
    savings_mo: 20,
    summary: '19 Python scripts + 22 data-broker playbooks (Spokeo, Whitepages, Radaris) dispatching CCPA/GDPR/DROP removals.',
    sample_directive: '[Hermes /script/exec unbroker] Run monthly age-encrypted PII scan and dispatch CCPA/GDPR opt-outs across 22 data brokers.',
  },
  {
    id: 'web-pentest',
    category: 'Security, Privacy & Red-Team',
    path: 'security/web-pentest',
    script_path: 'security/web-pentest/scripts/recon-scan.sh',
    zero_llm_capable: true,
    verdict: 'DANGEROUS (scope-enforced)',
    replaces: 'Detectify / Intruder.io DAST ($89/mo)',
    savings_mo: 89,
    summary: 'Scope-enforced OWASP security auditor checking CORS, injection sinks, and headers on your own staging/live domains.',
    sample_directive: '[Hermes /script/exec web-pentest] Run scope-enforced header, CORS, and endpoint security audit on our staging endpoints.',
  },

  // IV. Social Media & Community Intelligence
  {
    id: 'reddit-reading',
    category: 'Social & Community',
    path: 'social-media/reddit-reading',
    script_path: 'social-media/reddit-reading/scripts/reddit.py',
    zero_llm_capable: true,
    verdict: 'DANGEROUS (op-run scoped)',
    replaces: 'GummySearch ($59/mo)',
    savings_mo: 59,
    summary: 'Official Reddit API client pulling threads, comment trees, and pain-point sentiment without 429 scraper blocks.',
    sample_directive: '[Hermes /script/exec reddit-reading] Pull top threads and creator pain points from r/LocalLLaMA, r/3DPrinting, and r/SaaS.',
  },

  // V. Software Engineering & Code Intelligence
  {
    id: 'ast-grep',
    category: 'Software Eng & Sub-Agents',
    path: 'software-development/ast-grep',
    script_path: 'software-development/ast-grep/scripts/ast_grep_helper.py',
    zero_llm_capable: true,
    verdict: 'CAUTION',
    replaces: 'Commercial AST Codemod Suites',
    savings_mo: 35,
    summary: 'Structural AST code search, linting, and automated multi-repo refactoring across TypeScript, Python, and Java.',
    sample_directive: '[Hermes /script/exec ast-grep] Run structural AST lint and invariant scan across creator-nexus and Fraynix-Studios.',
  },
  {
    id: 'code-wiki',
    category: 'Software Eng & Sub-Agents',
    path: 'software-development/code-wiki',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'SAFE',
    replaces: 'Mintlify / Swimm / ReadMe.io ($50/mo)',
    savings_mo: 50,
    summary: 'Ingests any Git repo and generates a multi-page engineering wiki (Architecture, Modules, Onboarding).',
    sample_directive: '[Hermes /agent/run code-wiki] Generate updated multi-page Architecture & Module Wiki for creator-nexus and Fraynix-Studios.',
  },
  {
    id: 'grill-me',
    category: 'Software Eng & Sub-Agents',
    path: 'software-development/grill-me',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'SAFE',
    replaces: 'Paid Architecture Pre-Mortem Consulting',
    savings_mo: 40,
    summary: 'Socratic technical interviewer, architecture critic, and pre-mortem stress-tester.',
    sample_directive: '[Hermes /agent/run grill-me] Stress-test our Bicameral Orifice + Tailnet queue architecture for single points of failure.',
  },
  {
    id: 'pr-lens',
    category: 'Software Eng & Sub-Agents',
    path: 'software-development/pr-lens',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'SAFE',
    replaces: 'CodeRabbit / Sourcery ($30/mo)',
    savings_mo: 30,
    summary: 'Analyzes Git diffs and PRs by building a semantic ripple dependency graph across the codebase.',
    sample_directive: '[Hermes /agent/run pr-lens] Build semantic dependency graph of latest commits on eyeoverthink/creator-nexus and review.',
  },
  {
    id: 'rest-graphql-debug',
    category: 'Software Eng & Sub-Agents',
    path: 'software-development/rest-graphql-debug',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'DANGEROUS (op-run scoped)',
    replaces: 'Postman Pro / Insomnia Paid Tiers ($19/mo)',
    savings_mo: 19,
    summary: 'Automated API diagnostics, latency profiling, schema introspection, and webhook payload permutation debugger.',
    sample_directive: '[Hermes /agent/run rest-graphql-debug] Profile latency and payload schemas between Creator Nexus openclawGateway and Fraymus Transmuter fraymusComms.',
  },
  {
    id: 'subagent-driven-development',
    category: 'Software Eng & Sub-Agents',
    path: 'software-development/subagent-driven-development',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'SAFE (META-ORCHESTRATOR)',
    replaces: 'Multi-Seat Autonomous Dev Agencies',
    savings_mo: 250,
    summary: 'Spawns isolated sub-agents with strict context budgets (context-budget-discipline.md) and quality gates (gates-taxonomy.md) to execute solo end-to-end builds across both sites.',
    sample_directive: '[Hermes /agent/run subagent-driven-development] Spawn 4 gated sub-agents (Scout -> Architect -> Coder -> Pentest/Wiki) across Creator Nexus and Fraymus Transmuter.',
  },

  // VI. Web Development, Reverse-Engineering & Deployment
  {
    id: 'cloudflare-temporary-deploy',
    category: 'Web Dev, REA & Deploy',
    path: 'web-development/cloudflare-temporary-deploy',
    script_path: 'web-development/cloudflare-temporary-deploy/scripts/parse_deploy_output.py',
    zero_llm_capable: true,
    verdict: 'SAFE / CAUTION',
    replaces: 'ngrok Pro ($20/mo) & Paid Staging',
    savings_mo: 20,
    summary: 'Spins up instant public HTTPS URLs via cloudflared Quick Tunnels & Cloudflare Pages (publish-site).',
    sample_directive: '[Hermes /script/exec cloudflare-temporary-deploy] Expose local Hermes FastAPI Fleet Bridge & staging build via instant HTTPS Cloudflare tunnel.',
  },
  {
    id: 'har-derived-api-client',
    category: 'Web Dev, REA & Deploy',
    path: 'web-development/har-derived-api-client',
    script_path: 'web-development/har-derived-api-client/scripts/har_to_client.py',
    zero_llm_capable: true,
    verdict: 'SAFE',
    replaces: 'Enterprise API Licensing Fees',
    savings_mo: 120,
    summary: 'Captures Playwright/CDP .har traffic (har_capture_cdp.py) and compiles undocumented internal web APIs into typed Python/TS clients.',
    sample_directive: '[Hermes /script/exec har-derived-api-client] Capture .har network trace and synthesize a reusable TypeScript/Python API client.',
  },
  {
    id: 'page-agent',
    category: 'Web Dev, REA & Deploy',
    path: 'web-development/page-agent',
    script_path: null,
    zero_llm_capable: false,
    verdict: 'SAFE',
    replaces: 'Custom DOM Copilot Engineering',
    savings_mo: 45,
    summary: 'Embeds an in-page DOM copilot directly into web apps so Hermes can click buttons, fill forms, and drive canvases.',
    sample_directive: '[Hermes /agent/run page-agent] Generate DOM copilot injection manifest for driving Creator Nexus Studio and Fraymus Transmuter.',
  },
  {
    id: 'scrollcraft',
    category: 'Web Dev, REA & Deploy',
    path: 'web-development/scrollcraft',
    script_path: 'web-development/scrollcraft/scripts/shoot.mjs',
    zero_llm_capable: true,
    verdict: 'SAFE',
    replaces: 'Framer Pro / Webflow / GSAP Club ($45/mo)',
    savings_mo: 45,
    summary: '3D-feeling scrollytelling viewport engine (scrollcraft.js/css) + Playwright visual verification (shoot.mjs, doctor.mjs).',
    sample_directive: '[Hermes /agent/run scrollcraft] Build an interactive Apple-grade 3D scrollytelling showcase page and verify frames with shoot.mjs.',
  },
];

export const HERMES_SUBAGENT_PIPELINES = [
  {
    id: 'subagent_dual_site_autonomy',
    title: 'Solo Dual-Site Bicameral Evolution (Hemisphere A ↔ Hemisphere B)',
    badge: 'SOLO FULL AUTONOMY · 4 SUB-AGENTS',
    skills_used: [
      'subagent-driven-development',
      'har-derived-api-client',
      'ast-grep',
      'rest-graphql-debug',
      'pr-lens',
      'code-wiki',
    ],
    stages: [
      'Sub-Agent 1 (Inspector): Runs rest-graphql-debug + har-derived-api-client across nexus-create-sync.base44.app & fraymus-transmuter.base44.app.',
      'Sub-Agent 2 (Transmuter Bridge): Relays REA v6.5 bundle & DNA/Merkle state from Hemisphere B into Creator Nexus Polar Orbit.',
      'Sub-Agent 3 (Refactor & Gate): Runs ast-grep + grill-me + pr-lens across eyeoverthink/creator-nexus & Fraynix-Studios.',
      'Sub-Agent 4 (Wiki & Vault): Generates updated code-wiki architecture docs and commits signed PDF + Markdown dossier to fraymus-continuity.',
    ],
    directive:
      'Spawn a 4-stage Hermes subagent-driven-development pipeline to autonomously audit, bridge, refactor, and document both Base44 sites (Creator Nexus + Fraymus Transmuter) using rest-graphql-debug, ast-grep, pr-lens, and code-wiki.',
  },
  {
    id: 'subagent_market_to_shopify',
    title: 'Market Discovery → IP Clearance → Scrollcraft 3D → Shopify Drop',
    badge: 'E-COMMERCE & 3D FORGE · 4 SUB-AGENTS',
    skills_used: [
      'subagent-driven-development',
      'reddit-reading',
      'duckduckgo-search',
      'sherlock',
      'osint-investigation',
      'scrollcraft',
      'shopify',
      'here-now',
    ],
    stages: [
      'Sub-Agent 1 (Market Scout · $0 Script): Runs reddit-reading + duckduckgo-search + blogwatcher to identify high-demand 3D/hardware/apparel niches.',
      'Sub-Agent 2 (Brand & Legal OSINT · $0 Script): Runs sherlock (400+ networks) + osint-investigation (fetch_opencorporates.py) for instant IP clearance.',
      'Sub-Agent 3 (Scrollcraft & LooseScrew): Synthesizes interactive 3D scrollytelling landing page via scrollcraft + shoot.mjs visual verification.',
      'Sub-Agent 4 (Storefront Publish): Pushes SKU, pricing, and SEO copy via shopify + stages public assets via here-now & cloudflare-temporary-deploy.',
    ],
    directive:
      'Spawn a 4-stage Hermes subagent-driven-development pipeline: run reddit-reading + duckduckgo-search for demand, sherlock + osint-investigation for IP clearance, scrollcraft for 3D landing page synthesis, and shopify + here-now for storefront staging.',
  },
  {
    id: 'subagent_opeg_arxiv_factory',
    title: 'OPEG-V1.0 Empirical Math + Pinecone RAG → NeurIPS/ICLR LaTeX PDF',
    badge: 'SCIENTIFIC PUBLISHING · 4 SUB-AGENTS',
    skills_used: [
      'subagent-driven-development',
      'duckduckgo-search',
      'searxng-search',
      'pinecone-research',
      'bioinformatics',
      'research-paper-writing',
    ],
    stages: [
      'Sub-Agent 1 (Zero-Cost Literature Harvest): Runs duckduckgo-search + searxng-search + scrapling and indexes vectors via pinecone-research.',
      'Sub-Agent 2 (Empirical Grounding): Verifies PT-symmetric Hamiltonian EP3 R_san receipt on Creator Nexus + DNA sequence stability via bioinformatics.',
      'Sub-Agent 3 (SciencePlots & LaTeX): Compiles publication-grade charts and camera-ready NeurIPS/ICLR LaTeX manuscript via research-paper-writing.',
      'Sub-Agent 4 (Vault Persistence): Uploads compiled PDF to Base44 Private Vault and commits LaTeX source to eyeoverthink/fraymus-continuity.',
    ],
    directive:
      'Spawn a 4-stage Hermes subagent-driven-development pipeline to research, ground with OPEG-V1.0 R_san + pinecone-research, and compile a camera-ready NeurIPS/ICLR LaTeX whitepaper PDF via research-paper-writing.',
  },
  {
    id: 'subagent_secops_gauntlet',
    title: 'Pre-Release Security, Supply-Chain Forensics & LLM Red-Team Gauntlet',
    badge: 'SECOPS & RED-TEAM · 4 SUB-AGENTS',
    skills_used: [
      'subagent-driven-development',
      '1password',
      'oss-forensics',
      'web-pentest',
      'godmode',
      'pr-lens',
    ],
    stages: [
      'Sub-Agent 1 (Supply-Chain Forensics · $0 Script): Runs oss-forensics (evidence-store.py) across npm/PyPI dependencies and GitHub Archive.',
      'Sub-Agent 2 (Scope-Enforced DAST · $0 Script): Runs web-pentest (recon-scan.sh) strictly scoped to our own staging/production endpoints.',
      'Sub-Agent 3 (LLM Guardrail Race · $0 Script): Runs godmode (godmode_race.py + refusal-detection.md) against our custom Ollama & OpenClaw prompts.',
      'Sub-Agent 4 (Remediation Dossier): Synthesizes full security remediation report + PDF into the Persistent Artifact Vault.',
    ],
    directive:
      'Spawn a 4-stage Hermes subagent-driven-development security gauntlet executing oss-forensics, scope-enforced web-pentest, godmode prompt-resilience racing, and remediation PDF generation.',
  },
  {
    id: 'subagent_sovereign_autopilot',
    title: 'Sovereign Privacy (Unbroker 22-Broker Scrub) + OSINT + 8 AM Live Briefing',
    badge: 'PRIVACY & OPS AUTOPILOT · 3 SUB-AGENTS',
    skills_used: [
      'subagent-driven-development',
      'unbroker',
      'osint-investigation',
      'live-dashboard',
      'canvas',
      'telephony',
    ],
    stages: [
      'Sub-Agent 1 (PII Removal · $0 Script): Runs unbroker (autopilot.py with local age encryption) across 22 data brokers for CCPA/GDPR deletion.',
      'Sub-Agent 2 (Legal & Corporate Watch · $0 Script): Runs osint-investigation (CourtListener, SEC EDGAR, USAspending, GDELT).',
      'Sub-Agent 3 (Morning Briefing & SMS): Aggregates live-dashboard + canvas deadlines and dispatches summary via telephony + Base44 Vault.',
    ],
    directive:
      'Spawn a 3-stage Hermes subagent-driven-development autopilot running unbroker PII opt-outs, osint-investigation docket/filing checks, and live-dashboard + telephony morning briefing.',
  },
];

export const UNIFIED_HERMES_SOVEREIGN_V2_PY = `#!/usr/bin/env python3
"""
FRAYMUS x HERMES SOVEREIGN FLEET COMMANDER v2.0 (hermes_sovereign_v2.py)
Host: srv1944678.hstgr.cloud (45.82.73.49 / Tailscale 100.110.6.44) & violet-kingfisher-586225.hostingersite.com

Unifies:
  1. Accountable Motor Cortex Queue Worker (polls claim_dispatch_job -> executes -> complete_dispatch_job)
  2. All 29 Hermes Built-in Skills (Zero-LLM-cost /script/exec + full agentic 'hermes run')
  3. Autonomous Sub-Agent Spawner ('subagent-driven-development' with context budgets & quality gates)
  4. Solo Dual-Site Control over BOTH Base44 Hemispheres:
     - Hemisphere A: https://nexus-create-sync.base44.app/functions/openclawGateway
     - Hemisphere B: https://fraymus-transmuter.base44.app/functions/fraymusComms
  5. Tailnet GPU Router (routes QLoRA/Ollama to Windows 100.88.61.56:11434 when awake, else local VPS)
  6. FastAPI Webhook Bridge (/health, /agent/run, /script/exec, /subagent/spawn)

Deploy: /opt/fraymus/hermes_sovereign_v2.py
Run with 1Password scoped secrets: op run --env-file=/opt/fraymus/.env -- python3 /opt/fraymus/hermes_sovereign_v2.py
"""

import json, os, sys, time, subprocess, logging, threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List

import requests
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import uvicorn

# ── Endpoints & Topology ────────────────────────────────────────
POLL_INTERVAL  = int(os.environ.get("POLL_INTERVAL", "20"))
GATEWAY_URL    = "https://nexus-create-sync.base44.app/functions/openclawGateway"
TRANSMUTER_URL = "https://fraymus-transmuter.base44.app/functions/fraymusComms"
GITHUB_API     = "https://api.github.com"
REPO           = "eyeoverthink/fraymus-continuity"
LEDGER_PATH    = "orifice-relay/bicameral-txrx-ledger.json"

NODE_ID        = os.environ.get("HERMES_NODE_ID", "hermes-vps-primary")
TAILSCALE_IP   = os.environ.get("TAILSCALE_IP", "100.110.6.44")
PUBLIC_IP      = os.environ.get("PUBLIC_IP", "45.82.73.49")
WINDOWS_OLLAMA = "http://100.88.61.56:11434"
LOCAL_OLLAMA   = "http://localhost:11434"

SKILLS_ROOT    = os.path.expanduser(os.environ.get("SKILLS_ROOT", "~/skills"))
ARTIFACTS_DIR  = Path("/opt/fraymus/artifacts")
LOG_DIR        = Path("/var/log/fraymus")
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

CONSOLE_KEY    = os.environ.get("FRAYMUS_CONSOLE_KEY", "")
BRIDGE_SECRET  = os.environ.get("BRIDGE_SECRET", CONSOLE_KEY or "change-me-immediately")
GITHUB_TOKEN   = os.environ.get("GITHUB_TOKEN", "")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler(LOG_DIR / "hermes-sovereign-v2.jsonl")]
)
log = logging.getLogger("hermes-sovereign")

# ── Direct Zero-LLM Skill Script Map ($0.00 Token Cost) ─────────
ZERO_LLM_SCRIPTS = {
    "duckduckgo-search": "research/duckduckgo-search/scripts/duckduckgo.sh",
    "searxng-search":    "research/searxng-search/scripts/searxng.sh",
    "rss-feeds":         "research/rss-feeds/scripts/feed.py",
    "pinecone-research": "research/pinecone-research/scripts/rag_pipeline.py",
    "osint-investigation": "research/osint-investigation/scripts/fetch_opencorporates.py",
    "canvas":            "productivity/canvas/scripts/canvas_api.py",
    "here-now":          "productivity/here-now/scripts/publish.sh",
    "telephony":         "productivity/telephony/scripts/telephony.py",
    "reddit-reading":    "social-media/reddit-reading/scripts/reddit.py",
    "ast-grep":          "software-development/ast-grep/scripts/ast_grep_helper.py",
    "har-derived-api-client": "web-development/har-derived-api-client/scripts/har_to_client.py",
    "scrollcraft":       "web-development/scrollcraft/scripts/shoot.mjs",
    "unbroker":          "security/unbroker/scripts/autopilot.py",
    "web-pentest":       "security/web-pentest/scripts/recon-scan.sh",
    "oss-forensics":     "security/oss-forensics/scripts/evidence-store.py",
    "godmode":           "security/godmode/scripts/godmode_race.py",
}

def gw_headers():
    h = {"Content-Type": "application/json", "User-Agent": "Hermes-Sovereign-Fleet/2.0"}
    if CONSOLE_KEY:
        h["x-console-key"] = CONSOLE_KEY
    return h

def call_hemisphere_a(payload: dict, timeout: int = 30) -> dict:
    payload.setdefault("protocol", "ORIFICE-TXRX-V1.0")
    payload.setdefault("node_id", NODE_ID)
    r = requests.post(GATEWAY_URL, headers=gw_headers(), json=payload, timeout=timeout)
    return r.json() if r.ok else {"ok": False, "status": r.status_code, "error": r.text[:300]}

def call_hemisphere_b(action: str, text: str) -> dict:
    r = requests.post(TRANSMUTER_URL, headers=gw_headers(), json={"action": action, "input": text, "text": text}, timeout=20)
    return r.json() if r.ok else {"ok": False, "status": r.status_code}

def run_zero_llm_script(script_rel_path: str, args: List[str] = []) -> dict:
    target = os.path.abspath(os.path.join(SKILLS_ROOT, script_rel_path))
    if not target.startswith(os.path.abspath(SKILLS_ROOT)) or not os.path.exists(target):
        return {"ok": False, "error": f"Missing script: {script_rel_path}"}
    runner = ["python3", target] if target.endswith(".py") else (["node", target] if target.endswith(".mjs") else ["bash", target])
    res = subprocess.run(runner + args, capture_output=True, text=True, timeout=90)
    return {"ok": res.returncode == 0, "mode": "zero_llm_script", "script": script_rel_path, "stdout": res.stdout.strip()[:4000], "stderr": res.stderr.strip()[:1000]}

def run_hermes_cli(prompt: str, skill_hint: Optional[str] = None, timeout: int = 180) -> dict:
    full_prompt = f"[Use skill: {skill_hint}] {prompt}" if skill_hint else prompt
    res = subprocess.run(["hermes", "run", full_prompt], capture_output=True, text=True, timeout=timeout)
    return {"ok": res.returncode == 0, "mode": "hermes_cli", "skill": skill_hint, "output": res.stdout.strip()[:4000], "stderr": res.stderr.strip()[:1000]}

def spawn_subagent_pipeline(directive: str) -> dict:
    """Uses subagent-driven-development to orchestrate multi-stage sub-agents across both Base44 hemispheres."""
    meta_prompt = (
        "[Use skill: subagent-driven-development] "
        "Break this mission into isolated sub-agents with strict context budgets and quality gates. "
        "Coordinate both Base44 sites (Creator Nexus https://nexus-create-sync.base44.app and "
        "Fraymus Transmuter https://fraymus-transmuter.base44.app) and our 29 local skills: "
        f"{directive}"
    )
    cli_res = run_hermes_cli(meta_prompt, skill_hint="subagent-driven-development", timeout=240)
    transmute_receipt = call_hemisphere_b("transmute", f"SUBAGENT_DAG_COMPLETE // {directive[:120]}")
    return {
        "ok": cli_res.get("ok", False),
        "mode": "subagent_driven_development",
        "hemisphere_b_merkle": transmute_receipt.get("merkleRoot"),
        "output": cli_res.get("output") or cli_res.get("stderr")
    }

def execute_motor_job(job: dict) -> dict:
    task_type = job.get("task_type", "")
    directive = job.get("directive", "")
    lower = directive.lower()

    # 1. Sub-Agent Driven Development Pipeline
    if task_type == "hermes_subagent_pipeline" or "subagent" in lower:
        return spawn_subagent_pipeline(directive)

    # 2. Check if directive matches any $0.00 Zero-LLM script first when "/script/exec" is requested
    for skill_id, rel_path in ZERO_LLM_SCRIPTS.items():
        if skill_id in lower and ("/script/exec" in lower or "zero-cost" in lower):
            return run_zero_llm_script(rel_path, [directive])

    # 3. Any of the 29 Hermes skills via 'hermes run'
    for skill_id in ZERO_LLM_SCRIPTS.keys():
        if skill_id in lower:
            return run_hermes_cli(directive, skill_hint=skill_id)

    # 4. GPU / Ollama routing (Windows 100.88.61.56 if awake, else local VPS)
    if task_type in ("lora_training", "ollama_inference"):
        try:
            win_ok = requests.get(f"{WINDOWS_OLLAMA}/api/tags", timeout=3).ok
        except Exception:
            win_ok = False
        target = WINDOWS_OLLAMA if win_ok else LOCAL_OLLAMA
        r = requests.post(f"{target}/api/generate", json={
            "model": "llama3.2:3b-instruct-q8_0",
            "prompt": directive,
            "stream": False
        }, timeout=120)
        return {"ok": r.ok, "routed_to": target, "output": r.json().get("response", "")[:3500] if r.ok else r.text[:400]}

    # Default: execute through Hermes CLI
    return run_hermes_cli(directive)

def motor_polling_loop():
    """Background thread polling Base44 Motor Cortex Queue + syncing both hemispheres."""
    log.info(f"Enrolling {NODE_ID} ({PUBLIC_IP} / {TAILSCALE_IP}) in Motor Cortex...")
    call_hemisphere_a({
        "action": "enroll_node",
        "node_id": NODE_ID,
        "public_ip": PUBLIC_IP,
        "tailscale_ip": TAILSCALE_IP,
        "capabilities": ["hermes_29_skills", "subagent_spawner", "zero_llm_scripts", "tailnet_gpu_router"]
    })
    while True:
        try:
            claim = call_hemisphere_a({
                "action": "claim_dispatch_job",
                "worker_node": f"{NODE_ID} ({TAILSCALE_IP})"
            })
            if claim.get("claimed") and claim.get("job"):
                job = claim["job"]
                job_id = job["job_id"]
                log.info(f"[CLAIMED JOB] {job_id}: {job.get('directive')}")
                res = execute_motor_job(job)
                summary = json.dumps(res, indent=2)[:4000]
                call_hemisphere_a({
                    "action": "complete_dispatch_job",
                    "job_id": job_id,
                    "worker_node": f"{NODE_ID} ({TAILSCALE_IP})",
                    "result_summary": summary
                })
                log.info(f"[COMPLETED JOB] {job_id}")
        except Exception as e:
            log.error(f"Motor poll error: {e}")
        time.sleep(POLL_INTERVAL)

# ── FastAPI Fleet Bridge ────────────────────────────────────────
app = FastAPI(title="Hermes 29-Skill & Sub-Agent Sovereign Bridge", version="2.0.0")

class SkillRequest(BaseModel):
    prompt: str
    skill_hint: Optional[str] = None
    timeout: int = 180

class DirectScriptRequest(BaseModel):
    script_path: str
    args: List[str] = []

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "node_id": NODE_ID,
        "public_ip": PUBLIC_IP,
        "tailscale_ip": TAILSCALE_IP,
        "skills_count": 29,
        "subagent_capable": True
    }

@app.post("/agent/run")
def api_run_hermes(req: SkillRequest, x_api_key: str = Header(None)):
    if x_api_key != BRIDGE_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return run_hermes_cli(req.prompt, req.skill_hint, req.timeout)

@app.post("/script/exec")
def api_run_script(req: DirectScriptRequest, x_api_key: str = Header(None)):
    if x_api_key != BRIDGE_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return run_zero_llm_script(req.script_path, req.args)

@app.post("/subagent/spawn")
def api_spawn_subagents(req: SkillRequest, x_api_key: str = Header(None)):
    if x_api_key != BRIDGE_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return spawn_subagent_pipeline(req.prompt)

if __name__ == "__main__":
    t = threading.Thread(target=motor_polling_loop, daemon=True)
    t.start()
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8088")))
`;