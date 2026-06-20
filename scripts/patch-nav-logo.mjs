import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = join(root, 'index.html');
let html = readFileSync(htmlPath, 'utf8');

const navLogoCss = `
  nav .nav-logo {
    height: 34px;
    width: auto;
    display: block;
  }
`;

if (!html.includes('nav .nav-logo')) {
  html = html.replace('  .nav-cta {', `${navLogoCss}\n  .nav-cta {`);
}

html = html.replace(
  /<nav>\s*<img src="data:image\/png;base64,[^"]+"[^>]*>/s,
  '<nav>\n  <a href="#" aria-label="Parkle home"><img class="nav-logo" src="parkle-logo-nav.png" alt="Parkle" /></a>'
);

writeFileSync(htmlPath, html, 'utf8');
console.log('Updated index.html nav logo');
