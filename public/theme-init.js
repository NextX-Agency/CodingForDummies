(() => {
  let savedTheme = null;

  try {
    savedTheme = window.localStorage.getItem('cfd-theme');
  } catch {
    // Browseropslag kan door privacy-instellingen uitgeschakeld zijn.
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = savedTheme === 'dark' || savedTheme === 'light'
    ? savedTheme
    : (prefersDark ? 'dark' : 'light');
})();
