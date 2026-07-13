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
  text: section.textContent.replace(/\s+/g, " ").trim(),
  element: section
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
    searchResults.innerHTML = "<p>Typ een onderwerp of foutmelding. Je kunt ook zoeken op ‘XAMPP’, ‘opslaan’ of ‘database’.</p>";
    return;
  }

  const matches = searchIndex.filter((item) =>
    !item.element.hidden && `${item.title} ${item.text}`.toLowerCase().includes(needle)
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
const progressTotal = $("[data-progress-total]");
const progressBar = $("[data-checklist-progress]");
let activeRoute = null;

function progressItemsForRoute() {
  return progressItems.filter((input) => {
    const routes = input.dataset.progressRoutes;
    return !activeRoute || !routes || routes.split(" ").includes(activeRoute);
  });
}

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
  try {
    localStorage.setItem("cfd-progress", JSON.stringify(saved));
  } catch {
    // De checklist blijft werken wanneer browseropslag is uitgeschakeld.
  }
  const applicableItems = progressItemsForRoute();
  const completed = applicableItems.filter((input) => input.checked).length;
  progressCount.textContent = completed;
  progressTotal.textContent = applicableItems.length;
  progressBar.style.width = `${(completed / Math.max(applicableItems.length, 1)) * 100}%`;
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
  let currentBuilderTab = "steps";
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
        <label><span>Tekst op formulier</span><input data-field-key="label" value="${escapeBuilderAttribute(field.label)}" aria-label="Tekst op formulier voor gegeven ${index + 1}"></label>
        <label><span>Naam in database</span><input data-field-key="name" value="${escapeBuilderAttribute(field.name)}" aria-label="Databasenaam van gegeven ${index + 1}"></label>
        <label><span>Soort invoer</span><select data-field-key="type" aria-label="Soort invoer van gegeven ${index + 1}">${typeOptions(field.type)}</select></label>
        <label class="builder-check"><input type="checkbox" data-field-key="required" ${field.required ? "checked" : ""}><span>Moet ingevuld</span></label>
        <label class="builder-check"><input type="checkbox" data-field-key="unique" ${field.unique ? "checked" : ""}><span>Geen dubbele</span></label>
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
    const controls = state.fields.map((field) => htmlControl(field, state)).join("\n\n");
    if (state.stack === "js-sqlite") {
      const headers = state.fields.map((field) => `        <th>${escapeHtmlCode(field.label)}</th>`).join("\n");
      return [
        `<section class="${state.table}-beheer">`,
        `  <h2>${state.table} beheren</h2>`,
        `  <form id="${state.singular}-form">`,
        controls,
        `    <button type="submit" id="${state.singular}-submit">${state.singular} toevoegen</button>`,
        `    <button type="button" id="${state.singular}-cancel" hidden>Annuleer bewerken</button>`,
        `  </form>`,
        ``,
        `  <table>`,
        `    <thead>`,
        `      <tr>`,
        headers,
        `        <th>Acties</th>`,
        `      </tr>`,
        `    </thead>`,
        `    <tbody id="${state.table}-rows"></tbody>`,
        `  </table>`,
        `</section>`
      ].join("\n");
    }

    const editControls = state.fields.map((field) => {
      const label = escapeHtmlCode(field.label);
      if (field.type === "textarea") {
        return `      <label>${label}\n        <textarea name="${field.name}"${field.required ? " required" : ""}><?= e($row['${field.name}']) ?></textarea>\n      </label>`;
      }
      if (field.type === "boolean") {
        return `      <input type="hidden" name="${field.name}" value="0">\n      <label><input name="${field.name}" type="checkbox" value="1" <?= (int) $row['${field.name}'] === 1 ? 'checked' : '' ?>> ${label}</label>`;
      }
      const type = { email: "email", integer: "number", decimal: "number", date: "date" }[field.type] || "text";
      const extra = field.type === "decimal" ? ' min="0" step="0.01"' : field.type === "integer" ? ' step="1"' : "";
      return `      <label>${label}\n        <input name="${field.name}" type="${type}" value="<?= e($row['${field.name}']) ?>"${extra}${field.required ? " required" : ""}>\n      </label>`;
    }).join("\n");
    const headers = state.fields.map((field) => `        <th>${escapeHtmlCode(field.label)}</th>`).join("\n");
    const cells = state.fields.map((field) => `          <td><?= e($row['${field.name}']) ?></td>`).join("\n");

    return [
      `<section class="app-shell ${state.table}-beheer">`,
      `  <div class="page-heading"><div><p class="eyebrow">Eigen CRUD</p><h2>${state.table} beheren</h2></div></div>`,
      ``,
      `  <div class="form-panel">`,
      `  <h3>Nieuwe ${state.singular}</h3>`,
      `  <form class="stack-form" method="post">`,
      `    <input type="hidden" name="_token" value="<?= e(csrf_token()) ?>">`,
      `    <input type="hidden" name="intent" value="create_${state.singular}">`,
      controls,
      `    <button type="submit">${state.singular} toevoegen</button>`,
      `  </form>`,
      `  </div>`,
      ``,
      `  <h3>Overzicht</h3>`,
      `  <div class="list-panel"><div class="table-scroll">`,
      `  <table>`,
      `    <thead>`,
      `      <tr>`,
      headers,
      `        <th>Acties</th>`,
      `      </tr>`,
      `    </thead>`,
      `    <tbody>`,
      `      <?php foreach ($rows as $row): ?>`,
      `        <tr>`,
      cells,
      `          <td class="row-actions">`,
      `            <details>`,
      `              <summary>Bewerk</summary>`,
      `              <form class="stack-form" method="post">`,
      `                <input type="hidden" name="_token" value="<?= e(csrf_token()) ?>">`,
      `                <input type="hidden" name="intent" value="update_${state.singular}">`,
      `                <input type="hidden" name="id" value="<?= (int) $row['id'] ?>">`,
      editControls,
      `                <button type="submit">Wijzigingen opslaan</button>`,
      `              </form>`,
      `            </details>`,
      `            <form method="post" onsubmit="return confirm('Weet je zeker dat je dit wilt verwijderen?')">`,
      `              <input type="hidden" name="_token" value="<?= e(csrf_token()) ?>">`,
      `              <input type="hidden" name="intent" value="delete_${state.singular}">`,
      `              <input type="hidden" name="id" value="<?= (int) $row['id'] ?>">`,
      `              <button class="danger-link" type="submit">Verwijder</button>`,
      `            </form>`,
      `          </td>`,
      `        </tr>`,
      `      <?php endforeach; ?>`,
      `    </tbody>`,
      `  </table>`,
      `  </div></div>`,
      `</section>`
    ].join("\n");
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

  function generateJsFrontend(state) {
    const functionName = toPascalCase(state.singular);
    const elementLines = state.fields.map((field) => `  ${field.name}: document.querySelector('#${state.singular}-${field.name}'),`);
    const inputLines = state.fields.map((field) => {
      const source = `${state.singular}Elements.${field.name}`;
      if (field.type === "boolean") return `    ${field.name}: ${source}.checked ? 1 : 0,`;
      if (field.type === "integer" || field.type === "decimal") return `    ${field.name}: Number(${source}.value),`;
      return `    ${field.name}: ${source}.value.trim(),`;
    });
    const resetLines = state.fields.map((field) => field.type === "boolean"
      ? `  ${state.singular}Elements.${field.name}.checked = false;`
      : `  ${state.singular}Elements.${field.name}.value = '';`);
    const fillLines = state.fields.map((field) => field.type === "boolean"
      ? `  ${state.singular}Elements.${field.name}.checked = Number(item.${field.name}) === 1;`
      : `  ${state.singular}Elements.${field.name}.value = item.${field.name} ?? '';`);
    const cells = state.fields.map((field) => `      <td>\${escape${functionName}Html(item.${field.name})}</td>`).join("\n");

    return [
      `const ${state.singular}Elements = {`,
      `  form: document.querySelector('#${state.singular}-form'),`,
      `  rows: document.querySelector('#${state.table}-rows'),`,
      `  submit: document.querySelector('#${state.singular}-submit'),`,
      `  cancel: document.querySelector('#${state.singular}-cancel'),`,
      ...elementLines,
      `};`,
      `let editing${functionName}Id = null;`,
      ``,
      `function escape${functionName}Html(value) {`,
      `  const element = document.createElement('div');`,
      `  element.textContent = String(value ?? '');`,
      `  return element.innerHTML;`,
      `}`,
      ``,
      `async function request${functionName}(url, options = {}) {`,
      `  const response = await fetch(url, options);`,
      `  if (response.status === 204) return null;`,
      `  const data = await response.json();`,
      `  if (!response.ok) throw new Error(data.error || 'Er ging iets mis.');`,
      `  return data;`,
      `}`,
      ``,
      `function read${functionName}Form() {`,
      `  return {`,
      ...inputLines,
      `  };`,
      `}`,
      ``,
      `function reset${functionName}Form() {`,
      `  editing${functionName}Id = null;`,
      ...resetLines,
      `  ${state.singular}Elements.submit.textContent = '${state.singular} toevoegen';`,
      `  ${state.singular}Elements.cancel.hidden = true;`,
      `}`,
      ``,
      `function start${functionName}Edit(item) {`,
      `  editing${functionName}Id = item.id;`,
      ...fillLines,
      `  ${state.singular}Elements.submit.textContent = 'Wijzigingen opslaan';`,
      `  ${state.singular}Elements.cancel.hidden = false;`,
      `  ${state.singular}Elements.form.scrollIntoView({ behavior: 'smooth' });`,
      `}`,
      ``,
      `async function load${functionName}Rows() {`,
      `  const items = await request${functionName}('/api/${state.table}');`,
      `  ${state.singular}Elements.rows.innerHTML = items.map((item) => \``,
      `    <tr>`,
      cells,
      `      <td>`,
      `        <button type="button" data-edit-${state.singular}="\${item.id}">Bewerk</button>`,
      `        <button type="button" data-delete-${state.singular}="\${item.id}">Verwijder</button>`,
      `      </td>`,
      `    </tr>`,
      `  \`).join('');`,
      `  ${state.singular}Elements.rows.currentItems = items;`,
      `}`,
      ``,
      `${state.singular}Elements.form.addEventListener('submit', async (event) => {`,
      `  event.preventDefault();`,
      `  const url = editing${functionName}Id ? \`/api/${state.table}/\${editing${functionName}Id}\` : '/api/${state.table}';`,
      `  const method = editing${functionName}Id ? 'PUT' : 'POST';`,
      `  try {`,
      `    await request${functionName}(url, {`,
      `      method,`,
      `      headers: { 'Content-Type': 'application/json' },`,
      `      body: JSON.stringify(read${functionName}Form())`,
      `    });`,
      `    reset${functionName}Form();`,
      `    await load${functionName}Rows();`,
      `  } catch (error) {`,
      `    window.alert(error.message);`,
      `  }`,
      `});`,
      ``,
      `${state.singular}Elements.cancel.addEventListener('click', reset${functionName}Form);`,
      `${state.singular}Elements.rows.addEventListener('click', async (event) => {`,
      `  const editButton = event.target.closest('[data-edit-${state.singular}]');`,
      `  const deleteButton = event.target.closest('[data-delete-${state.singular}]');`,
      `  const items = ${state.singular}Elements.rows.currentItems || [];`,
      `  if (editButton) {`,
      `    const item = items.find((row) => row.id === Number(editButton.dataset.edit${functionName}));`,
      `    if (item) start${functionName}Edit(item);`,
      `  }`,
      `  if (deleteButton && window.confirm('Weet je zeker dat je dit wilt verwijderen?')) {`,
      `    await request${functionName}(\`/api/${state.table}/\${deleteButton.dataset.delete${functionName}}\`, { method: 'DELETE' });`,
      `    await load${functionName}Rows();`,
      `  }`,
      `});`,
      ``,
      `load${functionName}Rows().catch((error) => window.alert(error.message));`
    ].join("\n");
  }

  function generatePastePlan(state) {
    const title = `EXACT PLAKPLAN VOOR: ${state.table.toUpperCase()}`;
    if (state.stack === "js-sqlite") {
      return [
        title,
        `Maak eerst een kopie van de hele projectmap.`,
        ``,
        `1. DATABASETABEL — tab 1`,
        `   Open: backend/server.js`,
        `   Ctrl+F: CREATE INDEX IF NOT EXISTS idx_students_country`,
        `   Zoek direct daarna de regel met een afsluitende backtick en );`,
        `   Plak tab 1 OP EEN NIEUWE REGEL VÓÓR die backtick.`,
        ``,
        `2. HTML — tab 2`,
        `   Open: frontend/index.html`,
        `   Ctrl+F: </main>`,
        `   Klik aan het begin van die regel.`,
        `   Plak tab 2 DIRECT BOVEN </main>.`,
        ``,
        `3. API — tab 3`,
        `   Open: backend/server.js`,
        `   Ctrl+F: app.use((error`,
        `   Plak tab 3 DIRECT BOVEN de foutafhandeling.`,
        ``,
        `4. BROWSERCODE — tab 4`,
        `   Open: frontend/app.js`,
        `   Druk Ctrl+End en maak één nieuwe lege regel.`,
        `   Plak tab 4 ONDERAAN het bestand.`,
        ``,
        `5. TEST`,
        `   Stop npm start met Ctrl+C en start opnieuw met npm start.`,
        `   Test: toevoegen → vernieuwen → wijzigen → verwijderen.`,
        `   Zoek bij een fout op de letterlijke foutmelding in de Foutzoeker.`
      ].join("\n");
    }

    const databaseReset = state.stack === "php-sqlite"
      ? `   Vernieuw de pagina; CREATE TABLE IF NOT EXISTS voegt de nieuwe tabel toe. Verwijder app.sqlite niet als er echte gegevens in staan.`
      : `   Vernieuw de pagina; PHP maakt de nieuwe tabel in MySQL.`;
    return [
      title,
      `Maak eerst een kopie van de hele projectmap.`,
      ``,
      `1. DATABASETABEL — tab 1`,
      `   Open: database/schema.sql`,
      `   Druk Ctrl+End en maak één nieuwe lege regel.`,
      `   Controleer dat de vorige SQL-regel eindigt met een puntkomma (;).`,
      `   Plak tab 1 ONDERAAN en sla op met Ctrl+S.`,
      databaseReset,
      ``,
      `2. PHP-VERWERKING — tab 3`,
      `   Open: index.php`,
      `   Ctrl+F: if ($_SERVER['REQUEST_METHOD'] === 'POST') {`,
      `   Klik aan het begin van deze regel.`,
      `   Plak tab 3 DIRECT BOVEN deze bestaande regel.`,
      `   Twee POST-blokken onder elkaar zijn hier bewust: het nieuwe blok verwerkt ${state.table}.`,
      ``,
      `3. FORMULIER + OVERZICHT — tab 2`,
      `   Blijf in: index.php`,
      `   Ctrl+F: <footer><span>Campus Admin`,
      `   Klik aan het begin van die regel.`,
      `   Plak tab 2 DIRECT BOVEN deze footerregel.`,
      `   Tab 2 bevat toevoegen, bekijken, bewerken én verwijderen.`,
      ``,
      `4. BROWSERCODE — tab 4`,
      `   Voor PHP is geen extra browsercode nodig. Sla deze tab over.`,
      ``,
      `5. TEST IN DEZE VOLGORDE`,
      `   Open localhost en voeg één testitem toe.`,
      `   Vernieuw: het item moet blijven staan.`,
      `   Wijzig één veld en vernieuw opnieuw.`,
      `   Verwijder alleen het testitem.`,
      ``,
      `KLAAR? Voeg pas daarna zoeken, relaties, uploads of login toe.`
    ].join("\n");
  }

  function builderOutputs(state) {
    return {
      sql: { file: state.stack === "js-sqlite" ? "backend/server.js · binnen db.exec" : "database/schema.sql", code: generateSql(state) },
      form: { file: state.stack === "js-sqlite" ? "frontend/index.html" : "index.php · HTML", code: generateForm(state) },
      backend: { file: state.stack === "js-sqlite" ? "backend/server.js" : "index.php · PHP", code: state.stack === "js-sqlite" ? generateJsBackend(state) : generatePhpBackend(state) },
      frontend: { file: state.stack === "js-sqlite" ? "frontend/app.js" : "Niet nodig bij de PHP-route", code: state.stack === "js-sqlite" ? generateJsFrontend(state) : "PHP verwerkt het formulier bij iedere paginalaad. Voor deze gegenereerde CRUD hoef je geen extra browser-JavaScript te plakken. Ga naar tab 5 voor het exacte plakplan." },
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
      const builderCodeContainer = builderCode.closest(".builder-code");
      builderCodeContainer?.classList.toggle("is-code-open", currentBuilderTab === "steps");
      const codeToggle = builderCodeContainer?.querySelector("[data-code-toggle]");
      if (codeToggle) {
        const open = currentBuilderTab === "steps";
        codeToggle.setAttribute("aria-expanded", String(open));
        codeToggle.textContent = open ? "Verberg het plakplan" : "2. Toon de code";
      }
      updateBuilderOutput();
    });
  });

  $("[data-copy-builder]", builder).addEventListener("click", () => copyText(builder.currentCode || ""));
  applyPreset("products");
}

