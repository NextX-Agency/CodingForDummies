# CodingForDummies

Een Nederlandstalige, beginnersvriendelijke gids voor het bouwen van een complete CRUD-webapplicatie. De gids zelf is een statische Vite-site die op Vercel kan worden gepubliceerd.

## Drie leerroutes

- **PHP + SQLite** — eenvoudigste route voor XAMPP; geen databaseserver nodig.
- **PHP + MySQL** — gebruikt Apache, MySQL en eventueel phpMyAdmin uit XAMPP.
- **JavaScript + SQLite** — browser-JavaScript, Node.js, Express en `better-sqlite3`.

Iedere route heeft een downloadbare studentenadministratie met een gekoppeld landenregister. De starters bevatten CRUD, zoeken, filters, validatie en veilige databasevragen.

De gids bevat daarnaast een frontendwerkbank die HTML, CSS en functionaliteit bestand voor bestand koppelt. De interactieve CRUD-builder genereert voor eigen resources niet alleen SQL en backendcode, maar ook bijpassende HTML, mobiele CSS, browser-JavaScript en een exact plakplan. De snippetbibliotheek behandelt onder andere veldtypes, relaties, detailpagina's, login, uploads, CSV-export, soft delete en transacties. Daarmee is de gids gericht op vrijwel iedere normale administratieve CRUD-app. Betalingen, realtime chat en vergelijkbare specialistische systemen vallen bewust buiten de scope.

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
