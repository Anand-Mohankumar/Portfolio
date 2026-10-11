// Serve the repository, install Playwright in a separate environment, then run:
// NODE_PATH=/path/to/node_modules node scripts/test-window-layout.cjs http://localhost:8765
// Optional: CHROMIUM_EXECUTABLE=/path/to/chrome for an existing browser install.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
    args: process.env.CHROMIUM_EXECUTABLE ? ['--no-sandbox'] : []
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Keep validation independent of external fonts, feeds and editor libraries.
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    });
    await page.goto(process.argv[2] || 'http://localhost:8765', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('.desktop').inert);
    await page.locator('.sidebar').waitFor({ state: 'visible' });
    const settle = () => page.waitForFunction(() => !document.querySelector('.window-card[style*="transition: transform"]'));
    const open = async name => {
      await page.locator(`.sidebar-item[data-view="${name}"]`).click();
      await settle();
    };
    const inspect = async () => {
      const result = await page.evaluate(() => {
        const topbar = document.querySelector('.topbar');
        const bar = topbar.getBoundingClientRect();
        const system = document.querySelector('.topbar-right').getBoundingClientRect();
        const visible = [...document.querySelectorAll('.window-card')].filter(card => getComputedStyle(card).display !== 'none');
        const mobile = innerWidth <= 768;
        return {
          clockBelowWorkspace: Number(getComputedStyle(document.querySelector('.desktop-clock-widget')).zIndex) < Number(getComputedStyle(document.querySelector('.content-area')).zIndex),
          barTop: bar.top,
          barHit: !!document.elementFromPoint(innerWidth - 10, 25)?.closest('.topbar'),
          systemFits: system.right <= innerWidth + 1 && system.left >= 0,
          windowsFit: mobile || visible.every(card => {
            const r = card.getBoundingClientRect();
            return r.top >= 69 && r.left >= 19 && r.right <= innerWidth - 19 && r.bottom <= innerHeight - 111;
          }),
          surfacesClipped: visible.every(card => getComputedStyle(card).overflow === 'hidden'),
          liveWindowBlur: visible.some(card => getComputedStyle(card).backdropFilter !== 'none'),
          transientState: visible.some(card => card.inert || card.style.clipPath || card.style.opacity),
          activeCount: visible.filter(card => card.classList.contains('active-window')).length
        };
      });
      assert.ok(result.clockBelowWorkspace, 'desktop clock stays behind windows');
      assert.equal(result.barTop, 0, 'topbar stays at viewport top');
      assert.ok(result.barHit, 'topbar remains above the window stack');
      assert.ok(result.systemFits, 'system icons fit alongside overflowing tabs');
      assert.ok(result.windowsFit, 'desktop windows fit between topbar and dock');
      assert.ok(result.surfacesClipped, 'window descendants stay within rounded surfaces');
      assert.equal(result.liveWindowBlur, false, 'overlapping windows do not sample live backdrops');
      assert.equal(result.transientState, false, 'completed animations leave no clipping, opacity or inert state');
      assert.equal(result.activeCount, 1, 'one foreground window');
    };
    for (const name of ['home', 'projects', 'skills', 'markdownify', 'newsfeed']) await open(name);
    await inspect();
    await page.locator('#openWindowsTabs [data-view="skills"]').click();
    await page.waitForTimeout(500); // Wait for the background stack transition.
    const header = await page.locator('#skillsCard .card-header').boundingBox();
    await page.mouse.move(header.x + 80, header.y + 20);
    await page.mouse.down();
    await page.mouse.move(30, 20, { steps: 5 });
    await page.mouse.up();
    await inspect();
    await page.locator('#skillsCard .btn-minimize').click();
    await page.waitForFunction(() => document.querySelector('#skillsCard').style.display === 'none');
    await open('skills');
    await inspect();
    await page.locator('#skillsCard .btn-maximize').click();
    await inspect();
    await page.locator('#skillsCard .btn-maximize').click();
    // Interrupt close with reopen and confirm stale hide callbacks cannot win.
    await page.evaluate(() => { closeWindow('skills'); showView('skills'); });
    await settle();
    await page.waitForTimeout(500);
    await inspect();
    for (const viewport of [{width:1280,height:800}, {width:900,height:600}, {width:390,height:844}, {width:1440,height:900}]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      await inspect();
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#skillsCard .btn-close').click();
    await page.waitForFunction(() => document.querySelector('#skillsCard').style.display === 'none');
    await open('skills');
    await inspect();
    assert.deepEqual(errors, [], 'no uncaught page errors');
    if (process.env.SCREENSHOT_PATH) await page.screenshot({path: process.env.SCREENSHOT_PATH});
    await page.locator('.global-close-all-btn').click();
    await page.waitForFunction(() => [...document.querySelectorAll('.window-card')].every(card => card.style.display === 'none'));
    console.log('PASS: five-window stack, topbar hit testing, drag bounds, minimize/restore, maximize, interrupted close, desktop/mobile resize, reduced motion, close all');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
