# CodingForDommies

Een beginner-first website met kleine HTML-, CSS- en JavaScript-snippets. De hoofdpagina laat alleen zien wat iemand nodig heeft om een eenvoudige website te bouwen. PHP, databases, CRUD, accounts en bookingvoorbeelden staan apart op `advanced.html`.

## Wat staat waar?

```text
index.html                           eenvoudige snippetwebsite
styles.css                          vormgeving van de eenvoudige website
script.js                           zoeken, filters, kopiëren en mobiel menu
advanced.html                       uitgebreide CRUD- en databasegids
advanced.css / advanced.js          bestanden van de uitgebreide gids
public/templates/beginner-site/     complete beginnerstemplate
starter/                            complete PHP- en JavaScript-CRUD-projecten
tests/                              automatische controles
```

## Lokaal starten

```bash
npm install
npm run dev
```

Open de URL die Vite toont, meestal `http://localhost:5173`.

## Controleren en bouwen

```bash
npm test
npm run build
npm run test:dist
```

De productieversie komt in `dist/`. Vite bouwt zowel `index.html` als `advanced.html`.

## Beginnerstemplate

De map `public/templates/beginner-site/` bevat vier bewust korte bestanden:

- `index.html` — navigatie, hero, kaarten, contact en footer;
- `style.css` — basisvormgeving en één mobiele breakpoint;
- `script.js` — alleen het mobiele menu;
- `README.md` — drie stappen om te beginnen.

De website biedt dezelfde map aan als `public/downloads/beginner-website-template.zip`.

## Publiceren

Gebruik op Vercel build command `npm run build` en output directory `dist`.
