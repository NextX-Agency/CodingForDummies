# CodingForDommies

Een Nederlands/Engelse, beginnersvriendelijke gids voor het bouwen van een complete CRUD-webapplicatie. De statische Vite-site is ingericht voor `https://www.codingfordommies.quest/` en kan rechtstreeks op Vercel worden gepubliceerd.

## Drie leerroutes

- **PHP + SQLite** — eenvoudigste route voor XAMPP; geen databaseserver nodig.
- **PHP + MySQL** — gebruikt Apache, MySQL en eventueel phpMyAdmin uit XAMPP.
- **JavaScript + SQLite** — browser-JavaScript, Node.js, Express en `better-sqlite3`.

Iedere route heeft een downloadbare studentenadministratie met een gekoppeld landenregister. De starters bevatten CRUD, zoeken, filters, validatie en veilige databasevragen.

De gids bevat daarnaast een frontendwerkbank die HTML, CSS en functionaliteit bestand voor bestand koppelt. De interactieve CRUD-builder laat Create, Read, Update en Delete afzonderlijk kiezen, gebruikt gevalideerde PHP-datatypes zoals `int`, `float`, `bool` en `string`, en opent direct met één complete testbare PHP- of JavaScript-app. Daarna zijn losse SQL-, HTML-, CSS-, backend- en browserbestanden beschikbaar om te kopiëren of downloaden.

De snippetbibliotheek is ingericht als complete applicatieroute: vijf universele appkernbestanden, een tien-stappen integratiepad en zeventien volledige recepten voor onder meer relaties, login, gebruikersbeheer, rollen, uploads, CSV, soft delete, transacties, zoeken, paginering, bulkacties en auditlogging. Het afzonderlijke booking-domeinpakket voegt 48 doorzoekbare recepten toe voor SQLite/MySQL, CRUD, beschikbaarheid, medewerkers, resources, capaciteit, beveiliging, API/CSV/iCal en adapters voor afspraken, hotels, verhuur, restaurants en evenementen. Dezelfde appkern en builder blijven bruikbaar voor iedere andere CRUD-resource. De interface ondersteunt Nederlands, English, light mode en dark mode.

Het hoofdstuk **CRUD-relaties** maakt de koppeling tussen `landen.id` en `studenten.land_id` zichtbaar. Een interactieve oefening demonstreert Create, een JOIN bij Read, het wijzigen van een foreign key en `ON DELETE RESTRICT`. Bij het hoofdstuk staan op elkaar afgestemde HTML/PHP- en PHP/SQL-templates plus een download van het complete relatieproject.

## Gids lokaal starten

```bash
npm install
npm run dev
```

Open de URL die Vite toont, normaal `http://localhost:5173`.

## Productiebuild

```bash
npm run build
npm run preview
```

De uiteindelijke statische site komt in `dist/`.

## Releasecontrole

```bash
npm run release:check
```

Deze opdracht voert de functionele builder- en relatietests uit, controleert release-metadata, lokale links, toegankelijkheidsbasis, beveiligingsheaders en downloads, maakt de productiebuild en stopt bij bekende npm-kwetsbaarheden. Zie [RELEASE.md](RELEASE.md) voor de publicatie- en terugdraaichecklist.

De publieke configuratie bevat een strikte Content Security Policy, HSTS, framingbescherming, een eigen 404-pagina, webmanifest, sitemap en Open Graph/social-preview. De hero gebruikt een geoptimaliseerde WebP-versie; het bronbestand blijft beschikbaar voor toekomstig ontwerpwerk.

## Publiceren op Vercel

1. Push deze projectmap naar een GitHub-repository.
2. Importeer de repository in Vercel.
3. Gebruik build command `npm run build` en output directory `dist`.

De gids gaat naar Vercel. De PHP-starters draai je lokaal onder XAMPP; de JavaScript-starter draait lokaal met `npm start`.

## Belangrijke mappen

```text
assets/                         ontwerpasset van de gids
public/code/                    bronbestanden voor de interactieve codebank
public/downloads/               ZIP-bestanden die Vercel publiceert
starter/studenten-crud/         PHP + SQLite
starter/php-mysql-crud/         PHP + MySQL
starter/javascript-sqlite-crud/ JavaScript + SQLite
tests/mysql-smoke.php           tijdelijke MySQL CRUD-controle
```
