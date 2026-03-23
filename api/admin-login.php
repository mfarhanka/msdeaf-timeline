<?php

declare(strict_types=1);

require dirname(__DIR__) . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    msdeaf_json_response(['message' => 'Method not allowed.'], 405);
}

try {
    $payload = msdeaf_json_input();
    $username = trim((string) ($payload['username'] ?? MSDEAF_DEFAULT_ADMIN_USERNAME));
    $password = (string) ($payload['password'] ?? '');

    if ($password === '') {
        msdeaf_json_response(['message' => 'Password is required.'], 422);
    }

    $pdo = msdeaf_db_pdo();
    $statement = $pdo->prepare('SELECT username, password_hash FROM admin_users WHERE username = :username LIMIT 1');
    $statement->execute(['username' => $username]);
    $user = $statement->fetch();

    if (!$user || !password_verify($password, (string) $user['password_hash'])) {
        msdeaf_json_response(['message' => 'Invalid username or password.'], 401);
    }

    msdeaf_start_session();
    $_SESSION['msdeaf_admin_authenticated'] = true;
    $_SESSION['msdeaf_admin_username'] = $user['username'];

    msdeaf_json_response([
        'authenticated' => true,
        'username' => $user['username'],
        'message' => 'Admin session started.',
    ]);
} catch (Throwable $exception) {
    msdeaf_json_response(['message' => $exception->getMessage()], 500);
}
