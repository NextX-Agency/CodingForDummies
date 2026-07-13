document.querySelectorAll('[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (!window.confirm(form.dataset.confirm)) {
      event.preventDefault();
    }
  });
});

const navigationButton = document.querySelector('[data-nav-toggle]');
const navigation = document.querySelector('[data-navigation]');

navigationButton?.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('is-open');
  navigationButton.setAttribute('aria-expanded', String(isOpen));
});

