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
    // Test actual touch gestures: viewport-only checks do not catch scroll-chain traps.
    const android = await browser.newPage({
      viewport: { width: 412, height: 839 }, isMobile: true, hasTouch: true,
      deviceScaleFactor: 2, reducedMotion: 'reduce',
      userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
    });
    android.on('pageerror', error => errors.push(error.message));
    await android.route('**/*', route => {
      const url = new URL(route.request().url());
      return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    });
    await android.goto(process.argv[2] || 'http://localhost:8765', { waitUntil: 'domcontentloaded' });
    await android.waitForFunction(() => !document.querySelector('.desktop').inert);
    const touch = await android.context().newCDPSession(android);
    const swipe = async (start, end) => {
      await touch.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: 200, y: start}]});
      for (let i = 1; i <= 12; i++) {
        await touch.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: 200, y: start + (end - start) * i / 12}]});
        await android.waitForTimeout(20);
      }
      await touch.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
      await android.waitForTimeout(300);
    };
    const scrollTop = () => android.locator('.content-area').evaluate(area => area.scrollTop);
    for (const viewport of [{width: 412, height: 839}, {width: 360, height: 640}]) {
      await android.setViewportSize(viewport);
      await android.locator('.sidebar-item[data-view="skills"]').click();
      assert.equal(await scrollTop(), 0, 'newly selected mobile window starts at the top');
      await swipe(500, 200);
      const down = await scrollTop();
      assert.ok(down > 100, 'swiping over mobile window content scrolls the workspace');
      await swipe(200, 500);
      assert.ok(await scrollTop() < down, 'reverse swipe scrolls back toward the top');
      await android.locator('.sidebar-item[data-view="home"]').click();
      await swipe(500, 200);
      assert.ok(await scrollTop() > 100, 'touch scrolling works with multiple mobile windows');
      assert.ok(await android.evaluate(() => !!document.elementFromPoint(innerWidth - 10, 25)?.closest('.topbar')), 'mobile topbar stays above scrolling content');
    }
    await android.close();
    assert.deepEqual(errors, [], 'no uncaught desktop or Android page errors');
    console.log('PASS: window lifecycle/layout checks and Android touch scrolling at 412×839 and 360×640, including reverse swipes and multiple windows');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
