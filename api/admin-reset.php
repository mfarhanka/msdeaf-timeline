<?php

declare(strict_types=1);

require dirname(__DIR__) . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    msdeaf_json_response(['message' => 'Method not allowed.'], 405);
}

try {
    msdeaf_require_admin();
    $pdo = msdeaf_db_pdo();
    msdeaf_seed_from_data($pdo, true);

    msdeaf_json_response([
        'message' => 'Timeline reset from data.json.',
        'timeline' => msdeaf_get_timeline_payload($pdo),
    ]);
} catch (Throwable $exception) {
    msdeaf_json_response(['message' => $exception->getMessage()], 500);
}