const routeDefinitions = {
  "php-sqlite": {
    code: "Route A",
    name: "PHP + SQLite",
    description: "De kortste beginnersroute: XAMPP draait PHP en SQLite bewaart alles in één lokaal bestand. Je hoeft geen databaseserver of API te configureren.",
    recommendation: "Advies: PHP + SQLite. Dit heeft de minste bewegende onderdelen en is daarom de veiligste eerste CRUD-route.",
    download: "./downloads/studenten-crud.zip",
    downloadLabel: "PHP + SQLite starter",
    downloadHint: "Eén databasebestand · werkt met XAMPP",
    nextHref: "#xampp",
    nextLabel: "Start met XAMPP klaarzetten",
    steps: [
      ["xampp", "XAMPP klaarzetten", "Start Apache en controleer PDO SQLite."],
      ["mappen", "Projectmap maken", "Zet de starter in htdocs en controleer de bestanden."],
      ["database", "SQLite koppelen", "Maak de PDO-verbinding en de tabellen."],
      ["crud", "Vier CRUD-acties bouwen", "Test Create, Read, Update en Delete apart."],
      ["codebank", "Complete bestanden bekijken", "Vergelijk jouw code met de werkende codebank."],
      ["builder", "Eigen onderwerp genereren", "Maak velden en SQL voor jouw eigen thema."],
      ["snippets", "Functies toevoegen", "Kies zoeken, validatie, relaties of uploads."],
      ["eigen-maken", "Alles eigen maken", "Hernoem studenten naar jouw resource en test opnieuw."],
      ["foutzoeker", "Fouten gericht oplossen", "Zoek op de letterlijke foutmelding uit PHP of SQLite."]
    ]
  },
  "php-mysql": {
    code: "Route B",
    name: "PHP + MySQL",
    description: "Een eenvoudige PHP CRUD met de MySQL-server en phpMyAdmin die al in XAMPP zitten. Kies dit als je opleiding of bestaand project MySQL vereist.",
    recommendation: "Advies: PHP + MySQL. Je beheert tabellen visueel in phpMyAdmin en werkt met de database die XAMPP al meelevert.",
    download: "./downloads/php-mysql-crud.zip",
    downloadLabel: "PHP + MySQL starter",
    downloadHint: "XAMPP · MySQL · phpMyAdmin",
    nextHref: "#xampp",
    nextLabel: "Start Apache en MySQL",
    steps: [
      ["xampp", "XAMPP klaarzetten", "Start Apache én MySQL in het Control Panel."],
      ["mappen", "Projectmap maken", "Zet de MySQL-starter in de juiste htdocs-map."],
      ["mysql-route", "Database importeren", "Maak de database in phpMyAdmin en importeer schema.sql."],
      ["crud", "Vier CRUD-acties bouwen", "Gebruik PDO en test iedere actie apart."],
      ["builder", "Eigen onderwerp genereren", "Laat de builder MySQL-SQL en PHP maken."],
      ["snippets", "Functies toevoegen", "Voeg daarna zoeken, relaties of login toe."],
      ["uitbreiden", "Overzichten uitbreiden", "Werk met filters, sortering en paginering."],
      ["eigen-maken", "Alles eigen maken", "Vervang resource, velden en labels systematisch."],
      ["foutzoeker", "MySQL-fouten oplossen", "Zoek op Access denied, constraint of je foutcode."]
    ]
  },
  "js-sqlite": {
    code: "Route C",
    name: "JavaScript + SQLite",
    description: "Een frontend met HTML, CSS en browser-JavaScript, plus een Node.js/Express API die SQLite gebruikt. Kies dit als je fetch en API-routes wilt leren.",
    recommendation: "Advies: JavaScript + SQLite. Deze route laat duidelijk zien hoe een frontend, API en database met elkaar praten.",
    download: "./downloads/javascript-sqlite-crud.zip",
    downloadLabel: "JavaScript + SQLite starter",
    downloadHint: "Node.js · Express · fetch · SQLite",
    nextHref: "#javascript-route",
    nextLabel: "Start de JavaScript-route",
    steps: [
      ["javascript-route", "Node.js-project starten", "Installeer packages en open de lokale server."],
      ["javascript-route", "API en database testen", "Controleer de GET-route en de SQLite-tabel."],
      ["javascript-route", "Frontend koppelen", "Gebruik fetch voor Create, Read, Update en Delete."],
      ["builder", "Eigen onderwerp genereren", "Maak SQL, formulier en Express-routes voor jouw thema."],
      ["snippets", "Extra functies kiezen", "Voeg validatie, filters, relaties of uploads toe."],
      ["uitbreiden", "Overzichten uitbreiden", "Bouw zoeken, sortering en paginering in."],
      ["eigen-maken", "Alles eigen maken", "Hernoem de resource in frontend, API en database."],
      ["foutzoeker", "API-fouten oplossen", "Zoek op Failed to fetch, module of SQLite-fout."]
    ]
  }
};

