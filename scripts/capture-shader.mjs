import { chromium } from '@playwright/test';
import sharp from 'sharp';

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto(process.env.PREVIEW_URL || 'http://localhost:4321', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('[data-hero-shader][data-state="ready"]');
  await page.waitForTimeout(1000);
  await page.addStyleTag({
    content: `
    .portfolio-journey, .site-header, .backdrop-bike, .backdrop-shade, .backdrop-neon, [data-ignition-boot] {
      visibility: hidden !important;
    }
    .hero-shader { mask-image: none !important; opacity: 1 !important; }
    .hero-shader canvas { opacity: 1 !important; }
    .shader-fallback { visibility: hidden !important; }
  `,
  });
  const png = await page.locator('.hero-shader canvas').screenshot();
  await sharp(png)
    .webp({ quality: 86 })
    .toFile('public/assets/shaders/threads-still.webp');
  console.log('Captured the React Bits Threads fallback image.');
} finally {
  await browser.close();
}
