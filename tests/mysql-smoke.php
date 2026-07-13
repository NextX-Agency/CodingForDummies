<?php

declare(strict_types=1);

$databaseName = 'cfd_test_' . bin2hex(random_bytes(4));
$connection = new PDO(
    'mysql:host=127.0.0.1;port=3306;charset=utf8mb4',
    'root',
    '',
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
);

try {
    $connection->exec("CREATE DATABASE `{$databaseName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $connection->exec("USE `{$databaseName}`");
    $schema = file_get_contents(__DIR__ . '/../starter/php-mysql-crud/database/schema.sql');
    $connection->exec((string) $schema);

    $countryId = (int) $connection->query("SELECT id FROM landen WHERE code = 'SR'")->fetchColumn();
    $insert = $connection->prepare(
        'INSERT INTO studenten
            (studentnummer, voornaam, achternaam, email, opleiding, land_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $insert->execute(['MYSQL-TEST-001', 'Ada', 'Lovelace', 'mysql-test@example.com', 'Software Developer', $countryId, 'actief']);
    $studentId = (int) $connection->lastInsertId();

    $update = $connection->prepare('UPDATE studenten SET achternaam = ?, status = ? WHERE id = ?');
    $update->execute(['Byron', 'afgestudeerd', $studentId]);

    $student = $connection->prepare('SELECT * FROM studenten WHERE id = ?');
    $student->execute([$studentId]);
    $row = $student->fetch();

    if (!$row || $row['achternaam'] !== 'Byron' || $row['status'] !== 'afgestudeerd') {
        throw new RuntimeException('MySQL create/read/update controle is mislukt.');
    }

    $countries = $connection->query(
        'SELECT landen.*, COUNT(studenten.id) AS student_count
         FROM landen
         LEFT JOIN studenten ON studenten.land_id = landen.id
         GROUP BY landen.id, landen.naam, landen.code, landen.regio, landen.created_at, landen.updated_at
         ORDER BY landen.naam ASC'
    )->fetchAll();

    if (count($countries) < 5) {
        throw new RuntimeException('MySQL landenoverzicht is mislukt.');
    }

    $delete = $connection->prepare('DELETE FROM studenten WHERE id = ?');
    $delete->execute([$studentId]);

    if ($delete->rowCount() !== 1) {
        throw new RuntimeException('MySQL delete controle is mislukt.');
    }

    echo "PHP MySQL schema + CRUD: PASS\n";
} finally {
    $connection->exec('USE information_schema');
    $connection->exec("DROP DATABASE IF EXISTS `{$databaseName}`");
}