const routeChoices = $$('[data-route-choice]');
const routeResult = $("[data-route-result]");
const routeFocus = $("[data-route-focus]");
const routeSections = $$('[data-route-section]');
const routeLinks = $$('[data-route-link]');

function routeMatches(element, routeKey) {
  return element.dataset.routeSection?.split(" ").includes(routeKey)
    || element.dataset.routeLink?.split(" ").includes(routeKey);
}

function applyRouteFocus() {
  const shouldFocus = Boolean(activeRoute && routeFocus?.checked);
  routeSections.forEach((section) => {
    section.hidden = shouldFocus && !routeMatches(section, activeRoute);
  });
  routeLinks.forEach((link) => {
    link.hidden = shouldFocus && !routeMatches(link, activeRoute);
  });
  document.body.classList.toggle("route-focused", shouldFocus);
  updateProgress();
}

function renderPersonalRoute(route) {
  const routeList = $("[data-personal-route]");
  routeList.innerHTML = route.steps.map(([id, title, detail], index) => `
    <li><a href="#${id}"><span>${String(index + 1).padStart(2, "0")}</span><div><b>${title}</b><small>${detail}</small></div></a></li>
  `).join("");
}

function updateRouteDownloads(route) {
  const headerDownload = $(".header-cta");
  const sidebarDownload = $(".sidebar-download");
  if (headerDownload) {
    headerDownload.href = route.download;
    headerDownload.textContent = `Download ${route.name}`;
  }
  if (sidebarDownload) {
    sidebarDownload.href = route.download;
    $("span", sidebarDownload).textContent = "Jouw gekozen starter";
    $("strong", sidebarDownload).textContent = route.downloadLabel;
    $("small", sidebarDownload).textContent = route.downloadHint;
  }
}

