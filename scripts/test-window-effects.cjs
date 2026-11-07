// Run with: node scripts/test-window-effects.cjs
// Exercise the production overlap controller without browser dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');
const controller = source.slice(source.indexOf('let windowEffectsFrame ='), source.indexOf('let dragOrigin ='));
function card(id, left = 0) {
  const classes = new Set();
  return {
    id, style: { display: 'flex' }, events: 0,
    rect: { left, top: 0, right: left + 200, bottom: 200 },
    classList: {
      contains: name => classes.has(name),
      toggle(name, on) { if (on) classes.add(name); else classes.delete(name); }
    },
    getBoundingClientRect() { return this.rect; },
    addEventListener() {},
    dispatchEvent() { this.events++; }
  };
}
const cards = { home: card('home'), skills: card('skills', 50), projects: card('projects', 100) };
const context = vm.createContext({
  cards, openWindows: ['home'], minimizedWindows: new Set(), closingWindows: new Set(),
  mobileLayout: { matches: false }, windowMotion: new WeakMap(), isDragging: false,
  requestAnimationFrame: () => 1, Event, window: {}
});
vm.runInContext(controller, context);
const update = () => vm.runInContext('updateWindowEffects()', context);
const is = (name, state) => cards[name].classList.contains(state);
update();
assert.equal(is('home', 'overlaps-window'), false, 'a single window has no live blur');
context.openWindows.push('skills'); update();
assert.ok(is('skills', 'overlaps-window'), 'foreground glass samples the lower window');
assert.ok(is('home', 'background-window'), 'covered Home pauses interactions');
const events = cards.home.events; update();
assert.equal(cards.home.events, events, 'unchanged overlap does not restart the avatar');
context.openWindows.push('projects'); update();
assert.ok(is('home', 'background-window') && is('skills', 'background-window'), 'all lower layers pause');
assert.ok(is('skills', 'overlaps-window') && is('projects', 'overlaps-window'), 'middle and upper glass layers');
context.openWindows = ['skills', 'projects', 'home']; update();
assert.equal(is('home', 'background-window'), false, 'raising Home resumes interactions');
assert.ok(is('skills', 'background-window') && is('projects', 'background-window'));
context.minimizedWindows.add('home'); context.closingWindows.add('projects'); update();
assert.equal(is('skills', 'background-window'), false, 'minimized and closing windows do not cover content');
assert.equal(is('skills', 'overlaps-window'), false);
context.minimizedWindows.clear(); context.closingWindows.clear();
context.openWindows = ['home', 'skills'];
cards.skills.rect.left = 200; cards.skills.rect.right = 400; update();
assert.equal(is('home', 'background-window'), false, 'touching edges are not overlap');
assert.equal(is('skills', 'overlaps-window'), false);
cards.skills.rect.left = 199; update();
assert.ok(is('home', 'background-window'), 'dragging into overlap pauses Home');
context.mobileLayout.matches = true; update();
assert.ok(Object.keys(cards).every(name => !is(name, 'background-window') && !is(name, 'overlaps-window')), 'mobile stacked windows stay interactive');
context.mobileLayout.matches = false; update();
assert.ok(is('home', 'background-window'), 'desktop overlap resumes after breakpoint change');
context.openWindows = []; update();
assert.ok(Object.keys(cards).every(name => !is(name, 'background-window') && !is(name, 'overlaps-window')), 'close all clears overlap state');
console.log('PASS: single, two and three windows, focus changes, hide, edge contact, dragging, mobile and close-all overlap states');
