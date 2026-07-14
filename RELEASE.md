# Releasehandleiding

Deze checklist maakt van de huidige branch een controleerbare releasekandidaat voor `codingfordommies.quest`.

## 1. Schone installatie en volledige controle

```bash
npm ci
npm run release:check
```

`release:check` controleert de builder, relaties, PHP-syntax, links, metadata, toegankelijkheidsbasis, beveiligingsheaders, downloads, productiebuild en bekende npm-kwetsbaarheden.

## 2. Optionele MySQL-runtimecontrole

Start MySQL in XAMPP en voer uit:

```bash
npm run test:mysql
```

Afwijkende lokale gegevens kunnen via `CFD_MYSQL_HOST`, `CFD_MYSQL_PORT`, `CFD_MYSQL_USER` en `CFD_MYSQL_PASSWORD` worden ingesteld. De test gebruikt een tijdelijke database en verwijdert die altijd.

## 3. Publicatiecontrole

- Controleer dat de productiebranch alleen bedoelde wijzigingen bevat.
- Publiceer de Vite-outputmap `dist` via Vercel.
- Controleer na publicatie `/`, `/?lang=en`, `/404.html`, `/robots.txt`, `/sitemap.xml` en de drie ZIP-downloads.
- Controleer dat `https://www.codingfordommies.quest/og.png` publiek bereikbaar is.
- Controleer responseheaders op CSP, HSTS, `nosniff` en `frame-ancestors 'none'`.
- Voer één laatste CRUD-test uit met uitsluitend tijdelijke gegevens.

## 4. Terugdraaien

Bewaar de vorige geslaagde Vercel-deployment. Als een publieke controle faalt, zet die deployment terug en herstel de fout in een nieuwe release in plaats van rechtstreeks in productie te experimenteren.
