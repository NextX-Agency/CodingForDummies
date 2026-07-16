// Zoek de menuknop en het menu in de HTML.
const menuKnop = document.querySelector('.menu-knop');
const menu = document.querySelector('.menu');

// Open of sluit het menu na een klik.
menuKnop.addEventListener('click', () => {
  const isOpen = menu.classList.toggle('is-open');
  menuKnop.setAttribute('aria-expanded', String(isOpen));
});

// Sluit het menu nadat een link is gekozen.
menu.addEventListener('click', () => {
  menu.classList.remove('is-open');
  menuKnop.setAttribute('aria-expanded', 'false');
});
