<?php

declare(strict_types=1);

require dirname(__DIR__) . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    msdeaf_json_response(['message' => 'Method not allowed.'], 405);
}

msdeaf_start_session();
$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}

session_destroy();

msdeaf_json_response([
    'authenticated' => false,
    'message' => 'Admin session ended.',
]);
