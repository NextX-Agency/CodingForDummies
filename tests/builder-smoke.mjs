import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const phpStarter = readFileSync(new URL('../public/code/index.php.txt', import.meta.url), 'utf8');
const jsServerStarter = readFileSync(new URL('../public/code/js-server.js.txt', import.meta.url), 'utf8');
const jsHtmlStarter = readFileSync(new URL('../public/code/js-index.html.txt', import.meta.url), 'utf8');
const jsAppStarter = readFileSync(new URL('../public/code/js-app.js.txt', import.meta.url), 'utf8');
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

if (!window.document.body.classList.contains('beginner-mode')) {
  throw new Error('Beginnerstand staat niet standaard aan.');
}

const beginnerCodeBlocks = [...window.document.querySelectorAll('.beginner-code')];
if (beginnerCodeBlocks.length < 20 || beginnerCodeBlocks.some((block) => !block.querySelector('.beginner-code-guide'))) {
  throw new Error('Niet alle grote codeblokken krijgen eerst een beginnersuitleg.');
}

const toggleTestBlock = beginnerCodeBlocks.find((block) => !block.classList.contains('is-code-open'));
const firstCodeToggle = toggleTestBlock.querySelector('[data-code-toggle]');
firstCodeToggle.click();
if (!toggleTestBlock.classList.contains('is-code-open') || firstCodeToggle.getAttribute('aria-expanded') !== 'true') {
  throw new Error('Code kan niet bewust worden getoond vanuit de beginnersuitleg.');
}

const beginnerToggle = window.document.querySelector('[data-beginner-toggle]');
beginnerToggle.click();
if (window.document.body.classList.contains('beginner-mode') || window.localStorage.getItem('cfd-beginner-mode') !== 'false') {
  throw new Error('Beginnerstand kan niet worden uitgeschakeld of onthouden.');
}
beginnerToggle.click();

if (window.document.querySelectorAll('.command-guide').length !== window.document.querySelectorAll('.mini-code').length) {
  throw new Error('Terminalopdrachten krijgen niet allemaal een uitleg.');
}

const snippetWizardChoice = window.document.querySelector('[data-snippet-pick="snippet-upload"]');
snippetWizardChoice.click();
if (!window.document.getElementById('snippet-upload').closest('.snippet-item').open
  || !window.document.querySelector('[data-snippet-advice]').textContent.includes('Een foto laten uploaden')) {
  throw new Error('De taakgerichte functiekiezer opent niet het juiste beginnersrecept.');
}

const anatomyDatabaseButton = window.document.querySelector('[data-anatomy-file="database"]');
anatomyDatabaseButton.click();
if (!window.document.querySelector('[data-anatomy-path]').textContent.includes('config\\database.php')
  || window.document.querySelectorAll('[data-anatomy-zones] li').length !== 5) {
  throw new Error('De interactieve PHP-bestandskaart legt de gekozen bestandsstructuur niet uit.');
}

const createGuide = window.document.getElementById('create-code').closest('.code-block').querySelector('.beginner-code-guide').textContent;
if (!createGuide.includes("case 'create_student':") || !createGuide.includes('studenten-crud/index.php')) {
  throw new Error('Het Create-blok noemt geen exact bestand en zoekanker.');
}

const normalizePhpBlock = (value) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join('\n');
const normalizedStarter = normalizePhpBlock(phpStarter);
for (const id of ['create-code', 'read-code', 'update-code', 'delete-code']) {
  const source = normalizePhpBlock(window.document.getElementById(id).textContent);
  if (!normalizedStarter.includes(source)) {
    throw new Error(`${id} komt niet letterlijk overeen met het werkende PHP-starterbestand.`);
  }
}

if (!styles.includes('.stack-choice.is-recommended { border: 1px solid var(--line); background: transparent; }')) {
  throw new Error('Route A heeft nog steeds een permanente geselecteerde rand.');
}

const builder = window.document.querySelector('[data-crud-builder]');
const code = () => builder.querySelector('[data-builder-code]').textContent;
const clickTab = (name) => builder.querySelector(`[data-builder-tab="${name}"]`).click();
const change = (element, value) => {
  element.value = value;
  element.dispatchEvent(new window.Event('change', { bubbles: true }));
};

clickTab('sql');
if (!code().includes('CREATE TABLE IF NOT EXISTS producten')) {
  throw new Error('Standaard SQLite-schema is niet gegenereerd.');
}

