# Studenten CRUD — JavaScript + SQLite

Deze starter gebruikt browser-JavaScript voor de interface en Node.js + Express voor de API. SQLite bewaart alles in één lokaal bestand.

## Starten

1. Installeer Node.js LTS.
2. Open een terminal in deze map.
3. Voer uit:

```bash
npm install
npm start
```

4. Open `http://localhost:3000`.

De database wordt automatisch gemaakt als `data/app.sqlite`.

## Wat zit erin?

- Volledige CRUD voor studenten en landen.
- Zoeken en filteren.
- SQLite-relatie met een foreign key.
- Backend-validatie en prepared statements.
- Een eenvoudige JSON API en een losse frontend.

## Database resetten

Stop de server, verwijder `data/app.sqlite` en start opnieuw.

