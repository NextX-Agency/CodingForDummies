const menuButton = document.querySelector('[data-menu-button]');
const mainNav = document.querySelector('[data-main-nav]');
const searchInput = document.querySelector('[data-search]');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const snippets = [...document.querySelectorAll('[data-snippet]')];
const resultCount = document.querySelector('[data-result-count]');
const emptyState = document.querySelector('[data-empty-state]');
const resetSearchButton = document.querySelector('[data-reset-search]');
const copyToast = document.querySelector('[data-copy-toast]');

let activeFilter = 'all';
let toastTimer;

function closeMenu() {
  mainNav?.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
}

function updateSnippets() {
  const query = searchInput?.value.trim().toLocaleLowerCase('nl') || '';
  let visibleCount = 0;

  snippets.forEach((snippet) => {
    const matchesType = activeFilter === 'all' || snippet.dataset.type === activeFilter;
    const searchableText = `${snippet.dataset.searchTerms || ''} ${snippet.textContent}`.toLocaleLowerCase('nl');
    const matchesSearch = !query || searchableText.includes(query);
    const isVisible = matchesType && matchesSearch;

    snippet.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  if (resultCount) {
    resultCount.textContent = `${visibleCount} simpele ${visibleCount === 1 ? 'snippet' : 'snippets'}`;
  }
  if (emptyState) emptyState.hidden = visibleCount !== 0;
}

async function copyCode(button) {
  const target = document.getElementById(button.dataset.copyTarget);
  if (!target) return;

  const code = target.textContent;
  try {
    await navigator.clipboard.writeText(code);
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = code;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.append(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
  }

  const originalText = button.textContent;
  button.textContent = 'Gekopieerd';
  copyToast?.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    button.textContent = originalText;
    copyToast?.classList.remove('is-visible');
  }, 1800);
}

menuButton?.addEventListener('click', () => {
  const willOpen = !mainNav.classList.contains('is-open');
  mainNav.classList.toggle('is-open', willOpen);
  menuButton.setAttribute('aria-expanded', String(willOpen));
});

mainNav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});

document.addEventListener('click', (event) => {
  const copyButton = event.target.closest('[data-copy-target]');
  if (copyButton) copyCode(copyButton);
});

searchInput?.addEventListener('input', updateSnippets);

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });
    updateSnippets();
  });
});

resetSearchButton?.addEventListener('click', () => {
  searchInput.value = '';
  activeFilter = 'all';
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === 'all';
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  updateSnippets();
  searchInput.focus();
});

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput?.focus();
  }
  if (event.key === 'Escape') closeMenu();
});

updateSnippets();
