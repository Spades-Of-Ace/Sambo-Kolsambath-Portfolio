import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';

const url = process.env.PREVIEW_URL || 'http://localhost:4321';
const out = 'tmp/racing-boot-qa';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--disable-webgl'],
});
const results = [];
const filter = process.argv.slice(2).join(' ');
const check = async (name, test) => {
  if (filter && !name.includes(filter)) return;
  try {
    await test();
    results.push({ name, pass: true });
  } catch (error) {
    results.push({
      name,
      pass: false,
      error: error.message,
      stack: error.stack,
    });
  } finally {
    for (const context of browser.contexts()) await context.close();
    console.log((results.at(-1).pass ? 'PASS ' : 'FAIL ') + name);
  }
};
const controlledPage = async (viewport) => {
  const page = await browser.newPage({ viewport });
  await page.clock.install({ time: new Date('2026-11-13T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-13T00:01:00Z'));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#home[data-ignition-state="running"]');
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator('img[data-bike-view="quarter"]')
    .evaluate((image) => image.decode());
  await page
    .locator('[data-boot-wheel-image]')
    .evaluate((image) => image.decode());
  return page;
};
const assertReady = async (page) => {
  assert.equal(
    await page.locator('#home').getAttribute('data-ignition-state'),
    'ready',
  );
  assert.equal(await page.locator('[data-ignition-boot]').isVisible(), false);
  assert.equal(
    await page
      .locator('.ignition-dash, [data-dash-speed], [data-ignition-replay]')
      .count(),
    0,
  );
  assert.equal(await page.locator('#home .bits-char').count(), 0);
  assert.ok(
    !(await page.locator('[data-boot-wheel-spin]').getAttribute('style')),
    'The wheel must release its rotation transform after completion or skip.',
  );
  assert.ok(
    await page
      .locator('.hero-copy > *, .site-header')
      .evaluateAll((items) =>
        items.every(
          (item) =>
            +getComputedStyle(item).opacity > 0.99 &&
            getComputedStyle(item).visibility === 'visible',
        ),
      ),
    JSON.stringify(
      await page.locator('.hero-copy > *, .site-header').evaluateAll((items) =>
        items.map((item) => ({
          element: item.className,
          opacity: getComputedStyle(item).opacity,
          visibility: getComputedStyle(item).visibility,
          style: item.getAttribute('style'),
        })),
      ),
    ),
  );
  assert.equal(
    await page
      .locator('.backdrop-ignition')
      .evaluate((item) => +getComputedStyle(item).opacity),
    1,
  );
};
try {
  await check(
    'Rear wheel artwork has transparent spokes and a bounded asset size',
    async () => {
      const asset = 'public/assets/motorcycle/h2r/boot-rear-wheel.webp';
      assert.ok((await fs.stat(asset)).size < 250000);
      const { data, info } = await sharp(asset)
        .raw()
        .toBuffer({ resolveWithObject: true });
      assert.equal(info.width, 1000);
      assert.equal(info.height, 1000);
      assert.equal(info.channels, 4);
      for (const [x, y] of [
        [0, 0],
        [999, 0],
        [0, 999],
        [999, 999],
      ])
        assert.equal(data[(y * info.width + x) * info.channels + 3], 0);
      assert.equal(data[(500 * info.width + 500) * info.channels + 3], 0);
      assert.ok(data[(100 * info.width + 500) * info.channels + 3] > 240);
      assert.equal(data[(300 * info.width + 350) * info.channels + 3], 0);
    },
  );
  for (const entry of [
    { path: '/?preview=restart#skills', width: 1440, section: 'skills' },
    { path: '/#footer', width: 390, section: 'footer' },
    { path: '/', width: 1440, section: 'projects' },
  ]) {
    await check(
      'Reload restarts at home with the intro from ' +
        entry.section +
        ' at ' +
        entry.width +
        'px',
      async () => {
        const page = await browser.newPage({
          viewport: {
            width: entry.width,
            height: entry.width < 700 ? 844 : 1000,
          },
        });
        await page.goto(new URL(entry.path, url).href, {
          waitUntil: 'networkidle',
        });
        await page.keyboard.press('Escape');
        await page.evaluate((id) => {
          const slot = document.querySelector(
            '[data-section-slot="' + id + '"]',
          );
          scrollTo({ top: slot.offsetTop + 80, behavior: 'instant' });
        }, entry.section);
        await page.waitForFunction(
          (id) =>
            document.querySelector('.portfolio-journey').dataset.activeStage ===
            id,
          entry.section,
        );
        assert.ok((await page.evaluate(() => scrollY)) > 1000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#home[data-ignition-state="running"]');
        assert.equal(await page.evaluate(() => scrollY), 0);
        assert.equal(new URL(page.url()).hash, '');
        assert.equal(
          new URL(page.url()).search,
          new URL(entry.path, url).search,
        );
        assert.equal(
          await page
            .locator('.portfolio-journey')
            .getAttribute('data-active-stage'),
          'home',
        );
        await page.waitForLoadState('load');
        await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => scrollY), 0);
        await page.keyboard.press('Escape');
        await assertReady(page);
        await page.mouse.move(200, 400);
        await page.mouse.wheel(0, 90);
        await page.waitForTimeout(150);
        assert.ok((await page.evaluate(() => scrollY)) > 0);
      },
    );
  }
  await check(
    'Rear wheel accelerates behind the logo, catches the sweep, and clears before docking',
    async () => {
      const page = await controlledPage({ width: 1440, height: 1000 });
      const angle = () =>
        page.locator('[data-boot-wheel-spin]').evaluate((el) => {
          const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
          return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
        });
      await page.clock.runFor(1600);
      const first = await angle();
      await page.clock.runFor(300);
      const second = await angle();
      await page.clock.runFor(300);
      const third = await angle();
      assert.ok(Math.abs(second - first) > 5);
      assert.ok(Math.abs(third - second) > Math.abs(second - first) * 1.4);
      assert.equal(await page.locator('[data-boot-headlight]').count(), 0);
      assert.equal(await page.locator('[data-boot-compressor]').count(), 0);
      assert.ok(
        await page
          .locator('[data-boot-wheel]')
          .evaluate(
            (el) =>
              +getComputedStyle(el).zIndex <
              +getComputedStyle(document.querySelector('.boot-identity'))
                .zIndex,
          ),
      );
      const wheel = await page.locator('[data-boot-wheel]').boundingBox();
      const clip = {
        x: wheel.x + wheel.width * 0.26,
        y: wheel.y + wheel.height * 0.08,
        width: wheel.width * 0.48,
        height: wheel.height * 0.16,
      };
      const spooling = await sharp(await page.screenshot({ clip })).stats();
      assert.ok(
        spooling.channels[0].mean > 8,
        'The mechanical artwork must not render blank.',
      );
      await page.screenshot({ path: out + '/rear-wheel-spin-up.png' });
      await page.clock.runFor(1100);
      assert.ok(
        await page
          .locator('[data-boot-wheel]')
          .evaluate((el) => +getComputedStyle(el).opacity > 0.55),
      );
      assert.ok(
        await page
          .locator('[data-boot-glint]')
          .evaluate((el) => +getComputedStyle(el).opacity > 0.8),
      );
      assert.ok(
        await page
          .locator('[data-boot-details]')
          .evaluate((el) => +getComputedStyle(el).opacity < 0.01),
      );
      assert.ok(
        await page
          .locator('[data-boot-wheel-sweep]')
          .evaluate((el) => +getComputedStyle(el).opacity > 0.8),
      );
      const charged = await sharp(await page.screenshot({ clip })).stats();
      assert.ok(charged.channels[0].mean > spooling.channels[0].mean * 1.05);
      await page.screenshot({ path: out + '/rear-wheel-charged.png' });
      await page.clock.runFor(1050);
      assert.ok(
        await page
          .locator('[data-boot-wheel]')
          .evaluate((el) => +getComputedStyle(el).opacity < 0.01),
      );
      await page.clock.runFor(2300);
      await assertReady(page);
    },
  );
  await check(
    'Skipping during spin-up stops and clears the wheel permanently',
    async () => {
      const page = await controlledPage({ width: 390, height: 844 });
      await page.clock.runFor(2400);
      assert.notEqual(
        await page.locator('[data-boot-wheel-spin]').getAttribute('style'),
        null,
      );
      await page.keyboard.press('Escape');
      await assertReady(page);
      await page.clock.runFor(4500);
      await assertReady(page);
    },
  );
  await check(
    'Missing decorative rear wheel artwork does not block the cinematic intro',
    async () => {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      await page.route('**/boot-rear-wheel.webp', (route) => route.abort());
      await page.clock.install({ time: new Date('2026-11-13T00:00:00Z') });
      await page.clock.pauseAt(new Date('2026-11-13T00:01:00Z'));
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#home[data-ignition-state="running"]');
      await page.waitForFunction(
        () => document.querySelector('[data-boot-wheel]').hidden,
      );
      await page.clock.runFor(6700);
      await assertReady(page);
    },
  );
  await check(
    'Cinematic charge, metallic sweep and exact logo-to-navbar handoff',
    async () => {
      const page = await controlledPage({ width: 1440, height: 1000 });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.clock.runFor(1100);
      assert.equal(
        await page.locator('#home').getAttribute('data-ignition-phase'),
        'logo',
      );
      assert.ok(
        await page
          .locator('[data-boot-mark]')
          .evaluate((el) => +getComputedStyle(el).opacity > 0.99),
      );
      assert.ok(
        await page
          .locator('.site-header')
          .evaluate((el) => +getComputedStyle(el).opacity < 0.01),
      );
      assert.ok(
        await page
          .locator('.hero-actions')
          .evaluate((el) => +getComputedStyle(el).opacity < 0.01),
      );
      assert.equal(
        await page
          .locator('[data-ignition-boot]')
          .evaluate((el) => getComputedStyle(el).pointerEvents),
        'none',
      );
      const centered = await page.locator('[data-boot-mark]').boundingBox();
      await page.screenshot({ path: out + '/logo.png' });
      await page.clock.runFor(2200);
      assert.equal(
        await page.locator('#home').getAttribute('data-ignition-phase'),
        'charged',
      );
      assert.ok(
        await page
          .locator('[data-boot-glint]')
          .evaluate((el) => +getComputedStyle(el).opacity > 0.4),
      );
      assert.ok(
        await page
          .locator('[data-boot-charge]')
          .evaluate((el) =>
            getComputedStyle(el).transform.startsWith('matrix(1,'),
          ),
      );
      assert.equal(
        await page
          .locator('[data-boot-curtain]')
          .evaluate((el) => +getComputedStyle(el).opacity),
        1,
      );
      await page.screenshot({ path: out + '/charged.png' });
      await page.clock.runFor(1050);
      assert.equal(
        await page.locator('#home').getAttribute('data-ignition-phase'),
        'dock',
      );
      const departed = await page.locator('[data-boot-mark]').boundingBox();
      assert.ok(departed.y < centered.y && departed.width < centered.width);
      await page.screenshot({ path: out + '/docking.png' });
      await page.clock.runFor(1000);
      assert.equal(
        await page.locator('#home').getAttribute('data-ignition-phase'),
        'reveal',
      );
      assert.ok(
        await page
          .locator('[data-boot-curtain]')
          .evaluate((el) => +getComputedStyle(el).opacity < 0.4),
      );
      await page.screenshot({ path: out + '/power-on.png' });
      await page.clock.runFor(300);
      const docked = await page.locator('[data-boot-mark]').boundingBox();
      const target = await page
        .locator('.site-header .brand-logo')
        .evaluate((el) => el.getBoundingClientRect().toJSON());
      for (const key of ['x', 'y', 'width', 'height'])
        assert.ok(
          Math.abs(docked[key] - target[key]) < 1.5,
          key + ': ' + JSON.stringify({ docked, target }),
        );
      await page.clock.runFor(1000);
      await assertReady(page);
      assert.equal(
        await page
          .locator('.site-header .brand-logo')
          .evaluate((el) => +getComputedStyle(el).opacity),
        1,
      );
      await page.screenshot({ path: out + '/home-ready.png' });
      assert.deepEqual(errors, []);
    },
  );
  for (const action of ['Escape', 'reduced-motion', 'resize']) {
    await check('Docking can finish safely with ' + action, async () => {
      const page = await controlledPage({ width: 1440, height: 1000 });
      await page.clock.runFor(5100);
      if (action === 'Escape') await page.keyboard.press('Escape');
      else if (action === 'resize')
        await page.setViewportSize({ width: 390, height: 844 });
      else await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.clock.resume();
      await page.waitForSelector('#home[data-ignition-state="ready"]');
      await assertReady(page);
      assert.equal(
        await page
          .locator('.site-header .brand-logo')
          .evaluate((el) => getComputedStyle(el).visibility),
        'visible',
      );
    });
  }
  await check(
    'Scrolling skips boot and returning home does not replay it',
    async () => {
      const page = await controlledPage({ width: 1440, height: 1000 });
      await page.clock.runFor(250);
      await page.mouse.move(700, 500);
      await page.mouse.wheel(0, 120);
      await page.clock.runFor(100);
      await page.waitForSelector('#home[data-ignition-state="ready"]', {
        state: 'attached',
      });
      assert.ok((await page.evaluate(() => scrollY)) > 0);
      await page.clock.runFor(1200);
      await page.evaluate(() => {
        location.hash = 'home';
      });
      await page.clock.runFor(1500);
      await assertReady(page);
    },
  );
  for (const key of ['Escape', 'Tab']) {
    await check('Keyboard access skips boot with ' + key, async () => {
      const page = await controlledPage({ width: 1440, height: 1000 });
      await page.keyboard.press(key);
      await assertReady(page);
    });
  }
  await check(
    'Mobile section links retain native anchor navigation',
    async () => {
      const page = await controlledPage({ width: 390, height: 844 });
      await page.clock.runFor(5200);
      await page.locator('.menu-toggle').click();
      await page.locator('.site-nav a[data-nav-section="about"]').click();
      await assertReady(page);
      await page.clock.resume();
      await page.waitForFunction(
        () =>
          Math.abs(
            document.getElementById('about').getBoundingClientRect().top,
          ) < 4,
      );
    },
  );
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
  ]) {
    await check(
      'Logo and homepage fit at ' + viewport.width + 'px',
      async () => {
        const page = await controlledPage(viewport);
        await page.clock.runFor(500);
        const logo = await page.locator('[data-boot-mark]').boundingBox();
        assert.ok(
          logo.x >= 0 && logo.x + logo.width <= viewport.width + 1,
          JSON.stringify(logo),
        );
        assert.ok(
          logo.y >= 0 && logo.y + logo.height <= viewport.height,
          JSON.stringify(logo),
        );
        await page.screenshot({
          path: out + '/logo-' + viewport.width + '.png',
        });
        await page.clock.runFor(2800);
        const wheel = await page.locator('[data-boot-wheel]').boundingBox();
        assert.ok(wheel.x >= 0 && wheel.x + wheel.width <= viewport.width + 1);
        assert.ok(
          wheel.y >= 0 && wheel.y + wheel.height <= viewport.height + 1,
        );
        await page.screenshot({
          path: out + '/rear-wheel-' + viewport.width + '.png',
        });
        await page.clock.runFor(2300);
        const docked = await page.locator('[data-boot-mark]').boundingBox();
        const target = await page
          .locator('.site-header .brand-logo')
          .evaluate((el) => el.getBoundingClientRect().toJSON());
        for (const key of ['x', 'y', 'width', 'height'])
          assert.ok(
            Math.abs(docked[key] - target[key]) < 1.5,
            key + ': ' + JSON.stringify({ docked, target }),
          );
        await page.clock.runFor(1100);
        await assertReady(page);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
        if (viewport.width < 1024) {
          const copy = await page.locator('.hero-copy').boundingBox();
          assert.ok(copy.y >= 72);
          assert.equal(await page.locator('.hero-bottom').count(), 0);
        }
        await page.screenshot({
          path: out + '/home-' + viewport.width + '.png',
        });
      },
    );
  }
  await check(
    'Section lighting stays distinct without cyan project or skills accents',
    async () => {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: 'reduce',
      });
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const colors = new Set();
      for (const id of [
        'home',
        'experience',
        'projects',
        'skills',
        'about',
        'contact',
      ]) {
        await page.evaluate((id) => {
          location.hash = id;
        }, id);
        await page.waitForSelector(
          '[data-racing-backdrop][data-phase="' + id + '"]',
        );
        colors.add(
          await page
            .locator('[data-section-lighting]')
            .evaluate((item) =>
              getComputedStyle(item).getPropertyValue('--light-a').trim(),
            ),
        );
        if (id === 'projects' || id === 'skills') {
          const palette = await page
            .locator('#' + id)
            .evaluate((item) =>
              getComputedStyle(item)
                .getPropertyValue('--section-accent')
                .trim(),
            );
          assert.equal(palette, id === 'projects' ? '#cfe0c9' : '#b9ec7c');
          assert.equal(
            await page
              .locator('[data-hero-shader]')
              .evaluate((item) =>
                getComputedStyle(item).getPropertyValue('--still-hue').trim(),
              ),
            '0deg',
          );
          const channels = await page
            .locator('[data-section-lighting]')
            .evaluate((item) =>
              getComputedStyle(item)
                .getPropertyValue('--light-a')
                .match(/[\d.]+/g)
                .map(Number),
            );
          assert.ok(channels[2] <= channels[0] && channels[2] < channels[1]);
        }
        if (id === 'projects')
          await page
            .locator('.project-slide')
            .first()
            .locator('img')
            .evaluate((image) => image.decode());
        await page.screenshot({ path: out + '/section-' + id + '.png' });
      }
      assert.equal(colors.size, 6);
    },
  );
  await check(
    'Reduced-motion changes during boot leave all content visible',
    async () => {
      const page = await controlledPage({ width: 1440, height: 1000 });
      await page.clock.runFor(250);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.clock.resume();
      await page.waitForSelector('#home[data-ignition-state="ready"]', {
        state: 'attached',
      });
      await page.waitForFunction(() =>
        [...document.querySelectorAll('.hero-copy > *, .site-header')].every(
          (item) =>
            +getComputedStyle(item).opacity > 0.99 &&
            getComputedStyle(item).visibility === 'visible',
        ),
      );
      await assertReady(page);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.waitForTimeout(150);
      await assertReady(page);
    },
  );
  await check(
    'Boot has a bounded fail-safe if animation frames stall',
    async () => {
      const page = await controlledPage({ width: 1440, height: 1000 });
      await page.clock.fastForward(9000);
      await assertReady(page);
    },
  );
  await check(
    'Failed application scripts cannot trap the homepage behind the boot screen',
    async () => {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      let blocked = 0;
      await page.route('**/*', (route) => {
        if (route.request().resourceType() === 'script') {
          blocked++;
          return route.abort();
        }
        return route.continue();
      });
      await page.clock.install({ time: new Date('2026-11-13T00:00:00Z') });
      await page.clock.pauseAt(new Date('2026-11-13T00:01:00Z'));
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      assert.ok(blocked > 0);
      assert.equal(
        await page.locator('[data-ignition-boot]').isVisible(),
        true,
      );
      await page.clock.fastForward(3000);
      assert.equal(
        await page.locator('[data-ignition-boot]').isVisible(),
        false,
      );
      assert.ok(
        await page
          .locator('.hero-copy > *, .site-header')
          .evaluateAll((items) =>
            items.every((item) => +getComputedStyle(item).opacity > 0.99),
          ),
      );
    },
  );
  await check(
    'Standalone light pages retain readable heading colors',
    async () => {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: 'reduce',
      });
      for (const route of ['experience', 'about']) {
        await page.goto(new URL('/' + route, url).href, {
          waitUntil: 'domcontentloaded',
        });
        const heading = page.locator('.display-heading em');
        assert.equal(
          await heading.evaluate(
            (item) => getComputedStyle(item).backgroundImage,
          ),
          'none',
        );
        assert.notEqual(
          await heading.evaluate(
            (item) => getComputedStyle(item).webkitTextFillColor,
          ),
          'rgba(0, 0, 0, 0)',
        );
        assert.equal(await page.locator('[data-ignition-boot]').count(), 0);
      }
    },
  );
  for (const mode of ['reduced-motion', 'no-javascript', 'deep-link']) {
    await check('Boot fallback: ' + mode, async () => {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: mode === 'reduced-motion' ? 'reduce' : 'no-preference',
        javaScriptEnabled: mode !== 'no-javascript',
      });
      await page.goto(
        new URL(mode === 'deep-link' ? '/#projects' : '/', url).href,
        { waitUntil: 'domcontentloaded' },
      );
      if (mode !== 'no-javascript')
        await page.waitForSelector('#home[data-ignition-state="ready"]', {
          state: 'attached',
        });
      assert.equal(
        await page.locator('[data-ignition-boot]').isVisible(),
        false,
      );
      assert.equal(
        await page.locator('.ignition-dash, [data-dash-speed]').count(),
        0,
      );
      assert.ok(
        await page
          .locator('.hero-copy > *, .site-header')
          .evaluateAll((items) =>
            items.every((item) => +getComputedStyle(item).opacity > 0.99),
          ),
      );
      if (mode === 'deep-link') {
        try {
          await page.waitForFunction(
            () =>
              document.querySelector('.portfolio-journey').dataset
                .activeStage === 'projects',
            null,
            {
              timeout: 5000,
            },
          );
        } catch (error) {
          throw new Error(
            error.message +
              ' ' +
              JSON.stringify(
                await page.evaluate(() => ({
                  href: location.href,
                  y: scrollY,
                  projectTop: document
                    .getElementById('projects')
                    .getBoundingClientRect().top,
                  height: document.documentElement.scrollHeight,
                  ready: document.readyState,
                  fontStatus: document.fonts.status,
                })),
              ),
          );
        }
      }
    });
  }
} finally {
  await browser.close();
  await fs.writeFile(out + '/results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
if (results.some((result) => !result.pass)) process.exitCode = 1;
