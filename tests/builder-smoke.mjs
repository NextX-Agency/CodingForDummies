import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});

const { window } = dom;

window.IntersectionObserver = class {
  observe() {}
  disconnect() {}
};
window.fetch = async () => ({ ok: true, text: async () => '// testbestand' });
window.navigator.clipboard = { writeText: async () => {} };
window.HTMLElement.prototype.scrollIntoView = () => {};
window.HTMLDialogElement.prototype.showModal = function showModal() {
  this.setAttribute('open', '');
};
window.HTMLDialogElement.prototype.close = function close() {
  this.removeAttribute('open');
};

window.eval(script);
await new Promise((resolve) => window.setTimeout(resolve, 0));

const builder = window.document.querySelector('[data-crud-builder]');
const code = () => builder.querySelector('[data-builder-code]').textContent;
const clickTab = (name) => builder.querySelector(`[data-builder-tab="${name}"]`).click();
const change = (element, value) => {
  element.value = value;
  element.dispatchEvent(new window.Event('change', { bubbles: true }));
};

if (!code().includes('CREATE TABLE IF NOT EXISTS producten')) {
  throw new Error('Standaard SQLite-schema is niet gegenereerd.');
}

clickTab('form');
if (!code().includes('name="prijs"') || !code().includes('type="number"')) {
  throw new Error('HTML-formulier bevat niet de verwachte productvelden.');
}

clickTab('backend');
const phpCode = code();
if (!phpCode.includes("INSERT INTO producten") || !phpCode.includes("DELETE FROM producten")) {
  throw new Error('PHP CRUD-blok is niet compleet.');
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'cfd-builder-'));
try {
  const phpFile = join(temporaryDirectory, 'generated.php');
  writeFileSync(phpFile, `<?php\n${phpCode}`, 'utf8');
  execFileSync('php', ['-l', phpFile], { stdio: 'pipe' });
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

const stack = builder.querySelector('[data-builder-stack]');
change(stack, 'php-mysql');
clickTab('sql');
if (!code().includes('AUTO_INCREMENT') || !code().includes('ENGINE=InnoDB')) {
  throw new Error('MySQL-schema is niet correct gegenereerd.');
}

change(stack, 'js-sqlite');
clickTab('backend');
const javascriptCode = code();
if (!javascriptCode.includes("app.post('/api/producten'") || !javascriptCode.includes("app.delete('/api/producten/:id'")) {
  throw new Error('JavaScript CRUD-routes zijn niet compleet.');
}
new Function(javascriptCode);

builder.querySelector('[data-add-field]').click();
if (builder.querySelectorAll('[data-builder-field-row]').length !== 6) {
  throw new Error('Veld toevoegen werkt niet.');
}

const preset = builder.querySelector('[data-builder-preset]');
const generatedDirectory = mkdtempSync(join(tmpdir(), 'cfd-presets-'));
try {
  for (const presetName of ['products', 'books', 'employees', 'appointments', 'vehicles']) {
    change(preset, presetName);

    change(stack, 'php-sqlite');
    clickTab('backend');
    const generatedPhp = join(generatedDirectory, `${presetName}.php`);
    writeFileSync(generatedPhp, `<?php\n${code()}`, 'utf8');
    execFileSync('php', ['-l', generatedPhp], { stdio: 'pipe' });

    change(stack, 'js-sqlite');
    clickTab('backend');
    new Function(code());
  }

  change(preset, 'custom');
  const label = builder.querySelector('[data-field-key="label"]');
  label.value = "Klant's <naam>";
  label.dispatchEvent(new window.Event('input', { bubbles: true }));

  change(stack, 'php-sqlite');
  clickTab('backend');
  const customPhp = join(generatedDirectory, 'custom.php');
  writeFileSync(customPhp, `<?php\n${code()}`, 'utf8');
  execFileSync('php', ['-l', customPhp], { stdio: 'pipe' });

  clickTab('form');
  if (!code().includes('Klant&#39;s &lt;naam&gt;')) {
    throw new Error('Speciale tekens worden niet veilig in HTML gezet.');
  }
} finally {
  rmSync(generatedDirectory, { recursive: true, force: true });
}

const phpFilter = window.document.querySelector('[data-snippet-filter="php"]');
phpFilter.click();
const wrongSnippetVisible = [...window.document.querySelectorAll('.snippet-item')]
  .some((item) => !item.hidden && !item.dataset.snippetTags.split(' ').includes('php'));
if (wrongSnippetVisible) {
  throw new Error('Snippetfilter toont een verkeerde categorie.');
}

const snippetDirectory = mkdtempSync(join(tmpdir(), 'cfd-snippets-'));
try {
  for (const snippetId of ['snippet-detail-php', 'snippet-login', 'snippet-upload', 'snippet-csv', 'snippet-csv-import', 'snippet-transaction']) {
    const snippet = window.document.getElementById(snippetId).textContent;
    const phpStart = snippet.indexOf('<?php');
    const phpSource = phpStart >= 0 ? snippet.slice(phpStart) : `<?php\n${snippet}`;
    const filename = join(snippetDirectory, `${snippetId}.php`);
    writeFileSync(filename, phpSource, 'utf8');
    execFileSync('php', ['-l', filename], { stdio: 'pipe' });
  }
  new Function(window.document.getElementById('snippet-detail-js').textContent);
} finally {
  rmSync(snippetDirectory, { recursive: true, force: true });
}

console.log('CRUD-builder + snippetfilters: PASS');
