/* ==========================================================================
   career-bg.js  —  "Assurance Graph" background for cyberamo.work
   Replaces the fluid WebGL background with a role-themed scene:

   Layer A  #webgl-bg   low-res WebGL "latent field" in the brand palette
                        (charcoal / teal / rust), lit by the cursor, rippled by clicks.
   Layer B  #career-bg  2D knowledge graph. RFx questions drift in from the edges,
                        an orchestrator agent routes them across the graph to
                        evidence / answer-library nodes, and evidence-linked
                        answers travel back to where the question came from.

   Interactions (all passive – the canvases never take pointer events):
   • cursor  = a context window: nearby nodes are "attended" (attention lines)
   • rest the cursor near a node on the empty desktop to read its tag
   • click empty desktop  = dispatch an RFx batch;  3 quick clicks = spread the current
     shape out, or (when spread) form the next shape — cycling through all of them
   • every 40–65 s the mesh settles into a career shape: shield (trust), padlock (lock),
     questionnaire (rfx), magnifier (hunt), terminal (soc), scales (govern), AI chip (chip), flag (ctf),
     holds it for a couple of seconds, then eases back out into an even spread across the desktop
   • type on the desktop (not in inputs): questrix · mcp · hackathon, or any shape name above
     (the same words also work as Terminal commands)

   Performance: pre-rendered glow sprites (no shadowBlur), batched strokes,
   field rendered at ~half resolution / 30 fps, DPR capped, adaptive quality,
   pauses when the tab is hidden, single static frame for reduced motion.
   ========================================================================== */