function selectRoute(routeKey, { scrollResult = false } = {}) {
  const route = routeDefinitions[routeKey];
  if (!route) return;

  activeRoute = routeKey;
  try {
    localStorage.setItem("cfd-selected-route", routeKey);
  } catch {
    // De route blijft voor deze sessie actief zonder browseropslag.
  }

  routeChoices.forEach((choice) => {
    const selected = choice.dataset.routeChoice === routeKey;
    choice.classList.toggle("is-selected", selected);
    choice.setAttribute("aria-pressed", String(selected));
    const label = $("[data-route-select-label]", choice);
    if (label) label.textContent = selected ? "Gekozen ✓" : "Kies deze route →";
  });

  $$('[data-recommend-route]').forEach((button) => {
    button.classList.toggle("is-active", button.dataset.recommendRoute === routeKey);
  });

  routeResult.hidden = false;
  $("[data-selected-route-code]").textContent = `${route.code} gekozen`;
  $("[data-selected-route-name]").textContent = route.name;
  $("[data-selected-route-description]").textContent = route.description;
  $("[data-route-next]").href = route.nextHref;
  $("[data-route-next-label]").textContent = route.nextLabel;
  $("[data-route-recommendation]").textContent = route.recommendation;
  renderPersonalRoute(route);

  const headerRoute = $("[data-header-route]");
  const sidebarRoute = $("[data-sidebar-route]");
  [headerRoute, sidebarRoute].forEach((control) => {
    if (!control) return;
    control.hidden = false;
    $("[data-header-route-code], [data-sidebar-route-code]", control).textContent = route.code;
    $("[data-header-route-name], [data-sidebar-route-name]", control).textContent = route.name;
  });

  const builderStack = $("[data-builder-stack]");
  if (builderStack) {
    builderStack.value = routeKey;
    builderStack.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const stackProgress = $('[data-progress-item="stack"]');
  if (stackProgress) stackProgress.checked = true;
  updateRouteDownloads(route);
  applyRouteFocus();

  if (scrollResult) {
    routeResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

routeChoices.forEach((choice) => {
  choice.addEventListener("click", () => selectRoute(choice.dataset.routeChoice, { scrollResult: true }));
});

$$('[data-recommend-route]').forEach((button) => {
  button.addEventListener("click", () => selectRoute(button.dataset.recommendRoute, { scrollResult: true }));
});

routeFocus?.addEventListener("change", () => {
  try {
    localStorage.setItem("cfd-route-focus", String(routeFocus.checked));
  } catch {
    // Focus blijft voor deze sessie werken zonder browseropslag.
  }
  applyRouteFocus();
});

function scrollToRouteChooser() {
  $(".stack-decision")?.scrollIntoView({ behavior: "smooth", block: "center" });
  routeChoices[0]?.focus({ preventScroll: true });
}

$("[data-change-route]")?.addEventListener("click", scrollToRouteChooser);
$("[data-header-route]")?.addEventListener("click", scrollToRouteChooser);
$("[data-sidebar-route]")?.addEventListener("click", scrollToRouteChooser);

try {
  routeFocus.checked = localStorage.getItem("cfd-route-focus") !== "false";
  const savedRoute = localStorage.getItem("cfd-selected-route");
  if (routeDefinitions[savedRoute]) selectRoute(savedRoute);
} catch {
  routeFocus.checked = true;
}

let beginnerModeEnabled = true;
try {
  beginnerModeEnabled = localStorage.getItem("cfd-beginner-mode") !== "false";
} catch {
  beginnerModeEnabled = true;
}

function setBeginnerMode(enabled, persist = true) {
  beginnerModeEnabled = enabled;
  document.body.classList.toggle("beginner-mode", enabled);
  $$('[data-beginner-toggle]').forEach((button) => {
    button.setAttribute("aria-pressed", String(enabled));
    const label = $("[data-beginner-toggle-label]", button);
    if (label) label.textContent = enabled ? "Aan · leg code eerst uit" : "Uit · toon alle code direct";
  });

  if (persist) {
    try {
      localStorage.setItem("cfd-beginner-mode", String(enabled));
    } catch {
      // De instelling blijft voor deze sessie actief zonder browseropslag.
    }
  }
}

$$('[data-beginner-toggle]').forEach((button) => {
  button.addEventListener("click", () => setBeginnerMode(!beginnerModeEnabled));
});
setBeginnerMode(beginnerModeEnabled, false);

const pastePlacements = {
  "phpini-code": {
    method: "Wijzig twee bestaande regels",
    file: "C:\\xampp\\php\\php.ini (open via XAMPP → Apache → Config → PHP)",
    start: "extension=pdo_sqlite",
    end: "extension=sqlite3",
    action: "Gebruik Ctrl+F voor beide regels en haal alleen de puntkomma aan het begin weg. Plak geen tweede kopie onderaan.",
    check: "Sla op, herstart Apache en open http://localhost/test.php. Daar moet ‘SQLite werkt’ staan.",
    copyReady: true
  },
  "database-core": {
    method: "Uitlegvoorbeeld · niet los plakken",
    file: "config/database.php",
    start: "function database(): PDO",
    end: "return $connection; gevolgd door }",
    action: "Dit korte blok mist de paden en foutafhandeling eromheen. Gebruik in de PHP-codebank het complete bestand config/database.php en vervang daarmee het hele bestand.",
    check: "Na het complete bestand te vervangen: open de app en controleer of data/app.sqlite automatisch verschijnt.",
    copyReady: false
  },
  "mysql-core": {
    method: "Uitlegvoorbeeld · niet los plakken",
    file: "config/database.php uit de MySQL-starter",
    start: "function database(): PDO",
    end: "return $connection; gevolgd door }",
    action: "Gebruik het complete config/database.php-bestand in de MySQL-codebank direct onder dit voorbeeld. Dit losse kernblok mist de rest van de functie.",
    check: "Start Apache én MySQL en open de app. De database studenten_crud moet in phpMyAdmin verschijnen.",
    copyReady: false
  },
  "create-code": {
    method: "Vervang één bestaand PHP-blok",
    file: "studenten-crud/index.php",
    start: "case 'create_student':",
    end: "de eerste break; na dit beginanker",
    action: "Selecteer het beginanker, alle regels ertussen en die eerste break;. Plak het gekopieerde vervangblok precies één keer en sla op met Ctrl+S.",
    check: "Voeg student TEST001 toe. Na opslaan moet die student in het overzicht staan.",
    copyReady: true
  },
  "read-code": {
    method: "Vervang één bestaand PHP-blok",
    file: "studenten-crud/index.php",
    start: "$studentStatement = $db->prepare(",
    end: "$students = $studentStatement->fetchAll();",
    action: "Selecteer vanaf het beginanker tot en met het eindanker. Plak het nieuwe blok op exact dezelfde plek; laat de HTML-tabel verderop ongemoeid.",
    check: "Vernieuw de pagina. Teststudenten moeten zichtbaar blijven en zoeken, filteren en sorteren moeten nog werken.",
    copyReady: true
  },
  "update-code": {
    method: "Vervang één bestaand PHP-blok",
    file: "studenten-crud/index.php",
    start: "case 'update_student':",
    end: "de eerste break; na dit beginanker",
    action: "Selecteer inclusief beide ankers, plak één keer en sla op. Plak dit niet naast het bestaande Update-blok.",
    check: "Bewerk TEST001, verander alleen de achternaam en vernieuw de pagina. De wijziging moet bewaard blijven.",
    copyReady: true
  },
  "delete-code": {
    method: "Vervang één bestaand PHP-blok",
    file: "studenten-crud/index.php",
    start: "case 'delete_student':",
    end: "de eerste break; na dit beginanker",
    action: "Selecteer inclusief beide ankers, plak één keer en sla op. Verander niets aan de cases erboven of eronder.",
    check: "Verwijder alleen TEST001. Die rij moet weg zijn; de andere studenten moeten blijven staan.",
    copyReady: true
  },
  "js-db-code": {
    method: "Uitlegvoorbeeld · compleet bestand aanbevolen",
    file: "javascript-sqlite-crud/backend/server.js",
    start: "const Database = require(\"better-sqlite3\");",
    end: "de afsluitende `); na CREATE TABLE",
    action: "De echte starter gebruikt extra paden, landen en foutafhandeling. Gebruik onderaan dit hoofdstuk het complete backend/server.js-bestand.",
    check: "Voer npm start uit en open http://localhost:3000/api/students. Je moet een JSON-lijst zien.",
    copyReady: false
  },
  "js-api-code": {
    method: "Uitlegvoorbeeld · compleet bestand aanbevolen",
    file: "javascript-sqlite-crud/backend/server.js",
    start: "app.post(\"/api/students\"",
    end: "de bijbehorende afsluitende });",
    action: "Deze korte versie heeft helpers uit de starter nodig. Vervang voor zekerheid het complete backend/server.js-bestand vanuit de JavaScript-codebank.",
    check: "Voeg via het formulier een teststudent toe en controleer of de API status 201 terugstuurt.",
    copyReady: false
  },
  "js-fetch-code": {
    method: "Uitlegvoorbeeld · compleet bestand aanbevolen",
    file: "javascript-sqlite-crud/frontend/app.js",
    start: "async function createStudent",
    end: "de } die deze functie afsluit",
    action: "Gebruik bij twijfel het complete frontend/app.js-bestand uit de codebank; daar zijn formulier-events en meldingen al gekoppeld.",
    check: "Laat npm start draaien. Voeg via de browser een student toe; de nieuwe rij moet zonder volledige paginavernieuwing verschijnen.",
    copyReady: false
  },
  "snippet-one-many": {
    method: "Al aanwezig in de studenten-starter",
    file: "database/schema.sql",
    start: "CREATE TABLE IF NOT EXISTS landen",
    end: "FOREIGN KEY (land_id) ...",
    action: "Plak dit voorbeeld niet opnieuw in de studenten-starter: studenten en landen zijn daar al gekoppeld. Gebruik het alleen als patroon voor twee nieuwe tabellen.",
    check: "Probeer in de bestaande app een land te verwijderen dat nog studenten heeft. De app moet dit tegenhouden.",
    copyReady: false
  },
  "snippet-many-many": {
    method: "Voeg één tabel onderaan toe · gevorderd",
    file: "database/schema.sql",
    start: "na de volledige tabellen studenten én vakken",
    end: "vóór eventuele INSERT-voorbeelddata",
    action: "Dit werkt pas als de tabel vakken al bestaat. Kopieer alleen CREATE TABLE student_vakken; de INSERT en SELECT eronder horen later in je PHP-verwerking.",
    check: "Reset tijdens ontwikkeling app.sqlite, laad de app en controleer met een databaseviewer of student_vakken bestaat.",
    copyReady: false
  },
  "snippet-detail-php": {
    method: "Maak een compleet nieuw bestand",
    file: "studenten-crud/detail.php",
    start: "een nieuw, leeg bestand",
    end: "het einde van het nieuwe bestand",
    action: "Maak detail.php naast index.php, plak het hele blok vanaf <?php, sla op en open detail.php?id=1. Je vervangt niets in index.php.",
    check: "Open http://localhost/studenten-crud/detail.php?id=1. Je moet één student of ‘Student niet gevonden’ zien, geen PHP-fout.",
    copyReady: true
  },
  "snippet-detail-js": {
    method: "Twee bestanden · splits bij de comments",
    file: "backend/server.js én frontend/app.js",
    start: "// backend/server.js en daarna // frontend/app.js",
    end: "het einde van iedere functie",
    action: "Plak het eerste deel bij de andere app.get-routes in server.js. Plak het tweede deel bij de andere async functies in app.js. Plak nooit beide delen in één bestand.",
    check: "Open /api/students/1. Je moet één JSON-object of een duidelijke 404-fout krijgen.",
    copyReady: false
  },
  "snippet-login": {
    method: "Meerdelig recept · geen losse plakactie",
    file: "database/schema.sql + een nieuw login.php + het bestaande index.php",
    start: "drie verschillende plekken",
    end: "voer ieder deel afzonderlijk uit",
    action: "Dit blok toont de beveiligingskern maar is nog geen compleet inlogscherm. Gebruik het niet als één copy-pasteblok; formulier, registratie en uitloggen zijn ook nodig.",
    check: "Een complete login is pas klaar als fout wachtwoord wordt geweigerd, goed wachtwoord werkt en uitloggen de sessie wist.",
    copyReady: false
  },
  "snippet-upload": {
    method: "Meerdelig recept · formulier en verwerking",
    file: "index.php + uploads-map + databasekolom",
    start: "in de juiste POST-case na de invoercontrole",
    end: "vóór de INSERT of UPDATE wordt uitgevoerd",
    action: "Maak eerst uploads/, voeg het file-input toe aan het formulier en een bestandsnaamkolom aan schema.sql. Dit verwerkingsblok alleen is niet genoeg.",
    check: "Test een kleine JPG, een PNG, een te groot bestand en een PDF. Alleen de geldige afbeeldingen mogen worden opgeslagen.",
    copyReady: false
  },
  "snippet-csv": {
    method: "Maak een compleet nieuw bestand",
    file: "studenten-crud/export.php",
    start: "een nieuw, volledig leeg bestand",
    end: "het einde van het bestand",
    action: "Maak export.php naast index.php, plak het hele blok vanaf <?php en sla op. Voeg daarna in index.php een gewone link naar export.php toe.",
    check: "Open http://localhost/studenten-crud/export.php. Er moet een CSV-download starten die in Excel kan worden geopend.",
    copyReady: true
  },
  "snippet-csv-import": {
    method: "Meerdelig recept · nog een formulier nodig",
    file: "een nieuwe import.php + uploadformulier",
    start: "na databaseverbinding en CSRF-controle",
    end: "vóór er HTML wordt getoond",
    action: "Dit is alleen de verwerkingskern. Voeg eerst database(), $standaardLandId en het uploadformulier toe. Plak het niet los onderaan index.php.",
    check: "Test één geldige CSV en één CSV met een fout e-mailadres. Bij de foute CSV mag geen enkele rij worden toegevoegd.",
    copyReady: false
  },
  "snippet-soft-delete": {
    method: "Zes losse wijzigingen · geen enkel plakblok",
    file: "schema.sql + de SELECT-, DELETE- en herstelacties in index.php",
    start: "iedere commentregel noemt een andere plek",
    end: "voer de regels één voor één uit",
    action: "Kopieer dit niet als geheel. De kolom hoort in CREATE TABLE; iedere query vervangt een andere bestaande query in PHP.",
    check: "Een verwijderd testitem moet uit het normale overzicht verdwijnen, in de prullenbak staan en daarna hersteld kunnen worden.",
    copyReady: false
  },
  "snippet-transaction": {
    method: "Aanpasvoorbeeld · variabelen eerst bepalen",
    file: "de POST-case die bestelling en voorraad tegelijk verwerkt",
    start: "nadat $klantId, $totaal, $aantal en $productId zijn gecontroleerd",
    end: "vóór de redirect na opslaan",
    action: "De variabelen en tabellen zijn voorbeelden en bestaan niet in de studenten-starter. Pas eerst namen en invoer aan; plak dit niet ongewijzigd.",
    check: "Forceer te weinig voorraad. Dan mogen zowel de bestelling als de voorraadwijziging niet opgeslagen worden.",
    copyReady: false
  }
};

function codeLesson(label, code, container) {
  const context = `${label} ${code.slice(0, 1800)}`.toLowerCase();
  let location = `Open het bestand dat boven dit blok staat: ${label || "het genoemde bestand"}.`;
  let purpose = "Dit blok voert precies de functie uit die in de stap erboven wordt beschreven.";
  let action = "Lees de stap boven het blok. Kopieer daarna het hele blok, plak het één keer op de genoemde plek, sla op en test meteen.";
  let check = "Vernieuw de pagina. Zie je een fout? Kopieer de volledige foutmelding en plak één belangrijk woord in de Foutzoeker.";

  if (context.includes("php.ini")) {
    location = "Open XAMPP Control Panel → Apache → Config → PHP (php.ini).";
    purpose = "Deze regels zetten SQLite-ondersteuning in PHP aan.";
    action = "Zoek de bestaande regels. Verwijder alleen de puntkomma ervoor, sla op en herstart Apache. Voeg geen dubbele regels toe.";
    check = "Open daarna de controlepagina via localhost. De melding ‘could not find driver’ mag niet verschijnen.";
  } else if (label.toLowerCase().includes("schema")) {
    location = "Open de projectmap en daarna database/schema.sql in je code-editor.";
  } else if (label.toLowerCase().includes("database.php")) {
    location = "Open config/database.php in je projectmap.";
  } else if (label.toLowerCase().includes("functions.php")) {
    location = "Open includes/functions.php in je projectmap.";
  } else if (label.toLowerCase().includes("server.js") || label.toLowerCase().includes("express")) {
    location = "Open backend/server.js in de uitgepakte JavaScript-starter.";
  } else if (label.toLowerCase().includes("app.js") || label.toLowerCase().includes("browser")) {
    location = "Open het genoemde app.js-bestand in de frontendmap.";
  } else if (label.toLowerCase().includes("index.php")) {
    location = "Open index.php in de PHP-projectmap onder htdocs.";
  } else if (/\.php/i.test(label)) {
    location = `Maak of open ${label.split("·")[0].trim()} in je PHP-projectmap.`;
  }

  if (context.includes("create table")) {
    purpose = "Dit maakt de tabel en bepaalt welke gegevens daarin mogen worden bewaard.";
    check = "Open de app één keer. De tabel of het SQLite-databasebestand moet daarna bestaan; er hoeft nog geen rij in te staan.";
  }
  if (context.includes("insert into") && !context.includes("update ")) {
    purpose = "Dit bewaart de ingevulde gegevens als een nieuwe rij in de database.";
    check = "Vul het formulier met testgegevens in en klik op opslaan. De nieuwe rij moet in het overzicht verschijnen.";
  }
  if (context.includes("select ") && !context.includes("insert into") && !context.includes("delete from")) {
    purpose = "Dit leest opgeslagen gegevens uit de database zodat je ze op de pagina kunt tonen.";
    check = "Vernieuw de pagina. Eerder opgeslagen testgegevens moeten zichtbaar blijven.";
  }
  if (context.includes("update ") && !context.includes("insert into")) {
    purpose = "Dit zoekt één bestaande rij en bewaart de aangepaste waarden.";
    check = "Wijzig één herkenbaar testveld, sla op en vernieuw de pagina. Alleen die gekozen rij moet veranderd zijn.";
  }
  if (context.includes("delete from") && !context.includes("insert into")) {
    purpose = "Dit verwijdert precies één gekozen rij uit de database.";
    check = "Verwijder een testitem en vernieuw de pagina. Het item moet weg zijn terwijl de andere rijen blijven staan.";
  }
  if (context.includes("app.get(") || context.includes("app.post(") || context.includes("fetch(")) {
    purpose = "Dit laat de browser en de JavaScript-backend gegevens naar elkaar sturen.";
    check = "Laat npm start draaien en open de genoemde localhost-URL. Je moet gegevens zien en geen ‘Failed to fetch’-melding krijgen.";
  }
  if (context.includes("create table") && context.includes("insert into") && context.includes("delete from")) {
    purpose = "Dit is een compleet onderdeel met database, opslaan, lezen en verwijderen bij elkaar.";
  }

  if (container.classList.contains("builder-code")) {
    location = `De builder heeft dit gemaakt voor ${label}. Open eerst tab 5: “Start: waar plakken?”.`;
    action = "Kopieer daarna één tab tegelijk. Iedere tab noemt een ander bestand of een andere plek; plak ze nooit samen in één bestand.";
  } else if (container.closest(".snippet-body")) {
    action = "Voeg dit pas toe nadat de basis-CRUD werkt. Volg eerst ‘Waar plakken’ boven dit blok, kopieer alles en test alleen deze nieuwe functie.";
  } else if (container.classList.contains("file-code")) {
    location = `Dit is het complete bestand ${label}. Je hoeft het niet regel voor regel over te typen.`;
    action = "Gebruik dit alleen om een beschadigd bestand volledig te vervangen. Download voor een nieuw project liever de complete starter.";
    check = "Sla het vervangen bestand op en vernieuw de app. Controleer eerst de basisacties voordat je weer eigen wijzigingen toevoegt.";
  }

  const placement = pastePlacements[container.querySelector("pre code")?.id];
  if (placement) {
    return {
      location: placement.file,
      purpose,
      action: placement.action,
      check: placement.check,
      method: placement.method,
      start: placement.start,
      end: placement.end,
      copyReady: placement.copyReady
    };
  }

  return { location, purpose, action, check, method: "Volg de plaatsingsstappen" };
}

function addLabeledLine(parent, label, value) {
  const line = document.createElement("p");
  const strong = document.createElement("b");
  strong.textContent = `${label}: `;
  line.append(strong, document.createTextNode(value));
  parent.append(line);
}

$$('.code-block, .file-code').forEach((container, index) => {
  const toolbar = [...container.children].find((child) => child.classList?.contains("code-toolbar"));
  const pre = [...container.children].find((child) => child.tagName === "PRE");
  const code = pre?.querySelector("code");
  if (!toolbar || !pre || !code || container.querySelector(":scope > .beginner-code-guide")) return;

  container.classList.add("beginner-code");
  const guide = document.createElement("div");
  guide.className = "beginner-code-guide";
  const explanation = document.createElement("div");
  const eyebrow = document.createElement("span");
  eyebrow.textContent = "Eerst begrijpen, daarna kopiëren";
  const title = document.createElement("h4");
  const locationLine = document.createElement("div");
  const startLine = document.createElement("div");
  const endLine = document.createElement("div");
  const purposeLine = document.createElement("div");
  const actionLine = document.createElement("div");
  const checkLine = document.createElement("div");
  explanation.append(eyebrow, title, locationLine, startLine, endLine, purposeLine, actionLine, checkLine);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.dataset.codeToggle = String(index);
  const initiallyOpen = container.classList.contains("is-code-open");
  toggle.setAttribute("aria-expanded", String(initiallyOpen));
  toggle.textContent = initiallyOpen ? "Verberg het plakplan" : "2. Toon de code";
  guide.append(explanation, toggle);
  toolbar.insertAdjacentElement("afterend", guide);

  function refreshGuide() {
    const label = toolbar.querySelector("span")?.textContent.trim() || "dit codeblok";
    const lesson = codeLesson(label, code.textContent, container);
    eyebrow.textContent = `Plaktype · ${lesson.method}`;
    title.textContent = `1. Dit hoort bij: ${label}`;
    locationLine.replaceChildren();
    startLine.replaceChildren();
    endLine.replaceChildren();
    purposeLine.replaceChildren();
    actionLine.replaceChildren();
    checkLine.replaceChildren();
    addLabeledLine(locationLine, "Open exact dit bestand", lesson.location);
    if (lesson.start) addLabeledLine(startLine, "Zoek dit begin met Ctrl+F", lesson.start);
    if (lesson.end) addLabeledLine(endLine, "Stop met selecteren bij", lesson.end);
    addLabeledLine(purposeLine, "Dit doet het", lesson.purpose);
    addLabeledLine(actionLine, "Jouw actie", lesson.action);
    addLabeledLine(checkLine, "Zo test je het", lesson.check);

    const copyButton = toolbar.querySelector("button");
    if (copyButton && lesson.copyReady === false && copyButton.dataset.originalCopyLabel !== "saved") {
      copyButton.textContent = "Kopieer voorbeeld";
      copyButton.dataset.originalCopyLabel = "saved";
    }
  }

  toggle.addEventListener("click", () => {
    const open = container.classList.toggle("is-code-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Verberg de code" : "2. Toon de code";
  });

  refreshGuide();
  const observedLabel = toolbar.querySelector("span");
  const observer = new MutationObserver(refreshGuide);
  observer.observe(code, { childList: true, characterData: true, subtree: true });
  if (observedLabel) observer.observe(observedLabel, { childList: true, characterData: true, subtree: true });
});

$$('.mini-code').forEach((commandBlock) => {
  if (commandBlock.previousElementSibling?.classList.contains("command-guide")) return;
  const command = $("code", commandBlock)?.textContent.trim() || "de opdracht";
  let instruction = "Open de terminal in je projectmap, plak deze opdracht, druk op Enter en wacht tot hij klaar is.";
  if (command.startsWith("npm install")) instruction = "Open de terminal in de uitgepakte JavaScript-projectmap, plak dit, druk op Enter en wacht tot de installatie klaar is.";
  if (command.startsWith("npm start")) instruction = "Open de terminal in je JavaScript-projectmap, plak dit en laat het venster open terwijl je de app gebruikt.";
  if (command.startsWith("git ")) instruction = "Open de terminal in de map van CodingForDummies, plak deze opdracht en druk op Enter.";

  const guide = document.createElement("div");
  guide.className = "command-guide";
  const number = document.createElement("span");
  number.textContent = "→";
  const textLine = document.createElement("div");
  addLabeledLine(textLine, "Zo voer je dit uit", instruction);
  guide.append(number, textLine);
  commandBlock.insertAdjacentElement("beforebegin", guide);
});

$$('.snippet-body').forEach((body) => {
  if (body.querySelector(":scope > .snippet-read-first")) return;
  const note = document.createElement("div");
  note.className = "snippet-read-first";
  note.innerHTML = '<span>!</span><div><b>Eerst de basis controleren</b><small>Voeg deze functie pas toe als toevoegen, bekijken, wijzigen en verwijderen al zonder fout werken. Maak vooraf een kopie van je projectmap.</small></div>';
  body.prepend(note);

  const codeId = $("pre code", body)?.id;
  const placement = pastePlacements[codeId];
  const titleGroup = body.closest(".snippet-item")?.querySelector("summary > span:nth-child(2)");
  if (placement && titleGroup && !titleGroup.querySelector(".copy-ready-status")) {
    const status = document.createElement("em");
    status.className = `copy-ready-status ${placement.copyReady ? "is-ready" : "is-multistep"}`;
    status.textContent = placement.copyReady ? "Direct copy-paste" : "Meerdere stappen nodig";
    titleGroup.append(status);
  }
});

const snippetPickButtons = $$('[data-snippet-pick]');
const snippetAdvice = $("[data-snippet-advice]");

snippetPickButtons.forEach((button) => {
  button.addEventListener("click", () => {
    let targetId = button.dataset.snippetPick;
    if (targetId === "snippet-detail-php" && activeRoute === "js-sqlite") targetId = "snippet-detail-js";
    const targetCode = document.getElementById(targetId);
    const recipe = targetCode?.closest(".snippet-item");
    if (!recipe) return;

    snippetFilterButtons.find((item) => item.dataset.snippetFilter === "all")?.click();
    snippetItems.forEach((item) => { item.open = item === recipe; });
    snippetPickButtons.forEach((item) => item.classList.toggle("is-active", item === button));

    const title = $("summary b", recipe)?.textContent || "het gekozen recept";
    const tags = recipe.dataset.snippetTags.split(" ");
    const selectedPlacement = pastePlacements[targetCode.id];
    const readiness = selectedPlacement?.copyReady
      ? " Dit recept levert een compleet direct te plakken bestand."
      : " Dit is een recept met meerdere plaatsingen; voer ieder genoemd bestand afzonderlijk uit.";
    const routeWarning = activeRoute === "js-sqlite" && !tags.includes("javascript") && !tags.includes("database")
      ? " Let op: dit specifieke recept gebruikt PHP en kan niet rechtstreeks in de JavaScript-starter."
      : "";
    $("span", snippetAdvice).textContent = recipe.querySelector(".snippet-index")?.textContent || "→";
    $("p", snippetAdvice).textContent = `Open: “${title}”. Lees eerst de startcheck en ‘Waar plakken’.${readiness}${routeWarning}`;
    window.setTimeout(() => recipe.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  });
});

const phpAnatomy = {
  index: {
    path: "C:\\xampp\\htdocs\\studenten-crud\\index.php",
    title: "De hoofdpagina en alle acties",
    description: "Dit bestand bestaat uit twee helften: bovenaan verwerkt PHP de acties; onderaan staat de HTML die je in de browser ziet.",
    rule: "Nieuwe PHP-acties horen vóór <!DOCTYPE html>. Formuliervelden en tabellen horen ná <!DOCTYPE html>. Gebruik altijd de zoekankers uit de gids.",
    zones: [
      ["01", "PHP opent", "<?php staat helemaal bovenaan. Zet nooit tekst of lege regels vóór deze opening."],
      ["02", "Andere bestanden laden", "De require-regels halen database.php en functions.php binnen. Laat deze regels staan."],
      ["03", "Opslaan, wijzigen en verwijderen", "Binnen switch ($intent) staan aparte case-blokken. De CRUD-tabs vervangen precies één zo’n blok."],
      ["04", "Gegevens ophalen", "SELECT-query’s laden rijen vóórdat HTML wordt getoond."],
      ["05", "Zichtbare pagina", "Na <!DOCTYPE html> staan formulier, knoppen en overzicht. Hier hoort geen los case-blok."]
    ]
  },
  database: {
    path: "C:\\xampp\\htdocs\\studenten-crud\\config\\database.php",
    title: "De verbinding met je database",
    description: "Dit bestand zoekt schema.sql, opent app.sqlite en geeft één databaseverbinding terug aan index.php.",
    rule: "Voor een beginner is volledig vervangen veiliger dan één PDO-regel invoegen. Gebruik het complete bestand uit de codebank.",
    zones: [
      ["01", "Functie begint", "function database(): PDO groepeert alles wat nodig is voor de verbinding."],
      ["02", "Paden bepalen", "PHP berekent waar data/app.sqlite en database/schema.sql staan."],
      ["03", "SQLite openen", "new PDO(...) maakt de echte verbinding en zet foutmeldingen aan."],
      ["04", "Tabellen maken", "file_get_contents($schemaFile) voert schema.sql automatisch uit."],
      ["05", "Verbinding teruggeven", "return $connection; laat index.php databasevragen uitvoeren."]
    ]
  },
  functions: {
    path: "C:\\xampp\\htdocs\\studenten-crud\\includes\\functions.php",
    title: "Kleine hulpmiddelen die vaker nodig zijn",
    description: "Hier staan functies voor veilige tekst, invoercontrole, meldingen en doorsturen. index.php roept ze bij naam aan.",
    rule: "Een nieuwe functie komt na de afsluitende } van de vorige functie, nooit midden in een andere functie. Gebruik bij twijfel het complete bestand.",
    zones: [
      ["01", "Veilige uitvoer", "e() voorkomt dat ingevulde HTML als echte HTML wordt uitgevoerd."],
      ["02", "Formulierbeveiliging", "csrf_token() en verify_csrf() controleren dat een actie uit jouw formulier komt."],
      ["03", "Tekst controleren", "required_text() weigert lege of te lange invoer."],
      ["04", "ID controleren", "positive_id() accepteert alleen een geldig positief nummer."],
      ["05", "Jouw invoer samenstellen", "student_input() leest alle studentvelden en geeft één nette lijst terug."]
    ]
  },
  schema: {
    path: "C:\\xampp\\htdocs\\studenten-crud\\database\\schema.sql",
    title: "De bouwtekening van de database",
    description: "Dit is geen PHP-bestand. Iedere CREATE TABLE beschrijft één lijst gegevens en de kolommen die daarin horen.",
    rule: "Nieuwe kolommen komen binnen de haakjes van de juiste CREATE TABLE en krijgen een komma. Nieuwe tabellen komen na een volledig afgesloten );.",
    zones: [
      ["01", "Database-instelling", "PRAGMA foreign_keys = ON zet controles tussen gekoppelde tabellen aan."],
      ["02", "Landen-tabel", "CREATE TABLE ... landen bewaart naam, code en regio."],
      ["03", "Studenten-tabel", "CREATE TABLE ... studenten bewaart formuliergegevens en land_id."],
      ["04", "Koppeling", "FOREIGN KEY verbindt land_id aan één bestaand land."],
      ["05", "Voorbeeldgegevens", "INSERT OR IGNORE voegt de vijf startlanden maar één keer toe."]
    ]
  }
};

const phpMap = $("[data-php-map]");
if (phpMap) {
  const anatomyButtons = $$('[data-anatomy-file]', phpMap);

  function renderPhpAnatomy(key) {
    const file = phpAnatomy[key];
    if (!file) return;
    $("[data-anatomy-path]", phpMap).textContent = file.path;
    $("[data-anatomy-title]", phpMap).textContent = file.title;
    $("[data-anatomy-description]", phpMap).textContent = file.description;
    $("[data-anatomy-rule]", phpMap).textContent = file.rule;
    $("[data-anatomy-zones]", phpMap).innerHTML = file.zones.map(([number, title, description]) => `
      <li><span>${number}</span><div><b>${title}</b><small>${description}</small></div></li>
    `).join("");
    anatomyButtons.forEach((button) => {
      const active = button.dataset.anatomyFile === key;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
  }

  anatomyButtons.forEach((button) => button.addEventListener("click", () => renderPhpAnatomy(button.dataset.anatomyFile)));
  renderPhpAnatomy("index");
}
