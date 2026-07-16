import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const englishLocale = readFileSync(new URL('../public/translations-en.js', import.meta.url), 'utf8');
const phpStarter = readFileSync(new URL('../public/code/index.php.txt', import.meta.url), 'utf8');
const jsServerStarter = readFileSync(new URL('../public/code/js-server.js.txt', import.meta.url), 'utf8');
const jsHtmlStarter = readFileSync(new URL('../public/code/js-index.html.txt', import.meta.url), 'utf8');
const jsAppStarter = readFileSync(new URL('../public/code/js-app.js.txt', import.meta.url), 'utf8');
const jsdomErrors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => jsdomErrors.push(error));
const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole,
});

const { window } = dom;

window.IntersectionObserver = class {
  observe() {}
  disconnect() {}
};
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.fetch = async () => ({ ok: true, text: async () => '// testbestand' });
window.navigator.clipboard = { writeText: async () => {} };
window.HTMLElement.prototype.scrollIntoView = () => {};
window.HTMLDialogElement.prototype.showModal = function showModal() {
  this.setAttribute('open', '');
};
window.HTMLDialogElement.prototype.close = function close() {
  this.removeAttribute('open');
};

window.eval(englishLocale);
window.eval(script);
await new Promise((resolve) => window.setTimeout(resolve, 0));

if (!window.document.body.classList.contains('beginner-mode')) {
  throw new Error('Beginnerstand staat niet standaard aan.');
}

const beginnerCodeBlocks = [...window.document.querySelectorAll('.beginner-code')];
if (beginnerCodeBlocks.length < 20 || beginnerCodeBlocks.some((block) => !block.querySelector('.beginner-code-guide'))) {
  throw new Error('Niet alle grote codeblokken krijgen eerst een beginnersuitleg.');
}

if (window.document.querySelector('[data-code-toggle]') || beginnerCodeBlocks.some((block) => !block.querySelector('pre') || !block.querySelector('.code-toolbar button'))) {
  throw new Error('Code en kopieerknoppen moeten zonder een extra “Toon code”-stap direct beschikbaar zijn.');
}
if (styles.includes('.beginner-code:not(.is-code-open)') || styles.includes('visibility: hidden')) {
  throw new Error('Beginnersmodus verbergt nog code of een kopieerknop.');
}

