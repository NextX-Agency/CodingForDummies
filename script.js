const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const englishTranslations = {
  ...(window.CFD_TRANSLATIONS_EN || {}),
  "Tekst op formulier": "Form label",
  "Naam in database": "Database name",
  "Soort invoer": "Input type",
  "PHP / JavaScript": "PHP / JavaScript",
  "Automatisch datatype": "Automatic data type",
  "Moet ingevuld": "Required",
  "Geen dubbele": "Unique",
  "Verwijder": "Remove",
  "Nieuw veld": "New field",
  "Lange tekst": "Long text",
  "E-mailadres": "Email address",
  "Webadres / URL": "Website / URL",
  "Telefoonnummer": "Phone number",
  "Datum + tijd": "Date + time",
  "string (datum)": "string (date)",
  "string (datum/tijd)": "string (date/time)",
  "Configuratie is geldig.": "Configuration is valid.",
  "Herstel productvoorbeeld": "Restore product example",
  "Download bestand": "Download file",
  "Optioneel voor PHP: CSRF-beveiliging toevoegen": "Optional for PHP: add CSRF protection",
  "Laat dit uit voor je eerste lokale oefenapp. Zet het later aan voor een gepubliceerde applicatie; de tokenfuncties, controle en verborgen formuliervelden worden dan samen toegevoegd.": "Leave this off for your first local practice app. Enable it later for a published application; the token functions, check and hidden form fields will then be added together.",
  "Open exact dit bestand": "Open this exact file",
  "Zoek dit begin met Ctrl+F": "Find this starting point with Ctrl+F",
  "Stop met selecteren bij": "Stop selecting at",
  "Dit doet het": "What this does",
  "Jouw actie": "Your action",
  "Zo test je het": "How to test it",
  "Kopieer voorbeeld": "Copy example",
  "Volg de plaatsingsstappen": "Follow the placement steps",
  "Dit blok voert precies de functie uit die in de stap erboven wordt beschreven.": "This block performs exactly the function described in the step above.",
  "Lees de stap boven het blok. Kopieer daarna het hele blok, plak het één keer op de genoemde plek, sla op en test meteen.": "Read the step above the block. Then copy the entire block, paste it once in the stated location, save and test immediately.",
  "Vernieuw de pagina. Zie je een fout? Kopieer de volledige foutmelding en plak één belangrijk woord in de Foutzoeker.": "Refresh the page. If you see an error, copy the full message and paste one important word into the Error Finder.",
  "Code gekopieerd": "Code copied",
  "Donker": "Dark",
  "Licht": "Light",
  "Donkere modus inschakelen": "Enable dark mode",
  "Lichte modus inschakelen": "Enable light mode",
  "Gebouwd zonder framework-lock-in. De code in de starter is bedoeld om te lezen, te veranderen en opnieuw te gebruiken. Officiële site:": "Built without framework lock-in. The starter code is meant to be read, changed and reused. Official site:"
};
const languageParameter = new URLSearchParams(window.location.search).get("lang");
let activeLanguage = ["nl", "en"].includes(languageParameter)
  ? languageParameter
  : (localStorage.getItem("cfd-language") || "nl");
const originalTextNodes = new WeakMap();
const originalAttributes = new WeakMap();
const translatableAttributes = ["alt", "aria-label", "placeholder", "title", "data-search-title", "data-code-method", "data-code-start", "data-code-end", "data-code-action", "data-code-check"];
let languageMutationObserver;

function translatedText(nlText) {
  return activeLanguage === "en" ? (englishTranslations[nlText] || nlText) : nlText;
}

function translateSubtree(root = document.body) {
  const elements = root.nodeType === 1 ? [root, ...root.querySelectorAll("*")] : [];
  elements.forEach((element) => {
    if (element.closest("pre, code, script, style, svg, [data-no-translate]")) return;
    for (const attribute of translatableAttributes) {
      if (!element.hasAttribute(attribute)) continue;
      let originals = originalAttributes.get(element);
      if (!originals) {
        originals = new Map();
        originalAttributes.set(element, originals);
      }
      if (!originals.has(attribute)) originals.set(attribute, element.getAttribute(attribute));
      const original = originals.get(attribute);
      element.setAttribute(attribute, activeLanguage === "en" ? (englishTranslations[original] || original) : original);
    }
  });

  const walker = document.createTreeWalker(root, window.NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest("pre, code, script, style, svg, [data-no-translate]")) continue;
    if (!originalTextNodes.has(node)) originalTextNodes.set(node, node.nodeValue);
    const original = originalTextNodes.get(node);
    const trimmed = original.trim();
    if (!trimmed) continue;
    const leading = original.match(/^\s*/)?.[0] || "";
    const trailing = original.match(/\s*$/)?.[0] || "";
    node.nodeValue = activeLanguage === "en"
      ? `${leading}${englishTranslations[trimmed] || trimmed}${trailing}`
      : original;
  }
}

const themeToggle = $("[data-theme-toggle]");
const themeLabel = $("[data-theme-label]");

function applyTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  themeToggle?.setAttribute("aria-pressed", String(dark));
  themeToggle?.setAttribute("aria-label", translatedText(dark ? "Lichte modus inschakelen" : "Donkere modus inschakelen"));
  if (themeLabel) themeLabel.textContent = translatedText(dark ? "Licht" : "Donker");
  $("meta[name='theme-color']")?.setAttribute("content", dark ? "#091321" : "#f3f0e8");
}

applyTheme(document.documentElement.dataset.theme || "light");
themeToggle?.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("cfd-theme", nextTheme);
  applyTheme(nextTheme);
});

window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", (event) => {
  if (!localStorage.getItem("cfd-theme")) applyTheme(event.matches ? "dark" : "light");
});

const copyToast = $("[data-copy-toast]");
let toastTimer;

