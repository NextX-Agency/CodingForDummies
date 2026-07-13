const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const copyToast = $("[data-copy-toast]");
let toastTimer;

function showCopyToast(message = "Code gekopieerd") {
  copyToast.textContent = message;
  copyToast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => copyToast.classList.remove("is-visible"), 1800);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showCopyToast();
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    showCopyToast();
  }
}

$$('[data-copy-target]').forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.copyTarget);
    if (target) copyText(target.textContent);
  });
});

$$('[data-copy-text]').forEach((button) => {
  button.addEventListener("click", () => copyText(button.dataset.copyText));
});

const menuButton = $("[data-menu-button]");
const topNavigation = $("[data-top-nav]");

menuButton?.addEventListener("click", () => {
  const isOpen = topNavigation.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

$$('a[href^="#"]', topNavigation).forEach((link) => {
  link.addEventListener("click", () => {
    topNavigation.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

const searchDialog = $("[data-search-dialog]");
const globalSearch = $("[data-global-search]");
const searchResults = $("[data-search-results]");

const searchIndex = $$('[data-search-title]').map((section) => ({
  id: section.id,
  title: section.dataset.searchTitle,
  text: section.textContent.replace(/\s+/g, " ").trim()
}));

function openSearch() {
  if (!searchDialog.open) searchDialog.showModal();
  window.setTimeout(() => globalSearch.focus(), 40);
}

function closeSearch() {
  searchDialog.close();
}

function renderGlobalSearch(query) {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    searchResults.innerHTML = "<p>Typ een onderwerp of foutmelding. Je kunt ook zoeken op ‘XAMPP’, ‘update’ of ‘Vercel’.</p>";
    return;
  }

  const matches = searchIndex.filter((item) =>
    `${item.title} ${item.text}`.toLowerCase().includes(needle)
  ).slice(0, 7);

  if (matches.length === 0) {
    searchResults.innerHTML = '<p><strong>Geen resultaat.</strong> Probeer een korter woord, bijvoorbeeld “driver”, “SQLite” of “delete”.</p>';
    return;
  }

  searchResults.innerHTML = matches.map((item) => `
    <a href="#${item.id}">
      <span>${item.id === "foutzoeker" ? "Foutoplossing" : "Hoofdstuk"}</span>
      <strong>${item.title}</strong>
      <small>Ga naar onderdeel →</small>
    </a>
  `).join("");

  $$('a', searchResults).forEach((link) => link.addEventListener("click", closeSearch));
}

$("[data-open-search]")?.addEventListener("click", openSearch);
$("[data-close-search]")?.addEventListener("click", closeSearch);
globalSearch?.addEventListener("input", () => renderGlobalSearch(globalSearch.value));
searchDialog?.addEventListener("click", (event) => {
  if (event.target === searchDialog) closeSearch();
});

document.addEventListener("keydown", (event) => {
  const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearch();
  }

  if (event.key === "/" && !typing && !searchDialog.open) {
    event.preventDefault();
    const errorSearch = $("[data-error-search]");
    errorSearch?.focus();
    errorSearch?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

const progressItems = $$('[data-progress-item]');
const progressCount = $("[data-progress-count]");
const progressBar = $("[data-checklist-progress]");

function loadProgress() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem("cfd-progress") || "{}");
  } catch {
    saved = {};
  }

  progressItems.forEach((input) => {
    input.checked = Boolean(saved[input.dataset.progressItem]);
  });
  updateProgress();
}

function updateProgress() {
  const saved = {};
  progressItems.forEach((input) => { saved[input.dataset.progressItem] = input.checked; });
  localStorage.setItem("cfd-progress", JSON.stringify(saved));
  const completed = progressItems.filter((input) => input.checked).length;
  progressCount.textContent = completed;
  progressBar.style.width = `${(completed / Math.max(progressItems.length, 1)) * 100}%`;
}

progressItems.forEach((input) => input.addEventListener("change", updateProgress));
loadProgress();

const readingProgress = $("[data-reading-progress]");

function updateReadingProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percentage = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  readingProgress.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
}

window.addEventListener("scroll", updateReadingProgress, { passive: true });
updateReadingProgress();

const chapterLinks = $$('.chapter-nav a');
const observedSections = chapterLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const chapterObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (!visible) return;
  chapterLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
  });
}, { rootMargin: "-18% 0px -65%", threshold: [0.01, 0.2] });

