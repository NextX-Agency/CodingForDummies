# Studenten CRUD — PHP + MySQL (XAMPP)

Deze variant gebruikt dezelfde eenvoudige PHP-interface als de SQLite-starter, maar bewaart gegevens in MySQL uit XAMPP.

## Starten

1. Plaats `php-mysql-crud` in `C:\xampp\htdocs\`.
2. Start **Apache én MySQL** in het XAMPP Control Panel.
3. Open `http://localhost/php-mysql-crud/`.

De app maakt automatisch de database `studenten_crud`, de tabellen en de voorbeeldlanden. Bij een standaard XAMPP-installatie gebruikt MySQL lokaal gebruiker `root` met een leeg wachtwoord.

Heb jij een wachtwoord ingesteld? Pas dan bovenaan `config/database.php` de variabelen `$username` en `$password` aan.

## phpMyAdmin

Open `http://localhost/phpmyadmin/` om de database en rijen te bekijken. Je hoeft daar niets handmatig te importeren; `schema.sql` wordt door PHP uitgevoerd.

## Database resetten

Verwijder in phpMyAdmin de database `studenten_crud` en laad de app opnieuw.

## Wat zit erin?

- Studenten en landen: create, read, update en delete.
- Zoeken, filteren, sorteren en paginering.
- Foreign key-relatie tussen studenten en landen.
- Prepared statements, servervalidatie, escaping en CSRF-beveiliging.