function showCopyToast(message = "Code gekopieerd") {
  copyToast.textContent = translatedText(message);
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

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replace(/^.*[\\/]/, "").split(" · ")[0] || "crud-code.txt";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

function applyLanguage(language, updateUrl = true) {
  activeLanguage = language === "en" ? "en" : "nl";
  document.documentElement.lang = activeLanguage;
  translateSubtree(document.documentElement);
  document.title = activeLanguage === "en"
    ? (englishTranslations["CodingForDommies — Bouw je eerste CRUD-app"] || "CodingForDommies — Build your first CRUD app")
    : "CodingForDommies — Bouw je eerste CRUD-app";
  const description = $("meta[name='description']");
  const dutchDescription = "Bouw stap voor stap een complete CRUD-webapp met PHP of JavaScript, SQLite of MySQL en XAMPP. Inclusief werkende copy-paste starters.";
  description?.setAttribute("content", activeLanguage === "en" ? (englishTranslations[dutchDescription] || dutchDescription) : dutchDescription);
  $$('[data-language]').forEach((button) => {
    const selected = button.dataset.language === activeLanguage;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  searchIndex.forEach((entry) => {
    entry.title = entry.element.dataset.searchTitle;
    entry.text = entry.element.textContent.replace(/\s+/g, " ").trim();
  });
  $("[data-crud-builder]")?.refreshLanguage?.();
  if (activeRoute && routeDefinitions[activeRoute]) updateRouteDownloads(routeDefinitions[activeRoute]);
  applyTheme(document.documentElement.dataset.theme || "light");
  localStorage.setItem("cfd-language", activeLanguage);
  if (updateUrl) {
    const url = new URL(window.location.href);
    if (activeLanguage === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }
  if (!languageMutationObserver) {
    languageMutationObserver = new MutationObserver((records) => {
      if (activeLanguage !== "en") return;
      records.forEach((record) => record.addedNodes.forEach((addedNode) => translateSubtree(addedNode)));
    });
    languageMutationObserver.observe(document.body, { childList: true, subtree: true });
  }
}

$$('[data-language]').forEach((button) => {
  button.addEventListener("click", () => applyLanguage(button.dataset.language));
});

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

const frontendTabs = $$('[data-frontend-tab]');
const frontendPanels = $$('[data-frontend-panel]');

function showFrontendPanel(name) {
  const panelName = name === "js" || name === "js-sqlite" ? "js" : "php";
  frontendTabs.forEach((button) => {
    const active = button.dataset.frontendTab === panelName;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  frontendPanels.forEach((panel) => {
    panel.hidden = panel.dataset.frontendPanel !== panelName;
  });
}

frontendTabs.forEach((button) => {
  button.addEventListener("click", () => showFrontendPanel(button.dataset.frontendTab));
});

const fieldConnectionExamples = {
  php: {
    voornaam: { html: 'name="voornaam"', logic: "required_text('voornaam')", database: ":voornaam → voornaam", output: "$student['voornaam']" },
    email: { html: 'name="email"', logic: "required_text('email')", database: ":email → email", output: "$student['email']" },
    opleiding: { html: 'name="opleiding"', logic: "required_text('opleiding')", database: ":opleiding → opleiding", output: "$student['opleiding']" }
  },
  js: {
    firstName: { html: 'id="first-name"', logic: "elements.firstName", api: "firstName", database: "first_name", output: "student.firstName" },
    email: { html: 'id="email"', logic: "elements.email", api: "email", database: "email", output: "student.email" },
    education: { html: 'id="education"', logic: "elements.education", api: "education", database: "education", output: "student.education" }
  }
};

$$('[data-field-connection]').forEach((connection) => {
  const type = connection.dataset.fieldConnection;
  const examples = fieldConnectionExamples[type];
  const buttons = $$('[data-field-example]', connection);

  function showFieldExample(key) {
    const example = examples[key];
    if (!example) return;
    buttons.forEach((button) => button.classList.toggle("is-active", button.dataset.fieldExample === key));
    $$('[data-chain-value]', connection).forEach((value) => {
      value.textContent = example[value.dataset.chainValue] || "—";
    });
  }

  buttons.forEach((button) => button.addEventListener("click", () => showFieldExample(button.dataset.fieldExample)));
});

const themeData = {
  students: { singular: "student", plural: "studenten", fields: "studentnummer, naam, e-mail", create: "create_student", update: "update_student", table: "studenten" },
  products: { singular: "product", plural: "producten", fields: "sku, naam, prijs, voorraad", create: "create_product", update: "update_product", table: "producten" },
  books: { singular: "boek", plural: "boeken", fields: "isbn, titel, auteur, categorie", create: "create_book", update: "update_book", table: "boeken" },
  countries: { singular: "land", plural: "landen", fields: "naam, landcode, regio", create: "create_country", update: "update_country", table: "landen" }
};

$$('.theme-buttons [data-theme]').forEach((button) => {
  button.addEventListener("click", () => {
    $$('.theme-buttons [data-theme]').forEach((item) => item.classList.toggle("is-active", item === button));
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
  const builderTestTitle = $("[data-builder-test-title]", builder);
  const builderTestIntro = $("[data-builder-test-intro]", builder);
  const builderTestSteps = $("[data-builder-test-steps]", builder);
  const operationInputs = $$('[data-builder-operation]', builder);
  const operationSummary = $("[data-builder-operation-summary]", builder);
  const operationPresetButtons = $$('[data-crud-preset]', builder);
  const builderValidation = $("[data-builder-validation]", builder);
  const resetBuilderButton = $("[data-reset-builder]", builder);
  const csrfInput = $("[data-builder-csrf]", builder);
  const csrfOption = $("[data-builder-csrf-option]", builder);
  let currentBuilderTab = "complete";
  let builderFields = [];
  let builderInitialized = false;
  const builderStorageKey = "cfd-builder-configuration";

  const reservedWords = new Set(["select", "insert", "update", "delete", "from", "where", "order", "group", "table", "index", "user"]);
  const protectedFieldNames = new Set(["id", "created_at", "updated_at"]);
  const fieldTypeMeta = {
    text: { label: "Korte tekst", php: "string", js: "string", html: "text" },
    textarea: { label: "Lange tekst", php: "string", js: "string", html: "textarea" },
    email: { label: "E-mailadres", php: "string", js: "string", html: "email" },
    url: { label: "Webadres / URL", php: "string", js: "string", html: "url" },
    telephone: { label: "Telefoonnummer", php: "string", js: "string", html: "tel" },
    integer: { label: "Heel getal", php: "int", js: "number", html: "number" },
    decimal: { label: "Prijs / decimaal", php: "float", js: "number", html: "number" },
    date: { label: "Datum", php: "string (datum)", js: "string", html: "date" },
    datetime: { label: "Datum + tijd", php: "string (datum/tijd)", js: "string", html: "datetime-local" },
    boolean: { label: "Ja / nee", php: "bool → 0/1", js: "boolean → 0/1", html: "checkbox" }
  };

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

  function sanitizeFieldIdentifier(value, fallback) {
    const identifier = sanitizeIdentifier(value, fallback);
    return protectedFieldNames.has(identifier) ? `eigen_${identifier}` : identifier;
  }

  function escapeBuilderAttribute(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function typeOptions(selected) {
    return Object.entries(fieldTypeMeta).map(([value, meta]) =>
      `<option value="${value}" ${value === selected ? "selected" : ""}>${meta.label}</option>`
    ).join("");
  }

  function renderBuilderFields() {
    fieldsContainer.innerHTML = builderFields.map((field, index) => {
      const meta = fieldTypeMeta[field.type] || fieldTypeMeta.text;
      return `
      <div class="builder-field-row" data-builder-field-row="${index}">
        <label><span>Tekst op formulier</span><input data-field-key="label" value="${escapeBuilderAttribute(field.label)}" aria-label="Tekst op formulier voor gegeven ${index + 1}"></label>
        <label><span>Naam in database</span><input data-field-key="name" value="${escapeBuilderAttribute(field.name)}" aria-label="Databasenaam van gegeven ${index + 1}"></label>
        <label><span>Soort invoer</span><select data-field-key="type" aria-label="Soort invoer van gegeven ${index + 1}">${typeOptions(field.type)}</select></label>
        <div class="builder-data-type" aria-label="Automatisch datatype"><span>PHP / JavaScript</span><b>${meta.php}</b><small>JS: ${meta.js}</small></div>
        <label class="builder-check"><input type="checkbox" data-field-key="required" ${field.required ? "checked" : ""}><span>Moet ingevuld</span></label>
        <label class="builder-check"><input type="checkbox" data-field-key="unique" ${field.unique ? "checked" : ""}><span>Geen dubbele</span></label>
        <button class="builder-remove" type="button" data-remove-field="${index}" aria-label="Verwijder veld ${index + 1}">Verwijder</button>
      </div>
    `;
    }).join("");

    $$('[data-field-key]', fieldsContainer).forEach((control) => {
      const eventName = control.type === "checkbox" || control.tagName === "SELECT" ? "change" : "input";
      control.addEventListener(eventName, () => {
        const row = control.closest('[data-builder-field-row]');
        const field = builderFields[Number(row.dataset.builderFieldRow)];
        const key = control.dataset.fieldKey;
        if (key === "label") {
          field.label = control.value;
          if (!field.nameTouched) {
            field.name = sanitizeFieldIdentifier(control.value, `veld_${Number(row.dataset.builderFieldRow) + 1}`);
            $("[data-field-key='name']", row).value = field.name;
          }
        } else if (key === "name") {
          field.name = control.value;
          field.nameTouched = true;
        } else {
          field[key] = control.type === "checkbox" ? control.checked : control.value;
        }
        if (key === "type") renderBuilderFields();
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

  function selectedOperations() {
    return Object.fromEntries(operationInputs.map((input) => [input.dataset.builderOperation, input.checked]));
  }

  function updateOperationSummary() {
    const labels = { create: "Create", read: "Read", update: "Update", delete: "Delete" };
    const selected = operationInputs.filter((input) => input.checked).map((input) => labels[input.dataset.builderOperation]);
    const readable = selected.join(", ").replace(/, ([^,]*)$/, activeLanguage === "en" ? " and $1" : " en $1");
    operationSummary.textContent = activeLanguage === "en"
      ? `Selected: ${readable}. The generator removes all unselected forms, buttons and backend actions.`
      : `Gekozen: ${readable}. De generator verwijdert alle niet-gekozen formulieren, knoppen en backendacties.`;

    const signature = operationInputs.filter((input) => input.checked).map((input) => input.dataset.builderOperation).join(",");
    operationPresetButtons.forEach((button) => {
      const presetSignature = {
        all: "create,read,update,delete",
        read: "read",
        "create-read": "create,read"
      }[button.dataset.crudPreset];
      const selectedPreset = signature === presetSignature;
      button.classList.toggle("is-active", selectedPreset);
      button.setAttribute("aria-pressed", String(selectedPreset));
    });
  }

  function normalizedBuilderState() {
    const operations = selectedOperations();
    const usedNames = new Set();
    const fields = builderFields.map((field, index) => {
      const baseName = sanitizeFieldIdentifier(field.name, `veld_${index + 1}`);
      let uniqueName = baseName;
      let suffix = 2;
      while (usedNames.has(uniqueName)) uniqueName = `${baseName}_${suffix++}`;
      usedNames.add(uniqueName);
      return {
        label: String(field.label || `Veld ${index + 1}`).trim(),
        name: uniqueName,
        type: fieldTypeMeta[field.type] ? field.type : "text",
        required: Boolean(field.required),
        unique: Boolean(field.unique)
      };
    });

    return {
      stack: stackSelect.value,
      singular: sanitizeIdentifier(singularInput.value, "onderdeel"),
      table: sanitizeIdentifier(tableInput.value, "onderdelen"),
      operations,
      csrf: stackSelect.value !== "js-sqlite"
        && Boolean(csrfInput?.checked)
        && (operations.create || operations.update || operations.delete),
      fields
    };
  }

  function builderNormalizationNotes(state) {
    const notes = [];
    builderFields.forEach((field, index) => {
      const enteredName = String(field.name || "").trim();
      const basicName = sanitizeIdentifier(enteredName, `veld_${index + 1}`);
      const safeName = sanitizeFieldIdentifier(enteredName, `veld_${index + 1}`);
      const finalName = state.fields[index].name;
      if (protectedFieldNames.has(basicName)) {
        notes.push(activeLanguage === "en"
          ? `${enteredName || basicName} is reserved and becomes ${safeName}`
          : `${enteredName || basicName} is gereserveerd en wordt ${safeName}`);
      } else if (finalName !== safeName) {
        notes.push(activeLanguage === "en"
          ? `duplicate ${safeName} becomes ${finalName}`
          : `dubbele naam ${safeName} wordt ${finalName}`);
      } else if (enteredName && enteredName !== safeName) {
        notes.push(activeLanguage === "en"
          ? `${enteredName} becomes the safe name ${safeName}`
          : `${enteredName} wordt de veilige naam ${safeName}`);
      }
    });
    return [...new Set(notes)];
  }

  function updateBuilderValidation(state) {
    if (!builderValidation) return;
    const actionCount = Object.values(state.operations).filter(Boolean).length;
    const notes = builderNormalizationNotes(state);
    builderValidation.classList.toggle("has-note", notes.length > 0);
    builderValidation.textContent = notes.length
      ? (activeLanguage === "en" ? `Safe correction: ${notes.join("; ")}.` : `Veilige correctie: ${notes.join("; ")}.`)
      : (activeLanguage === "en"
        ? `Configuration is valid: ${state.fields.length} field(s) and ${actionCount} CRUD action(s).`
        : `Configuratie is geldig: ${state.fields.length} veld(en) en ${actionCount} CRUD-actie(s).`);
  }

  function saveBuilderConfiguration() {
    if (!builderInitialized) return;
    const configuration = {
      preset: presetSelect.value,
      stack: stackSelect.value,
      singular: singularInput.value,
      table: tableInput.value,
      operations: selectedOperations(),
      csrf: Boolean(csrfInput?.checked),
      fields: builderFields,
      tab: currentBuilderTab
    };
    try {
      localStorage.setItem(builderStorageKey, JSON.stringify(configuration));
    } catch {
      // De generator blijft werken wanneer een browser lokale opslag blokkeert.
    }
  }

  function restoreBuilderConfiguration() {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(builderStorageKey) || "null");
    } catch {
      return false;
    }
    if (!saved || !Array.isArray(saved.fields) || saved.fields.length < 1 || saved.fields.length > 12) return false;

    if ([...presetSelect.options].some((option) => option.value === saved.preset)) presetSelect.value = saved.preset;
    if ([...stackSelect.options].some((option) => option.value === saved.stack)) stackSelect.value = saved.stack;
    singularInput.value = String(saved.singular || "onderdeel");
    tableInput.value = String(saved.table || "onderdelen");
    builderFields = saved.fields.map((field, index) => ({
      label: String(field.label || `Veld ${index + 1}`),
      name: String(field.name || `veld_${index + 1}`),
      type: fieldTypeMeta[field.type] ? field.type : "text",
      required: Boolean(field.required),
      unique: Boolean(field.unique),
      nameTouched: Boolean(field.nameTouched)
    }));
    const savedOperations = saved.operations || {};
    operationInputs.forEach((input) => { input.checked = Boolean(savedOperations[input.dataset.builderOperation]); });
    if (csrfInput) csrfInput.checked = Boolean(saved.csrf);
    if (!operationInputs.some((input) => input.checked)) operationInputs[0].checked = true;
    if (builderTabs.some((tab) => tab.dataset.builderTab === saved.tab)) currentBuilderTab = saved.tab;
    builderTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.builderTab === currentBuilderTab));
    renderBuilderFields();
    return true;
  }

  function sqlType(field, stack) {
    if (stack === "php-mysql") {
      return {
        text: "VARCHAR(160)", textarea: "TEXT", email: "VARCHAR(160)", url: field.unique ? "VARCHAR(512)" : "VARCHAR(2048)",
        telephone: "VARCHAR(40)", integer: "INT", decimal: "DECIMAL(10,2)", date: "DATE",
        datetime: "DATETIME", boolean: "TINYINT(1)"
      }[field.type];
    }

    return {
      text: "TEXT", textarea: "TEXT", email: "TEXT", url: "TEXT", telephone: "TEXT",
      integer: "INTEGER", decimal: "REAL", date: "TEXT", datetime: "TEXT", boolean: "INTEGER"
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
      return `-- Dit bestand maakt de tabel voor ${state.table}.\n-- IF NOT EXISTS voorkomt een fout wanneer je de app opnieuw opent.\nCREATE TABLE IF NOT EXISTS ${state.table} (\n${definitions.join(",\n")}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
    }

    definitions.push("  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP");
    definitions.push("  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP");
    return `-- Dit bestand maakt de tabel voor ${state.table}.\n-- SQLite bewaart deze tabel in één lokaal databasebestand.\nCREATE TABLE IF NOT EXISTS ${state.table} (\n${definitions.join(",\n")}\n);`;
  }

  function htmlControl(field, state, scope = "") {
    const id = `${state.singular}-${scope ? `${scope}-` : ""}${field.name}`;
    const required = field.required ? " required" : "";
    const label = escapeHtmlCode(field.label);

    if (field.type === "textarea") {
      return `    <label class="generated-field" for="${id}"><span>${label}</span>\n      <textarea id="${id}" name="${field.name}"${required}></textarea>\n    </label>`;
    }

    if (field.type === "boolean") {
      if (state.stack.startsWith("php")) {
        return `    <input type="hidden" name="${field.name}" value="0">\n    <label class="generated-check"><input id="${id}" name="${field.name}" type="checkbox" value="1"> <span>${label}</span></label>`;
      }
      return `    <label class="generated-check"><input id="${id}" name="${field.name}" type="checkbox"> <span>${label}</span></label>`;
    }

    const type = fieldTypeMeta[field.type]?.html || "text";
    const extras = [];
    if (field.type === "decimal") extras.push('step="0.01"');
    if (field.type === "integer") extras.push('step="1"');
    if (["text", "email"].includes(field.type)) extras.push('maxlength="160"');
    if (field.type === "telephone") extras.push('maxlength="40"');
    if (field.type === "url") extras.push('maxlength="2048"');
    const extra = extras.length ? ` ${extras.join(" ")}` : "";
    return `    <label class="generated-field" for="${id}"><span>${label}</span>\n      <input id="${id}" name="${field.name}" type="${type}"${extra}${required}>\n    </label>`;
  }

  function generateForm(state) {
    const ops = state.operations;
    const selectedNames = [ops.create && "Create", ops.read && "Read", ops.update && "Update", ops.delete && "Delete"].filter(Boolean).join(" + ");
    const headers = state.fields.map((field) => `        <th>${escapeHtmlCode(field.label)}</th>`).join("\n");

    if (state.stack === "js-sqlite") {
      const cards = [];
      if (ops.create) {
        const createControls = state.fields.map((field) => htmlControl(field, state, "create")).join("\n\n");
        cards.push([
          `  <!-- CREATE: dit formulier verstuurt een POST-request naar de API. -->`,
          `  <form class="generated-card generated-form" id="${state.singular}-create-form">`,
          `    <h3>Nieuwe ${state.singular}</h3>`,
          createControls,
          `    <button class="generated-primary" type="submit">${state.singular} toevoegen</button>`,
          `  </form>`
        ].join("\n"));
      }
      if (ops.update) {
        const updateControls = state.fields.map((field) => htmlControl(field, state, "update")).join("\n\n");
        cards.push([
          `  <!-- UPDATE: met Read vult de knop Bewerk dit formulier; zonder Read vul je zelf een ID in. -->`,
          `  <form class="generated-card generated-form" id="${state.singular}-update-form">`,
          `    <h3>${state.singular} wijzigen</h3>`,
          `    <label class="generated-field"><span>ID van de ${state.singular}</span><input name="id" type="number" min="1" step="1" ${ops.read ? "readonly" : "required"}></label>`,
          updateControls,
          `    <button class="generated-primary" type="submit">Wijzigingen opslaan</button>`,
          `  </form>`
        ].join("\n"));
      }
      if (ops.delete && !ops.read) {
        cards.push([
          `  <!-- DELETE ZONDER READ: vul het ID in van de rij die weg mag. -->`,
          `  <form class="generated-card generated-form" id="${state.singular}-delete-form">`,
          `    <h3>${state.singular} verwijderen</h3>`,
          `    <label class="generated-field"><span>ID van de ${state.singular}</span><input name="id" type="number" min="1" step="1" required></label>`,
          `    <button class="generated-danger" type="submit">Definitief verwijderen</button>`,
          `  </form>`
        ].join("\n"));
      }
      if (ops.read) {
        const actionHeader = ops.update || ops.delete ? `\n        <th>Acties</th>` : "";
        cards.push([
          `  <!-- READ: deze tbody wordt door browser-JavaScript gevuld. -->`,
          `  <div class="generated-card generated-list">`,
          `    <h3>Overzicht ${state.table}</h3>`,
          `    <div class="generated-table-scroll"><table>`,
          `      <thead><tr>`,
          headers,
          actionHeader,
          `      </tr></thead>`,
          `      <tbody id="${state.table}-rows"></tbody>`,
          `    </table></div>`,
          `  </div>`
        ].filter(Boolean).join("\n"));
      }

      return [
        `<!-- GEKOZEN FUNCTIES: ${selectedNames}. Niet-gekozen acties staan niet in deze HTML. -->`,
        `<section class="generated-crud ${state.table}-beheer">`,
        `  <header class="generated-crud-heading"><p>Eigen administratie</p><h2>${state.table} beheren</h2></header>`,
        `  <div class="generated-crud-layout">`,
        cards.join("\n\n"),
        `  </div>`,
        `</section>`
      ].join("\n");
    }

    const csrfField = state.csrf ? `    <input type="hidden" name="_token" value="<?= e(csrf_token()) ?>">` : "";
    const csrfEditField = state.csrf ? `                <input type="hidden" name="_token" value="<?= e(csrf_token()) ?>">` : "";
    const csrfRowField = state.csrf ? `              <input type="hidden" name="_token" value="<?= e(csrf_token()) ?>">` : "";
    const phpEditControls = (rowExpression = null) => state.fields.map((field) => {
      const label = escapeHtmlCode(field.label);
      const required = field.required ? " required" : "";
      const value = rowExpression
        ? (field.type === "datetime"
          ? ` value="<?= e(str_replace(' ', 'T', substr((string) ${rowExpression}['${field.name}'], 0, 16))) ?>"`
          : ` value="<?= e(${rowExpression}['${field.name}']) ?>"`)
        : "";
      if (field.type === "textarea") {
        const content = rowExpression ? `<?= e(${rowExpression}['${field.name}']) ?>` : "";
        return `      <label class="generated-field"><span>${label}</span><textarea name="${field.name}"${required}>${content}</textarea></label>`;
      }
      if (field.type === "boolean") {
        const checked = rowExpression ? ` <?= (int) ${rowExpression}['${field.name}'] === 1 ? 'checked' : '' ?>` : "";
        return `      <input type="hidden" name="${field.name}" value="0">\n      <label class="generated-check"><input name="${field.name}" type="checkbox" value="1"${checked}> <span>${label}</span></label>`;
      }
      const type = fieldTypeMeta[field.type]?.html || "text";
      const extra = field.type === "decimal" ? ' step="0.01"' : field.type === "integer" ? ' step="1"' : "";
      return `      <label class="generated-field"><span>${label}</span><input name="${field.name}" type="${type}"${value}${extra}${required}></label>`;
    }).join("\n");

    const cards = [];
    if (ops.create) {
      cards.push([
        `  <!-- CREATE: dit formulier stuurt intent create_${state.singular}. -->`,
        `  <div class="generated-card"><h3>Nieuwe ${state.singular}</h3>`,
        `  <form class="generated-form" method="post">`,
        csrfField,
        `    <input type="hidden" name="intent" value="create_${state.singular}">`,
        state.fields.map((field) => htmlControl(field, state, "create")).join("\n\n"),
        `    <button class="generated-primary" type="submit">${state.singular} toevoegen</button>`,
        `  </form></div>`
      ].join("\n"));
    }

    if (ops.read) {
      const cells = state.fields.map((field) => `          <td><?= e($row['${field.name}']) ?></td>`).join("\n");
      const actionHeader = ops.update || ops.delete ? `\n        <th>Acties</th>` : "";
      const actionCell = ops.update || ops.delete ? [
        `          <td class="row-actions">`,
        ops.update ? [
          `            <details><summary>Bewerk</summary>`,
          `              <form class="generated-form generated-edit-form" method="post">`,
          csrfEditField,
          `                <input type="hidden" name="intent" value="update_${state.singular}">`,
          `                <input type="hidden" name="id" value="<?= (int) $row['id'] ?>">`,
          phpEditControls("$row"),
          `                <button class="generated-primary" type="submit">Wijzigingen opslaan</button>`,
          `              </form>`,
          `            </details>`
        ].join("\n") : "",
        ops.delete ? [
          `            <form method="post" onsubmit="return confirm('Weet je zeker dat je dit wilt verwijderen?')">`,
          csrfRowField,
          `              <input type="hidden" name="intent" value="delete_${state.singular}">`,
          `              <input type="hidden" name="id" value="<?= (int) $row['id'] ?>">`,
          `              <button class="generated-danger" type="submit">Verwijder</button>`,
          `            </form>`
        ].join("\n") : "",
        `          </td>`
      ].filter(Boolean).join("\n") : "";
      cards.push([
        `  <!-- READ${ops.update || ops.delete ? " + RIJACTIES" : ""}: PHP loopt door $rows. -->`,
        `  <div class="generated-card generated-list"><h3>Overzicht</h3><div class="generated-table-scroll">`,
        `  <table><thead><tr>`,
        headers,
        actionHeader,
        `  </tr></thead><tbody>`,
        `      <?php foreach ($rows as $row): ?>`,
        `        <tr>`,
        cells,
        actionCell,
        `        </tr>`,
        `      <?php endforeach; ?>`,
        `  </tbody></table>`,
        `  </div></div>`
      ].filter(Boolean).join("\n"));
    }

    if (ops.update && !ops.read) {
      cards.push([
        `  <!-- UPDATE ZONDER READ: vul het doel-ID en de nieuwe waarden in. -->`,
        `  <div class="generated-card"><h3>${state.singular} wijzigen</h3>`,
        `  <form class="generated-form" method="post">`,
        csrfField,
        `    <input type="hidden" name="intent" value="update_${state.singular}">`,
        `    <label class="generated-field"><span>ID van de ${state.singular}</span><input name="id" type="number" min="1" step="1" required></label>`,
        phpEditControls(),
        `    <button class="generated-primary" type="submit">Wijzigingen opslaan</button>`,
        `  </form></div>`
      ].join("\n"));
    }

    if (ops.delete && !ops.read) {
      cards.push([
        `  <!-- DELETE ZONDER READ: verwijder één bestaande rij met het ID. -->`,
        `  <div class="generated-card"><h3>${state.singular} verwijderen</h3>`,
        `  <form class="generated-form" method="post" onsubmit="return confirm('Weet je zeker dat je dit wilt verwijderen?')">`,
        csrfField,
        `    <input type="hidden" name="intent" value="delete_${state.singular}">`,
        `    <label class="generated-field"><span>ID van de ${state.singular}</span><input name="id" type="number" min="1" step="1" required></label>`,
        `    <button class="generated-danger" type="submit">Definitief verwijderen</button>`,
        `  </form></div>`
      ].join("\n"));
    }

    return [
      `<!-- GEKOZEN FUNCTIES: ${selectedNames}. Niet-gekozen acties staan niet in deze HTML. -->`,
      `<section class="generated-crud ${state.table}-beheer">`,
      `  <header class="generated-crud-heading"><p>Eigen CRUD</p><h2>${state.table} beheren</h2></header>`,
      `  <div class="generated-crud-layout">`,
      cards.join("\n\n"),
      `  </div>`,
      `</section>`
    ].join("\n");
  }

  function generateCss(state) {
    return [
      `/* Vormgeving voor ${state.table}. Plak dit hele blok onderaan je CSS-bestand. */`,
      `.generated-crud {`,
      `  --generated-blue: #1e56dc;`,
      `  --generated-ink: #10233f;`,
      `  --generated-muted: #5f6c7e;`,
      `  --generated-line: #d9dee8;`,
      `  margin: 48px 0;`,
      `  color: var(--generated-ink);`,
      `  font-family: "DM Sans", Arial, sans-serif;`,
      `}`,
      ``,
      `.generated-crud * { box-sizing: border-box; }`,
      `.generated-crud-heading { margin-bottom: 22px; }`,
      `.generated-crud-heading p { margin: 0 0 6px; color: var(--generated-blue); font-size: 12px; font-weight: 700; text-transform: uppercase; }`,
      `.generated-crud-heading h2 { margin: 0; font-size: clamp(30px, 5vw, 48px); line-height: 1; }`,
      `.generated-crud-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 310px), 1fr)); gap: 22px; align-items: start; }`,
      `.generated-card { padding: 22px; border: 1px solid var(--generated-line); background: #fff; box-shadow: 0 16px 40px rgba(16, 35, 63, .08); }`,
      `.generated-card h3 { margin: 0 0 18px; font-size: 20px; }`,
      `.generated-form { display: grid; gap: 14px; }`,
      `.generated-field { display: grid; gap: 6px; color: var(--generated-muted); font-size: 12px; font-weight: 700; }`,
      `.generated-field input, .generated-field textarea, .generated-field select { width: 100%; min-height: 44px; padding: 10px 12px; border: 1px solid #c7cfda; border-radius: 3px; background: #fff; color: var(--generated-ink); font: inherit; font-weight: 400; }`,
      `.generated-field textarea { min-height: 110px; resize: vertical; }`,
      `.generated-field input:focus, .generated-field textarea:focus, .generated-field select:focus { border-color: var(--generated-blue); outline: 3px solid rgba(30, 86, 220, .12); }`,
      `.generated-check { display: flex; gap: 9px; align-items: center; color: var(--generated-muted); font-size: 13px; font-weight: 700; }`,
      `.generated-check input { width: 18px; height: 18px; }`,
      `.generated-primary, .generated-secondary, .generated-danger { min-height: 42px; padding: 0 14px; border: 1px solid transparent; border-radius: 3px; font: inherit; font-weight: 700; cursor: pointer; }`,
      `.generated-primary { background: var(--generated-blue); color: #fff; }`,
      `.generated-primary:hover { background: #153fa7; }`,
      `.generated-secondary { border-color: var(--generated-line); background: #fff; color: var(--generated-ink); }`,
      `.generated-danger { background: #fff0f1; color: #b62935; }`,
      `.generated-list { grid-column: 1 / -1; }`,
      `.generated-table-scroll { width: 100%; overflow-x: auto; }`,
      `.generated-list table { width: 100%; border-collapse: collapse; text-align: left; }`,
      `.generated-list th { padding: 11px 13px; border-bottom: 1px solid var(--generated-line); background: #f5f7fa; color: var(--generated-muted); font-size: 10px; text-transform: uppercase; }`,
      `.generated-list td { padding: 13px; border-bottom: 1px solid #e8ebf0; font-size: 13px; vertical-align: top; }`,
      `.generated-list td button, .generated-list summary { margin: 2px; border: 0; background: transparent; color: var(--generated-blue); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }`,
      `.generated-edit-form { min-width: 240px; margin-top: 12px; padding: 14px; background: #f5f7fa; }`,
      ``,
      `@media (max-width: 850px) {`,
      `  .generated-crud-layout { grid-template-columns: 1fr; }`,
      `  .generated-card { padding: 17px; }`,
      `}`
    ].join("\n");
  }

  function phpInputExpression(field, state) {
    const label = escapeSingleQuoted(field.label);
    const prefix = `read_${state.singular}`;
    if (field.type === "boolean") return `${prefix}_bool('${field.name}') ? 1 : 0`;
    if (field.type === "integer") return `${prefix}_int('${field.name}', '${label}', ${field.required ? "true" : "false"})`;
    if (field.type === "decimal") return `${prefix}_float('${field.name}', '${label}', ${field.required ? "true" : "false"})`;
    if (field.type === "date" || field.type === "datetime") return `${prefix}_date('${field.name}', '${label}', ${field.required ? "true" : "false"}, ${field.type === "datetime" ? "true" : "false"})`;
    const maxLength = field.type === "textarea" ? 5000 : field.type === "url" ? 2048 : field.type === "telephone" ? 40 : 160;
    return field.required ? `required_text('${field.name}', '${label}', ${maxLength})` : `post_text('${field.name}')`;
  }

  function generatePhpBackend(state) {
    const ops = state.operations;
    const needsInput = ops.create || ops.update;
    const columns = state.fields.map((field) => field.name);
    const placeholders = columns.map((column) => `:${column}`);
    const updateFields = columns.map((column) => `        ${column} = :${column}`).join(",\n");
    const inputLines = state.fields.map((field) => `        '${field.name}' => ${phpInputExpression(field, state)},`);
    const validationLines = [];
    state.fields.filter((field) => field.type === "email").forEach((field) => {
      validationLines.push(`    if ($input['${field.name}'] !== '' && !filter_var($input['${field.name}'], FILTER_VALIDATE_EMAIL)) throw new RuntimeException('${escapeSingleQuoted(field.label)} is ongeldig.');`);
    });
    state.fields.filter((field) => field.type === "url").forEach((field) => {
      validationLines.push(`    if ($input['${field.name}'] !== '' && !filter_var($input['${field.name}'], FILTER_VALIDATE_URL)) throw new RuntimeException('${escapeSingleQuoted(field.label)} is geen geldige URL.');`);
    });

    const parts = [`// GEKOZEN PHP-ACTIES: ${[ops.create && "Create", ops.read && "Read", ops.update && "Update", ops.delete && "Delete"].filter(Boolean).join(", ")}.`];
    if (needsInput) {
      if (state.fields.some((field) => field.type === "integer")) {
        parts.push(
          `function read_${state.singular}_int(string $name, string $label, bool $required): ?int`,
          `{`,
          `    $raw = post_text($name);`,
          `    if ($raw === '' && !$required) return null;`,
          `    $value = filter_var($raw, FILTER_VALIDATE_INT);`,
          `    if ($value === false) throw new RuntimeException($label . ' moet een heel getal zijn.');`,
          `    return (int) $value;`,
          `}`,
          ``
        );
      }
      if (state.fields.some((field) => field.type === "decimal")) {
        parts.push(
          `function read_${state.singular}_float(string $name, string $label, bool $required): ?float`,
          `{`,
          `    $raw = str_replace(',', '.', post_text($name));`,
          `    if ($raw === '' && !$required) return null;`,
          `    $value = filter_var($raw, FILTER_VALIDATE_FLOAT);`,
          `    if ($value === false) throw new RuntimeException($label . ' moet een getal zijn.');`,
          `    return (float) $value;`,
          `}`,
          ``
        );
      }
      if (state.fields.some((field) => field.type === "boolean")) {
        parts.push(
          `function read_${state.singular}_bool(string $name): bool`,
          `{`,
          `    return filter_var($_POST[$name] ?? false, FILTER_VALIDATE_BOOLEAN);`,
          `}`,
          ``
        );
      }
      if (state.fields.some((field) => field.type === "date" || field.type === "datetime")) {
        parts.push(
          `function read_${state.singular}_date(string $name, string $label, bool $required, bool $withTime): ?string`,
          `{`,
          `    $raw = post_text($name);`,
          `    if ($raw === '' && !$required) return null;`,
          `    $format = $withTime ? 'Y-m-d\\TH:i' : 'Y-m-d';`,
          `    $date = DateTimeImmutable::createFromFormat($format, $raw);`,
          `    if (!$date || $date->format($format) !== $raw) throw new RuntimeException($label . ' heeft geen geldige datum.');`,
          `    return $withTime ? $date->format('Y-m-d H:i:s') : $date->format('Y-m-d');`,
          `}`,
          ``
        );
      }
      parts.push(
        `function read_${state.singular}_input(): array`,
        `{`,
        `    $input = [`,
        ...inputLines,
        `    ];`,
        ...validationLines,
        `    return $input;`,
        `}`,
        ``
      );
    }

    if (ops.create || ops.update || ops.delete) {
      parts.push(
        `$pageError = '';`,
        `if ($_SERVER['REQUEST_METHOD'] === 'POST') {`,
        `    try {`,
        ...(state.csrf ? [`        verify_csrf($_POST['_token'] ?? null);`] : []),
        `        $intent = post_text('intent');`
      );
      if (ops.create) {
        parts.push(
          ``,
          `        if ($intent === 'create_${state.singular}') {`,
          `            $input = read_${state.singular}_input();`,
          `            $statement = $db->prepare('INSERT INTO ${state.table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})');`,
          `            $statement->execute($input);`,
          `            flash('success', '${state.singular} is toegevoegd.');`,
          `            redirect('index.php');`,
          `        }`
        );
      }
      if (ops.update) {
        parts.push(
          ``,
          `        if ($intent === 'update_${state.singular}') {`,
          `            $input = read_${state.singular}_input();`,
          `            $input['id'] = positive_id($_POST['id'] ?? null, 'ID');`,
          `            $statement = $db->prepare('UPDATE ${state.table} SET\n${updateFields},\n        updated_at = CURRENT_TIMESTAMP WHERE id = :id');`,
          `            $statement->execute($input);`,
          `            if ($statement->rowCount() === 0) throw new RuntimeException('${state.singular} niet gevonden of niets gewijzigd.');`,
          `            flash('success', '${state.singular} is bijgewerkt.');`,
          `            redirect('index.php');`,
          `        }`
        );
      }
      if (ops.delete) {
        parts.push(
          ``,
          `        if ($intent === 'delete_${state.singular}') {`,
          `            $id = positive_id($_POST['id'] ?? null, 'ID');`,
          `            $statement = $db->prepare('DELETE FROM ${state.table} WHERE id = ?');`,
          `            $statement->execute([$id]);`,
          `            if ($statement->rowCount() === 0) throw new RuntimeException('${state.singular} niet gevonden.');`,
          `            flash('success', '${state.singular} is verwijderd.');`,
          `            redirect('index.php');`,
          `        }`
        );
      }
      parts.push(
        `    } catch (Throwable $crudError) {`,
        `        $pageError = $crudError->getMessage();`,
        `    }`,
        `}`,
        ``
      );
    } else {
      parts.push(`$pageError = '';`, ``);
    }
    if (ops.read) parts.push(`$rows = $db->query('SELECT * FROM ${state.table} ORDER BY id DESC')->fetchAll();`);
    return parts.join("\n");
  }

  function jsInputExpression(field) {
    const label = escapeSingleQuoted(field.label);
    if (field.type === "boolean") return `body.${field.name} ? 1 : 0`;
    if (field.type === "integer" || field.type === "decimal") return field.required
      ? `Number(body.${field.name})`
      : `(body.${field.name} === '' || body.${field.name} == null ? null : Number(body.${field.name}))`;
    const maxLength = field.type === "textarea" ? 5000 : field.type === "url" ? 2048 : field.type === "telephone" ? 40 : 160;
    return field.required ? `requiredText(body.${field.name}, '${label}', ${maxLength})` : `String(body.${field.name} ?? '').trim()`;
  }

  function toPascalCase(value) {
    return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
  }

  function generateJsBackend(state) {
    const ops = state.operations;
    const needsInput = ops.create || ops.update;
    const columns = state.fields.map((field) => field.name);
    const placeholders = columns.map((column) => `@${column}`);
    const updateFields = columns.map((column) => `${column} = @${column}`).join(", ");
    const functionName = toPascalCase(state.singular);
    const inputLines = state.fields.map((field) => `    ${field.name}: ${jsInputExpression(field)},`);
    const numericChecks = state.fields
      .filter((field) => field.type === "integer" || field.type === "decimal")
      .map((field) => {
        const allowNull = field.required ? "" : `item.${field.name} !== null && `;
        const check = field.type === "integer" ? `!Number.isInteger(item.${field.name})` : `!Number.isFinite(item.${field.name})`;
        return `  if (${allowNull}${check}) throw httpError(400, '${escapeSingleQuoted(field.label)} moet ${field.type === "integer" ? "een heel getal" : "een getal"} zijn.');`;
      });
    const emailChecks = state.fields
      .filter((field) => field.type === "email")
      .map((field) => `  if (item.${field.name} && !item.${field.name}.includes('@')) throw httpError(400, '${escapeSingleQuoted(field.label)} is ongeldig.');`);
    const extraChecks = [];
    state.fields.filter((field) => field.type === "url").forEach((field) => {
      extraChecks.push(`  if (item.${field.name}) { try { new URL(item.${field.name}); } catch { throw httpError(400, '${escapeSingleQuoted(field.label)} is geen geldige URL.'); } }`);
    });
    state.fields.filter((field) => field.type === "date" || field.type === "datetime").forEach((field) => {
      extraChecks.push(`  if (item.${field.name} && Number.isNaN(Date.parse(item.${field.name}))) throw httpError(400, '${escapeSingleQuoted(field.label)} heeft geen geldige datum.');`);
    });

    const parts = [`// GEKOZEN API-ROUTES: ${[ops.create && "POST/Create", ops.read && "GET/Read", ops.update && "PUT/Update", ops.delete && "DELETE/Delete"].filter(Boolean).join(", ")}.`];
    if (needsInput) {
      parts.push(
        `function read${functionName}(body = {}) {`,
        `  const item = {`,
        ...inputLines,
        `  };`,
        ...numericChecks,
        ...emailChecks,
        ...extraChecks,
        `  return item;`,
        `}`,
        ``
      );
    }
    if (ops.read) {
      parts.push(
        `app.get('/api/${state.table}', (req, res) => {`,
        `  const rows = db.prepare('SELECT * FROM ${state.table} ORDER BY id DESC').all();`,
        `  res.json(rows);`,
        `});`,
        ``
      );
    }
    if (ops.create) {
      parts.push(
        `app.post('/api/${state.table}', (req, res) => {`,
        `  const item = read${functionName}(req.body);`,
        `  const result = db.prepare('INSERT INTO ${state.table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})').run(item);`,
        `  res.status(201).json(db.prepare('SELECT * FROM ${state.table} WHERE id = ?').get(result.lastInsertRowid));`,
        `});`,
        ``
      );
    }
    if (ops.update) {
      parts.push(
        `app.put('/api/${state.table}/:id', (req, res) => {`,
        `  const item = { ...read${functionName}(req.body), id: readId(req.params.id) };`,
        `  const result = db.prepare('UPDATE ${state.table} SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = @id').run(item);`,
        `  if (result.changes === 0) throw httpError(404, '${state.singular} niet gevonden.');`,
        `  res.json(db.prepare('SELECT * FROM ${state.table} WHERE id = ?').get(item.id));`,
        `});`,
        ``
      );
    }
    if (ops.delete) {
      parts.push(
        `app.delete('/api/${state.table}/:id', (req, res) => {`,
        `  const result = db.prepare('DELETE FROM ${state.table} WHERE id = ?').run(readId(req.params.id));`,
        `  if (result.changes === 0) throw httpError(404, '${state.singular} niet gevonden.');`,
        `  res.status(204).send();`,
        `});`
      );
    }
    return parts.join("\n");
  }

  function generateJsFrontend(state) {
    const ops = state.operations;
    const functionName = toPascalCase(state.singular);
    const needsInput = ops.create || ops.update;
    const inputLines = state.fields.map((field) => field.type === "boolean"
      ? `    ${field.name}: Boolean(form.elements.namedItem('${field.name}').checked),`
      : `    ${field.name}: form.elements.namedItem('${field.name}').value.trim(),`);
    const fillLines = state.fields.map((field) => {
      if (field.type === "boolean") return `  form.elements.namedItem('${field.name}').checked = Number(item.${field.name}) === 1;`;
      if (field.type === "datetime") return `  form.elements.namedItem('${field.name}').value = String(item.${field.name} ?? '').replace(' ', 'T').slice(0, 16);`;
      return `  form.elements.namedItem('${field.name}').value = item.${field.name} ?? '';`;
    });
    const cells = state.fields.map((field) => `      <td>\${escape${functionName}Html(item.${field.name})}</td>`).join("\n");
    const parts = [`// GEKOZEN BROWSERACTIES: ${[ops.create && "Create", ops.read && "Read", ops.update && "Update", ops.delete && "Delete"].filter(Boolean).join(", ")}.`];
    parts.push(
      `async function request${functionName}(url, options = {}) {`,
      `  const response = await fetch(url, options);`,
      `  if (response.status === 204) return null;`,
      `  const data = await response.json();`,
      `  if (!response.ok) throw new Error(data.error || 'Er ging iets mis.');`,
      `  return data;`,
      `}`,
      ``
    );
    if (needsInput) {
      parts.push(
      `function read${functionName}Form(form) {`,
      `  return {`,
      ...inputLines,
      `  };`,
      `}`,
      ``
      );
    }
    if (ops.read) {
      const actionButtons = [
        ops.update ? `        <button type="button" data-edit-${state.singular}="\${item.id}">Bewerk</button>` : "",
        ops.delete ? `        <button type="button" data-delete-${state.singular}="\${item.id}">Verwijder</button>` : ""
      ].filter(Boolean);
      const actionCell = actionButtons.length ? [`      <td>`, ...actionButtons, `      </td>`] : [];
      parts.push(
      `function escape${functionName}Html(value) {`,
      `  const element = document.createElement('div');`,
      `  element.textContent = String(value ?? '');`,
      `  return element.innerHTML;`,
      `}`,
      ``,
      `async function load${functionName}Rows() {`,
      `  const items = await request${functionName}('/api/${state.table}');`,
      `  const rows = document.querySelector('#${state.table}-rows');`,
      `  rows.innerHTML = items.map((item) => \``,
      `    <tr>`,
      cells,
      ...actionCell,
      `    </tr>`,
      `  \`).join('');`,
      `  rows.currentItems = items;`,
      `}`,
      ``
      );
    }
    if (ops.create) {
      parts.push(
      `document.querySelector('#${state.singular}-create-form').addEventListener('submit', async (event) => {`,
      `  event.preventDefault();`,
      `  try {`,
      `    await request${functionName}('/api/${state.table}', {`,
      `      method: 'POST',`,
      `      headers: { 'Content-Type': 'application/json' },`,
      `      body: JSON.stringify(read${functionName}Form(event.currentTarget))`,
      `    });`,
      `    event.currentTarget.reset();`,
      ops.read ? `    await load${functionName}Rows();` : `    window.alert('${state.singular} is toegevoegd.');`,
      `  } catch (error) {`,
      `    window.alert(error.message);`,
      `  }`,
      `});`,
      ``
      );
    }
    if (ops.update) {
      parts.push(
      `document.querySelector('#${state.singular}-update-form').addEventListener('submit', async (event) => {`,
      `  event.preventDefault();`,
      `  const id = Number(event.currentTarget.elements.namedItem('id').value);`,
      `  try {`,
      `    await request${functionName}(\`/api/${state.table}/\${id}\`, {`,
      `      method: 'PUT',`,
      `      headers: { 'Content-Type': 'application/json' },`,
      `      body: JSON.stringify(read${functionName}Form(event.currentTarget))`,
      `    });`,
      ops.read ? `    await load${functionName}Rows();` : `    window.alert('${state.singular} is bijgewerkt.');`,
      `  } catch (error) {`,
      `    window.alert(error.message);`,
      `  }`,
      `});`,
      ``
      );
      if (ops.read) {
        parts.push(
        `function start${functionName}Edit(item) {`,
        `  const form = document.querySelector('#${state.singular}-update-form');`,
        `  form.elements.namedItem('id').value = item.id;`,
        ...fillLines,
        `  form.scrollIntoView({ behavior: 'smooth' });`,
        `}`,
        ``
        );
      }
    }
    if (ops.delete && !ops.read) {
      parts.push(
      `document.querySelector('#${state.singular}-delete-form').addEventListener('submit', async (event) => {`,
      `  event.preventDefault();`,
      `  const id = Number(event.currentTarget.elements.namedItem('id').value);`,
      `  if (!window.confirm('Weet je zeker dat je dit wilt verwijderen?')) return;`,
      `  try {`,
      `    await request${functionName}(\`/api/${state.table}/\${id}\`, { method: 'DELETE' });`,
      `    event.currentTarget.reset();`,
      `    window.alert('${state.singular} is verwijderd.');`,
      `  } catch (error) {`,
      `    window.alert(error.message);`,
      `  }`,
      `});`,
      ``
      );
    }
    if (ops.read && (ops.update || ops.delete)) {
      parts.push(
      `document.querySelector('#${state.table}-rows').addEventListener('click', async (event) => {`,
      `  const editButton = event.target.closest('[data-edit-${state.singular}]');`,
      `  const deleteButton = event.target.closest('[data-delete-${state.singular}]');`,
      `  const rows = event.currentTarget;`,
      `  const items = rows.currentItems || [];`,
      ops.update ? `  if (editButton) { const item = items.find((row) => row.id === Number(editButton.dataset.edit${functionName})); if (item) start${functionName}Edit(item); }` : "",
      ops.delete ? `  if (deleteButton && window.confirm('Weet je zeker dat je dit wilt verwijderen?')) { await request${functionName}(\`/api/${state.table}/\${deleteButton.dataset.delete${functionName}}\`, { method: 'DELETE' }); await load${functionName}Rows(); }` : "",
      `});`,
      ``
      );
    }
    if (ops.read) parts.push(`load${functionName}Rows().catch((error) => window.alert(error.message));`);
    return parts.filter((line) => line !== "").join("\n");
  }

  function generateCompletePhpApp(state) {
    const schema = generateSql(state);
    const crudLogic = generatePhpBackend(state);
    const pageHtml = generateForm(state);
    const componentCss = generateCss(state);
    const databaseName = `${state.table}_crud`;
    const operationNames = [state.operations.create && "Create", state.operations.read && "Read", state.operations.update && "Update", state.operations.delete && "Delete"].filter(Boolean).join(" + ");
    const csrfHelpers = state.csrf ? [
      `function csrf_token(): string`,
      `{`,
      `    if (empty($_SESSION['_token'])) $_SESSION['_token'] = bin2hex(random_bytes(32));`,
      `    return $_SESSION['_token'];`,
      `}`,
      ``,
      `function verify_csrf(mixed $token): void`,
      `{`,
      `    if (!is_string($token) || !hash_equals(csrf_token(), $token)) {`,
      `        throw new RuntimeException('De beveiligingscode is verlopen. Vernieuw de pagina.');`,
      `    }`,
      `}`,
      ``
    ] : [];
    const databaseSetup = state.stack === "php-mysql"
      ? [
          `// MYSQL-INSTELLINGEN: de standaard XAMPP-gebruiker is root zonder wachtwoord.`,
          `$dbUser = 'root';`,
          `$dbPassword = '';`,
          `$server = new PDO('mysql:host=127.0.0.1;charset=utf8mb4', $dbUser, $dbPassword, $pdoOptions);`,
          `$server->exec('CREATE DATABASE IF NOT EXISTS ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');`,
          `$db = new PDO('mysql:host=127.0.0.1;dbname=${databaseName};charset=utf8mb4', $dbUser, $dbPassword, $pdoOptions);`
        ].join("\n")
      : [
          `// SQLITE-INSTELLINGEN: maak automatisch de map data en het databasebestand.`,
          `$dataDirectory = __DIR__ . '/data';`,
          `if (!is_dir($dataDirectory) && !mkdir($dataDirectory, 0775, true) && !is_dir($dataDirectory)) {`,
          `    throw new RuntimeException('De map data kon niet worden gemaakt.');`,
          `}`,
          `$db = new PDO('sqlite:' . $dataDirectory . '/app.sqlite', null, null, $pdoOptions);`,
          `$db->exec('PRAGMA foreign_keys = ON');`
        ].join("\n");

    return [
      `<?php`,
      ``,
      `declare(strict_types=1);`,
      `session_start();`,
      ``,
      `// ============================================================`,
      `// COMPLETE TESTAPP VOOR ${state.table.toUpperCase()} · ${operationNames}`,
      `// Zet dit bestand als index.php in een nieuwe map onder htdocs.`,
      `// De comments leggen ieder onderdeel uit; je mag ze laten staan.`,
      `// ============================================================`,
      ``,
      `// STAP 1 — Kleine hulpfuncties voor veilige HTML, invoer en redirects.`,
      `function e(mixed $value): string`,
      `{`,
      `    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');`,
      `}`,
      ``,
      `function post_text(string $name): string`,
      `{`,
      `    return trim((string) ($_POST[$name] ?? ''));`,
      `}`,
      ``,
      `function required_text(string $name, string $label, int $maxLength): string`,
      `{`,
      `    $value = post_text($name);`,
      `    if ($value === '') throw new RuntimeException($label . ' is verplicht.');`,
      `    if (strlen($value) > $maxLength) throw new RuntimeException($label . ' is te lang.');`,
      `    return $value;`,
      `}`,
      ``,
      `function positive_id(mixed $value, string $label = 'ID'): int`,
      `{`,
      `    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);`,
      `    if ($id === false) throw new RuntimeException($label . ' is ongeldig.');`,
      `    return (int) $id;`,
      `}`,
      ``,
      ...csrfHelpers,
      `function flash(string $type, string $message): void`,
      `{`,
      `    $_SESSION['flash'] = ['type' => $type, 'message' => $message];`,
      `}`,
      ``,
      `function redirect(string $location): never`,
      `{`,
      `    header('Location: ' . $location);`,
      `    exit;`,
      `}`,
      ``,
      `// STAP 2 — Open ${state.stack === "php-mysql" ? "MySQL via XAMPP" : "het lokale SQLite-bestand"}.`,
      `$pdoOptions = [`,
      `    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,`,
      `    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,`,
      `    PDO::ATTR_EMULATE_PREPARES => false,`,
      `];`,
      databaseSetup,
      ``,
      `// STAP 3 — Maak de tabel automatisch wanneer hij nog niet bestaat.`,
      `$db->exec(<<<'SQL'`,
      schema,
      `SQL);`,
      ``,
      `// STAP 4 — Alleen de gekozen acties: ${operationNames}.`,
      crudLogic,
      ``,
      `// STAP 5 — Haal een eenmalige succesmelding uit de sessie.`,
      `$flashMessage = $_SESSION['flash'] ?? null;`,
      `unset($_SESSION['flash']);`,
      `?>`,
      `<!DOCTYPE html>`,
      `<html lang="nl">`,
      `<head>`,
      `  <meta charset="utf-8">`,
      `  <meta name="viewport" content="width=device-width, initial-scale=1">`,
      `  <title>${state.table} beheren</title>`,
      `  <style>`,
      `    /* STAP 6 — Basisopmaak van de complete testpagina. */`,
      `    * { box-sizing: border-box; }`,
      `    body { margin: 0; background: #f5f3ed; color: #10233f; font-family: Arial, sans-serif; line-height: 1.5; }`,
      `    .complete-header { padding: 22px 5vw; background: #10233f; color: #fff; }`,
      `    .complete-header b { font-size: 20px; }`,
      `    .complete-header small { display: block; color: #bdcbe0; }`,
      `    .complete-page { width: min(1280px, 92vw); margin: 0 auto; padding: 34px 0 70px; }`,
      `    .complete-message { margin-bottom: 18px; padding: 13px 16px; border-left: 4px solid #168451; background: #fff; }`,
      `    .complete-message--error { border-left-color: #b62935; background: #fff0f1; color: #8f2029; }`,
      componentCss.split("\n").map((line) => `    ${line}`).join("\n"),
      `  </style>`,
      `</head>`,
      `<body>`,
      `  <!-- STAP 7 — Dit is het zichtbare gedeelte van de applicatie. -->`,
      `  <header class="complete-header"><b>${state.table} administratie</b><small>Gekozen functies: ${operationNames}</small></header>`,
      `  <main class="complete-page">`,
      `    <?php if ($pageError !== ''): ?>`,
      `      <div class="complete-message complete-message--error"><?= e($pageError) ?></div>`,
      `    <?php endif; ?>`,
      `    <?php if ($flashMessage): ?>`,
      `      <div class="complete-message"><?= e($flashMessage['message']) ?></div>`,
      `    <?php endif; ?>`,
      pageHtml.split("\n").map((line) => `    ${line}`).join("\n"),
      `  </main>`,
      `</body>`,
      `</html>`
    ].join("\n");
  }

  function escapeForJsTemplate(value) {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$\{/g, "\\${");
  }

  function generateCompleteJsApp(state) {
    const schema = generateSql(state);
    const api = generateJsBackend(state);
    const form = generateForm(state);
    const css = generateCss(state);
    const browserCode = generateJsFrontend(state);
    const page = [
      `<!DOCTYPE html>`,
      `<html lang="nl"><head>`,
      `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">`,
      `<title>${state.table} beheren</title>`,
      `<style>body{margin:0;padding:4vw;background:#f5f3ed;color:#10233f;font-family:Arial,sans-serif}${css}</style>`,
      `</head><body>`,
      `<!-- COMPLETE HTML: formulier en overzicht gebruiken dezelfde ids als browser-JavaScript. -->`,
      `<main>${form}</main>`,
      `<script>${browserCode}</script>`,
      `</body></html>`
    ].join("\n");

    return [
      `// COMPLETE JAVASCRIPT + SQLITE TESTAPP`,
      `// 1. Maak een lege map en sla dit bestand op als server.js.`,
      `// 2. Open daar een terminal en voer uit: npm init -y`,
      `// 3. Voer uit: npm install express better-sqlite3`,
      `// 4. Start met: node server.js`,
      `// 5. Open: http://localhost:3000`,
      ``,
      `const express = require('express');`,
      `const Database = require('better-sqlite3');`,
      `const { mkdirSync } = require('node:fs');`,
      ``,
      `// DATABASE: maak de datamap, open SQLite en maak de tabel.`,
      `mkdirSync('data', { recursive: true });`,
      `const db = new Database('data/app.sqlite');`,
      `db.pragma('foreign_keys = ON');`,
      `db.exec(${JSON.stringify(schema)});`,
      ``,
      `// EXPRESS: lees JSON uit de browser en geef duidelijke fouten terug.`,
      `const app = express();`,
      `app.use(express.json());`,
      `function httpError(status, message) { const error = new Error(message); error.status = status; return error; }`,
      `function requiredText(value, label, max) { const text = String(value ?? '').trim(); if (!text) throw httpError(400, label + ' is verplicht.'); if (text.length > max) throw httpError(400, label + ' is te lang.'); return text; }`,
      `function readId(value, label = 'ID') { const id = Number(value); if (!Number.isInteger(id) || id < 1) throw httpError(400, label + ' is ongeldig.'); return id; }`,
      ``,
      api,
      ``,
      `// FRONTEND: deze complete HTML, CSS en browser-JS worden op / getoond.`,
      `const page = \`${escapeForJsTemplate(page)}\`;`,
      `app.get('/', (req, res) => res.type('html').send(page));`,
      ``,
      `// FOUTAFHANDELING: stuur altijd leesbare JSON naar de browser.`,
      `app.use((error, req, res, next) => {`,
      `  if (res.headersSent) return next(error);`,
      `  res.status(error.status || 500).json({ error: error.message || 'Serverfout.' });`,
      `});`,
      `app.listen(3000, () => console.log('Open http://localhost:3000'));`
    ].join("\n");
  }

  function generateCompleteApp(state) {
    return state.stack === "js-sqlite" ? generateCompleteJsApp(state) : generateCompletePhpApp(state);
  }

  function generatePastePlan(state) {
    const title = `EXACT PLAKPLAN VOOR: ${state.table.toUpperCase()}`;
    const selectedActions = [state.operations.create && "Create", state.operations.read && "Read", state.operations.update && "Update", state.operations.delete && "Delete"].filter(Boolean);
    const testActions = [
      state.operations.create && `   CREATE: voeg één herkenbaar testitem toe.`,
      state.operations.read && `   READ: vernieuw en controleer of bestaande rijen zichtbaar blijven.`,
      state.operations.update && `   UPDATE: wijzig één veld van een bestaand testitem.`,
      state.operations.delete && `   DELETE: verwijder alleen een testitem.`
    ].filter(Boolean);
    if (state.stack === "js-sqlite") {
      return [
        title,
        `Gekozen acties: ${selectedActions.join(", ")}.`,
        `Maak eerst een kopie van de hele projectmap.`,
        ``,
        `1. DATABASETABEL — tab 2`,
        `   Open: backend/server.js`,
        `   Ctrl+F: CREATE INDEX IF NOT EXISTS idx_students_country`,
        `   Zoek direct daarna de regel met een afsluitende backtick en );`,
        `   Plak tab 2 OP EEN NIEUWE REGEL VÓÓR die backtick.`,
        ``,
        `2. HTML — tab 3`,
        `   Open: frontend/index.html`,
        `   Ctrl+F: </main>`,
        `   Klik aan het begin van die regel.`,
        `   Plak tab 3 DIRECT BOVEN </main>.`,
        ``,
        `3. CSS-OPMAAK — tab 4`,
        `   Open: frontend/style.css`,
        `   Druk Ctrl+End en maak twee nieuwe lege regels.`,
        `   Plak tab 4 HELEMAAL ONDERAAN het CSS-bestand.`,
        `   De class generated-crud in tab 3 wijst nu naar .generated-crud in tab 4.`,
        ``,
        `4. API — tab 5`,
        `   Open: backend/server.js`,
        `   Ctrl+F: app.use((error`,
        `   Plak tab 5 DIRECT BOVEN de foutafhandeling.`,
        ``,
        `5. BROWSERCODE — tab 6`,
        `   Open: frontend/app.js`,
        `   Druk Ctrl+End en maak één nieuwe lege regel.`,
        `   Plak tab 6 ONDERAAN het bestand.`,
        ``,
        `6. TEST`,
        `   Stop npm start met Ctrl+C en start opnieuw met npm start.`,
        ...testActions,
        `   Zoek bij een fout op de letterlijke foutmelding in de Foutzoeker.`
      ].join("\n");
    }

    const databaseReset = state.stack === "php-sqlite"
      ? `   Vernieuw de pagina; CREATE TABLE IF NOT EXISTS voegt de nieuwe tabel toe. Verwijder app.sqlite niet als er echte gegevens in staan.`
      : `   Vernieuw de pagina; PHP maakt de nieuwe tabel in MySQL.`;
    return [
      title,
      `Gekozen acties: ${selectedActions.join(", ")}.`,
      `Maak eerst een kopie van de hele projectmap.`,
      ``,
      `1. DATABASETABEL — tab 2`,
      `   Open: database/schema.sql`,
      `   Druk Ctrl+End en maak één nieuwe lege regel.`,
      `   Controleer dat de vorige SQL-regel eindigt met een puntkomma (;).`,
      `   Plak tab 2 ONDERAAN en sla op met Ctrl+S.`,
      databaseReset,
      ``,
      `2. PHP-VERWERKING — tab 5`,
      `   Open: index.php`,
      `   Ctrl+F: if ($_SERVER['REQUEST_METHOD'] === 'POST') {`,
      `   Klik aan het begin van deze regel.`,
      `   Plak tab 5 DIRECT BOVEN deze bestaande regel.`,
      `   Twee POST-blokken onder elkaar zijn hier bewust: het nieuwe blok verwerkt ${state.table}.`,
      ``,
      `3. FORMULIER + OVERZICHT — tab 3`,
      `   Blijf in: index.php`,
      `   Ctrl+F: <footer><span>Campus Admin`,
      `   Klik aan het begin van die regel.`,
      `   Plak tab 3 DIRECT BOVEN deze footerregel.`,
      `   Tab 3 bevat alleen: ${selectedActions.join(", ")}.`,
      ``,
      `4. CSS-OPMAAK — tab 4`,
      `   Open: assets/app.css`,
      `   Druk Ctrl+End en maak twee nieuwe lege regels.`,
      `   Plak tab 4 HELEMAAL ONDERAAN het CSS-bestand.`,
      `   De class generated-crud in tab 3 wijst nu naar .generated-crud in tab 4.`,
      ``,
      `5. BROWSERCODE — tab 6`,
      `   Voor PHP is geen extra browsercode nodig. Sla deze tab over.`,
      ``,
      `6. TEST IN DEZE VOLGORDE`,
      ...testActions,
      ``,
      `KLAAR? Voeg pas daarna zoeken, relaties, uploads of login toe.`
    ].join("\n");
  }

  function builderOutputs(state) {
    return {
      complete: { file: state.stack === "js-sqlite" ? "server.js · compleet testbestand" : "index.php · compleet testbestand", code: generateCompleteApp(state) },
      sql: { file: state.stack === "js-sqlite" ? "backend/server.js · binnen db.exec" : "database/schema.sql", code: generateSql(state) },
      form: { file: state.stack === "js-sqlite" ? "frontend/index.html" : "index.php · HTML", code: generateForm(state) },
      css: { file: state.stack === "js-sqlite" ? "frontend/style.css · onderaan" : "assets/app.css · onderaan", code: generateCss(state) },
      backend: { file: state.stack === "js-sqlite" ? "backend/server.js" : "index.php · PHP", code: state.stack === "js-sqlite" ? generateJsBackend(state) : generatePhpBackend(state) },
      frontend: { file: state.stack === "js-sqlite" ? "frontend/app.js" : "Niet nodig bij de PHP-route", code: state.stack === "js-sqlite" ? generateJsFrontend(state) : "// PHP verwerkt het formulier op de server.\n// Voor deze gegenereerde PHP-CRUD hoef je geen extra browser-JavaScript te plakken.\n// Ga naar tab 7 voor het exacte plakplan." },
      steps: { file: "plakplan.txt", code: generatePastePlan(state) }
    };
  }

  function updateBuilderTestGuide(state) {
    const dutchGuides = {
      "php-sqlite": {
        title: "Complete PHP + SQLite-app in één bestand",
        intro: "Kopieer tab 1. De database en tabel worden bij de eerste keer openen automatisch gemaakt.",
        steps: [
          ["Stap 1", "Maak een projectmap", "C:\\xampp\\htdocs\\mijn-crud"],
          ["Stap 2", "Maak één bestand", "Plak tab 1 in index.php"],
          ["Stap 3", "Start Apache", "XAMPP → Apache → Start"],
          ["Stap 4", "Open de app", "http://localhost/mijn-crud/"]
        ]
      },
      "php-mysql": {
        title: "Complete PHP + MySQL-app in één bestand",
        intro: "Kopieer tab 1. PHP maakt de MySQL-database en tabel automatisch met de standaard XAMPP-instellingen.",
        steps: [
          ["Stap 1", "Start twee onderdelen", "XAMPP → Apache én MySQL → Start"],
          ["Stap 2", "Maak een projectmap", "C:\\xampp\\htdocs\\mijn-crud"],
          ["Stap 3", "Maak één bestand", "Plak tab 1 in index.php"],
          ["Stap 4", "Open de app", "http://localhost/mijn-crud/"]
        ]
      },
      "js-sqlite": {
        title: "Complete JavaScript + SQLite-app in één bestand",
        intro: "Kopieer tab 1 naar server.js. HTML, CSS, API en database zitten al in dat ene bestand.",
        steps: [
          ["Stap 1", "Maak een lege map", "Open die map in VS Code"],
          ["Stap 2", "Maak één bestand", "Plak tab 1 in server.js"],
          ["Stap 3", "Installeer en start", "npm init -y · npm install express better-sqlite3 · node server.js"],
          ["Stap 4", "Open de app", "http://localhost:3000/"]
        ]
      }
    };
    const englishGuides = {
      "php-sqlite": {
        title: "Complete PHP + SQLite app in one file",
        intro: "Copy tab 1. The database and table are created automatically when you first open the app.",
        steps: [["Step 1", "Create a project folder", "C:\\xampp\\htdocs\\my-crud"], ["Step 2", "Create one file", "Paste tab 1 into index.php"], ["Step 3", "Start Apache", "XAMPP → Apache → Start"], ["Step 4", "Open the app", "http://localhost/my-crud/"]]
      },
      "php-mysql": {
        title: "Complete PHP + MySQL app in one file",
        intro: "Copy tab 1. PHP automatically creates the MySQL database and table with the default XAMPP settings.",
        steps: [["Step 1", "Start two services", "XAMPP → Apache and MySQL → Start"], ["Step 2", "Create a project folder", "C:\\xampp\\htdocs\\my-crud"], ["Step 3", "Create one file", "Paste tab 1 into index.php"], ["Step 4", "Open the app", "http://localhost/my-crud/"]]
      },
      "js-sqlite": {
        title: "Complete JavaScript + SQLite app in one file",
        intro: "Copy tab 1 to server.js. HTML, CSS, API and database code are already included in that file.",
        steps: [["Step 1", "Create an empty folder", "Open that folder in VS Code"], ["Step 2", "Create one file", "Paste tab 1 into server.js"], ["Step 3", "Install and start", "npm init -y · npm install express better-sqlite3 · node server.js"], ["Step 4", "Open the app", "http://localhost:3000/"]]
      }
    };
    const guide = (activeLanguage === "en" ? englishGuides : dutchGuides)[state.stack];
    builderTestTitle.textContent = guide.title;
    builderTestIntro.textContent = guide.intro;
    builderTestSteps.replaceChildren(...guide.steps.map(([number, title, detail]) => {
      const item = document.createElement("li");
      const numberElement = document.createElement("span");
      const titleElement = document.createElement("b");
      const detailElement = document.createElement("code");
      numberElement.textContent = number;
      titleElement.textContent = title;
      detailElement.textContent = detail;
      item.append(numberElement, titleElement, detailElement);
      return item;
    }));
  }

  function updateBuilderOutput() {
    if (csrfOption) csrfOption.hidden = stackSelect.value === "js-sqlite";
    const state = normalizedBuilderState();
    const output = builderOutputs(state)[currentBuilderTab];
    builderFile.textContent = output.file;
    builderCode.textContent = output.code;
    builder.currentCode = output.code;
    builder.currentFilename = output.file;
    updateBuilderValidation(state);
    updateBuilderTestGuide(state);
    saveBuilderConfiguration();
  }

  function applyPreset(name) {
    const preset = presets[name] || presets.custom;
    singularInput.value = preset.singular;
    tableInput.value = preset.table;
    builderFields = preset.fields.map((field) => ({ ...field, nameTouched: false }));
    renderBuilderFields();
    updateBuilderOutput();
  }

  presetSelect.addEventListener("change", () => applyPreset(presetSelect.value));
  stackSelect.addEventListener("change", updateBuilderOutput);
  csrfInput?.addEventListener("change", updateBuilderOutput);
  singularInput.addEventListener("input", updateBuilderOutput);
  tableInput.addEventListener("input", updateBuilderOutput);
  $("[data-add-field]", builder).addEventListener("click", () => {
    if (builderFields.length >= 12) return;
    builderFields.push({ label: "Nieuw veld", name: `veld_${builderFields.length + 1}`, type: "text", required: false, unique: false, nameTouched: false });
    renderBuilderFields();
    updateBuilderOutput();
  });

  operationInputs.forEach((input) => {
    input.addEventListener("change", () => {
      // Minstens één actie blijft gekozen, anders heeft de generator niets te bouwen.
      if (!operationInputs.some((item) => item.checked)) input.checked = true;
      updateOperationSummary();
      updateBuilderOutput();
    });
  });

  operationPresetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const crudPreset = button.dataset.crudPreset;
      operationInputs.forEach((input) => {
        input.checked = crudPreset === "all"
          || (crudPreset === "read" && input.dataset.builderOperation === "read")
          || (crudPreset === "create-read" && ["create", "read"].includes(input.dataset.builderOperation));
      });
      updateOperationSummary();
      updateBuilderOutput();
    });
  });

  builderTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      currentBuilderTab = tab.dataset.builderTab;
      builderTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      updateBuilderOutput();
    });
  });

  $("[data-copy-builder]", builder).addEventListener("click", () => copyText(builder.currentCode || ""));
  $("[data-download-builder]", builder).addEventListener("click", () => downloadTextFile(builder.currentFilename || "crud-code.txt", builder.currentCode || ""));
  resetBuilderButton?.addEventListener("click", () => {
    localStorage.removeItem(builderStorageKey);
    presetSelect.value = "products";
    stackSelect.value = "php-sqlite";
    if (csrfInput) csrfInput.checked = false;
    operationInputs.forEach((input) => { input.checked = true; });
    currentBuilderTab = "complete";
    builderTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.builderTab === currentBuilderTab));
    updateOperationSummary();
    applyPreset("products");
  });
  builder.refreshLanguage = () => {
    updateOperationSummary();
    const state = normalizedBuilderState();
    updateBuilderValidation(state);
    updateBuilderTestGuide(state);
  };
  updateOperationSummary();
  const restoredBuilder = restoreBuilderConfiguration();
  builderInitialized = true;
  if (restoredBuilder) updateBuilderOutput();
  else applyPreset("products");
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
      ["frontend-koppelen", "HTML en CSS koppelen", "Zie waar index.php, app.css en app.js staan en hoe de paden werken."],
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
      ["frontend-koppelen", "HTML en CSS koppelen", "Verbind index.php met assets/app.css en begrijp class-namen."],
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
    nextHref: "#frontend-koppelen",
    nextLabel: "Koppel eerst de JavaScript-frontend",
    steps: [
      ["frontend-koppelen", "HTML en CSS koppelen", "Verbind index.html, style.css en app.js met de juiste paden."],
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
    const downloadLabel = activeLanguage === "en"
      ? `Download the ${route.name} starter`
      : `Download de ${route.name}-starter`;
    headerDownload.setAttribute("aria-label", downloadLabel);
    headerDownload.title = downloadLabel;
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
  showFrontendPanel(routeKey);

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
    if (label) label.textContent = enabled ? "Aan · uitleg boven de code" : "Uit · alleen code";
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
  "php-style-link": {
    method: "Controleer één bestaande regel",
    file: "studenten-crud/index.php",
    start: "<head>",
    end: "</head>",
    action: "Deze regel staat al in de starter. Ontbreekt hij? Plak hem één keer vóór </head>. Gebruik exact assets/app.css en zet hem niet in app.css zelf.",
    check: "Open localhost en druk Ctrl+F5. De pagina moet kleuren, ruimte en een layout hebben in plaats van kale tekst.",
    copyReady: true
  },
  "php-script-link": {
    method: "Controleer één bestaande regel",
    file: "studenten-crud/index.php",
    start: "<head>",
    end: "</head>",
    action: "Deze regel staat al in de starter. Ontbreekt hij? Plak hem één keer vóór </head>. defer zorgt dat de HTML eerst wordt geladen.",
    check: "Klik op Menu op een smal scherm of probeer Verwijder. De menu- of bevestigingsactie moet reageren.",
    copyReady: true
  },
  "php-first-html": {
    method: "Voeg één compleet HTML-blok toe",
    file: "studenten-crud/index.php",
    start: "<main class=\"app-shell\">",
    end: "dezelfde regel <main class=\"app-shell\">",
    action: "Laat de gevonden main-regel staan. Zet je cursor aan het einde, druk Enter en plak het hele section-blok direct eronder.",
    check: "Sla op en vernieuw localhost. De tekst ‘Mijn eerste eigen onderdeel’ moet boven de administratie verschijnen.",
    copyReady: true
  },
  "php-first-css": {
    method: "Voeg CSS onderaan toe",
    file: "studenten-crud/assets/app.css",
    start: "ga met Ctrl+End naar de laatste regel",
    end: "onder de bestaande CSS",
    action: "Zet de cursor na de laatste } van het bestand, druk twee keer Enter en plak dit hele CSS-blok. Plak het niet in index.php.",
    check: "Druk Ctrl+F5 in de browser. Het nieuwe blok moet wit zijn en links een blauwe lijn hebben.",
    copyReady: true
  },
  "js-style-link": {
    method: "Controleer één bestaande regel",
    file: "javascript-sqlite-crud/frontend/index.html",
    start: "<head>",
    end: "</head>",
    action: "Deze regel staat al in de starter. Ontbreekt hij? Plak hem één keer vóór </head>. style.css staat naast index.html, daarom begint het pad met ./.",
    check: "Start npm start en open http://localhost:3000. De pagina moet de Campus-layout en blauwe knoppen tonen.",
    copyReady: true
  },
  "js-script-link": {
    method: "Controleer één bestaande regel",
    file: "javascript-sqlite-crud/frontend/index.html",
    start: "<head>",
    end: "</head>",
    action: "Deze regel staat al in de starter. Ontbreekt hij? Plak hem één keer vóór </head>. app.js staat in dezelfde frontendmap.",
    check: "Open http://localhost:3000. Landen en studenten moeten geladen worden; de browserconsole mag geen 404 voor app.js tonen.",
    copyReady: true
  },
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
    method: "Nieuw bestand in drie delen · PHP, HTML en CSS",
    file: "studenten-crud/detail.php + assets/app.css",
    start: "een nieuw detail.php-bestand",
    end: "voer daarna de HTML- en CSS-blokken uit",
    action: "Maak detail.php naast index.php. Plak eerst dit PHP-blok, daarna het HTML-blok in hetzelfde bestand en ten slotte het CSS-blok onderaan assets/app.css.",
    check: "Open http://localhost/studenten-crud/detail.php?id=1. Je moet één student of ‘Student niet gevonden’ zien, geen PHP-fout.",
    copyReady: false
  },
  "snippet-detail-js": {
    method: "Vier plaatsingen · API, browser-JS, HTML en CSS",
    file: "backend/server.js + frontend/app.js + frontend/index.html + frontend/style.css",
    start: "// backend/server.js en daarna // frontend/app.js",
    end: "voer daarna de afzonderlijke HTML- en CSS-blokken uit",
    action: "Splits dit blok bij de comments over server.js en app.js. Voeg daarna de dialoog-HTML aan index.html en de bijbehorende CSS aan style.css toe.",
    check: "Open /api/students/1. Je moet één JSON-object of een duidelijke 404-fout krijgen.",
    copyReady: false
  },
  "snippet-login": {
    method: "Meerdelig compleet recept · eerste admin, login, logout, HTML en CSS",
    file: "maak-admin.php + login.php + logout.php + assets/app.css + beschermde pagina's",
    start: "drie verschillende plekken",
    end: "voer ieder deel afzonderlijk uit",
    action: "Voer eerst de users-tabel van U1 uit. Maak daarna één admin met maak-admin.php en verwijder dat tijdelijke bestand. Bouw vervolgens login.php, logout.php, de HTML en de CSS in de getoonde volgorde.",
    check: "Test fout wachtwoord, goed wachtwoord, inactief account, een beschermde pagina en uitloggen. Na uitloggen moet index.php je naar login.php terugsturen.",
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
    method: "Nieuw exportbestand + HTML-knop + CSS",
    file: "studenten-crud/export.php + index.php + assets/app.css",
    start: "een nieuw, volledig leeg bestand",
    end: "het einde van het bestand",
    action: "Maak export.php naast index.php en plak dit hele PHP-blok. Voeg daarna de HTML-downloadlink aan index.php en het CSS-blok aan app.css toe.",
    check: "Open http://localhost/studenten-crud/export.php. Er moet een CSV-download starten die in Excel kan worden geopend.",
    copyReady: false
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
    method: "Meerdelig recept · schema, PHP, HTML en CSS",
    file: "schema.sql + index.php + assets/app.css",
    start: "iedere commentregel noemt een andere plek",
    end: "voer de regels één voor één uit",
    action: "Voeg eerst deleted_at aan het schema toe. Plaats daarna het complete PHP-actieblok, de twee HTML-fragmenten en ten slotte de CSS op hun afzonderlijke plekken.",
    check: "Een verwijderd testitem moet uit het normale overzicht verdwijnen, in de prullenbak staan en daarna hersteld kunnen worden.",
    copyReady: false
  },
  "snippet-transaction": {
    method: "Compleet voorbeeld in PHP, HTML en CSS · eigen tabellen nodig",
    file: "jouw index.php + het gekoppelde assets/app.css",
    start: "vóór het bestaande algemene POST-blok",
    end: "voer daarna formulier en CSS afzonderlijk uit",
    action: "Dit PHP-blok leest dezelfde klant_id, product_id en aantal als het HTML-formulier. De tabellen klanten, producten en bestellingen moeten wel al in jouw database bestaan.",
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
    location = `De builder heeft dit gemaakt voor ${label}. Gebruik tab 1 om direct te testen of open tab 7 voor het losse plakplan.`;
    action = "Kopieer daarna één tab tegelijk. Iedere tab noemt een ander bestand of een andere plek; plak ze nooit samen in één bestand.";
  } else if (container.closest(".snippet-body")) {
    action = "Voeg dit pas toe nadat de basis-CRUD werkt. Volg eerst ‘Waar plakken’ boven dit blok, kopieer alles en test alleen deze nieuwe functie.";
  } else if (container.classList.contains("file-code")) {
    location = `Dit is het complete bestand ${label}. Je hoeft het niet regel voor regel over te typen.`;
    action = "Gebruik dit alleen om een beschadigd bestand volledig te vervangen. Download voor een nieuw project liever de complete starter.";
    check = "Sla het vervangen bestand op en vernieuw de app. Controleer eerst de basisacties voordat je weer eigen wijzigingen toevoegt.";
  }

  if (container.dataset.codeFile) {
    return {
      location: container.dataset.codeFile,
      purpose,
      action: container.dataset.codeAction || action,
      check: container.dataset.codeCheck || check,
      method: container.dataset.codeMethod || "Voeg dit complete onderdeel toe",
      start: container.dataset.codeStart,
      end: container.dataset.codeEnd,
      copyReady: container.dataset.copyReady !== "false"
    };
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
  strong.textContent = `${translatedText(label)}: `;
  line.append(strong, document.createTextNode(translatedText(value)));
  parent.append(line);
}

$$('.code-block, .file-code').forEach((container) => {
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

  guide.append(explanation);
  toolbar.insertAdjacentElement("afterend", guide);

  function refreshGuide() {
    const label = toolbar.querySelector("span")?.textContent.trim() || "dit codeblok";
    const lesson = codeLesson(label, code.textContent, container);
    eyebrow.textContent = activeLanguage === "en" ? `Paste type · ${translatedText(lesson.method)}` : `Plaktype · ${lesson.method}`;
    title.textContent = activeLanguage === "en" ? `1. This belongs to: ${translatedText(label)}` : `1. Dit hoort bij: ${label}`;
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
      copyButton.textContent = translatedText("Kopieer voorbeeld");
      copyButton.dataset.originalCopyLabel = "saved";
    }
  }

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
  if (command.startsWith("git ")) instruction = "Open de terminal in de map van CodingForDommies, plak deze opdracht en druk op Enter.";

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

  const firstCode = $("pre code", body);
  const codeId = firstCode?.id;
  const firstCodeBlock = firstCode?.closest(".code-block");
  const placement = pastePlacements[codeId] || (firstCodeBlock?.dataset.codeFile ? {
    copyReady: firstCodeBlock.dataset.copyReady !== "false"
  } : null);
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
    const selectedCodeBlock = targetCode.closest(".code-block");
    const selectedPlacement = pastePlacements[targetCode.id] || (selectedCodeBlock?.dataset.codeFile ? {
      copyReady: selectedCodeBlock.dataset.copyReady !== "false"
    } : null);
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

// Pas de gekozen taal pas toe nadat alle interactieve uitlegblokken zijn opgebouwd.
applyLanguage(activeLanguage, false);
