import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { JSDOM } from 'jsdom';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const indexPath = join(dist, 'index.html');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

assert(existsSync(indexPath), 'dist/index.html ontbreekt.');
if (existsSync(indexPath)) {
  const html = readFileSync(indexPath, 'utf8');
  const document = new JSDOM(html).window.document;
  const localUrls = [
    ...[...document.querySelectorAll('script[src], img[src]')].map((element) => element.getAttribute('src')),
    ...[...document.querySelectorAll('link[href]')].map((element) => element.getAttribute('href')),
  ].filter((url) => url && !/^(https?:|data:)/.test(url));

  for (const url of localUrls) {
    const clean = url.split(/[?#]/)[0].replace(/^\.\//, '').replace(/^\//, '');
    assert(existsSync(join(dist, clean)), `Productiebestand ontbreekt: ${url}`);
  }

  assert(gzipSync(html).length < 75_000, 'Gzip-budget voor index.html is overschreden (75 KB).');
  assert(!html.includes('crud-blueprint.png'), 'Productie verwijst nog naar de zware PNG-hero.');
  assert(html.includes('https://www.codingfordommies.quest/og.png'), 'Productie mist de absolute social-preview-URL.');
}

for (const required of [
  '404.html', '404.css', 'theme-init.js', 'site.webmanifest', 'og.png', 'robots.txt', 'sitemap.xml',
  'downloads/studenten-crud.zip', 'downloads/php-mysql-crud.zip', 'downloads/javascript-sqlite-crud.zip',
]) {
  assert(existsSync(join(dist, required)), `Publiek releasebestand ontbreekt in dist: ${required}`);
}

const assetsDirectory = join(dist, 'assets');
if (existsSync(assetsDirectory)) {
  const assets = readdirSync(assetsDirectory);
  const js = assets.find((filename) => filename.endsWith('.js'));
  const css = assets.find((filename) => filename.endsWith('.css'));
  const hero = assets.find((filename) => filename.startsWith('crud-blueprint-') && filename.endsWith('.webp'));
  assert(js, 'Gebundelde JavaScript ontbreekt.');
  assert(css, 'Gebundelde CSS ontbreekt.');
  assert(hero, 'Geoptimaliseerde WebP-hero ontbreekt.');
  if (js) assert(gzipSync(readFileSync(join(assetsDirectory, js))).length < 45_000, 'Gzip-budget voor JavaScript is overschreden (45 KB).');
  if (css) assert(gzipSync(readFileSync(join(assetsDirectory, css))).length < 25_000, 'Gzip-budget voor CSS is overschreden (25 KB).');
  if (hero) assert(statSync(join(assetsDirectory, hero)).size < 300_000, 'Hero-budget is overschreden (300 KB).');
}

if (errors.length) {
  console.error(`Productiecontrole mislukt met ${errors.length} punt(en):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Productiebundel + releasebestanden + omvangbudgetten: PASS');
