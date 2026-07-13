# Studenten CRUD — PHP + SQLite

Dit is het complete voorbeeldproject van CodingForDommies.

## Starten met XAMPP

1. Plaats de map `studenten-crud` in `C:\xampp\htdocs\`.
2. Start **Apache** in het XAMPP Control Panel.
3. Open `http://localhost/studenten-crud/`.

De SQLite-database wordt automatisch gemaakt in `data/app.sqlite`.

## Fout: could not find driver

Open in XAMPP het actieve `php.ini`-bestand en controleer dat deze regels geen puntkomma vooraan hebben:

```ini
extension=pdo_sqlite
extension=sqlite3
```

Sla op en herstart Apache.

## Database resetten

Stop Apache, verwijder `data/app.sqlite` en start Apache opnieuw. De tabellen en voorbeeldlanden worden opnieuw aangemaakt.

## Wat zit erin?

- Studenten: toevoegen, bekijken, wijzigen en verwijderen.
- Landenregister: toevoegen, bekijken, wijzigen en veilig verwijderen.
- Zoeken, filteren, sorteren en paginering.
- Dashboardcijfers en een SQLite-relatie tussen studenten en landen.
- Prepared statements, servervalidatie, escaping en CSRF-beveiliging.
