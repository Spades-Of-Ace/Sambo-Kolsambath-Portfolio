import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
const url = process.env.PREVIEW_URL || 'http://localhost:4321';
const out = 'tmp/racing-journey-qa';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
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
    console.log(`${results.at(-1).pass ? 'PASS' : 'FAIL'} ${name}`);
  }
};
const enter = async (page, id) => {
  await page.evaluate((id) => {
    window.scrollTo({
      top: document.getElementById(id).closest('[data-section-slot]').offsetTop,
      behavior: 'instant',
    });
  }, id);
  await page.waitForFunction((id) => {
    const root = document.querySelector('.portfolio-journey');
    return (
      root.dataset.activeStage === id && root.dataset.transitioning === 'false'
    );
  }, id);
  await page.waitForTimeout(1500);
};
try {
  await check(
    'Shader canvas draws, moves and falls back after context loss',
    async () => {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
      });
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(
        '[data-hero-shader][data-state="ready"][data-running="true"]',
      );
      const isolated = await page.addStyleTag({
        content: `
      .portfolio-journey, .site-header, .backdrop-bike, .backdrop-shade, .backdrop-neon, [data-ignition-boot] { visibility: hidden !important; }
      .hero-shader, .hero-shader canvas { opacity: 1 !important; mask-image: none !important; }
    `,
      });
      const canvas = page.locator('.hero-shader canvas');
      const first = await canvas.screenshot();
      const stats = await sharp(first).stats();
      assert.ok(
        stats.channels.slice(0, 3).some((channel) => channel.stdev > 2),
        'Canvas must contain visible line detail',
      );
      await page.mouse.move(1100, 100);
      await page.waitForTimeout(900);
      const second = await canvas.screenshot();
      assert.ok(!first.equals(second), 'Shader pixels should change over time');
      await fs.writeFile(out + '/live-shader.png', second);
      await isolated.evaluate((element) => element.remove());
      await canvas.evaluate((element) =>
        element
          .getContext('webgl2')
          .getExtension('WEBGL_lose_context')
          .loseContext(),
      );
      await page.waitForSelector(
        '[data-hero-shader][data-state="fallback"][data-running="false"]',
      );
      assert.ok(
        await page
          .locator('.shader-fallback')
          .evaluate((element) => element.complete && element.naturalWidth > 0),
      );
    },
  );

  await check(
    'Single live shader, distinct bike views, section lighting and once-only effects',
    async () => {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.keyboard.press('Escape');
      await page.waitForSelector('[data-hero-shader][data-state="ready"]');
      const views = new Set();
      const profiles = new Set();
      const transforms = new Set();
      for (const id of [
        'home',
        'experience',
        'projects',
        'skills',
        'about',
        'contact',
      ]) {
        await enter(page, id);
        const scene = page.locator('[data-racing-backdrop]');
        assert.equal(await scene.getAttribute('data-phase'), id);
        views.add(await scene.getAttribute('data-bike-view'));
        profiles.add(
          await page.locator('[data-hero-shader]').getAttribute('data-profile'),
        );
        transforms.add(
          await page
            .locator('[data-background-bike]')
            .evaluate((el) => getComputedStyle(el).transform),
        );
        assert.equal(
          await page.locator('[data-hero-shader] canvas').count(),
          1,
        );
        assert.ok(Math.abs((await scene.boundingBox()).y) < 1);
        assert.equal(
          await page
            .locator('.backdrop-bike-motion > [data-bike-view]')
            .evaluateAll(
              (els) =>
                els.filter((el) => {
                  const image =
                    el instanceof HTMLImageElement
                      ? el
                      : el.querySelector('img');
                  return (
                    +getComputedStyle(el).opacity > 0.95 &&
                    image?.complete &&
                    image.naturalWidth > 0
                  );
                }).length,
            ),
          1,
        );
        if (id !== 'home')
          assert.match(
            await page
              .locator('#' + id)
              .evaluate((el) => getComputedStyle(el).backgroundColor),
            id === 'experience' ? /0\.68\)$/ : /0\.5\)$/,
          );
        await page.screenshot({ path: out + '/' + id + '.png' });
      }
      assert.equal(views.size, 6);
      assert.equal(profiles.size, 6);
      assert.equal(transforms.size, 6);
      assert.equal(
        new Set(
          await page
            .locator('[data-heading-effect]')
            .evaluateAll((els) => els.map((el) => el.dataset.headingEffect)),
        ).size,
        5,
      );
      await enter(page, 'skills');
      assert.equal(
        await page.locator('#skills-title').getAttribute('data-float-revealed'),
        'true',
      );
      await page.locator('[data-skill-tab="2"]').click();
      await page.waitForTimeout(1300);
      assert.equal(
        await page.locator('#skill-panel-2 h3').textContent(),
        'Tools of the trade',
      );
      await enter(page, 'home');
      await enter(page, 'skills');
      assert.equal(
        await page.locator('#skills-title .scroll-float-char').count(),
        0,
      );
      assert.match(
        await page.locator('#skills-title').innerText(),
        /BEHIND THE WORK/,
      );
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(300);
      assert.equal(
        await page.locator('.bits-click-layer, .bits-char').count(),
        0,
      );
      assert.deepEqual(errors, []);
    },
  );
  await check(
    'Live shader pauses at footer and resumes when reversing the departure',
    async () => {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      await page.goto(url + '/#departure', { waitUntil: 'networkidle' });
      await page.waitForSelector(
        '[data-hero-shader][data-state="ready"][data-running="true"]',
      );
      await enter(page, 'footer');
      assert.equal(
        await page.locator('[data-hero-shader]').getAttribute('data-running'),
        'false',
      );
      assert.equal(
        await page
          .locator('[data-racing-backdrop]')
          .getAttribute('data-hidden'),
        'true',
      );
      await enter(page, 'departure');
      assert.equal(
        await page.locator('[data-hero-shader]').getAttribute('data-running'),
        'true',
      );
      assert.equal(
        await page
          .locator('[data-racing-backdrop]')
          .getAttribute('data-bike-view'),
        'side',
      );
    },
  );
} finally {
  await browser.close();
  await fs.writeFile(out + '/results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
if (results.some((r) => !r.pass)) process.exitCode = 1;