clickTab('form');
if (!code().includes('name="prijs"') || !code().includes('type="number"')) {
  throw new Error('HTML-formulier bevat niet de verwachte productvelden.');
}
const phpViewCode = code();
if (!phpViewCode.includes('foreach ($rows as $row)') || !phpViewCode.includes('update_product') || !phpViewCode.includes('delete_product')) {
  throw new Error('PHP-builder maakt geen compleet overzicht met Update en Delete.');
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
  const phpViewFile = join(temporaryDirectory, 'generated-view.php');
  writeFileSync(phpViewFile, `<?php\n$rows = [];\nfunction e($value) { return $value; }\nfunction csrf_token() { return ''; }\n?>\n${phpViewCode}`, 'utf8');
  execFileSync('php', ['-l', phpViewFile], { stdio: 'pipe' });
  const integratedPhp = phpStarter
    .replace("if ($_SERVER['REQUEST_METHOD'] === 'POST') {", `${phpCode}\n\nif ($_SERVER['REQUEST_METHOD'] === 'POST') {`)
    .replace('    <footer><span>Campus Admin', `${phpViewCode}\n\n    <footer><span>Campus Admin`);
  const integratedPhpFile = join(temporaryDirectory, 'integrated-starter.php');
  writeFileSync(integratedPhpFile, integratedPhp, 'utf8');
  execFileSync('php', ['-l', integratedPhpFile], { stdio: 'pipe' });
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
clickTab('form');
const javascriptViewCode = code();
if (!javascriptViewCode.includes('id="product-form"') || !javascriptViewCode.includes('id="producten-rows"')) {
  throw new Error('JavaScript-builder maakt geen passend formulier en overzicht.');
}
clickTab('backend');
const javascriptCode = code();
if (!javascriptCode.includes("app.post('/api/producten'") || !javascriptCode.includes("app.delete('/api/producten/:id'")) {
  throw new Error('JavaScript CRUD-routes zijn niet compleet.');
}
new Function(javascriptCode);

clickTab('frontend');
const javascriptFrontendCode = code();
if (!javascriptFrontendCode.includes('loadProductRows') || !javascriptFrontendCode.includes("method: 'DELETE'")) {
  throw new Error('JavaScript-builder maakt geen complete browsercode voor Read en Delete.');
}
new Function(javascriptFrontendCode);

const integratedServer = jsServerStarter.replace('app.use((error, req, res, next) => {', `${javascriptCode}\n\napp.use((error, req, res, next) => {`);
const integratedApp = `${jsAppStarter}\n\n${javascriptFrontendCode}`;
const integratedHtml = jsHtmlStarter.replace('    </main>', `${javascriptViewCode}\n\n    </main>`);
new Function(integratedServer);
new Function(integratedApp);
if (!integratedHtml.includes('id="product-form"')) {
  throw new Error('Het JavaScript-formulier kan niet via het genoemde anker worden geplaatst.');
}

clickTab('steps');
if (!code().includes('Ctrl+F: app.use((error') || !code().includes('frontend/app.js')) {
  throw new Error('Het JavaScript-plakplan noemt niet de exacte bestanden en zoekankers.');
}

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

const sqliteRoute = window.document.querySelector('[data-route-choice="php-sqlite"]');
const mysqlRoute = window.document.querySelector('[data-route-choice="php-mysql"]');
const javascriptRoute = window.document.querySelector('[data-route-choice="js-sqlite"]');
const routeFocus = window.document.querySelector('[data-route-focus]');

if (![sqliteRoute, mysqlRoute, javascriptRoute].every((choice) => choice.tagName === 'BUTTON')) {
  throw new Error('Niet alle bouwroutes zijn toetsenbordvriendelijke knoppen.');
}

sqliteRoute.click();
if (sqliteRoute.getAttribute('aria-pressed') !== 'true' || window.document.querySelector('[data-route-result]').hidden) {
  throw new Error('PHP + SQLite kan niet als actieve route worden gekozen.');
}
if (window.document.querySelector('#database').hidden || !window.document.querySelector('#mysql-route').hidden || !window.document.querySelector('#javascript-route').hidden) {
  throw new Error('Routefocus toont niet alleen de PHP + SQLite-hoofdstukken.');
}
if (window.document.querySelector('[data-progress-total]').textContent !== '8') {
  throw new Error('De voortgang is niet aangepast aan PHP + SQLite.');
}
if (stack.value !== 'php-sqlite' || window.document.querySelector('.header-cta').getAttribute('href') !== './downloads/studenten-crud.zip') {
  throw new Error('Builder of download volgt de gekozen SQLite-route niet.');
}

routeFocus.checked = false;
routeFocus.dispatchEvent(new window.Event('change', { bubbles: true }));
if ([...window.document.querySelectorAll('[data-route-section]')].some((section) => section.hidden)) {
  throw new Error('“Toon alle routes” maakt niet alle hoofdstukken zichtbaar.');
}

routeFocus.checked = true;
routeFocus.dispatchEvent(new window.Event('change', { bubbles: true }));
javascriptRoute.click();
if (!window.document.querySelector('#xampp').hidden || window.document.querySelector('#javascript-route').hidden) {
  throw new Error('De JavaScript-route filtert de PHP-hoofdstukken niet goed.');
}
if (window.document.querySelector('[data-progress-total]').textContent !== '5' || stack.value !== 'js-sqlite') {
  throw new Error('JavaScript-voortgang of buildertechniek is niet routespecifiek.');
}
if (window.document.querySelectorAll('[data-personal-route] li').length < 6) {
  throw new Error('Het persoonlijke JavaScript-stappenplan is te kort of ontbreekt.');
}
if (window.document.querySelectorAll('[data-route-choice].is-selected').length !== 1 || !javascriptRoute.classList.contains('is-selected')) {
  throw new Error('Meer dan één route blijft visueel geselecteerd.');
}
if (window.localStorage.getItem('cfd-selected-route') !== 'js-sqlite') {
  throw new Error('De gekozen route wordt niet onthouden.');
}

window.document.querySelector('[data-recommend-route="php-mysql"]').click();
if (mysqlRoute.getAttribute('aria-pressed') !== 'true' || !window.document.querySelector('#database').hidden || window.document.querySelector('#mysql-route').hidden) {
  throw new Error('De snelle keuzehulp activeert PHP + MySQL niet correct.');
}

console.log('CRUD-builder + snippets + interactieve bouwroutes: PASS');
