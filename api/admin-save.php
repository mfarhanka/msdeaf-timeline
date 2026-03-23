<?php

declare(strict_types=1);

require dirname(__DIR__) . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    msdeaf_json_response(['message' => 'Method not allowed.'], 405);
}

try {
    msdeaf_require_admin();
    $payload = msdeaf_json_input();
    $pdo = msdeaf_db_pdo();
    msdeaf_save_timeline($pdo, $payload);

    msdeaf_json_response([
        'message' => 'Timeline saved successfully.',
        'timeline' => msdeaf_get_timeline_payload($pdo),
    ]);
} catch (Throwable $exception) {
    $statusCode = $exception instanceof RuntimeException ? 422 : 500;
    msdeaf_json_response(['message' => $exception->getMessage()], $statusCode);
}
