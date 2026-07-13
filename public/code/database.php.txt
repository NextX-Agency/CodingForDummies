<?php

declare(strict_types=1);

/**
 * Geeft steeds dezelfde PDO-verbinding terug en maakt de database automatisch.
 */
function database(): PDO
{
    static $connection = null;

    if ($connection instanceof PDO) {
        return $connection;
    }

    $projectRoot = dirname(__DIR__);
    $dataDirectory = $projectRoot . DIRECTORY_SEPARATOR . 'data';
    $databaseFile = $dataDirectory . DIRECTORY_SEPARATOR . 'app.sqlite';
    $schemaFile = $projectRoot . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'schema.sql';

    if (!is_dir($dataDirectory) && !mkdir($dataDirectory, 0775, true) && !is_dir($dataDirectory)) {
        throw new RuntimeException('De map data/ kon niet worden gemaakt. Controleer de schrijfrechten.');
    }

    if (!is_file($schemaFile)) {
        throw new RuntimeException('database/schema.sql ontbreekt.');
    }

    try {
        $connection = new PDO('sqlite:' . $databaseFile, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        $connection->exec('PRAGMA foreign_keys = ON');
        $connection->exec('PRAGMA busy_timeout = 5000');
        $connection->exec((string) file_get_contents($schemaFile));
    } catch (PDOException $exception) {
        throw new RuntimeException(
            'SQLite kon niet starten. Controleer of pdo_sqlite aanstaat in php.ini. Technische melding: '
            . $exception->getMessage()
        );
    }

    return $connection;
}

