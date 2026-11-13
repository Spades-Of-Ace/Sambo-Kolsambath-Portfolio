import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';

const url = process.env.PREVIEW_URL || 'http://localhost:4321';
const out = 'tmp/racing-stage-qa';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--disable-webgl'],
});
const results = [];
const filter = process.argv.slice(2).join(' ');
const check = async (name, fn) => {
  if (filter && !name.includes(filter)) return;
  try {
    await fn();
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
const ready = async (page, hash = '') => {
  await page.goto(url + '/' + hash, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-stage-flow-ready="true"]');
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.fonts.ready);
};
const active = (page) =>
  page.locator('.portfolio-journey').getAttribute('data-active-stage');
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
  await page.waitForTimeout(400);
};
const assertSection = async (page, id) => {
  assert.equal(await active(page), id);
  assert.deepEqual(
    await page
      .locator('.stage-panel')
      .evaluateAll((els) =>
        els
          .filter((el) => getComputedStyle(el).visibility === 'visible')
          .map((el) => el.id),
      ),
    [id],
  );
  assert.equal(await page.locator('.stage-panel:not([inert])').count(), 1);
  assert.equal(
    await page.locator('.portfolio-journey').getAttribute('data-scroll-mode'),
    'native',
  );
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollSnapType,
    ),
    'none',
  );
};

