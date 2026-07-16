import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const html = read('index.html');
const styles = read('styles.css');
const script = read('script.js');
const vercel = JSON.parse(read('vercel.json'));
const manifest = JSON.parse(read('public/site.webmanifest'));
const packageJson = JSON.parse(read('package.json'));
const dom = new JSDOM(html);
const { document } = dom.window;
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
assert(duplicateIds.length === 0, `Dubbele HTML-id's: ${[...new Set(duplicateIds)].join(', ')}`);

for (const link of document.querySelectorAll('a[href^="#"]')) {
  const id = decodeURIComponent(link.getAttribute('href').slice(1));
  assert(!id || document.getElementById(id), `Interne link mist doel: #${id}`);
}

for (const button of document.querySelectorAll('button')) {
  assert(button.hasAttribute('type'), `Button zonder expliciet type: ${button.textContent.trim().slice(0, 40)}`);
}

for (const control of document.querySelectorAll('input, select, textarea')) {
  if (control.getAttribute('type') === 'hidden') continue;
  const labelled = control.closest('label')
    || (control.id && document.querySelector(`label[for="${control.id}"]`))
    || control.hasAttribute('aria-label')
    || control.hasAttribute('aria-labelledby');
  assert(labelled, `Formulierveld zonder label: ${control.outerHTML.slice(0, 90)}`);
}

for (const image of document.querySelectorAll('img')) {
  assert(image.hasAttribute('alt'), `Afbeelding zonder alt: ${image.getAttribute('src')}`);
  assert(image.hasAttribute('width') && image.hasAttribute('height'), `Afbeelding zonder afmetingen: ${image.getAttribute('src')}`);
}

for (const button of document.querySelectorAll('[data-copy-target]')) {
  assert(document.getElementById(button.dataset.copyTarget), `Kopieerdoel ontbreekt: ${button.dataset.copyTarget}`);
}

