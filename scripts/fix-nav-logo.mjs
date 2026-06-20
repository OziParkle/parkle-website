import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sharpPath = join(root, '..', 'parkle-app', 'node_modules', 'sharp', 'lib', 'index.js');
const { default: sharp } = await import(pathToFileURL(sharpPath).href);
const htmlPath = join(root, 'index.html');
const PAGE_BG = { r: 10, g: 10, b: 10, alpha: 255 };
const TOLERANCE = 36;

function isBackground(r, g, b) {
  // Logo was exported on pure black; page uses #0A0A0A.
  if (r <= TOLERANCE && g <= TOLERANCE && b <= TOLERANCE) return true;
  return (
    Math.abs(r - PAGE_BG.r) <= 8 &&
    Math.abs(g - PAGE_BG.g) <= 8 &&
    Math.abs(b - PAGE_BG.b) <= 8
  );
}

function extractNavLogoB64(html) {
  const match = html.match(/<nav>\s*<img src="data:image\/png;base64,([^"]+)"/s);
  if (!match) throw new Error('Nav logo not found');
  return match[1];
}

async function main() {
  const html = readFileSync(htmlPath, 'utf8');
  const raw = Buffer.from(extractNavLogoB64(html), 'base64');
  writeFileSync(join(root, 'nav-logo-original.png'), raw);

  const meta = await sharp(raw).metadata();
  console.log('Original:', meta.width, 'x', meta.height);

  const { data, info } = await sharp(raw).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const corners = [
    [0, 0],
    [info.width - 1, 0],
    [0, info.height - 1],
    [info.width - 1, info.height - 1],
  ];
  for (const [x, y] of corners) {
    const i = (y * info.width + x) * 4;
    console.log(`Corner (${x},${y}):`, data[i], data[i + 1], data[i + 2], data[i + 3]);
  }

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isBackground(r, g, b)) {
      data[i + 3] = 0;
    }
  }

  const outPath = join(root, 'parkle-logo-nav.png');
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize(140, null, { fit: 'inside' })
    .png()
    .toFile(outPath);

  const outMeta = await sharp(outPath).metadata();
  console.log('Saved:', outPath, `${outMeta.width}x${outMeta.height}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
