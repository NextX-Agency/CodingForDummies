<?php

declare(strict_types=1);

function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return (string) $_SESSION['csrf_token'];
}

function verify_csrf(mixed $token): void
{
    if (!is_string($token) || !hash_equals(csrf_token(), $token)) {
        throw new RuntimeException('De beveiligingscode is verlopen. Vernieuw de pagina en probeer opnieuw.');
    }
}

function flash(string $type, string $message): void
{
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function pull_flash(): ?array
{
    $message = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);

    return is_array($message) ? $message : null;
}

function redirect(string $location): never
{
    header('Location: ' . $location);
    exit;
}

function post_text(string $key): string
{
    return trim((string) ($_POST[$key] ?? ''));
}

function required_text(string $key, string $label, int $maxLength = 120): string
{
    $value = post_text($key);

    if ($value === '') {
        throw new RuntimeException($label . ' is verplicht.');
    }

    $length = function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);

    if ($length > $maxLength) {
        throw new RuntimeException($label . ' mag maximaal ' . $maxLength . ' tekens bevatten.');
    }

    return $value;
}

function positive_id(mixed $value, string $label = 'ID'): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

    if ($id === false) {
        throw new RuntimeException($label . ' is ongeldig.');
    }

    return (int) $id;
}

function query_page(string $name = 'p'): int
{
    $page = filter_input(INPUT_GET, $name, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    return $page === false || $page === null ? 1 : (int) $page;
}

function student_input(PDO $db): array
{
    $student = [
        'studentnummer' => strtoupper(required_text('studentnummer', 'Studentnummer', 30)),
        'voornaam' => required_text('voornaam', 'Voornaam', 80),
        'achternaam' => required_text('achternaam', 'Achternaam', 100),
        'email' => strtolower(required_text('email', 'E-mailadres', 160)),
        'opleiding' => required_text('opleiding', 'Opleiding', 120),
        'land_id' => positive_id($_POST['land_id'] ?? null, 'Land'),
        'status' => post_text('status'),
    ];

    if (!filter_var($student['email'], FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('Vul een geldig e-mailadres in.');
    }

    if (!in_array($student['status'], ['actief', 'inactief', 'afgestudeerd'], true)) {
        throw new RuntimeException('Kies een geldige status.');
    }

    $countryExists = $db->prepare('SELECT COUNT(*) FROM landen WHERE id = ?');
    $countryExists->execute([$student['land_id']]);

    if ((int) $countryExists->fetchColumn() === 0) {
        throw new RuntimeException('Het gekozen land bestaat niet.');
    }

    return $student;
}

function country_input(): array
{
    $country = [
        'naam' => required_text('naam', 'Landnaam', 100),
        'code' => strtoupper(required_text('code', 'Landcode', 2)),
        'regio' => required_text('regio', 'Regio', 80),
    ];

    if (!preg_match('/^[A-Z]{2}$/', $country['code'])) {
        throw new RuntimeException('De landcode moet uit precies twee letters bestaan, bijvoorbeeld SR.');
    }

    return $country;
}

function unique_error_message(PDOException $exception, string $resource): string
{
    if (str_contains(strtolower($exception->getMessage()), 'unique')) {
        return $resource === 'student'
            ? 'Dit studentnummer of e-mailadres bestaat al.'
            : 'Deze landcode bestaat al.';
    }

    return 'Opslaan is niet gelukt. Technische melding: ' . $exception->getMessage();
}