try {
  await check(
    'Fade-through exposes one section, follows scroll in both directions, and keeps WORK readable',
    async () => {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      await ready(page);
      assert.equal(
        await page.locator('#skills-title').getAttribute('data-float-revealed'),
        null,
      );
      const start = await page
        .locator('[data-section-slot="skills"]')
        .evaluate((el) => el.offsetTop - innerHeight);
      for (const progress of [
        0, 0.2, 0.4, 0.49, 0.51, 0.6, 0.8, 1, 0.8, 0.51, 0.49, 0.2, 0,
      ]) {
        await page.evaluate(
          ({ start, progress }) =>
            scrollTo({
              top: start + progress * innerHeight,
              behavior: 'instant',
            }),
          { start, progress },
        );
        await page.waitForTimeout(100);
        const expected = progress < 0.5 ? 'projects' : 'skills';
        assert.equal(await active(page), expected);
        assert.deepEqual(
          await page
            .locator('.stage-panel')
            .evaluateAll((els) =>
              els
                .filter((el) => getComputedStyle(el).visibility === 'visible')
                .map((el) => el.id),
            ),
          [expected],
        );
        const y = await page.evaluate(() => scrollY);
        const opacity = await page
          .locator('#' + expected)
          .evaluate((el) => +getComputedStyle(el).opacity);
        await page.waitForTimeout(100);
        assert.equal(await page.evaluate(() => scrollY), y);
        assert.equal(
          await page
            .locator('#' + expected)
            .evaluate((el) => +getComputedStyle(el).opacity),
          opacity,
        );
        if (progress === 0.4 || progress === 0.6)
          await page.screenshot({
            path: out + '/handoff-' + progress + '.png',
          });
      }
      await enter(page, 'skills');
      await page.waitForFunction(
        () =>
          document.querySelector('#skills-title').dataset.floatRevealed ===
            'true' &&
          !document.querySelector('#skills-title .scroll-float-char'),
      );
      assert.match(
        await page.locator('#skills-title').innerText(),
        /BEHIND THE WORK/,
      );
      const pixels = await sharp(
        await page.locator('#skills-title em').screenshot(),
      )
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      let brightGreen = 0;
      for (let i = 0; i < pixels.data.length; i += pixels.info.channels) {
        const [r, g, b] = pixels.data.subarray(i, i + 3);
        if (g > 155 && r > 105 && g > r * 1.05 && r > b * 1.1) brightGreen++;
      }
      assert.ok(
        brightGreen > 400,
        'The accented word needs visible glyphs, not just a faint glow: ' +
          brightGreen,
      );
      await page.screenshot({ path: out + '/skills-heading-fixed.png' });
    },
  );
  await check(
    'Continuous wheel movement, immediate reverse and no snap-back at section boundaries',
    async () => {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await ready(page);
      await assertSection(page, 'home');
      await page.evaluate(() => {
        window.__wheelBlocked = [];
        window.addEventListener(
          'wheel',
          (event) => window.__wheelBlocked.push(event.defaultPrevented),
          { passive: true },
        );
      });
      await page.mouse.move(700, 500);
      await page.mouse.wheel(0, 20);
      await page.waitForTimeout(100);
      assert.equal(await page.evaluate(() => scrollY), 20);
      await page.waitForTimeout(1000);
      assert.equal(await page.evaluate(() => scrollY), 20);
      await page.mouse.wheel(0, 1050);
      await page.waitForTimeout(80);
      const first = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 80);
      await page.waitForTimeout(80);
      const second = await page.evaluate(() => scrollY);
      assert.ok(second > first);
      await page.mouse.wheel(0, -35);
      await page.waitForTimeout(100);
      const reversed = await page.evaluate(() => scrollY);
      assert.ok(reversed < second);
      await page.waitForTimeout(1000);
      assert.equal(await page.evaluate(() => scrollY), reversed);
      await assertSection(page, 'experience');
      assert.equal(
        await page.locator('[data-racing-backdrop]').getAttribute('data-phase'),
        'experience',
      );
      await page.evaluate(() =>
        scrollTo({
          top:
            document.getElementById('projects').closest('[data-section-slot]')
              .offsetTop - 30,
          behavior: 'instant',
        }),
      );
      await page.mouse.wheel(0, 70);
      await page.waitForTimeout(150);
      const across = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, -20);
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => scrollY), across - 20);
      assert.deepEqual(await page.evaluate(() => window.__wheelBlocked), [
        false,
        false,
        false,
        false,
        false,
        false,
      ]);
      assert.deepEqual(errors, []);
    },
  );

  await check(
    'Navigation, deep links, history, background views and once-only headings',
    async () => {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      await ready(page, '#projects');
      await assertSection(page, 'projects');
      const views = new Set();
      for (const id of [
        'home',
        'experience',
        'projects',
        'skills',
        'about',
        'contact',
      ]) {
        await page.locator('[data-nav-section="' + id + '"]').click();
        await page.waitForTimeout(1500);
        await assertSection(page, id);
        assert.equal(
          await page
            .locator('[data-racing-backdrop]')
            .getAttribute('data-phase'),
          id,
        );
        views.add(
          await page
            .locator('[data-racing-backdrop]')
            .getAttribute('data-bike-view'),
        );
        assert.equal(
          await page
            .locator('[aria-current="location"]')
            .getAttribute('data-nav-section'),
          id,
        );
        await page.screenshot({ path: out + '/' + id + '-1440.png' });
      }
      assert.equal(views.size, 6);
      await page.goBack();
      await page.waitForTimeout(1200);
      await assertSection(page, 'about');
      await page.goForward();
      await page.waitForTimeout(1200);
      await assertSection(page, 'contact');
      await enter(page, 'skills');
      assert.equal(
        await page.locator('#skills-title').getAttribute('data-float-revealed'),
        'true',
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
    },
  );

  await check(
    'Gallery controls, three-second autoplay, hold pause, release, and keyboard',
    async () => {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      await ready(page, '#projects');
      const project = page.locator('#projects');
      assert.equal(
        await page
          .locator(
            '[data-gallery-autoplay], [data-project-count], .gallery-timer, .project-track',
          )
          .count(),
        0,
      );
      assert.equal(
        await page.locator('.section-heading-row .icon-button').count(),
        0,
      );
      assert.equal(
        await page.locator('.project-browser .gallery-navigation').count(),
        1,
      );
      await page.waitForFunction(
        () =>
          document.querySelector('#projects').dataset.autoplay === 'running',
      );
      await page.mouse.move(1000, 700);
      await page.mouse.down();
      const selected = await project.getAttribute('data-selected-project');
      await page.waitForTimeout(3400);
      assert.equal(
        await project.getAttribute('data-selected-project'),
        selected,
      );
      assert.equal(await project.getAttribute('data-autoplay'), 'paused');
      let popups = 0;
      page.on('popup', () => popups++);
      await page.mouse.up();
      await page.waitForTimeout(3250);
      assert.notEqual(
        await project.getAttribute('data-selected-project'),
        selected,
      );
      assert.equal(popups, 0);
      await page.locator('.gallery-next').click();
      await page.waitForTimeout(800);
      assert.equal(await project.getAttribute('data-selected-project'), '2');
      await page.locator('.project-rail').focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(800);
      assert.equal(await project.getAttribute('data-selected-project'), '3');
      await page.waitForTimeout(3300);
      assert.equal(await project.getAttribute('data-selected-project'), '3');
      await page.locator('[data-project-select="6"]').click();
      assert.equal(await page.locator('.gallery-next').isDisabled(), true);
      await page.waitForTimeout(800);
      assert.equal(
        await page.locator('.project-slide:not([inert])').count(),
        1,
      );
      await enter(page, 'home');
      assert.equal(await project.getAttribute('data-autoplay'), 'paused');
    },
  );

  await check(
    'Native closing scroll returns the whole bike, exits left, reveals footer and reverses',
    async () => {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      await ready(page, '#departure');
      await page.evaluate(() =>
        scrollTo({
          top: document
            .getElementById('departure')
            .closest('[data-section-slot]').offsetTop,
          behavior: 'instant',
        }),
      );
      await page.waitForTimeout(900);
      assert.equal(
        await page
          .locator('[data-racing-backdrop]')
          .getAttribute('data-bike-view'),
        'side',
      );
      const full = await page.locator('.backdrop-bike-motion').boundingBox();
      assert.ok(full.x >= 0 && full.x + full.width <= 1441);
      await page.evaluate(() => {
        const panel = document
          .getElementById('departure')
          .closest('[data-section-slot]');
        scrollTo({
          top: panel.offsetTop + panel.offsetHeight - innerHeight - 1,
          behavior: 'instant',
        });
      });
      await page.waitForTimeout(300);
      const exit = await page.locator('.backdrop-bike-motion').boundingBox();
      assert.ok(exit.x + exit.width < 0);
      await enter(page, 'footer');
      assert.equal(
        await page.locator('[data-hero-shader]').getAttribute('data-paused'),
        'true',
      );
      await page.screenshot({ path: out + '/footer-1440.png' });
      await page.evaluate(() =>
        scrollTo({
          top: document
            .getElementById('departure')
            .closest('[data-section-slot]').offsetTop,
          behavior: 'instant',
        }),
      );
      await page.waitForTimeout(900);
      assert.equal(
        await page
          .locator('[data-racing-backdrop]')
          .getAttribute('data-hidden'),
        'false',
      );
      assert.ok(
        (await page.locator('.backdrop-bike-motion').boundingBox()).x >= 0,
      );
      await page.keyboard.press('Control+Home');
      await page.waitForTimeout(1000);
      await assertSection(page, 'home');
    },
  );

  for (const width of [320, 390, 768, 1024, 1920]) {
    await check(
      'Responsive stages, readable copy and controls at ' + width + 'px',
      async () => {
        const page = await browser.newPage({
          viewport: { width, height: width < 700 ? 844 : 1000 },
          reducedMotion: 'reduce',
        });
        await ready(page);
        for (const id of [
          'home',
          'experience',
          'projects',
          'skills',
          'about',
          'contact',
          'footer',
        ]) {
          await enter(page, id);
          await assertSection(page, id);
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          );
          const panel = page.locator('#' + id);
          assert.ok(
            await panel.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
            id,
          );
          if (id === 'projects') {
            const button = await page.locator('.gallery-next').boundingBox();
            assert.ok(
              button.x >= 0 &&
                button.x + button.width <= width &&
                button.y > 72 &&
                button.y + button.height <= (width < 700 ? 844 : 1000),
            );
            assert.ok(
              await page
                .locator('[data-project-select]')
                .evaluateAll((els) =>
                  els.every((el) => el.scrollWidth <= el.clientWidth + 1),
                ),
            );
          }
          await page.screenshot({
            path: out + '/' + id + '-' + width + '.png',
          });
        }
        await enter(page, 'skills');
        await page.locator('[data-skill-tab="2"]').click();
        assert.equal(await page.locator('#skill-panel-2').isVisible(), true);
        await page.locator('[data-skill-tab="2"]').focus();
        await page.keyboard.press('ArrowDown');
        assert.equal(await page.locator('#skill-panel-3').isVisible(), true);
        const descriptions = await page
          .locator(
            '.hero-description, .section-description, .career-description, .project-overview p, .project-contribution p, .skill-panel > p',
          )
          .evaluateAll((els) =>
            els.map((el) => parseFloat(getComputedStyle(el).fontSize)),
          );
        assert.ok(descriptions.every((size) => size >= 16));
      },
    );
  }

  await check(
    'Mobile native vertical scrolling preserves horizontal gallery swipes',
    async () => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();
      await ready(page);
      await page.locator('.menu-toggle').tap();
      await page.locator('[data-nav-section="projects"]').tap();
      await page.waitForTimeout(1400);
      await assertSection(page, 'projects');
      assert.equal(
        await page.locator('.menu-toggle').getAttribute('aria-expanded'),
        'false',
      );
      const session = await context.newCDPSession(page);
      const beforeSwipe = await page.evaluate(() => scrollY);
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: 300, y: 530 }],
      });
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: 120, y: 530 }],
      });
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await page.waitForTimeout(900);
      await assertSection(page, 'projects');
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: 180, y: 300 }],
      });
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: 180, y: 470 }],
      });
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await page.waitForTimeout(1000);
      assert.ok((await page.evaluate(() => scrollY)) < beforeSwipe);
      assert.equal(await page.locator('.stage-panel:not([inert])').count(), 1);
    },
  );

  await check(
    'Real assets, removed status strips, static fallback and standalone routes',
    async () => {
      const page = await browser.newPage();
      await ready(page);
      assert.equal(
        await page
          .locator(
            '.hero-bottom, .scroll-cue, .section-topline, .page-progress, .race-route',
          )
          .count(),
        0,
      );
      const images = await page.locator('img').evaluateAll(async (els) => {
        return Promise.all(
          els.map(async (img) => {
            img.loading = 'eager';
            try {
              await img.decode();
              return img.naturalWidth > 0;
            } catch {
              return false;
            }
          }),
        );
      });
      assert.ok(images.every(Boolean));
      assert.match(
        await page.locator('link[rel="icon"]').getAttribute('href'),
        /ace-icon-transparent/,
      );
      for (const route of [
        'experience',
        'projects',
        'skills',
        'about',
        'contact',
        'work',
      ]) {
        assert.equal((await page.goto(url + '/' + route)).status(), 200);
        assert.equal(await page.locator('.stage-panel').count(), 0);
      }
      const context = await browser.newContext({ javaScriptEnabled: false });
      const staticPage = await context.newPage();
      await staticPage.goto(url);
      assert.equal(
        await staticPage
          .locator('.portfolio-journey > section[hidden]')
          .count(),
        0,
      );
      assert.equal(await staticPage.locator('.project-slide').count(), 7);
      assert.equal(
        await staticPage
          .locator('.project-rail')
          .evaluate((el) => getComputedStyle(el).display),
        'grid',
      );
      assert.equal(
        await staticPage.locator('[data-skill-panel]:visible').count(),
        4,
      );
    },
  );
} finally {
  await browser.close();
  await fs.writeFile(out + '/results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
if (results.some((result) => !result.pass)) process.exitCode = 1;
