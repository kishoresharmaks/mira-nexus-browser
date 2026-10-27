import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'assets';
const INK = '#14120E';
const CREAM = '#F4EFE5';
const ACCENT = '#FF5A2B';

const wrap = (body, size = 1024, background) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ''}
  ${body}
</svg>`;

const mark = ({ ring = CREAM, dot = ACCENT, c = 512, r = 330, stroke = 56, dotR = 74 }) => {
  const d = r * Math.SQRT1_2;
  return `
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${ring}" stroke-width="${stroke}"/>
    <circle cx="${c + d}" cy="${c - d}" r="${dotR}" fill="${dot}"/>
  `;
};

await mkdir(OUT, { recursive: true });

const icon = wrap(mark({ c: 512, r: 330 }), 1024, INK);
await sharp(Buffer.from(icon)).png().toFile(`${OUT}/icon.png`);
await sharp(Buffer.from(icon)).resize(512, 512).png().toFile(`${OUT}/icon-512.png`);

const adaptiveForeground = wrap(mark({ c: 512, r: 250, stroke: 42, dotR: 56 }), 1024);
await sharp(Buffer.from(adaptiveForeground)).png().toFile(`${OUT}/adaptive-icon.png`);

const monochrome = wrap(mark({ ring: '#FFFFFF', dot: '#FFFFFF', c: 512, r: 250, stroke: 42, dotR: 56 }), 1024);
await sharp(Buffer.from(monochrome)).png().toFile(`${OUT}/monochrome-icon.png`);

const splashLight = wrap(mark({ ring: '#1A1712', dot: ACCENT, c: 256, r: 150, stroke: 26, dotR: 34 }), 512);
await sharp(Buffer.from(splashLight)).png().toFile(`${OUT}/splash-light.png`);

const splashDark = wrap(mark({ ring: CREAM, dot: ACCENT, c: 256, r: 150, stroke: 26, dotR: 34 }), 512);
await sharp(Buffer.from(splashDark)).png().toFile(`${OUT}/splash-dark.png`);

const favicon = wrap(
  `${mark({ c: 256, r: 150, stroke: 26, dotR: 34 })}`,
  512,
  INK,
).replace('<rect width="512" height="512"', '<rect rx="116" width="512" height="512"');
await sharp(Buffer.from(favicon)).resize(128, 128).png().toFile(`${OUT}/favicon.png`);

console.log('Brand assets written to assets/');
