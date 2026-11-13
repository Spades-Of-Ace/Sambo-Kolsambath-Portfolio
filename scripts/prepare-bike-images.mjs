import sharp from 'sharp';

const [front, side] = process.argv.slice(2);
if (!front || !side)
  throw new Error('Provide the front and side transparent image paths.');
for (const [source, view] of [
  [front, 'front'],
  [side, 'side'],
]) {
  const metadata = await sharp(source).metadata();
  if (!metadata.hasAlpha)
    throw new Error('The bike source must have transparency.');
  await sharp(source)
    .trim()
    .resize(1440, 900, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile('public/assets/motorcycle/h2r/bike-' + view + '.webp');
  console.log('Prepared transparent bike-' + view + '.webp');
}
