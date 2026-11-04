// Exercise the production reader without a browser or network.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Element {
  constructor(tag = 'div') { this.tag = tag; this.children = []; this.attrs = {}; this.listeners = {}; this.classList = { toggle() {} }; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = items; }
  setAttribute(k, v) { this.attrs[k] = v; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(k, fn) { this.listeners[k] = fn; }
  focus() { this.focused = true; }
}
const ids = {};
const document = { getElementById: id => ids[id] ||= new Element(), querySelector: id => ids[id] ||= new Element(), createElement: tag => new Element(tag) };
const source = fs.readFileSync(require('node:path').join(__dirname, '../script.js'), 'utf8').split('// --- NEWSFEED LOGIC ---')[1].split('// --- MARKDOWNIFY LOGIC ---')[0];
const articles = Array.from({length: 45}, (_, i) => ({ title: `Article ${i + 1}`, url: `https://example.com/${i}`, summary: '<script>untrusted</script>', source: 'Publisher' }));
let fail = false;
const context = vm.createContext({ document, URL, setTimeout, clearTimeout, AbortController, fetch: async () => {
  if (fail) throw Error('offline');
  return {ok: true, json: async () => ({updatedAt:'2026-11-04T00:00:00Z', articles})};
}});
vm.runInContext(source, context);
const run = code => vm.runInContext(code, context);
(async () => {
  await run('loadNewsfeed()');
  assert.equal(ids['newsfeed-articles'].children.length, 20);
  assert.equal(ids['newsfeed-page'].textContent, 'Page 1 of 3');
  assert.equal(ids['newsfeed-prev'].disabled, true);
  ids['newsfeed-next'].listeners.click();
  assert.equal(ids['newsfeed-page'].textContent, 'Page 2 of 3');
  assert.equal(ids['newsfeed-articles'].children[0].children[0].children[0].children[0].textContent, 'Article 21');
  ids['newsfeed-next'].listeners.click();
  assert.equal(ids['newsfeed-articles'].children.length, 5);
  assert.equal(ids['newsfeed-next'].disabled, true);
  ids['newsfeed-next'].listeners.click();
  assert.equal(ids['newsfeed-page'].textContent, 'Page 3 of 3');
  ids['newsfeed-prev'].listeners.click();
  assert.equal(ids['newsfeed-page'].textContent, 'Page 2 of 3');
  await run("newsfeedState.active = 'infosec'; loadNewsfeed()");
  assert.equal(ids['newsfeed-page'].textContent, 'Page 1 of 3');
  await run("newsfeedState.active = 'ai'; loadNewsfeed()");
  assert.equal(ids['newsfeed-page'].textContent, 'Page 2 of 3');
  assert.equal(run("newsfeedURL('javascript:alert(1)')"), '');
  assert.equal(ids['newsfeed-articles'].children[0].children[0].children[2].textContent, '<script>untrusted</script>');
  fail = true;
  await run("delete newsfeedState.cache.ai; loadNewsfeed()");
  assert.equal(ids['newsfeed-retry'].hidden, false);
  assert.match(ids['newsfeed-status'].textContent, /could not be loaded/);
  assert.equal(ids['.newsfeed-pagination'].hidden, true);
  fail = false;
  await run('loadNewsfeed()');
  assert.equal(ids['newsfeed-retry'].hidden, true);
  console.log('Newsfeed: pagination, boundaries, independent tabs, safe text/URLs, failure and retry passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
