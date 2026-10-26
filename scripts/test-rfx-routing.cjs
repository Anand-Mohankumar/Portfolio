// Run with Node only: node scripts/test-rfx-routing.cjs
// Canvas/DOM stubs exercise the actual simulation without requiring a browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function scene(reduced = false) {
  const source = fs.readFileSync(process.env.RFX_SOURCE || path.join(__dirname, '../career-bg.js'), 'utf8');
  const marker = '  resize();            // also paints the static frame when motion is reduced';
  assert.ok(source.includes(marker));
  // Expose closure state only inside this test VM; production has no test hooks.
  const hooks = `window.testScene = {
    spawnQuestion, step, draw, flightEnds, routeToEvidence,
    state: () => ({ flights, packets, labels, agent, answered }),
    reset(types, connected = true) {
      flights.length = packets.length = queue.length = labels.length = 0;
      sparks.length = ripples.length = nodes.length = adj.length = 0;
      time = answered = energy = 0;
      formation = disperse = hub = tag = null;
      nextQuestion = nextShape = nextWhisper = Infinity;
      W = 1000; H = 700;
      types.forEach((type, i) => {
        nodes.push(makeNode(type, 500 + i * 70, 350));
        adj.push([]);
        if (connected && i) { adj[i - 1].push(i); adj[i].push(i - 1); }
      });
      agent = nodes[0];
    }
  };\n`;
  const operations = [];
  const ctx = new Proxy({}, { get(target, key) {
    if (key in target) return target[key];
    if (key === 'measureText') return text => ({ width: text.length * 7 });
    if (/^create.*Gradient$/.test(key)) return () => ({ addColorStop() {} });
    return (...args) => operations.push([key, ...args]);
  } });
  const elements = new Map();
  const element = () => ({
    style: {}, width: 0, height: 0,
    setAttribute() {}, addEventListener() {},
    getContext: type => type === 'webgl' ? null : ctx,
    insertAdjacentElement: (_, el) => elements.set(el.id, el),
    matches: () => true
  });
  elements.set('webgl-bg', element());
  elements.set('career-bg', element());
  let animationRequests = 0;
  const window = {
    innerWidth: 1000, innerHeight: 700, devicePixelRatio: 1,
    matchMedia: query => ({ matches: query.includes('coarse') || reduced }),
    addEventListener() {}
  };
  const document = {
    hidden: false, body: element(), documentElement: element(),
    getElementById: id => elements.get(id), createElement: element,
    addEventListener() {}, elementFromPoint: () => elements.get('webgl-bg')
  };
  vm.runInNewContext(source.replace(marker, hooks + marker), {
    window, document, console: { log() {} }, performance: { now: () => 0 },
    requestAnimationFrame: () => ++animationRequests, cancelAnimationFrame() {},
    setInterval() {}, setTimeout() {}, clearTimeout() {}
  });
  return { ...window.testScene, publicAPI: window.CareerBG, operations,
    animationRequests: () => animationRequests };
}

function advance(scene, predicate) {
  for (let i = 0; i < 2000 && !predicate(); i++) scene.step(0.05);
  assert.ok(predicate(), 'simulation reaches the expected phase');
}

for (const [types, connected] of [
  [['agent', 'kb', 'sme', 'doc'], true],
  [['agent', 'sme'], true],
  [['agent', 'kb'], false],
  [['agent', 'doc'], false]
]) {
  const s = scene();
  s.reset(types, connected);
  const state = s.state;
  const batch = { x: 10, y: 20, total: 1, done: 0, caption: true };
  assert.ok(s.spawnQuestion(10, 20, batch));
  advance(s, () => state().packets.length > 0);
  const outboundPath = Array.from(state().packets[0].path);
  assert.equal(outboundPath[0], 0, 'retrieval begins at Questrix');
  advance(s, () => state().packets.some(p => p.returning) || state().flights.some(f => f.kind === 'a'));
  assert.equal(state().flights.length, 0, 'evidence/SME cannot send a customer answer directly');
  assert.deepEqual(Array.from(state().packets[0].path), outboundPath.slice().reverse(), 'results retrace the graph to Questrix');
  assert.equal(batch.done, 0);
  advance(s, () => state().flights.some(f => f.kind === 'a'));
  const answer = state().flights.find(f => f.kind === 'a');
  assert.equal(answer.from, 0, 'Questrix sends the completed answer');
  assert.equal(state().packets.length, 0, 'retrieval has finished before dispatch');
  const [start, end] = s.flightEnds(answer);
  assert.deepEqual(Array.from(start), [state().agent.x, state().agent.y]);
  assert.deepEqual(Array.from(end), [10, 20], 'answer keeps the original requester');
  assert.equal(batch.done, 0, 'dispatch does not count as delivery');
  advance(s, () => batch.done === 1);
  assert.equal(state().answered, 1);
  assert.equal(state().labels.filter(l => l.text.includes('1/1 answered')).length, 1);
}

const mcp = scene();
mcp.reset(['agent', 'doc']);
mcp.state().packets.push({ path: [0, 1], seg: 0, prog: 0, speed: 420, tool: true, origin: mcp.state().agent });
advance(mcp, () => mcp.state().packets.some(p => p.returning) || !mcp.state().packets.length);
assert.equal(mcp.state().packets[0]?.returning, true, 'MCP results also return to Questrix');
advance(mcp, () => !mcp.state().packets.length);
assert.equal(mcp.state().flights.length, 0, 'MCP retrieval does not create a customer answer');
assert.equal(mcp.state().answered, 0);

const visual = scene();
visual.reset(['agent', 'doc']);
assert.equal(visual.state().agent.tag, 'agent://Questrix');
visual.operations.length = 0;
visual.draw();
assert.equal(visual.operations.filter(op => op[0] === 'scale' && op[1] === 1.5 && op[2] === 1.5).length, 1);
assert.equal(visual.operations.filter(op => op[0] === 'save').length,
  visual.operations.filter(op => op[0] === 'restore').length, 'agent scaling does not leak into the graph');
assert.equal(visual.publicAPI.has('questrix'), true, 'lowercase terminal command still works');
assert.equal(visual.publicAPI.trigger('questrix'), true);
const reduced = scene(true);
assert.equal(reduced.animationRequests(), 0, 'reduced motion stays static');
assert.equal(reduced.publicAPI.trigger('questrix'), false);
console.log('PASS: RFx round trips, SME/library fallback, MCP returns, delivery counts, Questrix label/scale and reduced motion');