const siteHeader = window.document.querySelector('.site-header');
if (!siteHeader.querySelector('.header-utilities')
  || siteHeader.querySelector('[data-header-route]')
  || siteHeader.querySelector('kbd')
  || siteHeader.querySelector('[data-theme-toggle]').textContent.trim()
  || siteHeader.querySelector('.header-cta').textContent.trim() !== 'Starter'
  || !styles.includes('min-height: 64px')) {
  throw new Error('De header is niet teruggebracht tot compacte navigatie, utilities en één starter-CTA.');
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

if (!phpStarter.includes(window.document.getElementById('php-style-link').textContent)
  || !phpStarter.includes(window.document.getElementById('php-script-link').textContent)
  || !jsHtmlStarter.includes(window.document.getElementById('js-style-link').textContent)
  || !jsHtmlStarter.includes(window.document.getElementById('js-script-link').textContent)) {
  throw new Error('De frontend-koppelregels wijzen niet letterlijk naar de echte starterbestanden.');
}

const jsFrontendTab = window.document.querySelector('[data-frontend-tab="js"]');
jsFrontendTab.click();
if (window.document.querySelector('[data-frontend-panel="js"]').hidden
  || !window.document.querySelector('[data-frontend-panel="php"]').hidden
  || jsFrontendTab.getAttribute('aria-selected') !== 'true') {
  throw new Error('De PHP/JavaScript-frontendwerkbank wisselt niet van route.');
}

const phpEmailField = window.document.querySelector('[data-field-connection="php"] [data-field-example="email"]');
phpEmailField.click();
if (!window.document.querySelector('[data-field-connection="php"] [data-chain-value="output"]').textContent.includes("$student['email']")) {
  throw new Error('De veldketen koppelt HTML, backend, database en uitvoer niet interactief.');
}

const createGuide = window.document.getElementById('create-code').closest('.code-block').querySelector('.beginner-code-guide').textContent;
if (!createGuide.includes("case 'create_student':") || !createGuide.includes('studenten-crud/index.php')) {
  throw new Error('Het Create-blok noemt geen exact bestand en zoekanker.');
}

const createCrudTab = window.document.querySelector('[data-crud-tab="create"]');
const readCrudTab = window.document.querySelector('[data-crud-tab="read"]');
createCrudTab.focus();
createCrudTab.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
await new Promise((resolve) => window.setTimeout(resolve, 0));
if (window.document.activeElement !== readCrudTab
  || readCrudTab.getAttribute('aria-selected') !== 'true'
  || window.document.querySelector('[data-crud-panel="read"]').hidden) {
  throw new Error('CRUD-tabs ondersteunen geen pijltjestoetsen of correcte ARIA-status.');
}
createCrudTab.click();

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
const csrfToggle = builder.querySelector('[data-builder-csrf]');
const change = (element, value) => {
  element.value = value;
  element.dispatchEvent(new window.Event('change', { bubbles: true }));
};

if (!builder.querySelector('[data-builder-tab="complete"]').classList.contains('is-active')
  || builder.querySelector('[data-builder-tab="complete"]').getAttribute('aria-selected') !== 'true'
  || builder.querySelectorAll('[data-builder-tab]').length !== 7) {
  throw new Error('De CRUD-generator opent niet direct met de complete testapp.');
}
if (builder.querySelectorAll('[data-builder-operation]').length !== 4
  || [...builder.querySelectorAll('[data-builder-operation]')].some((input) => !input.checked)
  || !builder.querySelector('[data-builder-operation-summary]').textContent.includes('Create, Read, Update en Delete')) {
  throw new Error('De CRUD-generator start niet met vier afzonderlijk kiesbare CRUD-acties.');
}
if (!csrfToggle || csrfToggle.checked || builder.querySelector('[data-builder-csrf-option]').hidden) {
  throw new Error('CSRF is niet als zichtbare, standaard uitgeschakelde PHP-optie beschikbaar.');
}
const generatedTypeLabels = [...builder.querySelectorAll('.builder-data-type b')].map((element) => element.textContent);
if (!generatedTypeLabels.includes('float') || !generatedTypeLabels.includes('int') || !generatedTypeLabels.includes('bool → 0/1')) {
  throw new Error('De veldgenerator toont niet de echte PHP-datatypes int, float en bool.');
}
if (!builder.querySelector('[data-builder-test-title]').textContent.includes('PHP + SQLite')
  || builder.querySelectorAll('[data-builder-test-steps] li').length !== 4
  || !builder.querySelector('[data-builder-test-steps]').textContent.includes('index.php')) {
  throw new Error('De complete PHP + SQLite-app heeft geen direct zichtbaar testplan.');
}
const completePhpSqliteCode = code();
if (!completePhpSqliteCode.startsWith('<?php')
  || !completePhpSqliteCode.includes('<!DOCTYPE html>')
  || !completePhpSqliteCode.includes('CREATE TABLE IF NOT EXISTS producten')
  || !completePhpSqliteCode.includes('INSERT INTO producten')
  || !completePhpSqliteCode.includes('UPDATE producten SET')
  || !completePhpSqliteCode.includes('DELETE FROM producten')
  || !['// STAP', '<!-- STAP', '/* STAP', '-- Dit bestand'].every((comment) => completePhpSqliteCode.includes(comment))) {
  throw new Error('De standaard PHP-complete-app mist CRUD, HTML, CSS of uitlegcomments.');
}
if (completePhpSqliteCode.includes('function csrf_token')
  || completePhpSqliteCode.includes('verify_csrf(')
  || completePhpSqliteCode.includes('name="_token"')) {
  throw new Error('De standaard PHP-app bevat nog verplichte CSRF-code.');
}
const builderStackForComplete = builder.querySelector('[data-builder-stack]');
change(builderStackForComplete, 'php-mysql');
const completePhpMysqlCode = code();
if (!completePhpMysqlCode.includes('CREATE DATABASE IF NOT EXISTS producten_crud')
  || !completePhpMysqlCode.includes('mysql:host=127.0.0.1;dbname=producten_crud')
  || !builder.querySelector('[data-builder-test-title]').textContent.includes('PHP + MySQL')
  || !builder.querySelector('[data-builder-test-steps]').textContent.includes('Apache én MySQL')) {
  throw new Error('De complete PHP + MySQL-app maakt geen direct bruikbare XAMPP-verbinding.');
}
change(builderStackForComplete, 'php-sqlite');
csrfToggle.click();
const csrfProtectedPhpCode = code();
if (!csrfProtectedPhpCode.includes('function csrf_token(): string')
  || !csrfProtectedPhpCode.includes('function verify_csrf(mixed $token): void')
  || !csrfProtectedPhpCode.includes("verify_csrf($_POST['_token'] ?? null)")
  || !csrfProtectedPhpCode.includes('name="_token"')) {
  throw new Error('De optionele CSRF-keuze voegt niet alle afhankelijke PHP-onderdelen samen toe.');
}
csrfToggle.click();
for (const csrfFreeTab of ['complete', 'form', 'backend']) {
  clickTab(csrfFreeTab);
  if (code().includes('csrf_token(') || code().includes('verify_csrf(') || code().includes('name="_token"')) {
    throw new Error(`Tab ${csrfFreeTab} houdt een losse CSRF-afhankelijkheid over terwijl de optie uitstaat.`);
  }
}

clickTab('sql');
if (!code().includes('CREATE TABLE IF NOT EXISTS producten')) {
  throw new Error('Standaard SQLite-schema is niet gegenereerd.');
}

clickTab('form');
if (!code().includes('name="prijs"') || !code().includes('type="number"')) {
  throw new Error('HTML-formulier bevat niet de verwachte productvelden.');
}
const phpViewCode = code();
if (!phpViewCode.includes('foreach ($rows as $row)') || !phpViewCode.includes('update_product') || !phpViewCode.includes('delete_product') || !phpViewCode.includes('class="generated-crud')) {
  throw new Error('PHP-builder maakt geen compleet overzicht met Update en Delete.');
}

clickTab('css');
const generatedCss = code();
if (!generatedCss.includes('.generated-crud-layout') || !generatedCss.includes('.generated-field input') || !generatedCss.includes('@media (max-width: 850px)')) {
  throw new Error('Builder maakt geen complete, mobiele CSS-opmaak voor de gegenereerde HTML.');
}
for (const className of ['generated-crud', 'generated-crud-layout', 'generated-card', 'generated-form', 'generated-field', 'generated-primary', 'generated-list', 'generated-table-scroll']) {
  if (phpViewCode.includes(className) && !generatedCss.includes(`.${className}`)) {
    throw new Error(`De HTML-class ${className} wijst niet naar de gegenereerde CSS.`);
  }
}

clickTab('backend');
const phpCode = code();
if (!phpCode.includes("INSERT INTO producten") || !phpCode.includes("DELETE FROM producten")
  || !phpCode.includes('function read_product_int')
  || !phpCode.includes('function read_product_float')
  || !phpCode.includes('function read_product_bool')) {
  throw new Error('PHP CRUD-blok is niet compleet.');
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'cfd-builder-'));
try {
  const completeSqliteFile = join(temporaryDirectory, 'complete-sqlite.php');
  writeFileSync(completeSqliteFile, completePhpSqliteCode, 'utf8');
  execFileSync('php', ['-l', completeSqliteFile], { stdio: 'pipe' });
  const runCompletePhp = (filename, requestMethod, post = {}) => {
    const phpPost = Object.entries(post).map(([key, value]) => `${JSON.stringify(key)} => ${JSON.stringify(value)}`).join(', ');
    const requestSetup = `session_start();\n$_SERVER['REQUEST_METHOD'] = '${requestMethod}';\n$_POST = [${phpPost}];`;
    const runnableSource = completePhpSqliteCode.replace('session_start();', requestSetup);
    const runnableFile = join(temporaryDirectory, filename);
    writeFileSync(runnableFile, runnableSource, 'utf8');
    return execFileSync('php', [runnableFile], { encoding: 'utf8' });
  };
  runCompletePhp('complete-create.php', 'POST', {
    intent: 'create_product', naam: 'Testproduct', omschrijving: 'Eerste versie', prijs: '12.50', voorraad: '3', actief: '1'
  });
  if (!runCompletePhp('complete-read.php', 'GET').includes('Testproduct')) {
    throw new Error('De complete PHP-app kan een aangemaakt item niet opnieuw lezen.');
  }
  runCompletePhp('complete-update.php', 'POST', {
    intent: 'update_product', id: '1', naam: 'Gewijzigd product', omschrijving: 'Tweede versie', prijs: '14.00', voorraad: '5', actief: '1'
  });
  if (!runCompletePhp('complete-read-updated.php', 'GET').includes('Gewijzigd product')) {
    throw new Error('De complete PHP-app kan een item niet wijzigen.');
  }
  runCompletePhp('complete-delete.php', 'POST', { intent: 'delete_product', id: '1' });
  if (runCompletePhp('complete-read-deleted.php', 'GET').includes('Gewijzigd product')) {
    throw new Error('De complete PHP-app kan een testitem niet verwijderen.');
  }
  const completeMysqlFile = join(temporaryDirectory, 'complete-mysql.php');
  writeFileSync(completeMysqlFile, completePhpMysqlCode, 'utf8');
  execFileSync('php', ['-l', completeMysqlFile], { stdio: 'pipe' });
  const csrfProtectedFile = join(temporaryDirectory, 'complete-csrf.php');
  writeFileSync(csrfProtectedFile, csrfProtectedPhpCode, 'utf8');
  execFileSync('php', ['-l', csrfProtectedFile], { stdio: 'pipe' });
  const runProtectedPhp = (filename, token) => {
    const protectedPost = {
      _token: token,
      intent: 'create_product',
      naam: 'CSRF-testproduct',
      omschrijving: 'Beveiligde test',
      prijs: '8.50',
      voorraad: '2',
      actief: '1',
    };
    const phpPost = Object.entries(protectedPost).map(([key, value]) => `${JSON.stringify(key)} => ${JSON.stringify(value)}`).join(', ');
    const requestSetup = `session_start();\n$_SERVER['REQUEST_METHOD'] = 'POST';\n$_SESSION['_token'] = 'valid-token';\n$_POST = [${phpPost}];`;
    const runnableSource = csrfProtectedPhpCode.replace('session_start();', requestSetup);
    const runnableFile = join(temporaryDirectory, filename);
    writeFileSync(runnableFile, runnableSource, 'utf8');
    return execFileSync('php', [runnableFile], { encoding: 'utf8' });
  };
  runProtectedPhp('complete-csrf-valid.php', 'valid-token');
  if (!runProtectedPhp('complete-csrf-invalid.php', 'invalid-token').includes('De beveiligingscode is verlopen')) {
    throw new Error('De ingeschakelde CSRF-variant accepteert of meldt een ongeldig token niet correct.');
  }
  const phpFile = join(temporaryDirectory, 'generated.php');
  writeFileSync(phpFile, `<?php\n${phpCode}`, 'utf8');
  execFileSync('php', ['-l', phpFile], { stdio: 'pipe' });
  const phpViewFile = join(temporaryDirectory, 'generated-view.php');
  writeFileSync(phpViewFile, `<?php\n$rows = [];\nfunction e($value) { return $value; }\n?>\n${phpViewCode}`, 'utf8');
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
clickTab('complete');
const completeJavaScriptCode = code();
if (!completeJavaScriptCode.includes("app.listen(3000")
  || !completeJavaScriptCode.includes('<!DOCTYPE html>')
  || !completeJavaScriptCode.includes('CREATE TABLE IF NOT EXISTS producten')
  || !builder.querySelector('[data-builder-test-title]').textContent.includes('JavaScript + SQLite')
  || !builder.querySelector('[data-builder-test-steps]').textContent.includes('npm install express better-sqlite3')) {
  throw new Error('De complete JavaScript-app mist server, frontend of SQLite-tabel.');
}
if (!builder.querySelector('[data-builder-csrf-option]').hidden) {
  throw new Error('De PHP-specifieke CSRF-optie blijft onterecht zichtbaar bij JavaScript.');
}
new Function(completeJavaScriptCode);
clickTab('form');
const javascriptViewCode = code();
if (!javascriptViewCode.includes('id="product-create-form"') || !javascriptViewCode.includes('id="producten-rows"') || !javascriptViewCode.includes('class="generated-crud')) {
  throw new Error('JavaScript-builder maakt geen passend formulier en overzicht.');
}
clickTab('css');
if (!code().includes('.generated-crud') || builder.querySelector('[data-builder-file]').textContent !== 'frontend/style.css · onderaan') {
  throw new Error('JavaScript-builder wijst de CSS niet naar frontend/style.css.');
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
if (!integratedHtml.includes('id="product-create-form"')) {
  throw new Error('Het JavaScript-formulier kan niet via het genoemde anker worden geplaatst.');
}

const operationInputs = [...builder.querySelectorAll('[data-builder-operation]')];
const setOperations = (selected) => {
  operationInputs.forEach((input) => { input.checked = selected.includes(input.dataset.builderOperation); });
  operationInputs.find((input) => input.checked).dispatchEvent(new window.Event('change', { bubbles: true }));
};
const operationNames = ['create', 'read', 'update', 'delete'];
const operationTokens = {
  php: {
    create: 'INSERT INTO producten',
    read: "$rows = $db->query('SELECT * FROM producten",
    update: 'UPDATE producten SET',
    delete: 'DELETE FROM producten',
  },
  js: {
    create: "app.post('/api/producten'",
    read: "app.get('/api/producten'",
    update: "app.put('/api/producten/:id'",
    delete: "app.delete('/api/producten/:id'",
  },
};
const combinationDirectory = mkdtempSync(join(tmpdir(), 'cfd-operation-combinations-'));
try {
  for (let mask = 1; mask < 16; mask += 1) {
    const selected = operationNames.filter((name, index) => mask & (1 << index));
    setOperations(selected);

    change(stack, 'php-sqlite');
    clickTab('complete');
    const phpCombination = code();
    for (const operation of operationNames) {
      if (phpCombination.includes(operationTokens.php[operation]) !== selected.includes(operation)) {
        throw new Error(`PHP-combinatie ${selected.join('+')} bevat een verkeerde ${operation}-actie.`);
      }
    }
    const phpCombinationFile = join(combinationDirectory, `combination-${mask}.php`);
    writeFileSync(phpCombinationFile, phpCombination, 'utf8');
    execFileSync('php', ['-l', phpCombinationFile], { stdio: 'pipe' });

    csrfToggle.checked = true;
    csrfToggle.dispatchEvent(new window.Event('change', { bubbles: true }));
    const protectedCombination = code();
    const needsCsrf = selected.some((operation) => ['create', 'update', 'delete'].includes(operation));
    for (const csrfPart of ['function csrf_token(): string', 'function verify_csrf(mixed $token): void', "verify_csrf($_POST['_token'] ?? null)", 'name="_token"']) {
      if (protectedCombination.includes(csrfPart) !== needsCsrf) {
        throw new Error(`PHP-combinatie ${selected.join('+')} verwerkt de optionele CSRF-onderdelen niet consequent.`);
      }
    }
    const protectedCombinationFile = join(combinationDirectory, `combination-${mask}-csrf.php`);
    writeFileSync(protectedCombinationFile, protectedCombination, 'utf8');
    execFileSync('php', ['-l', protectedCombinationFile], { stdio: 'pipe' });
    csrfToggle.checked = false;
    csrfToggle.dispatchEvent(new window.Event('change', { bubbles: true }));

    change(stack, 'js-sqlite');
    clickTab('complete');
    const jsCombination = code();
    for (const operation of operationNames) {
      if (jsCombination.includes(operationTokens.js[operation]) !== selected.includes(operation)) {
        throw new Error(`JavaScript-combinatie ${selected.join('+')} bevat een verkeerde ${operation}-route.`);
      }
    }
    new Function(jsCombination);
  }
} finally {
  rmSync(combinationDirectory, { recursive: true, force: true });
}
setOperations(operationNames);
change(stack, 'js-sqlite');

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
  label.value = 'id';
  label.dispatchEvent(new window.Event('input', { bubbles: true }));
  if (builder.querySelector('[data-field-key="name"]').value !== 'eigen_id'
    || ![...builder.querySelector('[data-field-key="type"]').options].some((option) => option.value === 'datetime')
    || ![...builder.querySelector('[data-field-key="type"]').options].some((option) => option.value === 'url')) {
    throw new Error('Veldnamen synchroniseren niet veilig of de uitgebreide datatypes ontbreken.');
  }
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

  builder.querySelector('[data-add-field]').click();
  const customRows = [...builder.querySelectorAll('[data-builder-field-row]')];
  const duplicateName = customRows[1].querySelector('[data-field-key="name"]');
  duplicateName.value = customRows[0].querySelector('[data-field-key="name"]').value;
  duplicateName.dispatchEvent(new window.Event('input', { bubbles: true }));
  clickTab('backend');
  if (!code().includes('klant_s_naam_2')
    || !builder.querySelector('[data-builder-validation]').textContent.includes('dubbele naam')) {
    throw new Error('Dubbele databasnamen worden niet veilig hernoemd en uitgelegd.');
  }

  change(builder.querySelectorAll('[data-field-key="type"]')[0], 'datetime');
  change(builder.querySelectorAll('[data-field-key="type"]')[1], 'url');
  builder.querySelectorAll('[data-builder-field-row]')[1].querySelector('[data-field-key="unique"]').click();
  change(stack, 'php-mysql');
  clickTab('sql');
  if (!code().includes('DATETIME') || !code().includes('VARCHAR(512)') || !code().includes('UNIQUE')) {
    throw new Error('Datumtijd en unieke URL krijgen geen veilige MySQL-datatypes.');
  }
  clickTab('backend');
  const typedPhp = join(generatedDirectory, 'custom-types.php');
  writeFileSync(typedPhp, `<?php\n${code()}`, 'utf8');
  execFileSync('php', ['-l', typedPhp], { stdio: 'pipe' });
  change(stack, 'js-sqlite');
  clickTab('backend');
  new Function(code());

  const savedBuilder = JSON.parse(window.localStorage.getItem('cfd-builder-configuration'));
  if (savedBuilder.fields.length !== 2 || savedBuilder.stack !== 'js-sqlite' || savedBuilder.tab !== 'backend') {
    throw new Error('De gekozen builderconfiguratie wordt niet lokaal bewaard.');
  }

  builder.querySelector('[data-reset-builder]').click();
  if (builder.querySelectorAll('[data-builder-field-row]').length !== 5
    || builder.querySelector('[data-builder-stack]').value !== 'php-sqlite'
    || builder.querySelector('[data-builder-csrf]').checked
    || [...builder.querySelectorAll('[data-builder-operation]')].some((input) => !input.checked)
    || !builder.querySelector('[data-builder-tab="complete"]').classList.contains('is-active')) {
    throw new Error('De herstelknop zet niet het volledige, werkende productvoorbeeld terug.');
  }
} finally {
  rmSync(generatedDirectory, { recursive: true, force: true });
}

const relationLab = window.document.querySelector('[data-relation-lab]');
if (!relationLab
  || relationLab.querySelectorAll('.relation-student-row').length !== 3
  || relationLab.querySelectorAll('.relation-country-row').length !== 3
  || !window.document.getElementById('relation-html-template').textContent.includes('name="land_id"')
  || !window.document.getElementById('relation-php-template').textContent.includes('JOIN landen ON landen.id = studenten.land_id')
  || !window.document.getElementById('relation-php-template').textContent.includes('ON DELETE RESTRICT')) {
  throw new Error('Het relatiehoofdstuk mist de interactieve startdata, HTML-template, JOIN of foreign-keyregel.');
}

const relationStudentForm = relationLab.querySelector('[data-relation-student-form]');
relationStudentForm.elements.student_name.value = 'Teststudent';
relationStudentForm.elements.country_id.value = '3';
relationStudentForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
if (relationLab.querySelectorAll('.relation-student-row').length !== 4
  || !relationLab.querySelector('[data-relation-student-list]').textContent.includes('land_id=3')
  || !relationLab.querySelector('[data-relation-student-list]').textContent.includes('Curaçao')) {
  throw new Error('De relatielab kan geen nieuwe kindrij met een geldige foreign key toevoegen.');
}

const createdRelationRow = [...relationLab.querySelectorAll('.relation-student-row')]
  .find((row) => row.textContent.includes('Teststudent'));
createdRelationRow.querySelector('[data-relation-update-select]').value = '1';
createdRelationRow.querySelector('[data-relation-update]').click();
const updatedRelationRow = [...relationLab.querySelectorAll('.relation-student-row')]
  .find((row) => row.textContent.includes('Teststudent'));
if (!updatedRelationRow.textContent.includes('land_id=1') || !updatedRelationRow.textContent.includes('Suriname')) {
  throw new Error('De relatielab kan een bestaande foreign key niet wijzigen.');
}

const surinameRow = [...relationLab.querySelectorAll('.relation-country-row')]
  .find((row) => row.textContent.includes('Suriname'));
surinameRow.querySelector('[data-relation-delete-country]').click();
if (!relationLab.querySelector('[data-relation-status]').textContent.includes('nog gekoppeld')
  || !relationLab.querySelector('[data-relation-country-list]').textContent.includes('Suriname')) {
  throw new Error('ON DELETE RESTRICT wordt niet zichtbaar nagebootst in de relatielab.');
}

updatedRelationRow.querySelector('[data-relation-delete-student]').click();
if (relationLab.querySelector('[data-relation-student-list]').textContent.includes('Teststudent')) {
  throw new Error('De relatielab kan een kindrij niet verwijderen.');
}
relationLab.querySelector('[data-relation-reset]').click();

const relationPhpTemplate = window.document.getElementById('relation-php-template').textContent;
const relationTemplateDirectory = mkdtempSync(join(tmpdir(), 'cfd-relation-template-'));
try {
  const relationDatabase = join(relationTemplateDirectory, 'relation.sqlite').replaceAll('\\', '\\\\');
  const helpers = `<?php
declare(strict_types=1);
session_start();
function post_text(string $key): string { return trim((string) ($_POST[$key] ?? '')); }
function required_text(string $key, string $label, int $maxLength = 120): string {
  $value = post_text($key);
  if ($value === '' || strlen($value) > $maxLength) throw new RuntimeException($label . ' is ongeldig.');
  return $value;
}
function positive_id(mixed $value, string $label = 'ID'): int {
  $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
  if ($id === false) throw new RuntimeException($label . ' is ongeldig.');
  return (int) $id;
}
function verify_csrf(mixed $token): void { if ($token !== 'test-token') throw new RuntimeException('CSRF'); }
function flash(string $type, string $message): void {}
function redirect(string $location): never { exit(0); }
$db = new PDO('sqlite:${relationDatabase}');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec('PRAGMA foreign_keys = ON');
$db->exec('CREATE TABLE IF NOT EXISTS landen (id INTEGER PRIMARY KEY, naam TEXT NOT NULL)');
$db->exec("INSERT OR IGNORE INTO landen (id, naam) VALUES (1, 'Suriname'), (2, 'Nederland')");
`;
  const templateBody = relationPhpTemplate.replace(/^<\?php\s*/, '');
  const runRelationTemplate = (filename, method, post = {}, printRows = false) => {
    const phpPost = Object.entries(post).map(([key, value]) => `${JSON.stringify(key)} => ${JSON.stringify(value)}`).join(', ');
    const source = `${helpers}\n$_SERVER['REQUEST_METHOD'] = '${method}';\n$_POST = [${phpPost}];\n${templateBody}\n${printRows ? 'echo json_encode($students);' : ''}`;
    const file = join(relationTemplateDirectory, filename);
    writeFileSync(file, source, 'utf8');
    execFileSync('php', ['-l', file], { stdio: 'pipe' });
    return execFileSync('php', [file], { encoding: 'utf8' });
  };
  runRelationTemplate('create.php', 'POST', { _token: 'test-token', intent: 'create_relation', naam: 'Relatietest', land_id: '1' });
  if (!runRelationTemplate('read.php', 'GET', {}, true).includes('Relatietest')) {
    throw new Error('De PHP-relatietemplate kan een gekoppelde rij niet maken of via JOIN lezen.');
  }
  runRelationTemplate('update.php', 'POST', { _token: 'test-token', intent: 'update_relation', id: '1', naam: 'Gewijzigde relatietest', land_id: '2' });
  const updatedRelationJson = runRelationTemplate('read-updated.php', 'GET', {}, true);
  if (!updatedRelationJson.includes('Gewijzigde relatietest') || !updatedRelationJson.includes('Nederland')) {
    throw new Error('De PHP-relatietemplate kan de foreign key niet wijzigen.');
  }
  runRelationTemplate('delete.php', 'POST', { _token: 'test-token', intent: 'delete_relation', id: '1' });
  if (runRelationTemplate('read-deleted.php', 'GET', {}, true).includes('Gewijzigde relatietest')) {
    throw new Error('De PHP-relatietemplate kan een kindrij niet verwijderen.');
  }
} finally {
  rmSync(relationTemplateDirectory, { recursive: true, force: true });
}

const bookingLibrary = window.document.querySelector('#boekingen');
const bookingSnippets = [...bookingLibrary.querySelectorAll('.booking-snippet[data-booking-tags]')];
if (bookingSnippets.length !== 48
  || !window.document.getElementById('booking-schema-sqlite').textContent.includes('FOREIGN KEY (service_id)')
  || !window.document.getElementById('booking-schema-mysql').textContent.includes('ENGINE=InnoDB')
  || !window.document.getElementById('booking-overlap').textContent.includes('start_at < :end')
  || !window.document.getElementById('booking-atomic-create').textContent.includes('beginTransaction')
  || bookingLibrary.querySelector('[data-booking-result]').textContent !== '48 recepten zichtbaar') {
  throw new Error('De booking CRUD-bank mist recepten, databaseschema, overlapcontrole, transactie of resultaatstatus.');
}

bookingLibrary.querySelector('[data-booking-filter="availability"]').click();
const visibleAvailability = bookingSnippets.filter((snippet) => !snippet.hidden);
if (visibleAvailability.length < 10
  || visibleAvailability.some((snippet) => !snippet.dataset.bookingTags.split(' ').includes('availability'))) {
  throw new Error('Het beschikbaarheidsfilter van de bookingbank toont niet uitsluitend passende recepten.');
}

const bookingSearch = bookingLibrary.querySelector('[data-booking-search]');
bookingLibrary.querySelector('[data-booking-filter="all"]').click();
bookingSearch.value = 'iCalendar';
bookingSearch.dispatchEvent(new window.Event('input', { bubbles: true }));
if (bookingSnippets.filter((snippet) => !snippet.hidden).length !== 1
  || !bookingSnippets.find((snippet) => !snippet.hidden).textContent.includes('iCalendar-download')) {
  throw new Error('Zoeken in bookingrecepten vindt niet het juiste iCalendar-recept.');
}
bookingSearch.value = '';
bookingSearch.dispatchEvent(new window.Event('input', { bubbles: true }));

bookingLibrary.querySelector('[data-booking-builder]').click();
if (builder.querySelector('[data-builder-preset]').value !== 'appointments'
  || builder.querySelector('[data-builder-table]').value !== 'boekingen'
  || ![...builder.querySelectorAll('[data-builder-field-row]')]
    .some((row) => row.querySelector('[data-field-key="name"]').value === 'startmoment')) {
  throw new Error('De bookingbank opent geen bruikbare boekingspreset in de CRUD-builder.');
}

if (window.document.querySelectorAll('#app-core-files .code-block').length !== 5
  || !window.document.getElementById('universal-bootstrap').textContent.includes('session_set_cookie_params')
  || window.document.querySelectorAll('.appkit-route li').length !== 10) {
  throw new Error('De universele complete-app route mist kernbestanden of integratiestappen.');
}

const bookingSnippetDirectory = mkdtempSync(join(tmpdir(), 'cfd-booking-snippets-'));
try {
  const phpBookingIds = [
    'booking-pdo-sqlite', 'booking-pdo-mysql', 'booking-helpers', 'booking-create',
    'booking-read-list', 'booking-read-detail', 'booking-update', 'booking-delete',
    'booking-cancel', 'booking-restore', 'booking-status-machine', 'booking-overlap',
    'booking-atomic-create', 'booking-reschedule', 'booking-hours', 'booking-service-crud',
    'booking-customer-find', 'booking-recurring', 'booking-filters', 'booking-pagination',
    'booking-day-agenda', 'booking-csrf', 'booking-authorization', 'booking-optimistic-lock',
    'booking-idempotency', 'booking-json-api', 'booking-csv', 'booking-ical',
    'booking-timezones', 'booking-hotel', 'booking-rental', 'booking-event',
    'universal-app-config', 'universal-bootstrap', 'universal-security'
  ];
  for (const snippetId of phpBookingIds) {
    const source = window.document.getElementById(snippetId).textContent;
    const filename = join(bookingSnippetDirectory, `${snippetId}.php`);
    writeFileSync(filename, source.includes('<?php') ? source : `<?php\n${source}`, 'utf8');
    execFileSync('php', ['-l', filename], { stdio: 'pipe' });
  }
  for (const snippetId of ['booking-form-html', 'universal-header', 'universal-footer']) {
    const filename = join(bookingSnippetDirectory, `${snippetId}.php`);
    writeFileSync(filename, window.document.getElementById(snippetId).textContent, 'utf8');
    execFileSync('php', ['-l', filename], { stdio: 'pipe' });
  }

  const sqliteSchema = Buffer.from(window.document.getElementById('booking-schema-sqlite').textContent).toString('base64');
  const overlapFunction = window.document.getElementById('booking-overlap').textContent;
  const runtimeDatabase = join(bookingSnippetDirectory, 'runtime.sqlite').replaceAll('\\', '\\\\');
  const runtimeFile = join(bookingSnippetDirectory, 'booking-runtime.php');
  writeFileSync(runtimeFile, `<?php
declare(strict_types=1);
$db = new PDO('sqlite:${runtimeDatabase}');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec(base64_decode('${sqliteSchema}'));
$db->exec("INSERT INTO services (id,name,duration_minutes,price_cents) VALUES (1,'Review',60,5000)");
$db->exec("INSERT INTO customers (id,name,email) VALUES (1,'Testklant','test@example.com')");
$db->exec("INSERT INTO staff (id,name) VALUES (1,'Tester')");
$db->exec("INSERT INTO bookings (id,customer_id,service_id,staff_id,start_at,end_at,status) VALUES (1,1,1,1,'2027-01-01 10:00:00','2027-01-01 11:00:00','confirmed')");
${overlapFunction}
$joined = (int) $db->query("SELECT COUNT(*) FROM bookings b JOIN customers c ON c.id=b.customer_id JOIN services s ON s.id=b.service_id")->fetchColumn();
echo json_encode([$joined,
  hasOverlap($db, 1, '2027-01-01 10:30:00', '2027-01-01 11:30:00'),
  hasOverlap($db, 1, '2027-01-01 11:00:00', '2027-01-01 12:00:00'),
  hasOverlap($db, 1, '2027-01-01 10:30:00', '2027-01-01 11:30:00', 1)
]);`, 'utf8');
  execFileSync('php', ['-l', runtimeFile], { stdio: 'pipe' });
  const runtimeResult = JSON.parse(execFileSync('php', [runtimeFile], { encoding: 'utf8' }));
  if (JSON.stringify(runtimeResult) !== JSON.stringify([1, true, false, false])) {
    throw new Error('SQLite bookingschema, JOIN of overlapfunctie werkt niet als geïntegreerde runtimeproef.');
  }
} finally {
  rmSync(bookingSnippetDirectory, { recursive: true, force: true });
}

const phpFilter = window.document.querySelector('[data-snippet-filter="php"]');
phpFilter.click();
const wrongSnippetVisible = [...window.document.querySelectorAll('.snippet-item')]
  .some((item) => !item.hidden && !item.dataset.snippetTags.split(' ').includes('php'));
if (wrongSnippetVisible) {
  throw new Error('Snippetfilter toont een verkeerde categorie.');
}

const snippetRecipes = [...window.document.querySelectorAll('.snippet-item')];
if (snippetRecipes.length !== 17) {
  throw new Error('Het verwachte aantal complete snippetrecepten is gewijzigd.');
}
const snippetPickButtons = [...window.document.querySelectorAll('[data-snippet-pick]')];
if (snippetPickButtons.length !== snippetRecipes.length
  || snippetPickButtons.some((button) => !window.document.getElementById(button.dataset.snippetPick))) {
  throw new Error('De gewone-taal functiekiezer maakt niet ieder snippetrecept vindbaar.');
}

const startOverviewLinks = [...window.document.querySelectorAll('.start-overview a')];
if (startOverviewLinks.length !== 4
  || startOverviewLinks.some((link) => !window.document.querySelector(link.getAttribute('href')))
  || window.document.querySelectorAll('.chapter-group').length !== 2) {
  throw new Error('Het vereenvoudigde startoverzicht of de scheiding tussen basis en extra ontbreekt.');
}

const quickSnippetButtons = [...window.document.querySelectorAll('[data-quick-snippet]')];
if (quickSnippetButtons.length !== 6) throw new Error('De zes snelle snippetkeuzes ontbreken.');
quickSnippetButtons.find((button) => button.dataset.quickSnippet === 'snippet-search-filter').click();
if (!window.document.getElementById('snippet-search-filter').closest('.snippet-item').open) {
  throw new Error('Een snelle snippetkeuze opent niet het bijbehorende bestaande recept.');
}

const appkitDetails = window.document.querySelector('details.appkit-details');
if (!appkitDetails || appkitDetails.open || !appkitDetails.querySelector('#app-core-files')) {
  throw new Error('De complete appstructuur staat niet overzichtelijk ingeklapt.');
}

for (const templateId of ['simple-nav-template', 'simple-hero-template', 'simple-footer-template', 'simple-components-css']) {
  if (!window.document.getElementById(templateId)) throw new Error(`Eenvoudige componenttemplate ontbreekt: ${templateId}.`);
}

for (const recipe of snippetRecipes) {
  const htmlBlock = recipe.querySelector('[data-snippet-part="html"]');
  const cssBlock = recipe.querySelector('[data-snippet-part="css"]');
  if (!htmlBlock || !cssBlock || !htmlBlock.dataset.codeFile || !cssBlock.dataset.codeFile) {
    throw new Error('Niet ieder snippetrecept heeft HTML, CSS en een exacte bestandslocatie.');
  }
  const rootClass = htmlBlock.dataset.snippetRoot;
  const htmlSource = htmlBlock.querySelector('pre code').textContent;
  const cssSource = cssBlock.querySelector('pre code').textContent;
  if (!rootClass || rootClass !== cssBlock.dataset.snippetRoot
    || !htmlSource.includes(rootClass)
    || !cssSource.includes(`.${rootClass}`)) {
    throw new Error(`HTML en CSS wijzen niet naar dezelfde hoofdclass bij snippet ${rootClass || 'onbekend'}.`);
  }
  const openBraces = (cssSource.match(/\{/g) || []).length;
  const closeBraces = (cssSource.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    throw new Error(`CSS-accolades zijn niet in balans bij ${rootClass}.`);
  }
}

for (const filterName of ['html', 'css']) {
  window.document.querySelector(`[data-snippet-filter="${filterName}"]`).click();
  const wrongVisible = snippetRecipes.some((item) => !item.hidden && !item.dataset.snippetTags.split(' ').includes(filterName));
  if (wrongVisible) throw new Error(`Het ${filterName.toUpperCase()}-snippetfilter toont een verkeerd recept.`);
}
window.document.querySelector('[data-snippet-filter="users"]').click();
if (snippetRecipes.filter((item) => !item.hidden).length < 4
  || snippetRecipes.some((item) => !item.hidden && !item.dataset.snippetTags.split(' ').includes('users'))) {
  throw new Error('Het gebruikersfilter toont niet alle gebruikersrecepten of toont een verkeerd recept.');
}
if (!window.document.getElementById('snippet-user-crud-php').textContent.includes('user_reset_password')
  || !window.document.getElementById('snippet-user-crud-mysql').textContent.includes('AUTO_INCREMENT')
  || !window.document.getElementById('snippet-first-admin').textContent.includes("'admin'")
  || !window.document.getElementById('snippet-login').textContent.includes("$user['active']")
  || !window.document.getElementById('snippet-logout').textContent.includes('session_destroy()')
  || !window.document.getElementById('snippet-audit-log-mysql').textContent.includes('fk_audit_user')) {
  throw new Error('De gebruikersrecepten missen account-CRUD, MySQL, eerste admin, actiefcontrole, logout of logging.');
}

const alignedSnippetPairs = [
  ['snippet-one-many-html', 'snippet-one-many', 'land_id'],
  ['snippet-login-html', 'snippet-login', 'name="email"'],
  ['snippet-upload-html', 'snippet-upload', 'name="foto"'],
  ['snippet-csv-import-html', 'snippet-csv-import', 'name="csv_bestand"'],
  ['snippet-soft-delete-html', 'snippet-soft-delete-php', 'restore_student'],
  ['snippet-transaction-html', 'snippet-transaction', 'product_id'],
];
for (const [htmlId, logicId, sharedName] of alignedSnippetPairs) {
  if (!window.document.getElementById(htmlId).textContent.includes(sharedName)
    || !window.document.getElementById(logicId).textContent.includes(sharedName.replace('name="', '').replace('"', ''))) {
    throw new Error(`${htmlId} gebruikt niet dezelfde veld- of actienaam als ${logicId}.`);
  }
}

const snippetDirectory = mkdtempSync(join(tmpdir(), 'cfd-snippets-'));
try {
  for (const snippetId of [
    'snippet-many-many-php', 'snippet-detail-php', 'snippet-login', 'snippet-upload',
    'snippet-first-admin', 'snippet-logout',
    'snippet-csv', 'snippet-csv-import', 'snippet-soft-delete-php', 'snippet-transaction',
    'snippet-user-crud-php', 'snippet-role-permissions', 'snippet-profile-settings',
    'snippet-search-filter', 'snippet-pagination', 'snippet-bulk-actions', 'snippet-audit-log-php'
  ]) {
    const snippet = window.document.getElementById(snippetId).textContent;
    const phpStart = snippet.indexOf('<?php');
    const phpSource = phpStart >= 0 ? snippet.slice(phpStart) : `<?php\n${snippet}`;
    const filename = join(snippetDirectory, `${snippetId}.php`);
    writeFileSync(filename, phpSource, 'utf8');
    execFileSync('php', ['-l', filename], { stdio: 'pipe' });
  }
  for (const htmlCode of window.document.querySelectorAll('[data-snippet-part="html"] pre code')) {
    const filename = join(snippetDirectory, `${htmlCode.id}.php`);
    writeFileSync(filename, htmlCode.textContent, 'utf8');
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
if (window.document.querySelector('[data-progress-total]').textContent !== '11') {
  throw new Error('De voortgang is niet aangepast aan PHP + SQLite.');
}
if (stack.value !== 'php-sqlite'
  || window.document.querySelector('.header-cta').getAttribute('href') !== './downloads/studenten-crud.zip'
  || window.document.querySelector('.header-cta').textContent.trim() !== 'Starter'
  || !window.document.querySelector('.header-cta').getAttribute('aria-label').includes('PHP + SQLite')) {
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
if (window.document.querySelector('[data-progress-total]').textContent !== '8' || stack.value !== 'js-sqlite') {
  throw new Error('JavaScript-voortgang of buildertechniek is niet routespecifiek.');
}
if (window.document.querySelector('[data-frontend-panel="js"]').hidden) {
  throw new Error('De frontendwerkbank volgt de gekozen JavaScript-route niet.');
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

const themeToggle = window.document.querySelector('[data-theme-toggle]');
themeToggle.click();
if (window.document.documentElement.dataset.theme !== 'dark'
  || window.localStorage.getItem('cfd-theme') !== 'dark'
  || themeToggle.getAttribute('aria-pressed') !== 'true'
  || !styles.includes(':root[data-theme="dark"]')) {
  throw new Error('Dark mode wordt niet volledig geactiveerd of onthouden.');
}
themeToggle.click();
if (window.document.documentElement.dataset.theme !== 'light') {
  throw new Error('Dark mode kan niet worden teruggeschakeld.');
}

const englishButton = window.document.querySelector('[data-language="en"]');
const dutchButton = window.document.querySelector('[data-language="nl"]');
englishButton.click();
await new Promise((resolve) => window.setTimeout(resolve, 0));
change(stack, 'js-sqlite');
if (window.document.documentElement.lang !== 'en'
  || !window.document.title.includes('Build your first CRUD app')
  || !window.document.querySelector('.hero-copy').textContent.includes('From empty folder')
  || !window.document.querySelector('[data-builder-test-title]').textContent.includes('app in one file')
  || window.document.querySelector('[data-reset-builder]').textContent !== 'Restore product example'
  || window.document.querySelector('[data-download-builder]').textContent !== 'Download file'
  || !window.document.querySelector('[data-builder-csrf-option]').textContent.includes('Optional for PHP')
  || relationLab.querySelector('[data-relation-update]').textContent !== 'Save'
  || relationLab.querySelector('[data-relation-delete-country]').textContent !== 'Remove'
  || !bookingLibrary.querySelector('h2').textContent.includes('Build any type of booking website')
  || bookingLibrary.querySelector('[data-booking-result]').textContent !== '48 recipes visible'
  || !window.document.querySelector('.appkit-heading h3').textContent.includes('complete CRUD app')
  || window.document.querySelector('.skip-link').textContent !== 'Skip to main content'
  || ![...window.document.querySelector('[data-field-key="type"]').options].some((option) => option.textContent === 'Long text')
  || window.localStorage.getItem('cfd-language') !== 'en'
  || englishButton.getAttribute('aria-pressed') !== 'true') {
  throw new Error('De professionele Engelse taalversie vertaalt niet alle belangrijke interfaceonderdelen.');
}
dutchButton.click();
await new Promise((resolve) => window.setTimeout(resolve, 0));
if (window.document.documentElement.lang !== 'nl'
  || !window.document.querySelector('.hero-copy').textContent.includes('Van lege map')
  || relationLab.querySelector('[data-relation-update]').textContent !== 'Opslaan'
  || !window.document.querySelector('[data-builder-test-title]').textContent.includes('app in één bestand')) {
  throw new Error('De Nederlandse taalversie kan niet volledig worden hersteld.');
}
if (jsdomErrors.length) {
  throw new Error(`De interface veroorzaakte een browserfout: ${jsdomErrors[0].message}`);
}

console.log('CRUD-builder + datatypes + talen + dark mode + interactieve bouwroutes: PASS');