const resolveLocalAsset = (url) => {
  const clean = url.split(/[?#]/)[0];
  if (clean.startsWith('./assets/')) return join(root, clean.slice(2));
  if (clean.startsWith('./')) {
    const sourceFile = join(root, clean.slice(2));
    return existsSync(sourceFile) ? sourceFile : join(root, 'public', clean.slice(2));
  }
  if (clean.startsWith('/')) return join(root, 'public', clean.slice(1));
  return null;
};

for (const element of document.querySelectorAll('img[src], script[src], link[href], a[href]')) {
  const url = element.getAttribute('src') || element.getAttribute('href');
  if (!url || url.startsWith('#') || /^(https?:|mailto:|data:)/.test(url)) continue;
  const target = resolveLocalAsset(url);
  if (target) assert(existsSync(target), `Lokaal bestand ontbreekt: ${url}`);
}

const meta = (selector) => document.querySelector(selector)?.getAttribute('content') || '';
assert(document.documentElement.lang === 'nl', 'Standaard documenttaal moet Nederlands zijn.');
assert(document.querySelector('.skip-link[href="#main-content"]'), 'Skiplink naar de hoofdinhoud ontbreekt.');
assert(document.querySelector('noscript'), 'Noscript-uitleg ontbreekt.');
assert(meta('meta[name="description"]').length >= 120, 'Metabeschrijving is te kort.');
assert(meta('meta[name="robots"]').includes('max-image-preview:large'), 'Uitgebreide robotsmetadata ontbreekt.');
assert(meta('meta[property="og:image"]') === 'https://www.codingfordommies.quest/og.png', 'Open Graph-afbeelding ontbreekt of is niet absoluut.');
assert(meta('meta[name="twitter:card"]') === 'summary_large_image', 'Twitter-cardmetadata ontbreekt.');
assert(document.querySelector('link[rel="canonical"]')?.href === 'https://www.codingfordommies.quest/', 'Canonical URL klopt niet.');
assert(document.querySelector('link[rel="manifest"]'), 'Webmanifestkoppeling ontbreekt.');

const structuredData = document.querySelector('script[type="application/ld+json"]');
try {
  const data = JSON.parse(structuredData?.textContent || '');
  assert(data['@type'] === 'Course' && data.isAccessibleForFree === true, 'Course structured data is onvolledig.');
} catch {
  errors.push('Structured data is geen geldige JSON.');
}

const inlineExecutableScripts = [...document.querySelectorAll('script:not([src])')]
  .filter((element) => element.type !== 'application/ld+json' && element.textContent.trim());
assert(inlineExecutableScripts.length === 0, 'Inline uitvoerbare JavaScript verhindert een strikte CSP.');
assert(![...document.querySelectorAll('*')].some((element) => [...element.attributes].some((attribute) => attribute.name.startsWith('on'))), 'Inline eventhandlers zijn niet toegestaan.');

assert(styles.includes('.skip-link') && styles.includes(':focus-visible'), 'Skiplink- of focusstijl ontbreekt.');
assert(styles.includes('@media (prefers-reduced-motion: reduce)'), 'Reduced-motionondersteuning ontbreekt.');
const scriptWithoutStorageWrapper = script.replace(/const safeStorage = \{[\s\S]*?\n\};/, '');
assert(!scriptWithoutStorageWrapper.includes('localStorage'), 'script.js gebruikt nog onbeschermde localStorage-aanroepen.');

const allHeaders = vercel.headers?.find((entry) => entry.source === '/(.*)')?.headers || [];
const headerMap = Object.fromEntries(allHeaders.map(({ key, value }) => [key.toLowerCase(), value]));
const structuredDataHash = `sha256-${createHash('sha256').update(structuredData?.textContent || '').digest('base64')}`;
assert(headerMap['content-security-policy']?.includes("default-src 'self'"), 'Content-Security-Policy ontbreekt.');
assert(headerMap['content-security-policy']?.includes("frame-ancestors 'none'"), 'CSP blokkeert framing nog niet.');
assert(headerMap['content-security-policy']?.includes(`'${structuredDataHash}'`), 'CSP-hash voor structured data klopt niet.');
assert(headerMap['strict-transport-security']?.includes('max-age='), 'HSTS ontbreekt.');
assert(headerMap['x-content-type-options'] === 'nosniff', 'nosniff-header ontbreekt.');
assert(headerMap['x-frame-options'] === 'DENY', 'X-Frame-Options ontbreekt.');

assert(manifest.name.includes('CodingForDommies') && manifest.start_url === '/', 'Webmanifest is onvolledig.');
assert(packageJson.scripts['release:check'], 'release:check-script ontbreekt.');
assert(existsSync(join(root, 'public/404.html')), '404-pagina ontbreekt.');
assert(existsSync(join(root, 'public/og.png')), 'Social-previewafbeelding ontbreekt.');
assert(statSync(join(root, 'public/og.png')).size < 1_500_000, 'Social-previewafbeelding is groter dan 1,5 MB.');
assert(statSync(join(root, 'assets/crud-blueprint.webp')).size < 300_000, 'Hero-afbeelding is groter dan 300 KB.');

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
for (const filename of ['studenten-crud.zip', 'php-mysql-crud.zip', 'javascript-sqlite-crud.zip']) {
  const source = join(root, 'downloads', filename);
  const publicCopy = join(root, 'public', 'downloads', filename);
  assert(existsSync(source) && existsSync(publicCopy), `Download ontbreekt: ${filename}`);
  if (existsSync(source) && existsSync(publicCopy)) {
    assert(sha256(source) === sha256(publicCopy), `Publieke download wijkt af: ${filename}`);
  }
}

const normalize = (value) => value.replace(/\r\n/g, '\n');
assert(
  normalize(read('starter/javascript-sqlite-crud/backend/server.js')) === normalize(read('public/code/js-server.js.txt')),
  'De JavaScript-codebank wijkt af van de downloadstarter.',
);

const sitemap = read('public/sitemap.xml');
assert(sitemap.includes('https://www.codingfordommies.quest/</loc>'), 'Nederlandse hoofd-URL ontbreekt in sitemap.');
assert(sitemap.includes('/advanced</loc>'), 'Gevorderde pagina ontbreekt in sitemap.');
assert(!sitemap.includes('?lang='), 'Sitemap bevat nog een oude taal-query-URL.');
assert(read('public/robots.txt').includes('https://www.codingfordommies.quest/sitemap.xml'), 'robots.txt verwijst niet naar de sitemap.');

if (errors.length) {
  console.error(`Releasecontrole mislukt met ${errors.length} punt(en):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Release metadata + links + toegankelijkheidsbasis + security + assets: PASS');