observedSections.forEach((section) => chapterObserver.observe(section));

const crudTabs = $$('[data-crud-tab]');
const crudPanels = $$('[data-crud-panel]');

crudTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    crudTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
    crudPanels.forEach((panel) => {
      const isActive = panel.dataset.crudPanel === tab.dataset.crudTab;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  });
});

async function loadViewerFile(viewer, button) {
  const code = $("[data-file-code]", viewer);
  const label = $("[data-current-file]", viewer);
  const lineCount = $("[data-line-count]", viewer);
  const buttons = $$('[data-source]', viewer);

  buttons.forEach((item) => item.classList.toggle("is-active", item === button));
  code.textContent = "Bestand wordt geladen…";
  label.textContent = button.textContent.trim().replace(/^(PHP|SQL|CSS|JS|JSON|HTML)/, "");

  try {
    const response = await fetch(button.dataset.source);
    if (!response.ok) throw new Error("Bestand niet gevonden");
    const fileText = await response.text();
    code.textContent = fileText;
    lineCount.textContent = `${fileText.split("\n").length} regels`;
    viewer.currentCode = fileText;
  } catch {
    code.textContent = "Dit codebestand kon niet worden geladen. Start de gids via npm run dev in plaats van index.html rechtstreeks te openen.";
    lineCount.textContent = "laadfout";
  }
}

$$('[data-file-viewer]').forEach((viewer) => {
  const buttons = $$('[data-source]', viewer);
  buttons.forEach((button) => button.addEventListener("click", () => loadViewerFile(viewer, button)));
  $("[data-copy-file]", viewer)?.addEventListener("click", () => copyText(viewer.currentCode || ""));
  if (buttons[0]) loadViewerFile(viewer, buttons[0]);
});

const themeData = {
  students: { singular: "student", plural: "studenten", fields: "studentnummer, naam, e-mail", create: "create_student", update: "update_student", table: "studenten" },
  products: { singular: "product", plural: "producten", fields: "sku, naam, prijs, voorraad", create: "create_product", update: "update_product", table: "producten" },
  books: { singular: "boek", plural: "boeken", fields: "isbn, titel, auteur, categorie", create: "create_book", update: "update_book", table: "boeken" },
  countries: { singular: "land", plural: "landen", fields: "naam, landcode, regio", create: "create_country", update: "update_country", table: "landen" }
};

$$('[data-theme]').forEach((button) => {
  button.addEventListener("click", () => {
    $$('[data-theme]').forEach((item) => item.classList.toggle("is-active", item === button));
    const values = themeData[button.dataset.theme];
    Object.entries(values).forEach(([key, value]) => {
      const target = $(`[data-map="${key}"]`);
      if (target) target.textContent = value;
    });
  });
});

const errorSearch = $("[data-error-search]");
const errorItems = $$('[data-error-item]');
const errorCount = $("[data-error-count]");
const noErrors = $("[data-no-errors]");

function filterErrors() {
  const needle = errorSearch.value.trim().toLowerCase();
  let shown = 0;

  errorItems.forEach((item) => {
    const matches = !needle || `${item.dataset.keywords} ${item.textContent}`.toLowerCase().includes(needle);
    item.hidden = !matches;
    if (matches) shown += 1;
  });

  errorCount.textContent = `${shown} ${shown === 1 ? "oplossing" : "oplossingen"}`;
  noErrors.hidden = shown !== 0;
}

errorSearch?.addEventListener("input", filterErrors);
filterErrors();

const snippetFilterButtons = $$('[data-snippet-filter]');
const snippetItems = $$('.snippet-item[data-snippet-tags]');

snippetFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.snippetFilter;
    snippetFilterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    snippetItems.forEach((item) => {
      const tags = item.dataset.snippetTags.split(" ");
      item.hidden = filter !== "all" && !tags.includes(filter);
    });
  });
});

const builder = $("[data-crud-builder]");

if (builder) {
  const presets = {
    products: {
      singular: "product",
      table: "producten",
      fields: [
        { label: "Productnaam", name: "naam", type: "text", required: true, unique: false },
        { label: "Omschrijving", name: "omschrijving", type: "textarea", required: false, unique: false },
        { label: "Prijs", name: "prijs", type: "decimal", required: true, unique: false },
        { label: "Voorraad", name: "voorraad", type: "integer", required: true, unique: false },
        { label: "Actief", name: "actief", type: "boolean", required: true, unique: false }
      ]
    },
    books: {
      singular: "boek",
      table: "boeken",
      fields: [
        { label: "ISBN", name: "isbn", type: "text", required: true, unique: true },
        { label: "Titel", name: "titel", type: "text", required: true, unique: false },
        { label: "Auteur", name: "auteur", type: "text", required: true, unique: false },
        { label: "Publicatiedatum", name: "publicatiedatum", type: "date", required: false, unique: false },
        { label: "Categorie", name: "categorie", type: "text", required: false, unique: false }
      ]
    },
    employees: {
      singular: "medewerker",
      table: "medewerkers",
      fields: [
        { label: "Personeelsnummer", name: "personeelsnummer", type: "text", required: true, unique: true },
        { label: "Voornaam", name: "voornaam", type: "text", required: true, unique: false },
        { label: "Achternaam", name: "achternaam", type: "text", required: true, unique: false },
        { label: "E-mailadres", name: "email", type: "email", required: true, unique: true },
        { label: "Startdatum", name: "startdatum", type: "date", required: true, unique: false },
        { label: "Actief", name: "actief", type: "boolean", required: true, unique: false }
      ]
    },
    appointments: {
      singular: "afspraak",
      table: "afspraken",
      fields: [
        { label: "Onderwerp", name: "onderwerp", type: "text", required: true, unique: false },
        { label: "Datum", name: "datum", type: "date", required: true, unique: false },
        { label: "Locatie", name: "locatie", type: "text", required: true, unique: false },
        { label: "Notities", name: "notities", type: "textarea", required: false, unique: false },
        { label: "Afgerond", name: "afgerond", type: "boolean", required: true, unique: false }
      ]
    },
    vehicles: {
      singular: "voertuig",
      table: "voertuigen",
      fields: [
        { label: "Kenteken", name: "kenteken", type: "text", required: true, unique: true },
        { label: "Merk", name: "merk", type: "text", required: true, unique: false },
        { label: "Model", name: "model", type: "text", required: true, unique: false },
        { label: "Bouwjaar", name: "bouwjaar", type: "integer", required: true, unique: false },
        { label: "Beschikbaar", name: "beschikbaar", type: "boolean", required: true, unique: false }
      ]
    },
    custom: {
      singular: "onderdeel",
      table: "onderdelen",
      fields: [
        { label: "Naam", name: "naam", type: "text", required: true, unique: false }
      ]
    }
  };

  const presetSelect = $("[data-builder-preset]", builder);
  const stackSelect = $("[data-builder-stack]", builder);
  const singularInput = $("[data-builder-singular]", builder);
  const tableInput = $("[data-builder-table]", builder);
  const fieldsContainer = $("[data-builder-fields]", builder);
  const builderCode = $("[data-builder-code]", builder);
  const builderFile = $("[data-builder-file]", builder);
  const builderTabs = $$('[data-builder-tab]', builder);
  let currentBuilderTab = "sql";
  let builderFields = [];

  const reservedWords = new Set(["select", "insert", "update", "delete", "from", "where", "order", "group", "table", "index", "user"]);

  function sanitizeIdentifier(value, fallback) {
    let identifier = String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!identifier) identifier = fallback;
    if (/^[0-9]/.test(identifier)) identifier = `veld_${identifier}`;
    if (reservedWords.has(identifier)) identifier = `item_${identifier}`;
    return identifier;
  }

  function escapeBuilderAttribute(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function typeOptions(selected) {
    const types = {
      text: "Korte tekst",
      textarea: "Lange tekst",
      email: "E-mailadres",
      integer: "Heel getal",
      decimal: "Prijs / decimaal",
      date: "Datum",
      boolean: "Ja / nee"
    };

    return Object.entries(types).map(([value, label]) =>
      `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`
    ).join("");
  }

  function renderBuilderFields() {
    fieldsContainer.innerHTML = builderFields.map((field, index) => `
      <div class="builder-field-row" data-builder-field-row="${index}">
        <label><span>Label</span><input data-field-key="label" value="${escapeBuilderAttribute(field.label)}" aria-label="Label van veld ${index + 1}"></label>
        <label><span>Veldnaam</span><input data-field-key="name" value="${escapeBuilderAttribute(field.name)}" aria-label="Databasenaam van veld ${index + 1}"></label>
        <label><span>Type</span><select data-field-key="type" aria-label="Type van veld ${index + 1}">${typeOptions(field.type)}</select></label>
        <label class="builder-check"><input type="checkbox" data-field-key="required" ${field.required ? "checked" : ""}><span>Verplicht</span></label>
        <label class="builder-check"><input type="checkbox" data-field-key="unique" ${field.unique ? "checked" : ""}><span>Uniek</span></label>
        <button class="builder-remove" type="button" data-remove-field="${index}" aria-label="Verwijder veld ${index + 1}">Verwijder</button>
      </div>
    `).join("");

    $$('[data-field-key]', fieldsContainer).forEach((control) => {
      const eventName = control.type === "checkbox" || control.tagName === "SELECT" ? "change" : "input";
      control.addEventListener(eventName, () => {
        const row = control.closest('[data-builder-field-row]');
        const field = builderFields[Number(row.dataset.builderFieldRow)];
        field[control.dataset.fieldKey] = control.type === "checkbox" ? control.checked : control.value;
        updateBuilderOutput();
      });
    });

    $$('[data-remove-field]', fieldsContainer).forEach((button) => {
      button.addEventListener("click", () => {
        if (builderFields.length === 1) return;
        builderFields.splice(Number(button.dataset.removeField), 1);
        renderBuilderFields();
        updateBuilderOutput();
      });
    });
  }

  function normalizedBuilderState() {
    return {
      stack: stackSelect.value,
      singular: sanitizeIdentifier(singularInput.value, "onderdeel"),
      table: sanitizeIdentifier(tableInput.value, "onderdelen"),
      fields: builderFields.map((field, index) => ({
        label: String(field.label || `Veld ${index + 1}`).trim(),
        name: sanitizeIdentifier(field.name, `veld_${index + 1}`),
        type: field.type,
        required: Boolean(field.required),
        unique: Boolean(field.unique)
      })).filter((field, index, all) => all.findIndex((item) => item.name === field.name) === index)
    };
  }

  function sqlType(field, stack) {
    if (stack === "php-mysql") {
      return {
        text: "VARCHAR(160)", textarea: "TEXT", email: "VARCHAR(160)", integer: "INT",
        decimal: "DECIMAL(10,2)", date: "DATE", boolean: "TINYINT(1)"
      }[field.type];
    }

    return {
      text: "TEXT", textarea: "TEXT", email: "TEXT", integer: "INTEGER",
      decimal: "REAL", date: "TEXT", boolean: "INTEGER"
    }[field.type];
  }

  function escapeSingleQuoted(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r?\n/g, " ");
  }

  function escapeHtmlCode(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function generateSql(state) {
    const mysql = state.stack === "php-mysql";
    const definitions = [mysql ? "  id INT UNSIGNED NOT NULL AUTO_INCREMENT" : "  id INTEGER PRIMARY KEY AUTOINCREMENT"];

    state.fields.forEach((field) => {
      const rules = [sqlType(field, state.stack)];
      if (field.required) rules.push("NOT NULL");
      if (field.type === "boolean") rules.push("DEFAULT 0");
      if (field.unique) rules.push("UNIQUE");
      definitions.push(`  ${field.name} ${rules.join(" ")}`);
    });

    if (mysql) {
      definitions.push("  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
      definitions.push("  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
      definitions.push("  PRIMARY KEY (id)");
      return `CREATE TABLE IF NOT EXISTS ${state.table} (\n${definitions.join(",\n")}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
    }

    definitions.push("  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP");
    definitions.push("  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP");
    return `CREATE TABLE IF NOT EXISTS ${state.table} (\n${definitions.join(",\n")}\n);`;
  }

  function htmlControl(field, state) {
    const id = `${state.singular}-${field.name}`;
    const required = field.required ? " required" : "";
    const label = escapeHtmlCode(field.label);

    if (field.type === "textarea") {
      return `  <label for="${id}">${label}</label>\n  <textarea id="${id}" name="${field.name}"${required}></textarea>`;
    }

    if (field.type === "boolean") {
      if (state.stack.startsWith("php")) {
        return `  <input type="hidden" name="${field.name}" value="0">\n  <label><input id="${id}" name="${field.name}" type="checkbox" value="1"> ${label}</label>`;
      }
      return `  <label><input id="${id}" name="${field.name}" type="checkbox"> ${label}</label>`;
    }

    const type = { email: "email", integer: "number", decimal: "number", date: "date" }[field.type] || "text";
    const extra = field.type === "decimal" ? ' min="0" step="0.01"' : field.type === "integer" ? ' step="1"' : "";
    return `  <label for="${id}">${label}</label>\n  <input id="${id}" name="${field.name}" type="${type}"${extra}${required}>`;
  }

  function generateForm(state) {
    const formStart = state.stack === "js-sqlite"
      ? `<form id="${state.singular}-form">`
      : `<form method="post">\n  <input type="hidden" name="_token" value="<?= e(csrf_token()) ?>">\n  <input type="hidden" name="intent" value="create_${state.singular}">`;
    const controls = state.fields.map((field) => htmlControl(field, state)).join("\n\n");
    return `${formStart}\n${controls}\n\n  <button type="submit">${state.singular} opslaan</button>\n</form>`;
  }

  function phpInputExpression(field) {
    const label = escapeSingleQuoted(field.label);
    if (field.type === "boolean") return `(int) ($_POST['${field.name}'] ?? 0)`;
    if (field.type === "integer") return field.required ? `(int) required_text('${field.name}', '${label}', 20)` : `(int) ($_POST['${field.name}'] ?? 0)`;
    if (field.type === "decimal") return field.required ? `(float) required_text('${field.name}', '${label}', 30)` : `(float) ($_POST['${field.name}'] ?? 0)`;
    return field.required ? `required_text('${field.name}', '${label}', 160)` : `post_text('${field.name}')`;
  }

  function generatePhpBackend(state) {
    const columns = state.fields.map((field) => field.name);
    const placeholders = columns.map((column) => `:${column}`);
    const updateFields = columns.map((column) => `        ${column} = :${column}`).join(",\n");
    const inputLines = state.fields.map((field) => `        '${field.name}' => ${phpInputExpression(field)},`);
    const emailField = state.fields.find((field) => field.type === "email");
    const emailValidation = emailField
      ? `\n    if ($input['${emailField.name}'] !== '' && !filter_var($input['${emailField.name}'], FILTER_VALIDATE_EMAIL)) {\n        throw new RuntimeException('${escapeSingleQuoted(emailField.label)} is ongeldig.');\n    }\n`
      : "";

    return [
      `function read_${state.singular}_input(): array`,
      `{`,
      `    $input = [`,
      ...inputLines,
      `    ];`,
      emailValidation,
      `    return $input;`,
      `}`,
      ``,
      `if ($_SERVER['REQUEST_METHOD'] === 'POST') {`,
      `    verify_csrf($_POST['_token'] ?? null);`,
      `    $intent = post_text('intent');`,
      ``,
      `    if ($intent === 'create_${state.singular}') {`,
      `        $input = read_${state.singular}_input();`,
      `        $statement = $db->prepare(`,
      `            'INSERT INTO ${state.table} (${columns.join(", ")})`,
      `             VALUES (${placeholders.join(", ")})'`,
      `        );`,
      `        $statement->execute($input);`,
      `        flash('success', '${state.singular} is toegevoegd.');`,
      `        redirect('index.php');`,
      `    }`,
      ``,
      `    if ($intent === 'update_${state.singular}') {`,
      `        $input = read_${state.singular}_input();`,
      `        $input['id'] = positive_id($_POST['id'] ?? null);`,
      `        $statement = $db->prepare(`,
      `            'UPDATE ${state.table} SET`,
      updateFields,
      `             WHERE id = :id'`,
      `        );`,
      `        $statement->execute($input);`,
      `        redirect('index.php');`,
      `    }`,
      ``,
      `    if ($intent === 'delete_${state.singular}') {`,
      `        $id = positive_id($_POST['id'] ?? null);`,
      `        $db->prepare('DELETE FROM ${state.table} WHERE id = ?')->execute([$id]);`,
      `        redirect('index.php');`,
      `    }`,
      `}`,
      ``,
      `$rows = $db->query('SELECT * FROM ${state.table} ORDER BY id DESC')->fetchAll();`
    ].join("\n");
  }

  function jsInputExpression(field) {
    const label = escapeSingleQuoted(field.label);
    if (field.type === "boolean") return `body.${field.name} ? 1 : 0`;
    if (field.type === "integer" || field.type === "decimal") return `Number(body.${field.name})`;
    return field.required ? `requiredText(body.${field.name}, '${label}', 160)` : `String(body.${field.name} ?? '').trim()`;
  }

  function toPascalCase(value) {
    return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
  }

  function generateJsBackend(state) {
    const columns = state.fields.map((field) => field.name);
    const placeholders = columns.map((column) => `@${column}`);
    const updateFields = columns.map((column) => `${column} = @${column}`).join(", ");
    const functionName = toPascalCase(state.singular);
    const inputLines = state.fields.map((field) => `    ${field.name}: ${jsInputExpression(field)},`);
    const numericChecks = state.fields
      .filter((field) => field.type === "integer" || field.type === "decimal")
      .map((field) => `  if (!Number.isFinite(item.${field.name})) throw httpError(400, '${escapeSingleQuoted(field.label)} moet een getal zijn.');`);
    const emailChecks = state.fields
      .filter((field) => field.type === "email")
      .map((field) => `  if (item.${field.name} && !item.${field.name}.includes('@')) throw httpError(400, '${escapeSingleQuoted(field.label)} is ongeldig.');`);

    return [
      `function read${functionName}(body = {}) {`,
      `  const item = {`,
      ...inputLines,
      `  };`,
      ...numericChecks,
      ...emailChecks,
      `  return item;`,
      `}`,
      ``,
      `app.get('/api/${state.table}', (req, res) => {`,
      `  const rows = db.prepare('SELECT * FROM ${state.table} ORDER BY id DESC').all();`,
      `  res.json(rows);`,
      `});`,
      ``,
      `app.post('/api/${state.table}', (req, res) => {`,
      `  const item = read${functionName}(req.body);`,
      `  const result = db.prepare(`,
      `    'INSERT INTO ${state.table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})'`,
      `  ).run(item);`,
      `  res.status(201).json(db.prepare('SELECT * FROM ${state.table} WHERE id = ?').get(result.lastInsertRowid));`,
      `});`,
      ``,
      `app.put('/api/${state.table}/:id', (req, res) => {`,
      `  const item = { ...read${functionName}(req.body), id: readId(req.params.id) };`,
      `  const result = db.prepare('UPDATE ${state.table} SET ${updateFields} WHERE id = @id').run(item);`,
      `  if (result.changes === 0) throw httpError(404, '${state.singular} niet gevonden.');`,
      `  res.json(db.prepare('SELECT * FROM ${state.table} WHERE id = ?').get(item.id));`,
      `});`,
      ``,
      `app.delete('/api/${state.table}/:id', (req, res) => {`,
      `  const result = db.prepare('DELETE FROM ${state.table} WHERE id = ?').run(readId(req.params.id));`,
      `  if (result.changes === 0) throw httpError(404, '${state.singular} niet gevonden.');`,
      `  res.status(204).send();`,
      `});`
    ].join("\n");
  }

  function generatePastePlan(state) {
    const backendFile = state.stack === "js-sqlite" ? "backend/server.js" : "index.php";
    const startCommand = state.stack === "js-sqlite" ? "npm start" : "Start Apache in XAMPP";
    return [
      `PLAKPLAN VOOR: ${state.table.toUpperCase()}`,
      ``,
      `1. SQL`,
      `   Plak tab 1 onderaan database/schema.sql.`,
      `   Reset tijdens ontwikkeling daarna je database.`,
      ``,
      `2. FORMULIER`,
      `   Plak tab 2 op de plek waar het invoerformulier moet staan.`,
      ``,
      `3. BACKEND`,
      `   Plak tab 3 in ${backendFile}.`,
      `   Controleer dat de helpers uit de starter aanwezig zijn.`,
      ``,
      `4. OVERZICHT`,
      `   Kopieer de bestaande studententabel en verander de kolommen naar:`,
      `   ${state.fields.map((field) => field.name).join(", ")}.`,
      ``,
      `5. TEST IN DEZE VOLGORDE`,
      `   ${startCommand}`,
      `   Create -> pagina vernieuwen -> Read -> Update -> Delete.`,
      ``,
      `6. PAS DAARNA EXTRA'S TOE`,
      `   Zoeken, filters, relaties, uploads, login of CSV.`
    ].join("\n");
  }

  function builderOutputs(state) {
    return {
      sql: { file: "database/schema.sql", code: generateSql(state) },
      form: { file: state.stack === "js-sqlite" ? "frontend/index.html" : "index.php · HTML", code: generateForm(state) },
      backend: { file: state.stack === "js-sqlite" ? "backend/server.js" : "index.php · PHP", code: state.stack === "js-sqlite" ? generateJsBackend(state) : generatePhpBackend(state) },
      steps: { file: "plakplan.txt", code: generatePastePlan(state) }
    };
  }

  function updateBuilderOutput() {
    const output = builderOutputs(normalizedBuilderState())[currentBuilderTab];
    builderFile.textContent = output.file;
    builderCode.textContent = output.code;
    builder.currentCode = output.code;
  }

  function applyPreset(name) {
    const preset = presets[name] || presets.custom;
    singularInput.value = preset.singular;
    tableInput.value = preset.table;
    builderFields = preset.fields.map((field) => ({ ...field }));
    renderBuilderFields();
    updateBuilderOutput();
  }

  presetSelect.addEventListener("change", () => applyPreset(presetSelect.value));
  stackSelect.addEventListener("change", updateBuilderOutput);
  singularInput.addEventListener("input", updateBuilderOutput);
  tableInput.addEventListener("input", updateBuilderOutput);
  $("[data-add-field]", builder).addEventListener("click", () => {
    if (builderFields.length >= 12) return;
    builderFields.push({ label: "Nieuw veld", name: `veld_${builderFields.length + 1}`, type: "text", required: false, unique: false });
    renderBuilderFields();
    updateBuilderOutput();
  });

  builderTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      currentBuilderTab = tab.dataset.builderTab;
      builderTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      updateBuilderOutput();
    });
  });

  $("[data-copy-builder]", builder).addEventListener("click", () => copyText(builder.currentCode || ""));
  applyPreset("products");
}
