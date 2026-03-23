<?php

declare(strict_types=1);

require dirname(__DIR__) . '/db.php';

msdeaf_start_session();

msdeaf_json_response([
    'authenticated' => (bool) ($_SESSION['msdeaf_admin_authenticated'] ?? false),
    'username' => $_SESSION['msdeaf_admin_username'] ?? null,
]);
