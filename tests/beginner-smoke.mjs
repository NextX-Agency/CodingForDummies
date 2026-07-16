import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});

const { window } = dom;
let copiedText = '';
window.navigator.clipboard = { writeText: async (value) => { copiedText = value; } };
window.eval(script);

const { document } = window;
const snippets = [...document.querySelectorAll('[data-snippet]')];
if (snippets.length !== 10) throw new Error(`Verwacht 10 simpele snippets, vond ${snippets.length}.`);

for (const snippet of snippets) {
  if (!snippet.querySelector('.simple-steps') || !snippet.querySelector('.code-box')) {
    throw new Error('Iedere snippet moet korte stappen en direct zichtbare code hebben.');
  }
}

const cssFilter = document.querySelector('[data-filter="css"]');
cssFilter.click();
const visibleCss = snippets.filter((snippet) => !snippet.hidden);
if (visibleCss.length !== 2 || visibleCss.some((snippet) => snippet.dataset.type !== 'css')) {
  throw new Error('CSS-filter toont niet precies de twee CSS-snippets.');
}

const search = document.querySelector('[data-search]');
document.querySelector('[data-filter="all"]').click();
search.value = 'contact';
search.dispatchEvent(new window.Event('input', { bubbles: true }));
const visibleSearch = snippets.filter((snippet) => !snippet.hidden);
if (!visibleSearch.some((snippet) => snippet.textContent.includes('Contactformulier'))) {
  throw new Error('Zoeken op gewone woorden geeft niet het verwachte resultaat.');
}

search.value = 'bestaat niet';
search.dispatchEvent(new window.Event('input', { bubbles: true }));
if (document.querySelector('[data-empty-state]').hidden) throw new Error('Lege zoekstatus wordt niet getoond.');
document.querySelector('[data-reset-search]').click();
if (snippets.some((snippet) => snippet.hidden)) throw new Error('Zoeken wissen toont niet alle snippets.');

const menuButton = document.querySelector('[data-menu-button]');
menuButton.click();
if (menuButton.getAttribute('aria-expanded') !== 'true' || !document.querySelector('[data-main-nav]').classList.contains('is-open')) {
  throw new Error('Mobiele navigatie opent niet.');
}

document.querySelector('[data-copy-target="code-hero"]').click();
await new Promise((resolve) => window.setTimeout(resolve, 0));
if (!copiedText.includes('class="hero"')) throw new Error('Kopieerknop kopieert niet de hero-code.');

for (const id of ['start', 'snippets', 'template', 'stappen', 'extra']) {
  if (!document.getElementById(id)) throw new Error(`Hoofdsectie ontbreekt: ${id}.`);
}

console.log('Beginner-snippets + zoeken + filters + kopiëren + menu: PASS');
