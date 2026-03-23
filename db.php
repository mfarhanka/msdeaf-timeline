<?php

declare(strict_types=1);

const MSDEAF_DB_HOST = '127.0.0.1';
const MSDEAF_DB_PORT = 3306;
const MSDEAF_DB_NAME = 'msdeaf-timeline';
const MSDEAF_DB_USER = 'root';
const MSDEAF_DB_PASSWORD = '';
const MSDEAF_DEFAULT_ADMIN_USERNAME = 'admin';
const MSDEAF_DEFAULT_ADMIN_PASSWORD = 'msdeaf-admin-2026';

function msdeaf_start_session(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function msdeaf_db_identifier(): string
{
    return '`' . str_replace('`', '``', MSDEAF_DB_NAME) . '`';
}

function msdeaf_db_root_pdo(): PDO
{
    $dsn = sprintf('mysql:host=%s;port=%d;charset=utf8mb4', MSDEAF_DB_HOST, MSDEAF_DB_PORT);

    return new PDO($dsn, MSDEAF_DB_USER, MSDEAF_DB_PASSWORD, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

function msdeaf_db_pdo(): PDO
{
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        MSDEAF_DB_HOST,
        MSDEAF_DB_PORT,
        MSDEAF_DB_NAME
    );

    return new PDO($dsn, MSDEAF_DB_USER, MSDEAF_DB_PASSWORD, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

function msdeaf_read_seed_data(): array
{
    $dataPath = __DIR__ . DIRECTORY_SEPARATOR . 'data.json';

    if (!is_file($dataPath)) {
        return [
            'title' => 'Malaysian Deaf Sports History',
            'subtitle' => '',
            'organization' => 'Malaysian Deaf Sports Association (MSDeaf)',
            'events' => [],
        ];
    }

    $raw = file_get_contents($dataPath);
    $parsed = json_decode($raw ?: '[]', true);

    if (!is_array($parsed)) {
        throw new RuntimeException('data.json could not be parsed.');
    }

    return [
        'title' => (string) ($parsed['title'] ?? 'Malaysian Deaf Sports History'),
        'subtitle' => (string) ($parsed['subtitle'] ?? ''),
        'organization' => (string) ($parsed['organization'] ?? 'Malaysian Deaf Sports Association (MSDeaf)'),
        'events' => array_values(array_filter($parsed['events'] ?? [], 'is_array')),
    ];
}

function msdeaf_create_schema(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS site_settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS admin_users (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS timeline_events (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            external_id VARCHAR(100) NOT NULL,
            display_order INT UNSIGNED NOT NULL,
            year_label VARCHAR(50) NOT NULL,
            date_label VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            image_path VARCHAR(255) DEFAULT NULL,
            image_alt VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_external_id (external_id),
            UNIQUE KEY unique_display_order (display_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

function msdeaf_seed_admin_user(PDO $pdo): void
{
    $statement = $pdo->prepare('SELECT id FROM admin_users WHERE username = :username LIMIT 1');
    $statement->execute(['username' => MSDEAF_DEFAULT_ADMIN_USERNAME]);

    if ($statement->fetch()) {
        return;
    }

    $insert = $pdo->prepare('INSERT INTO admin_users (username, password_hash) VALUES (:username, :password_hash)');
    $insert->execute([
        'username' => MSDEAF_DEFAULT_ADMIN_USERNAME,
        'password_hash' => password_hash(MSDEAF_DEFAULT_ADMIN_PASSWORD, PASSWORD_DEFAULT),
    ]);
}

function msdeaf_seed_from_data(PDO $pdo, bool $force = false): void
{
    $seed = msdeaf_read_seed_data();

    if ($force) {
        $pdo->exec('DELETE FROM timeline_events');
        $pdo->exec('DELETE FROM site_settings');
    } else {
        $count = (int) $pdo->query('SELECT COUNT(*) FROM timeline_events')->fetchColumn();
        if ($count > 0) {
            return;
        }
    }

    $settings = $pdo->prepare(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (:setting_key, :setting_value)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );

    $settings->execute(['setting_key' => 'title', 'setting_value' => $seed['title']]);
    $settings->execute(['setting_key' => 'subtitle', 'setting_value' => $seed['subtitle']]);
    $settings->execute(['setting_key' => 'organization', 'setting_value' => $seed['organization']]);

    $insert = $pdo->prepare(
        'INSERT INTO timeline_events (
            external_id,
            display_order,
            year_label,
            date_label,
            title,
            description,
            image_path,
            image_alt
        ) VALUES (
            :external_id,
            :display_order,
            :year_label,
            :date_label,
            :title,
            :description,
            :image_path,
            :image_alt
        )'
    );

    foreach ($seed['events'] as $index => $event) {
        $insert->execute([
            'external_id' => (string) ($event['id'] ?? ('seed-' . ($index + 1))),
            'display_order' => $index + 1,
            'year_label' => (string) ($event['year'] ?? ''),
            'date_label' => (string) ($event['date'] ?? ($event['year'] ?? '')),
            'title' => (string) ($event['title'] ?? ''),
            'description' => (string) ($event['description'] ?? ''),
            'image_path' => isset($event['image']) ? (string) $event['image'] : null,
            'image_alt' => isset($event['imageAlt']) ? (string) $event['imageAlt'] : null,
        ]);
    }
}

function msdeaf_get_settings(PDO $pdo): array
{
    $rows = $pdo->query('SELECT setting_key, setting_value FROM site_settings')->fetchAll();
    $settings = [
        'title' => 'Malaysian Deaf Sports History',
        'subtitle' => '',
        'organization' => 'Malaysian Deaf Sports Association (MSDeaf)',
    ];

    foreach ($rows as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    return $settings;
}

function msdeaf_get_events(PDO $pdo): array
{
    $statement = $pdo->query(
        'SELECT external_id, display_order, year_label, date_label, title, description, image_path, image_alt
         FROM timeline_events
         ORDER BY display_order ASC, id ASC'
    );

    return array_map(
        static function (array $row): array {
            return [
                'id' => $row['external_id'],
                'year' => $row['year_label'],
                'date' => $row['date_label'],
                'title' => $row['title'],
                'description' => $row['description'],
                'image' => $row['image_path'],
                'imageAlt' => $row['image_alt'],
            ];
        },
        $statement->fetchAll()
    );
}

function msdeaf_get_timeline_payload(PDO $pdo): array
{
    $settings = msdeaf_get_settings($pdo);

    return [
        'title' => $settings['title'] ?? 'Malaysian Deaf Sports History',
        'subtitle' => $settings['subtitle'] ?? '',
        'organization' => $settings['organization'] ?? 'Malaysian Deaf Sports Association (MSDeaf)',
        'events' => msdeaf_get_events($pdo),
    ];
}

function msdeaf_require_admin(): void
{
    msdeaf_start_session();

    if (!($_SESSION['msdeaf_admin_authenticated'] ?? false)) {
        msdeaf_json_response(['message' => 'Authentication required.'], 401);
    }
}

function msdeaf_json_input(): array
{
    $raw = file_get_contents('php://input');

    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Invalid JSON payload.');
    }

    return $decoded;
}

function msdeaf_save_timeline(PDO $pdo, array $payload): void
{
    $title = trim((string) ($payload['title'] ?? 'Malaysian Deaf Sports History'));
    $subtitle = trim((string) ($payload['subtitle'] ?? ''));
    $organization = trim((string) ($payload['organization'] ?? 'Malaysian Deaf Sports Association (MSDeaf)'));
    $events = $payload['events'] ?? [];

    if (!is_array($events)) {
        throw new RuntimeException('Events payload must be an array.');
    }

    $pdo->beginTransaction();

    try {
        $settings = $pdo->prepare(
            'INSERT INTO site_settings (setting_key, setting_value) VALUES (:setting_key, :setting_value)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
        );

        $settings->execute(['setting_key' => 'title', 'setting_value' => $title]);
        $settings->execute(['setting_key' => 'subtitle', 'setting_value' => $subtitle]);
        $settings->execute(['setting_key' => 'organization', 'setting_value' => $organization]);

        $pdo->exec('DELETE FROM timeline_events');

        $insert = $pdo->prepare(
            'INSERT INTO timeline_events (
                external_id,
                display_order,
                year_label,
                date_label,
                title,
                description,
                image_path,
                image_alt
            ) VALUES (
                :external_id,
                :display_order,
                :year_label,
                :date_label,
                :title,
                :description,
                :image_path,
                :image_alt
            )'
        );

        foreach (array_values($events) as $index => $event) {
            if (!is_array($event)) {
                continue;
            }

            $year = trim((string) ($event['year'] ?? ''));
            $titleValue = trim((string) ($event['title'] ?? ''));
            $description = trim((string) ($event['description'] ?? ''));

            if ($year === '' || $titleValue === '' || $description === '') {
                throw new RuntimeException('Each event requires year, title, and description.');
            }

            $insert->execute([
                'external_id' => trim((string) ($event['id'] ?? ('event-' . ($index + 1)))) ?: ('event-' . ($index + 1)),
                'display_order' => $index + 1,
                'year_label' => $year,
                'date_label' => trim((string) ($event['date'] ?? $year)) ?: $year,
                'title' => $titleValue,
                'description' => $description,
                'image_path' => trim((string) ($event['image'] ?? '')) ?: null,
                'image_alt' => trim((string) ($event['imageAlt'] ?? $titleValue)) ?: $titleValue,
            ]);
        }

        $pdo->commit();
    } catch (Throwable $exception) {
        $pdo->rollBack();
        throw $exception;
    }
}

function msdeaf_json_response(array $payload, int $statusCode = 200): never
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