(() => {
  'use strict';

  const glCanvas = document.getElementById('webgl-bg');
  if (!glCanvas) return;

  let fx = document.getElementById('career-bg');
  if (!fx) {
    fx = document.createElement('canvas');
    fx.id = 'career-bg';
    glCanvas.insertAdjacentElement('afterend', fx);
  }
  fx.setAttribute('aria-hidden', 'true');
  glCanvas.setAttribute('aria-hidden', 'true');
  const ctx = fx.getContext('2d');

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COARSE = window.matchMedia('(pointer: coarse)').matches;

  // Brand palette (Designguide.md)
  const RGB = {
    orange: '196,90,42',   // #C45A2A
    teal: '31,79,85',      // #1F4F55
    tealL: '126,200,200',  // #7EC8C8
    text: '232,239,245',   // #E8EFF5
    lava: '230,32,32'      // #e62020 (sparingly)
  };
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const ease = (x) => x * x * (3 - 2 * x);

  let W = 0, H = 0, DPR = 1;
  let quality = 2;            // 2 = high, 1 = medium, 0 = low (adaptive)
  let time = 0;               // seconds of simulated time

  /* ------------------------------------------------------------------------
     LAYER A — WebGL latent field
     ------------------------------------------------------------------------ */
  const Field = (() => {
    const gl = glCanvas.getContext('webgl', {
      antialias: false, alpha: false, depth: false, stencil: false,
      preserveDrawingBuffer: false, powerPreference: 'low-power'
    });
    const fallback = () => {
      glCanvas.style.background =
        'radial-gradient(60% 50% at 25% 70%, rgba(196,90,42,.35), transparent 70%),' +
        'radial-gradient(55% 55% at 78% 30%, rgba(31,79,85,.55), transparent 70%), #12181A';
      return { ok: false, resize() {}, draw() {}, setScale() {} };
    };
    if (!gl) return fallback();

    const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fs = `
      precision mediump float;
      uniform float u_time;
      uniform vec2  u_res;
      uniform vec3  u_mouse;   // xy uv (y up), z intensity
      uniform vec4  u_ripple;  // xy uv, z age (s), w strength
      uniform float u_energy;  // easter-egg boost 0..1

      float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1.,0.)), u.x),
                   mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), u.x), u.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++){ v += a*noise(p); p = p*2.03 + vec2(1.7, 9.2); a *= 0.5; }
        return v;
      }
      void main(){
        vec2 uv = gl_FragCoord.xy / u_res;
        float asp = u_res.x / u_res.y;
        vec2 p = vec2(uv.x*asp, uv.y);
        float t = u_time * 0.028;

        // click ripple: radial displacement + rim light
        vec2 rc = vec2(u_ripple.x*asp, u_ripple.y);
        vec2 d = p - rc;
        float rd = length(d);
        float ring = u_ripple.w * exp(-pow((rd - u_ripple.z*0.42)*10.0, 2.0)) * exp(-u_ripple.z*1.4);
        p += (d / (rd + 1e-4)) * ring * 0.035;

        // domain-warped latent field (large, slow shapes like the original fluid)
        vec2 q = vec2(fbm(p*1.1 + vec2(0.0, t)), fbm(p*1.1 + vec2(5.2, -t)));
        vec2 r = vec2(fbm(p*0.9 + 1.7*q + vec2(1.7, 9.2) + t*1.2),
                      fbm(p*0.9 + 1.7*q + vec2(8.3, 2.8) - t));
        float f = fbm(p*0.8 + 1.9*r);

        vec3 deep     = vec3(0.039, 0.059, 0.078); // #0A0F14
        vec3 charcoal = vec3(0.071, 0.094, 0.102); // #12181A
        vec3 teal     = vec3(0.122, 0.310, 0.333); // #1F4F55
        vec3 slate    = vec3(0.290, 0.330, 0.350);
        vec3 orange   = vec3(0.769, 0.353, 0.165); // #C45A2A
        vec3 brick    = vec3(0.420, 0.090, 0.050); // #6C180D

        vec3 col = mix(charcoal, teal, smoothstep(0.22, 0.52, q.y) * 0.95);
        col = mix(col, deep,   smoothstep(0.55, 0.75, 1.0 - f) * 0.45);
        col = mix(col, slate,  smoothstep(0.50, 0.75, f) * 0.38);
        col = mix(col, brick,  smoothstep(0.38, 0.60, r.x) * 0.6);
        col = mix(col, orange, smoothstep(0.48, 0.74, r.x) * 0.8);
        col = mix(col, vec3(0.90, 0.12, 0.12), smoothstep(0.82, 0.96, r.x) * 0.12); // rare lava

        // cursor light (soft warm light under the glass)
        vec2 m = vec2(u_mouse.x*asp, u_mouse.y);
        float g = exp(-dot(p-m, p-m) * 9.0) * u_mouse.z;
        col += orange * g * 0.16 + vec3(0.49, 0.78, 0.78) * g * 0.035;

        col *= 0.92;
        col += orange * ring * 0.22;
        col *= 1.0 + u_energy * 0.22;

        // vignette + fine grain
        vec2 v = uv - 0.5;
        col *= 1.0 - dot(v, v) * 0.7;
        col += (hash(gl_FragCoord.xy + fract(u_time*7.0)*91.0) - 0.5) * 0.028;

        gl_FragColor = vec4(col, 1.0);
      }`;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn('[career-bg]', gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fallback();
    gl.useProgram(prog);

    // one oversized triangle covers the viewport
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {
      time: gl.getUniformLocation(prog, 'u_time'),
      res: gl.getUniformLocation(prog, 'u_res'),
      mouse: gl.getUniformLocation(prog, 'u_mouse'),
      ripple: gl.getUniformLocation(prog, 'u_ripple'),
      energy: gl.getUniformLocation(prog, 'u_energy')
    };

    let scale = 0.5, lost = false;
    glCanvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; });

    return {
      ok: true,
      setScale(s) { scale = s; this.resize(); },
      resize() {
        // The field is soft; rendering at ~half resolution is visually identical
        // and 4x cheaper than the old full-DPR shader.
        glCanvas.width = Math.max(2, Math.round(W * scale));
        glCanvas.height = Math.max(2, Math.round(H * scale));
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      },
      draw(t, mouse, ripple, energy) {
        if (lost) return;
        gl.uniform1f(U.time, t);
        gl.uniform2f(U.res, glCanvas.width, glCanvas.height);
        gl.uniform3f(U.mouse, mouse.x / W, 1 - mouse.y / H, mouse.k);
        gl.uniform4f(U.ripple, ripple.x / W, 1 - ripple.y / H, ripple.age, ripple.k);
        gl.uniform1f(U.energy, energy);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  })();

  /* ------------------------------------------------------------------------
     LAYER B — assurance graph
     ------------------------------------------------------------------------ */

  // Node tags double as quiet hints about the work.
  const TAGS = {
    // evidence a trust / RFx team hands over: attestations, certificates, standard questionnaires, contracts
    doc: ['evidence://soc2-type-ii.pdf', 'evidence://iso27001-certificate.pdf', 'evidence://pentest-summary.pdf',
          'evidence://bcp-dr-plan.pdf', 'evidence://subprocessors.xlsx', 'evidence://encryption-policy.pdf',
          'evidence://isae3402-report.pdf', 'evidence://gdpr-toms.pdf', 'trust.center/nda-gated',
          'evidence://ai-use-policy.pdf', 'evidence://soc1-type-ii.pdf', 'evidence://soc3-report.pdf',
          'evidence://soc2-bridge-letter.pdf', 'evidence://iso27701-cert.pdf', 'evidence://iso42001-cert.pdf',
          'evidence://csa-star-level2.pdf', 'evidence://caiq-v4.xlsx', 'evidence://sig-lite.xlsx', 'evidence://sig-core.xlsx',
          'evidence://vsa-core.xlsx', 'evidence://hecvat-full.xlsx', 'evidence://pci-dss-aoc.pdf', 'evidence://pci-saq-d.pdf',
          'evidence://hipaa-baa.pdf', 'evidence://dpa-template.pdf', 'evidence://eu-sccs.pdf', 'evidence://tia-assessment.pdf',
          'evidence://dpia.pdf', 'evidence://incident-response-plan.pdf', 'evidence://network-diagram.pdf',
          'evidence://data-flow-diagram.pdf', 'evidence://sbom.json', 'evidence://vpat-wcag.pdf', 'evidence://cyber-insurance.pdf',
          'evidence://sla-uptime.pdf', 'evidence://esg-report.pdf', 'evidence://code-of-conduct.pdf',
          'evidence://modern-slavery.pdf', 'evidence://fedramp-ato.pdf', 'evidence://cyber-essentials-plus.pdf'],
    // answer library, FAQs and the vocabulary of RFP / RFQ / RFI / DDQ work
    kb:  ['faq://hosting-region', 'faq://data-retention', 'faq://sso-saml', 'faq://backup-rpo-rto',
          'faq://access-control', 'library://approved-answers', 'faq://vuln-management',
          'faq://incident-response', 'ddq://section-7.3', 'rfp://security-annex', 'skill://customgpt-builder',
          'prompt://context-engineering', 'ctx://200k-tokens', 'faq://mfa-enforcement', 'faq://encryption-at-rest',
          'faq://tls-1.2-in-transit', 'faq://key-management-kms', 'faq://data-residency', 'faq://subprocessor-notice',
          'faq://breach-notification-72h', 'faq://log-retention', 'faq://patch-sla', 'faq://background-checks',
          'faq://security-awareness', 'faq://secure-sdlc', 'faq://ai-training-opt-out', 'faq://data-deletion',
          'faq://right-to-audit', 'faq://uptime-sla-99.9', 'faq://insurance-limits', 'faq://accessibility-wcag',
          'faq://physical-security', 'faq://third-party-risk', 'faq://change-management', 'rfp://executive-summary',
          'rfp://compliance-matrix', 'rfp://pricing-schedule', 'rfp://win-themes', 'rfp://clarification-q&a',
          'rfp://go-no-go', 'rfp://mandatory-requirements', 'rfp://contract-redlines', 'rfq://line-item-pricing',
          'rfq://delivery-terms', 'rfi://company-overview', 'rfi://capability-statement', 'ddq://esg-section',
          'ddq://financial-stability', 'saq://pci-scope', 'library://content-owner-review', 'library://stale-answer-flag',
          'library://boilerplate', 'questionnaire://caiq-cloud', 'questionnaire://sig-lite', 'questionnaire://hecvat-lite'],
    // departments that get pulled in to answer about the company and its products
    sme: ['sme://infosec', 'sme://privacy', 'sme://legal', 'sme://engineering', 'sme://product', 'sme://it-ops',
          'sme://grc', 'sme://compliance', 'sme://security-architecture', 'sme://soc', 'sme://cloud-ops',
          'sme://devops-sre', 'sme://dpo', 'sme://risk-management', 'sme://internal-audit', 'sme://ai-governance',
          'sme://data-science', 'sme://qa', 'sme://business-continuity', 'sme://facilities', 'sme://hr',
          'sme://finance', 'sme://procurement', 'sme://contracts', 'sme://pricing', 'sme://sales-engineering',
          'sme://solutions-architecture', 'sme://customer-success', 'sme://support', 'sme://proposal-management',
          'sme://esg-sustainability', 'sme://accessibility'],
    agent: ['agent://questrix  (say my name)']
  };
  const WHISPERS_EXTRA = ['mcp://answer-library  tools/list', 'rfx://queue  0 overdue', 'human-in-the-loop://sme-review',
    'rfp://due  friday 17:00', 'go-no-go://bid-review  approved', 'sme-review://2 approvals pending',
    'library://answer-reuse  87%', 'rfq://pricing  → sme://finance', 'sig-lite://412/412 answered'];

  const nodes = [];
  let LINK = 160, CTX_R = 130, MAX_DEG = 3;
  const adj = [];              // adjacency lists (rebuilt each frame)
  const pairs = [];            // candidate links scratch
  let agent = null;

  const flights = [];          // free-flying questions (q) / answers (a)
  const packets = [];          // retrieval packets that hop along graph edges
  const sparks = [];
  const ripples = [];
  const labels = [];           // floating mono captions
  const queue = [];            // scheduled callbacks {at, fn}

  const pointer = { x: -9999, y: -9999, active: false, onBg: false, lastMove: -99, still: 0, k: 0 };
  const fieldRipple = { x: 0, y: 0, age: 9, k: 0 };
  let energy = 0;
  let formation = null;        // {name, until, weight}
  let disperse = null;         // {t0, dur} nodes spreading back out after a shape
  let hub = null;              // mcp spokes {until, ids}
  let tag = null;              // hover / whisper tag
  let nextWhisper = 6;
  let nextQuestion = 1.2;
  let answered = 0;

  // ---- glow sprites (cheap replacement for shadowBlur) ----
  const sprite = (rgb, size) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gr.addColorStop(0, `rgba(${rgb},1)`);
    gr.addColorStop(0.22, `rgba(${rgb},.42)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, size, size);
    return c;
  };
  const GLOW = { orange: sprite(RGB.orange, 128), teal: sprite(RGB.tealL, 96), white: sprite(RGB.text, 64) };
  const glow = (img, x, y, r, a) => {
    if (a <= 0.003) return;
    ctx.globalAlpha = a;
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  };

  const MONO = '"Fira Code", "JetBrains Mono", monospace';

  function makeNode(type, x, y) {
    return {
      type, x, y, vx: 0, vy: 0, glow: 0, phase: Math.random() * TAU,
      tag: type === 'agent' ? TAGS.agent[0] : pick(TAGS[type]),
      tx: x, ty: y, att: 0
    };
  }

  function nodeBudget() {
    const area = W * H;
    let n = Math.round(area / 19500);
    n = clamp(n, COARSE || W < 700 ? 24 : 34, 78);
    if (quality === 1) n = Math.round(n * 0.8);
    if (quality === 0) n = Math.round(n * 0.6);
    return n;
  }

  function seedGraph() {
    nodes.length = 0;
    const n = nodeBudget();
    agent = makeNode('agent', W * 0.5, H * 0.55);
    nodes.push(agent);
    // jittered grid seeding gives an even, calm distribution
    const cols = Math.ceil(Math.sqrt((n - 1) * W / H));
    const rows = Math.ceil((n - 1) / cols);
    const cw = W / cols, rh = H / rows;
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols && i < n - 1; c++, i++) {
        const roll = Math.random();
        const type = roll < 0.32 ? 'doc' : roll < 0.82 ? 'kb' : 'sme';
        nodes.push(makeNode(type, (c + rand(0.2, 0.8)) * cw, (r + rand(0.2, 0.8)) * rh));
      }
    }
    adj.length = 0;
    for (let k = 0; k < nodes.length; k++) adj.push([]);
  }

  function resize() {
    const oldW = W, oldH = H;
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, quality === 2 ? 2 : quality === 1 ? 1.5 : 1);
    fx.width = Math.round(W * DPR);
    fx.height = Math.round(H * DPR);
    Field.resize();

    const spacing = Math.sqrt((W * H) / nodeBudget());
    LINK = clamp(spacing * 1.38, 95, 200);
    CTX_R = COARSE ? 95 : clamp(Math.min(W, H) * 0.16, 110, 150);

    if (formation) formation.until = time; // shape targets are in old coordinates: let it dissolve
    if (!oldW || Math.abs(nodes.length - nodeBudget()) > 6) seedGraph();
    else {
      const sx = W / oldW, sy = H / oldH;
      for (const n of nodes) { n.x *= sx; n.y *= sy; }
    }
    if (REDUCED) renderStatic();
  }

  /* ---------------- graph helpers ---------------- */

  function rebuildLinks() {
    const n = nodes.length, L2 = LINK * LINK;
    pairs.length = 0;
    for (let i = 0; i < n; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < n; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < L2) pairs.push(d2, i, j);
      }
    }
    // shortest links first, capped degree keeps the mesh airy
    const idx = [];
    for (let k = 0; k < pairs.length; k += 3) idx.push(k);
    idx.sort((p, q) => pairs[p] - pairs[q]);
    for (let k = 0; k < n; k++) adj[k].length = 0;
    const edges = [];
    for (const k of idx) {
      const i = pairs[k + 1], j = pairs[k + 2];
      const capI = i === 0 ? 6 : MAX_DEG, capJ = MAX_DEG;
      if (adj[i].length < capI && adj[j].length < capJ) {
        adj[i].push(j); adj[j].push(i);
        edges.push(i, j, Math.sqrt(pairs[k]));
      }
    }
    return edges;
  }

  function bfsFromAgent() {
    const depth = new Int16Array(nodes.length).fill(-1);
    const prev = new Int16Array(nodes.length).fill(-1);
    const q = [0];
    depth[0] = 0;
    for (let h = 0; h < q.length; h++) {
      const u = q[h];
      for (const v of adj[u]) if (depth[v] < 0) { depth[v] = depth[u] + 1; prev[v] = u; q.push(v); }
    }
    return { depth, prev };
  }

  function routeToEvidence() {
    const { depth, prev } = bfsFromAgent();
    const cand = [];
    for (let i = 1; i < nodes.length; i++) {
      const t = nodes[i].type;
      if (depth[i] >= 1 && depth[i] <= 5 && (t === 'doc' || t === 'kb')) cand.push(i);
    }
    let target;
    if (cand.length) {
      const docs = cand.filter((i) => nodes[i].type === 'doc');
      target = docs.length && Math.random() < 0.7 ? pick(docs) : pick(cand);
      const path = [];
      for (let v = target; v >= 0; v = prev[v]) path.push(v);
      return path.reverse();
    }
    // graph fragmented: fly straight to the nearest evidence node
    let best = -1, bd = Infinity;
    for (let i = 1; i < nodes.length; i++) {
      if (nodes[i].type !== 'doc') continue;
      const d = (nodes[i].x - agent.x) ** 2 + (nodes[i].y - agent.y) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return best > 0 ? [0, best] : null;
  }

  function edgePoint() {
    const side = (Math.random() * 4) | 0, m = 14;
    if (side === 0) return { x: rand(0, W), y: -m };
    if (side === 1) return { x: W + m, y: rand(0, H) };
    if (side === 2) return { x: rand(0, W), y: H + m };
    return { x: -m, y: rand(0, H) };
  }

  /* ---------------- the RFx pipeline ---------------- */

  const MAX_FLOWS = 46;

  function spawnQuestion(ox, oy, batch, speed = 1) {
    if (flights.length + packets.length > MAX_FLOWS) return false;
    flights.push({
      kind: 'q', sx: ox, sy: oy, t: 0, dur: rand(2.3, 3.4) / speed,
      bend: rand(-0.32, 0.32), origin: { x: ox, y: oy }, batch
    });
    return true;
  }

  function onQuestionArrive(f) {
    agent.glow = 1;
    const path = routeToEvidence();
    if (!path) return;
    packets.push({ path, seg: 0, prog: 0, speed: rand(170, 240), origin: f.origin, batch: f.batch });
  }

  function onPacketDone(p) {
    const id = p.path[p.path.length - 1];
    const n = nodes[id];
    n.glow = 1;
    if (p.tool) return; // mcp tool call: no answer flight
    flights.push({
      kind: 'a', from: id, ex: p.origin.x, ey: p.origin.y, t: 0,
      dur: rand(1.8, 2.6), bend: rand(-0.3, 0.3), batch: p.batch
    });
  }

  function onAnswerArrive(f) {
    answered++;
    if (f.ex > 0 && f.ex < W && f.ey > 0 && f.ey < H) ripples.push({ x: f.ex, y: f.ey, age: 0, life: 0.9, rgb: RGB.tealL, r: 26 });
    const b = f.batch;
    if (b && ++b.done === b.total && b.caption) {
      labels.push({ x: b.x, y: b.y + 22, text: `✓ ${b.done}/${b.total} answered · evidence-linked`, age: 0, life: 3.2, rgb: RGB.tealL });
    }
  }

  function dispatchAt(x, y) {
    const total = 3 + ((Math.random() * 3) | 0);
    const batch = { x, y, total, done: 0, caption: true };
    ripples.push({ x, y, age: 0, life: 1.3, rgb: RGB.orange, r: 120 });
    fieldRipple.x = x; fieldRipple.y = y; fieldRipple.age = 0; fieldRipple.k = 1;
    labels.push({ x, y: y - 20, text: `rfx batch · ${total} questions → agent`, age: 0, life: 2.2, rgb: RGB.orange });
    for (let i = 0; i < total; i++) {
      queue.push({ at: time + i * 0.14, fn: () => { if (!spawnQuestion(x, y, batch, 1.25)) batch.total--; } });
    }
  }

  /* ---------------- career shapes ----------------
     Every so often (and on demand via the eggs below) the mesh settles into a
     motif from the work: each shape is a set of strokes in unit space
     (x ≈ -0.5..0.5, y ≈ -0.6..0.6, y down). Nodes spread evenly along the
     strokes, a faint contour completes the outline on sparse meshes, and the
     agent parks on the shape's anchor. */

  const seg2 = (x0, y0, x1, y1) => [[x0, y0], [x1, y1]];
  const poly = (...xy) => { const p = []; for (let i = 0; i < xy.length; i += 2) p.push([xy[i], xy[i + 1]]); return p; };
  const closed = (p) => p.concat([p[0]]);
  const arc = (cx, cy, r, a0, a1, n = 24) => {
    const p = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return p;
  };
  const quad = (x0, y0, cx, cy, x1, y1, n = 14) => {
    const p = [];
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; p.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]); }
    return p;
  };
  const rrect = (x, y, w, h, r) => closed([
    ...arc(x + w - r, y + r, r, -Math.PI / 2, 0, 5), ...arc(x + w - r, y + h - r, r, 0, Math.PI / 2, 5),
    ...arc(x + r, y + h - r, r, Math.PI / 2, Math.PI, 5), ...arc(x + r, y + r, r, Math.PI, Math.PI * 1.5, 5)
  ]);
  const tick = (x, y) => poly(x, y, x + 0.05, y + 0.05, x + 0.13, y - 0.06);

  const SHAPES = {
    // customer assurance / trust center
    trust: { anchor: [0, 0], strokes: [
      closed([...poly(-0.42, -0.46, 0, -0.56, 0.42, -0.46, 0.42, 0.04),
        ...quad(0.42, 0.04, 0.40, 0.40, 0, 0.60).slice(1), ...quad(0, 0.60, -0.40, 0.40, -0.42, 0.04).slice(1)]),
      poly(-0.18, 0, -0.05, 0.14, 0.20, -0.16)
    ] },
    // information security
    lock: { anchor: [0, 0.16], strokes: [
      rrect(-0.36, -0.04, 0.72, 0.58, 0.07),
      [[-0.22, -0.04], ...arc(0, -0.24, 0.22, Math.PI, Math.PI * 2, 20), [0.22, -0.04]],
      arc(0, 0.16, 0.06, 0, Math.PI * 2, 12),
      seg2(0, 0.22, 0, 0.38)
    ] },
    // security questionnaires / RFx / due diligence
    rfx: { anchor: [0.2, 0.4], strokes: [
      closed(poly(-0.34, -0.52, 0.18, -0.52, 0.34, -0.36, 0.34, 0.52, -0.34, 0.52)),
      poly(0.18, -0.52, 0.18, -0.36, 0.34, -0.36),
      ...[-0.24, 0, 0.24].flatMap((y) => [tick(-0.25, y), seg2(-0.04, y, 0.22, y)])
    ] },
    // threat hunting / OSINT
    hunt: { anchor: [-0.1, -0.12], strokes: [
      arc(-0.1, -0.12, 0.34, 0, Math.PI * 2, 40),
      arc(-0.1, -0.12, 0.24, Math.PI * 1.1, Math.PI * 1.45, 8),
      seg2(0.14, 0.12, 0.44, 0.44)
    ] },
    // security operations / the terminal
    soc: { anchor: [0.08, 0.14], strokes: [
      rrect(-0.52, -0.36, 1.04, 0.72, 0.06),
      seg2(-0.52, -0.2, 0.52, -0.2),
      [[-0.43, -0.28]], [[-0.36, -0.28]], [[-0.29, -0.28]],
      poly(-0.36, -0.06, -0.2, 0.04, -0.36, 0.14),
      seg2(-0.12, 0.14, 0.04, 0.14)
    ] },
    // GRC / AI governance
    govern: { anchor: [0, -0.34], strokes: [
      arc(0, -0.44, 0.05, 0, Math.PI * 2, 10),
      seg2(0, -0.39, 0, 0.46),
      seg2(-0.24, 0.46, 0.24, 0.46),
      seg2(-0.44, -0.34, 0.44, -0.34),
      poly(-0.57, 0.04, -0.44, -0.34, -0.31, 0.04),
      poly(0.31, 0.04, 0.44, -0.34, 0.57, 0.04),
      quad(-0.59, 0.04, -0.44, 0.26, -0.29, 0.04),
      quad(0.29, 0.04, 0.44, 0.26, 0.59, 0.04)
    ] },
    // AI enablement
    chip: { anchor: [0, 0], strokes: [
      rrect(-0.3, -0.3, 0.6, 0.6, 0.05),
      rrect(-0.13, -0.13, 0.26, 0.26, 0.03),
      ...[-0.18, -0.06, 0.06, 0.18].flatMap((t) => [seg2(t, -0.3, t, -0.44), seg2(t, 0.3, t, 0.44), seg2(-0.3, t, -0.44, t), seg2(0.3, t, 0.44, t)])
    ] },
    // capture the flag
    ctf: { anchor: [-0.3, -0.44], strokes: [
      seg2(-0.3, -0.44, -0.3, 0.58),
      seg2(-0.44, 0.58, -0.16, 0.58),
      [...quad(-0.3, -0.44, 0.06, -0.58, 0.42, -0.4), [0.42, -0.04], ...quad(0.42, -0.04, 0.06, -0.2, -0.3, -0.08).slice(1)]
    ] }
  };

  function assign(targets) {
    // map free nodes onto target points: sort both by angle around the centroid
    const free = nodes.slice(1);
    const cx = W / 2, cy = H * 0.56;
    const byAng = (p) => Math.atan2(p.y - cy, p.x - cx);
    free.sort((a, b) => byAng(a) - byAng(b));
    const tg = targets.slice(0, free.length).sort((a, b) => byAng(a) - byAng(b));
    free.forEach((n, i) => {
      const t = tg[i % tg.length];
      n.tx = t.x + rand(-2, 2); n.ty = t.y + rand(-2, 2);
    });
  }

  function sampleStrokes(strokes, count) {
    // dots get a node each; the rest are spaced evenly along the total stroke length
    const pts = [], segs = [];
    let total = 0;
    for (const st of strokes) {
      if (st.length === 1) { pts.push(st[0]); continue; }
      for (let i = 1; i < st.length; i++) {
        const a = st[i - 1], b = st[i], l = Math.hypot(b.x - a.x, b.y - a.y);
        if (l > 0) { segs.push({ a, b, l }); total += l; }
      }
    }
    const step = total / Math.max(1, count - pts.length);
    let next = step / 2, acc = 0;
    for (const { a, b, l } of segs) {
      while (next <= acc + l && pts.length < count) {
        const t = (next - acc) / l;
        pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        next += step;
      }
      acc += l;
    }
    return pts;
  }

  let nextShape = rand(20, 30);
  let shapeBag = [], lastShape = '';
  function nextShapeName() {
    if (!shapeBag.length) {
      shapeBag = Object.keys(SHAPES).sort(() => Math.random() - 0.5);
      if (shapeBag[0] === lastShape) shapeBag.push(shapeBag.shift());
    }
    return (lastShape = shapeBag.shift());
  }

  function scatter() {
    // after a shape: give every node a fresh spot on an evenly spread, jittered grid
    // across the whole desktop and ease it there (see `disperse` in step)
    const count = nodes.length - 1, mg = 32;
    const cols = Math.ceil(Math.sqrt(count * W / H)), rows = Math.ceil(count / cols);
    const cw = (W - 2 * mg) / cols, rh = (H - 2 * mg) / rows;
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ x: mg + (c + rand(0.2, 0.8)) * cw, y: mg + (r + rand(0.2, 0.8)) * rh });
    cells.sort(() => Math.random() - 0.5);
    assign(cells.slice(0, count));
    disperse = { t0: time, dur: 3.6 };
  }

  function formShape(name, dur = 4.2) {
    const def = SHAPES[name];
    const s = Math.min(W * 0.62, H * 0.40), cx = W / 2, cy = H * 0.56;
    const P = ([x, y]) => ({ x: cx + x * s, y: cy + y * s });
    const strokes = def.strokes.map((st) => st.map(P));
    formation = { name, until: time + dur, w: formation ? formation.w : 0, strokes, anchor: P(def.anchor), scattered: false };
    disperse = null;
    assign(sampleStrokes(strokes, nodes.length - 1));
    nextShape = rand(40, 65);
  }

  /* ---------------- easter eggs ---------------- */

  const EGGS = {
    questrix() {
      energy = 1;
      for (let i = 0; i < 18; i++) queue.push({ at: time + i * 0.13, fn: () => { const p = edgePoint(); spawnQuestion(p.x, p.y, null, 1.6); } });
    },
    mcp() {
      energy = 0.7;
      const ids = nodes.map((n, i) => i).filter((i) => i && nodes[i].type !== 'sme')
        .sort(() => Math.random() - 0.5).slice(0, 14);
      hub = { until: time + 5.5, ids };
      ids.forEach((id, k) => queue.push({ at: time + 0.4 + k * 0.12, fn: () => packets.push({ path: [0, id], seg: 0, prog: 0, speed: 420, tool: true, origin: agent }) }));
    },
    hackathon() {
      energy = 1;
      agent.glow = 1;
      for (let i = 0; i < 70; i++) {
        const a = Math.random() * TAU, v = rand(60, 330);
        sparks.push({ x: agent.x, y: agent.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: rand(1.1, 2.2),
          rgb: pick([RGB.orange, RGB.orange, RGB.tealL, RGB.text]) });
      }
      ripples.push({ x: agent.x, y: agent.y, age: 0, life: 1.4, rgb: RGB.orange, r: 180 });
    }
  };
  // every career shape is also an egg: trust · lock · rfx · hunt · soc · govern · chip · ctf
  for (const name of Object.keys(SHAPES)) EGGS[name] = () => formShape(name);
  function triggerEgg(name) {
    if (REDUCED || !EGGS[name]) return false;
    EGGS[name]();
    return true;
  }

  /* ---------------- input ---------------- */

  const BG_SEL = '.desktop, .main-content, .content-area, #webgl-bg, #career-bg';
  const isBackground = (el) => !el || el === document.body || el === document.documentElement || (el.matches && el.matches(BG_SEL));

  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    pointer.active = true;
    pointer.onBg = isBackground(e.target);
    pointer.lastMove = time;
    pointer.still = 0;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });
  window.addEventListener('blur', () => { pointer.active = false; });
  window.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') setTimeout(() => { pointer.active = false; }, 1200); }, { passive: true });

  // several quick clicks on the empty desktop flip between a career shape and the open
  // spread: in a shape they spread it out, when spread they form the next shape in the cycle
  const CLICKS_TO_TOGGLE = 3, CLICK_WINDOW = 1.5;
  let clickTimes = [];
  function toggleShape() {
    if (formation && !formation.scattered) formation.until = time; // step() scatters it
    else formShape(nextShapeName());
  }

  document.addEventListener('click', (e) => {
    if (REDUCED || !isBackground(e.target)) return;
    if (document.getElementById('bootScreen') && !document.getElementById('bootScreen').classList.contains('hidden')) return;
    const now = performance.now() / 1000;
    clickTimes = clickTimes.filter((t) => now - t < CLICK_WINDOW);
    clickTimes.push(now);
    if (clickTimes.length >= CLICKS_TO_TOGGLE) {
      clickTimes = [];
      ripples.push({ x: e.clientX, y: e.clientY, age: 0, life: 1.1, rgb: RGB.tealL, r: 90 });
      toggleShape();
      return;
    }
    dispatchAt(e.clientX, e.clientY);
  });

  let keyBuf = '';
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    keyBuf = (keyBuf + e.key.toLowerCase()).slice(-12);
    for (const name of Object.keys(EGGS)) {
      if (keyBuf.endsWith(name)) { triggerEgg(name); keyBuf = ''; break; }
    }
  });

  // tiny public API (used by the Terminal: `questrix`, `mcp`, `hackathon` and the shape names)
  window.CareerBG = {
    eggs: () => Object.keys(EGGS),
    has: (name) => Object.prototype.hasOwnProperty.call(EGGS, name),
    trigger: triggerEgg,
    stats: () => ({ frameMs: +ema.toFixed(1), scriptMs: +jsMs.toFixed(2), quality, nodes: nodes.length })
  };

  /* ---------------- simulation ---------------- */

  function flowAngle(x, y, t) {
    return (Math.sin(x * 0.0021 + t * 0.07) + Math.cos(y * 0.0017 - t * 0.05) + Math.sin((x + y) * 0.0009 + t * 0.031)) * 1.35;
  }

  function step(dt) {
    time += dt;
    energy = Math.max(0, energy - dt * 0.35);
    fieldRipple.age += dt;
    if (fieldRipple.age > 3) fieldRipple.k = 0;

    // pointer "presence" (fades when idle / off-screen)
    const present = pointer.active && time - pointer.lastMove < 5;
    pointer.k += ((present ? 1 : 0) - pointer.k) * Math.min(1, dt * 3);
    pointer.still += dt;

    // scheduled events
    for (let i = queue.length - 1; i >= 0; i--) if (queue[i].at <= time) { const q = queue[i]; queue.splice(i, 1); q.fn(); }

    // formation weight
    if (formation) {
      const target = time < formation.until ? 1 : 0;
      formation.w += (target - formation.w) * Math.min(1, dt * 2.4);
      // the shape has held for a moment: spread the nodes back out across the desktop
      if (!target && !formation.scattered) { formation.scattered = true; scatter(); }
      if (!target && formation.w < 0.02) formation = null;
    }
    if (disperse && time > disperse.t0 + disperse.dur) disperse = null;
    if (hub && time > hub.until) hub = null;

    // every so often the mesh settles into a career shape on its own
    if (!formation && !disperse && !hub) {
      nextShape -= dt;
      if (nextShape <= 0) formShape(nextShapeName());
    }

    // agent: slow Lissajous tour so it isn't always hidden behind a window;
    // during a shape it parks on the shape's anchor
    const anchor = formation && !formation.scattered && formation.anchor;
    const hubMode = hub || anchor;
    const ax = anchor ? anchor.x : hub ? W * 0.5 : W * (0.5 + 0.3 * Math.sin(time * 0.043));
    const ay = anchor ? anchor.y : hub ? H * 0.55 : H * (0.54 + 0.2 * Math.sin(time * 0.067 + 1.2));
    agent.x += (ax - agent.x) * Math.min(1, dt * (hubMode ? 1.6 : 0.35));
    agent.y += (ay - agent.y) * Math.min(1, dt * (hubMode ? 1.6 : 0.35));
    agent.glow = Math.max(0, agent.glow - dt * 0.9);

    const fw = formation ? ease(clamp(formation.w, 0, 1)) : 0;
    const shapePull = formation && !formation.scattered ? fw : 0;
    // disperse weight: eases in, holds, then eases out so the normal drift takes over seamlessly
    let dw = 0;
    if (disperse) {
      const p = (time - disperse.t0) / disperse.dur;
      dw = ease(clamp(p / 0.2, 0, 1)) * (1 - ease(clamp((p - 0.6) / 0.4, 0, 1)));
    }
    const sep = LINK * 0.5, sep2 = sep * sep;
    const R = CTX_R, R2 = R * R;
    const attend = pointer.k > 0.05 && pointer.onBg;

    for (let i = 1; i < nodes.length; i++) {
      const n = nodes[i];
      // gentle flow field drift
      const a = flowAngle(n.x, n.y, time);
      n.vx += (Math.cos(a) * 7 - n.vx) * Math.min(1, dt * 0.8);
      n.vy += (Math.sin(a) * 7 - n.vy) * Math.min(1, dt * 0.8);

      // separation keeps the mesh evenly spread
      if (fw < 0.5) {
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x, dy = n.y - m.y, d2 = dx * dx + dy * dy;
          if (d2 < sep2 && d2 > 0.01) {
            const d = Math.sqrt(d2), f = (1 - d / sep) * 22 * dt;
            n.vx += (dx / d) * f; n.vy += (dy / d) * f;
            m.vx -= (dx / d) * f; m.vy -= (dy / d) * f;
          }
        }
      }

      // soft bounds
      const mg = 24;
      if (n.x < mg) n.vx += (mg - n.x) * dt * 2; else if (n.x > W - mg) n.vx -= (n.x - (W - mg)) * dt * 2;
      if (n.y < mg) n.vy += (mg - n.y) * dt * 2; else if (n.y > H - mg) n.vy -= (n.y - (H - mg)) * dt * 2;

      // attention: nodes inside the cursor's context window lean in slightly
      n.att = 0;
      if (attend) {
        const dx = pointer.x - n.x, dy = pointer.y - n.y, d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1;
          n.att = (1 - d / R) * pointer.k;
          const pull = n.att * 16 * dt;
          n.vx += (dx / d) * pull; n.vy += (dy / d) * pull;
        }
      }

      n.vx *= 1 - Math.min(1, dt * 0.6);
      n.vy *= 1 - Math.min(1, dt * 0.6);
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      const pull = shapePull > 0 ? Math.min(1, dt * 3.2) * shapePull : dw > 0 ? Math.min(1, dt * 1.7) * dw : 0;
      if (pull > 0) {
        n.x += (n.tx - n.x) * pull;
        n.y += (n.ty - n.y) * pull;
      }
      n.glow = Math.max(0, n.glow - dt * 0.7);
    }

    // ambient questions
    nextQuestion -= dt;
    if (nextQuestion <= 0) {
      const p = edgePoint();
      spawnQuestion(p.x, p.y, null);
      nextQuestion = rand(2.6, 4.4);
    }

    // flights
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i];
      f.t += dt / f.dur;
      if (f.t >= 1) {
        flights.splice(i, 1);
        if (f.kind === 'q') onQuestionArrive(f); else onAnswerArrive(f);
      }
    }
    // packets
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      const a = nodes[p.path[p.seg]], b = nodes[p.path[p.seg + 1]];
      if (!a || !b) { packets.splice(i, 1); continue; }
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      p.prog += p.speed * dt;
      if (p.prog >= len) {
        p.seg++; p.prog = 0;
        nodes[p.path[p.seg]].glow = Math.max(nodes[p.path[p.seg]].glow, 0.45);
        if (p.seg >= p.path.length - 1) { packets.splice(i, 1); onPacketDone(p); }
      }
    }
    // sparks, ripples, labels
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.age += dt;
      s.vx *= 1 - Math.min(1, dt * 1.6); s.vy *= 1 - Math.min(1, dt * 1.6);
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.age > s.life) sparks.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) if ((ripples[i].age += dt) > ripples[i].life) ripples.splice(i, 1);
    for (let i = labels.length - 1; i >= 0; i--) if ((labels[i].age += dt) > labels[i].life) labels.splice(i, 1);

    updateTag(dt);
  }

  /* ---------------- tags (hover + ambient whispers) ---------------- */

  function underUI(x, y) {
    const el = document.elementFromPoint(x, y);
    return !isBackground(el);
  }

  function updateTag(dt) {
    // hover: rest the cursor near a node on the empty desktop
    if (pointer.onBg && pointer.k > 0.5 && pointer.still > 0.45) {
      let best = null, bd = 70 * 70;
      for (const n of nodes) {
        const d = (n.x - pointer.x) ** 2 + (n.y - pointer.y) ** 2;
        if (d < bd) { bd = d; best = n; }
      }
      if (best && (!tag || tag.node !== best)) tag = { node: best, text: best.tag, age: 0, life: 6, hover: true };
    }
    if (tag) {
      tag.age += dt;
      const n = tag.node;
      const far = tag.hover && ((n.x - pointer.x) ** 2 + (n.y - pointer.y) ** 2 > 110 * 110 || !pointer.onBg);
      if (far && tag.life - tag.age > 0.5) tag.age = tag.life - 0.5;
      if (tag.age > tag.life) tag = null;
    }
    // ambient whisper: occasionally a node reveals its tag on an uncovered patch of desktop
    nextWhisper -= dt;
    if (!tag && nextWhisper <= 0) {
      nextWhisper = rand(8, 13);
      for (let tries = 0; tries < 6; tries++) {
        const n = nodes[(Math.random() * nodes.length) | 0];
        if (n.x < 60 || n.x > W - 240 || n.y < 90 || n.y > H - 120) continue;
        if (underUI(n.x, n.y) || underUI(n.x + 120, n.y - 16)) continue;
        const text = n.type !== 'agent' && Math.random() < 0.15 ? pick(WHISPERS_EXTRA) : n.tag;
        tag = { node: n, text, age: 0, life: 4, hover: false };
        break;
      }
    }
  }

  /* ---------------- rendering ---------------- */

  const qb = (a, c, b, t) => {
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
  };
  const ctrl = (s, e, bend) => {
    const mx = (s[0] + e[0]) / 2, my = (s[1] + e[1]) / 2;
    const dx = e[0] - s[0], dy = e[1] - s[1];
    return [mx - dy * bend, my + dx * bend];
  };

  function flightEnds(f) {
    if (f.kind === 'q') return [[f.sx, f.sy], [agent.x, agent.y]];
    const n = nodes[f.from] || agent;
    return [[n.x, n.y], [f.ex, f.ey]];
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';

    const edges = rebuildLinks();
    const fw = formation ? formation.w : 0;
    // while a career shape holds, its contour carries the outline and the random mesh links recede
    const edgeBoost = (1 + energy * 0.6) * (1 - fw * 0.7);

    // ---- edges, batched into 4 alpha buckets ----
    ctx.lineWidth = 1;
    for (let bucket = 0; bucket < 4; bucket++) {
      ctx.beginPath();
      let any = false;
      for (let k = 0; k < edges.length; k += 3) {
        const i = edges[k], j = edges[k + 1];
        const s = 1 - edges[k + 2] / LINK;
        const b = s > 0.75 ? 3 : s > 0.5 ? 2 : s > 0.25 ? 1 : 0;
        if (b !== bucket || i === 0) continue;
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        any = true;
      }
      if (any) {
        ctx.strokeStyle = `rgba(${RGB.tealL},${Math.min(0.5, (0.035 + bucket * 0.035) * edgeBoost)})`;
        ctx.stroke();
      }
    }
    // agent links in warm tone
    ctx.beginPath();
    for (const j of adj[0]) { ctx.moveTo(agent.x, agent.y); ctx.lineTo(nodes[j].x, nodes[j].y); }
    ctx.strokeStyle = `rgba(${RGB.orange},${0.16 + agent.glow * 0.25})`;
    ctx.stroke();

    // career shape: faint contour completes the outline on sparse (mobile) meshes
    if (formation && formation.strokes) {
      ctx.beginPath();
      for (const st of formation.strokes) {
        if (st.length < 2) continue;
        ctx.moveTo(st[0].x, st[0].y);
        for (let k = 1; k < st.length; k++) ctx.lineTo(st[k].x, st[k].y);
      }
      ctx.strokeStyle = `rgba(${RGB.tealL},${0.3 * ease(clamp(formation.w, 0, 1))})`;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // mcp hub spokes
    if (hub) {
      const a = clamp((hub.until - time) / 1.2, 0, 1) * clamp((time - (hub.until - 5.5)) / 0.4, 0, 1);
      ctx.beginPath();
      for (const id of hub.ids) { const n = nodes[id]; if (n) { ctx.moveTo(agent.x, agent.y); ctx.lineTo(n.x, n.y); } }
      ctx.setLineDash([2, 5]);
      ctx.lineDashOffset = -time * 30;
      ctx.strokeStyle = `rgba(${RGB.orange},${0.28 * a})`;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ---- cursor context window + attention ----
    const attendVis = pointer.onBg ? pointer.k : 0;
    if (attendVis > 0.02) {
      let inCtx = 0;
      ctx.beginPath();
      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.att > 0.01) { ctx.moveTo(pointer.x, pointer.y); ctx.lineTo(n.x, n.y); inCtx++; }
      }
      ctx.strokeStyle = `rgba(${RGB.tealL},${0.14 * attendVis})`;
      ctx.stroke();
      // per-node attention weight as a soft halo
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.att > 0.01) glow(GLOW.teal, n.x, n.y, 10 + n.att * 12, n.att * 0.35 * attendVis);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      // the ring: dashed boundary + a token-usage arc
      ctx.beginPath();
      ctx.setLineDash([2, 7]);
      ctx.lineDashOffset = time * 6;
      ctx.arc(pointer.x, pointer.y, CTX_R, 0, TAU);
      ctx.strokeStyle = `rgba(${RGB.tealL},${0.12 * attendVis})`;
      ctx.stroke();
      ctx.setLineDash([]);
      const fill = clamp(inCtx / 8, 0.04, 1);
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, CTX_R + 4, -Math.PI / 2, -Math.PI / 2 + fill * TAU);
      ctx.strokeStyle = `rgba(${RGB.orange},${0.32 * attendVis})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // ---- nodes ----
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.glow > 0.02) glow(n.type === 'sme' ? GLOW.orange : GLOW.teal, n.x, n.y, 14 + n.glow * 16, n.glow * 0.6);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    const tw = 0.5 + 0.5 * Math.sin(time * 1.3);
    for (let i = 1; i < nodes.length; i++) {
      const n = nodes[i];
      const lift = Math.min(1, n.glow + n.att * 0.8 + fw * 0.35);
      if (n.type === 'doc') {
        // evidence document: tiny page with a folded corner
        const s = 3.6;
        ctx.beginPath();
        ctx.moveTo(n.x - s, n.y - s * 1.25);
        ctx.lineTo(n.x + s * 0.4, n.y - s * 1.25);
        ctx.lineTo(n.x + s, n.y - s * 0.6);
        ctx.lineTo(n.x + s, n.y + s * 1.25);
        ctx.lineTo(n.x - s, n.y + s * 1.25);
        ctx.closePath();
        ctx.strokeStyle = `rgba(${RGB.tealL},${0.34 + lift * 0.55})`;
        ctx.stroke();
        if (lift > 0.3) { ctx.fillStyle = `rgba(${RGB.tealL},${(lift - 0.3) * 0.5})`; ctx.fill(); }
      } else if (n.type === 'sme') {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3.2, 0, TAU);
        ctx.strokeStyle = `rgba(${RGB.orange},${0.42 + lift * 0.5})`;
        ctx.stroke();
      } else {
        const tw2 = 0.5 + 0.5 * Math.sin(time * 0.9 + n.phase);
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.5 + lift * 0.9, 0, TAU);
        ctx.fillStyle = `rgba(${RGB.text},${0.22 + tw2 * 0.14 + lift * 0.55})`;
        ctx.fill();
      }
    }

    // ---- agent (orchestrator) ----
    const pulse = agent.glow;
    ctx.globalCompositeOperation = 'lighter';
    glow(GLOW.orange, agent.x, agent.y, 44 + pulse * 26 + tw * 4, 0.42 + pulse * 0.35 + energy * 0.2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(agent.x, agent.y, 3.6 + pulse * 1.2, 0, TAU);
    ctx.fillStyle = `rgba(255,214,190,${0.85})`;
    ctx.fill();
    ctx.beginPath();
    ctx.setLineDash([3, 5]);
    ctx.lineDashOffset = -time * 8;
    ctx.arc(agent.x, agent.y, 15 + pulse * 3, 0, TAU);
    ctx.strokeStyle = `rgba(${RGB.orange},${0.45 + pulse * 0.3})`;
    ctx.stroke();
    ctx.setLineDash([]);
    // sub-agents orbiting
    for (let k = 0; k < 3; k++) {
      const a = time * (0.55 + k * 0.18) + k * 2.1;
      const r = 24 + k * 6;
      ctx.beginPath();
      ctx.arc(agent.x + Math.cos(a) * r, agent.y + Math.sin(a) * r, 1.3, 0, TAU);
      ctx.fillStyle = `rgba(${k === 1 ? RGB.tealL : RGB.orange},0.7)`;
      ctx.fill();
    }

    // ---- packets travelling along edges (retrieval / tool calls) ----
    for (const p of packets) {
      const a = nodes[p.path[p.seg]], b = nodes[p.path[p.seg + 1]];
      if (!a || !b) continue;
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const t = Math.min(1, p.prog / len);
      const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `rgba(${p.tool ? RGB.orange : RGB.tealL},0.38)`;
      ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      glow(p.tool ? GLOW.orange : GLOW.teal, x, y, 9, 0.7);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
    }

    // ---- questions (rust diamonds) and answers (teal checks) ----
    for (const f of flights) {
      const [s, e] = flightEnds(f);
      const c = ctrl(s, e, f.bend);
      const t = ease(clamp(f.t, 0, 1));
      const isQ = f.kind === 'q';
      const rgb = isQ ? RGB.orange : RGB.tealL;
      const fade = Math.min(1, f.t * 6) * Math.min(1, (1 - f.t) * 8 + (isQ ? 0 : 0.6));
      // tail
      ctx.beginPath();
      for (let k = 0; k <= 8; k++) {
        const tt = Math.max(0, t - k * 0.018);
        const [x, y] = qb(s, c, e, tt);
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${rgb},${0.34 * fade})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.lineWidth = 1;
      const [x, y] = qb(s, c, e, t);
      ctx.globalCompositeOperation = 'lighter';
      glow(isQ ? GLOW.orange : GLOW.teal, x, y, 10, 0.5 * fade);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      if (isQ) {
        const r = 3.4;
        ctx.beginPath();
        ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath();
        ctx.strokeStyle = `rgba(${RGB.orange},${0.85 * fade})`;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x - 3.2, y); ctx.lineTo(x - 1, y + 2.4); ctx.lineTo(x + 3.6, y - 2.8);
        ctx.strokeStyle = `rgba(${RGB.tealL},${0.95 * fade})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }

    // ---- sparks & ripples ----
    if (sparks.length) {
      ctx.globalCompositeOperation = 'lighter';
      for (const s of sparks) {
        const a = 1 - s.age / s.life;
        ctx.fillStyle = `rgba(${s.rgb},${a * 0.9})`;
        ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    for (const r of ripples) {
      const k = r.age / r.life;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 4 + ease(k) * r.r, 0, TAU);
      ctx.strokeStyle = `rgba(${r.rgb},${(1 - k) * 0.4})`;
      ctx.stroke();
    }

    // ---- captions ----
    ctx.font = `400 11px ${MONO}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    for (const l of labels) {
      const a = Math.min(1, l.age * 4) * Math.min(1, (l.life - l.age) * 2);
      ctx.fillStyle = `rgba(${l.rgb},${0.8 * a})`;
      ctx.fillText(l.text, l.x, l.y - l.age * 6);
    }
    ctx.textAlign = 'left';

    if (tag) drawTag();
  }

  function drawTag() {
    const n = tag.node;
    const chars = Math.min(tag.text.length, Math.floor(tag.age * 38));
    const a = Math.min(1, tag.age * 3) * Math.min(1, (tag.life - tag.age) * 2.5) * (tag.hover ? 1 : 0.8);
    if (a <= 0 || chars <= 0) return;
    const str = tag.text.slice(0, chars) + (chars < tag.text.length || (tag.age * 2) % 2 < 1 ? '▁' : ' ');
    ctx.font = `400 10.5px ${MONO}`;
    const w = ctx.measureText(tag.text + '▁').width + 16;
    const flip = n.x + 18 + w > W - 8;
    const bx = flip ? n.x - 18 - w : n.x + 18, by = n.y - 30;
    // leader
    ctx.beginPath();
    ctx.moveTo(n.x, n.y);
    ctx.lineTo(flip ? bx + w : bx, by + 10);
    ctx.strokeStyle = `rgba(${RGB.tealL},${0.3 * a})`;
    ctx.stroke();
    // glass pill
    roundRect(bx, by, w, 20, 7);
    ctx.fillStyle = `rgba(20,25,30,${0.62 * a})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.1 * a})`;
    ctx.stroke();
    ctx.fillStyle = `rgba(${RGB.text},${0.82 * a})`;
    ctx.textBaseline = 'middle';
    ctx.fillText(str, bx + 8, by + 10.5);
  }

  /* ---------------- loop, adaptive quality, lifecycle ---------------- */

  let raf = 0, running = false, last = 0, ema = 16, slowFrames = 0, fieldTick = 0, jsMs = 0;

  function applyQuality(q) {
    quality = q;
    Field.setScale && Field.setScale(q === 2 ? 0.5 : q === 1 ? 0.38 : 0.28);
    resize();
  }

  function frame(now) {
    if (!running) return;
    const dtMs = Math.min(100, now - last);
    last = now;
    ema = ema * 0.94 + dtMs * 0.06;
    if (ema > 26 && quality > 0) {
      if (++slowFrames > 120) { slowFrames = 0; ema = 16; applyQuality(quality - 1); }
    } else slowFrames = Math.max(0, slowFrames - 1);

    const t0 = performance.now();
    step(Math.min(dtMs, 50) / 1000);
    // field is slow & soft: 30 fps is plenty, except while a ripple is live
    if ((fieldTick++ & 1) === 0 || fieldRipple.k > 0 && fieldRipple.age < 1.5) drawField();
    draw();
    jsMs = jsMs * 0.95 + (performance.now() - t0) * 0.05;
    raf = requestAnimationFrame(frame);
  }

  function drawField() {
    Field.draw(time, { x: pointer.x, y: pointer.y, k: pointer.k * (pointer.onBg ? 1 : 0.6) }, fieldRipple, energy);
  }

  function start() {
    if (running || REDUCED || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function renderStatic() {
    // reduced motion: settle the graph, draw one calm frame
    for (let i = 0; i < 40; i++) step(0.05);
    flights.length = packets.length = 0;
    tag = null;
    drawField();
    draw();
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  // console easter egg
  try {
    console.log(
      '%c agent://questrix %c online · routing RFx questions to evidence\n' +
      '%cpsst — the desktop is listening. try typing: questrix · mcp · hackathon · trust · lock · rfx · hunt · soc · govern · chip · ctf',
      'background:#C45A2A;color:#fff;border-radius:4px;padding:2px 6px;font-family:monospace',
      'color:#7EC8C8;font-family:monospace',
      'color:rgba(232,239,245,.6);font-family:monospace'
    );
  } catch (_) { /* no-op */ }

  resize();            // also paints the static frame when motion is reduced
  start();
})();
