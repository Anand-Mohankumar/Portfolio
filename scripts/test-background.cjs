// Serve the repository and run with Playwright available via NODE_PATH:
// CHROMIUM_EXECUTABLE=/path/to/chrome node scripts/test-background.cjs http://localhost:8765
const assert = require('node:assert/strict');
const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch({headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [];
  const open = async options => {
    const page = await browser.newPage(options);
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
    });
    await page.goto(process.argv[2] || 'http://localhost:8765', {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => !document.querySelector('.desktop').inert);
    return page;
  };
  const sample = page => page.evaluate(() => {
    const c = document.querySelector('#webgl-bg');
    const {width, height} = c;
    const rgba = c.getContext('2d').getImageData(0, 0, width, height).data;
    let maxJump = 0, min = 255, max = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        min = Math.min(min, rgba[i + ch]); max = Math.max(max, rgba[i + ch]);
        if (x) maxJump = Math.max(maxJump, Math.abs(rgba[i + ch] - rgba[i - 4 + ch]));
        if (y) maxJump = Math.max(maxJump, Math.abs(rgba[i + ch] - rgba[i - width * 4 + ch]));
      }
    }
    const points = [];
    for (let y = 0; y < height; y += 20) for (let x = 0; x < width; x += 20) {
      const i = (y * width + x) * 4;
      points.push(rgba[i], rgba[i + 1], rgba[i + 2]);
    }
    return {width, height, maxJump, min, max, points,
      viewportWidth: innerWidth, viewportHeight: innerHeight,
      rectHeight: c.getBoundingClientRect().height};
  });
  try {
    const mobile = await open({...devices['Pixel 7'], reducedMotion: 'reduce'});
    assert.equal(await mobile.evaluate(() => CareerBG.stats().renderer), 'canvas2d');
    for (const viewport of [{width: 412, height: 839}, {width: 360, height: 640}, {width: 839, height: 412}]) {
      await mobile.setViewportSize(viewport);
      await mobile.waitForTimeout(200); // Debounced resize paints a new static frame.
      const a = await sample(mobile);
      assert.equal(a.width, a.viewportWidth, 'ambient bitmap matches mobile viewport width');
      assert.equal(a.height, a.viewportHeight, 'ambient bitmap matches mobile viewport height');
      assert.ok(Math.abs(a.rectHeight - a.viewportHeight) < 1, 'CSS canvas follows dynamic viewport');
      assert.ok(a.maxJump <= 4, 'adjacent pixels have no abrupt colour blocks');
      assert.ok(a.max - a.min > 10, 'background contains visible ambient colour');
      await mobile.waitForTimeout(200);
      assert.deepEqual((await sample(mobile)).points, a.points, 'reduced motion holds the ambient frame');
    }
    await mobile.close();
    const moving = await open({...devices['Pixel 7'], reducedMotion: 'no-preference'});
    const before = await sample(moving);
    await moving.waitForTimeout(1500);
    const after = await sample(moving);
    assert.notDeepEqual(after.points, before.points, 'ambient colours drift when motion is enabled');
    const maxDrift = Math.max(...after.points.map((p, i) => Math.abs(p - before.points[i])));
    assert.ok(maxDrift <= 5, 'ambient drift stays subtle over 1.5 seconds');
    assert.ok(after.maxJump <= 4, 'moving ambient field remains smooth');
    if (process.env.SCREENSHOT_PATH) await moving.screenshot({path: process.env.SCREENSHOT_PATH});
    await moving.close();
    const desktop = await open({viewport: {width: 1440, height: 900}, reducedMotion: 'reduce'});
    assert.equal(await desktop.evaluate(() => CareerBG.stats().renderer), 'webgl', 'desktop keeps WebGL rendering');
    await desktop.close();
    assert.deepEqual(errors, [], 'no uncaught page errors');
    console.log('PASS: smooth Android gradients, portrait/landscape resize, subtle animated drift, reduced motion, desktop WebGL');
  } finally { await browser.close(); }
})().catch(e => {console.error(e); process.exitCode = 1;});
