import sharp from 'sharp';

const names = ['rear-quarter', 'cockpit', 'rear-signal'];
const sources = process.argv.slice(2);
if (sources.length !== names.length)
  throw new Error('Provide the three transparent section-bike source images.');
for (const [index, source] of sources.entries()) {
  const image = sharp(source);
  if (!(await image.metadata()).hasAlpha)
    throw new Error('Section-bike images must preserve transparency.');
  const target = `public/assets/motorcycle/h2r/bike-${names[index]}.webp`;
  await image
    .resize(1600, 1000, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 87, alphaQuality: 100 })
    .toFile(target);
  console.log(target);
}
