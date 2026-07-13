<?php

declare(strict_types=1);

/**
 * Maakt lokaal verbinding met MySQL uit XAMPP.
 * De standaard XAMPP-gebruiker is root met een leeg wachtwoord.
 */
function database(): PDO
{
    static $connection = null;

    if ($connection instanceof PDO) {
        return $connection;
    }

    $host = '127.0.0.1';
    $port = 3306;
    $databaseName = 'studenten_crud';
    $username = 'root';
    $password = '';
    $schemaFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'schema.sql';

    if (!is_file($schemaFile)) {
        throw new RuntimeException('database/schema.sql ontbreekt.');
    }

    try {
        $connection = new PDO(
            "mysql:host={$host};port={$port};charset=utf8mb4",
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );

        $connection->exec(
            "CREATE DATABASE IF NOT EXISTS `{$databaseName}`
             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );
        $connection->exec("USE `{$databaseName}`");
        $connection->exec((string) file_get_contents($schemaFile));
    } catch (PDOException $exception) {
        throw new RuntimeException(
            'MySQL kon niet starten. Controleer of MySQL in XAMPP groen is en of de inloggegevens kloppen. '
            . 'Technische melding: ' . $exception->getMessage()
        );
    }

    return $connection;
}

