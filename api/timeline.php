<?php

declare(strict_types=1);

require dirname(__DIR__) . '/db.php';

try {
    $pdo = msdeaf_db_pdo();
    msdeaf_json_response(msdeaf_get_timeline_payload($pdo));
} catch (Throwable $exception) {
    msdeaf_json_response(['message' => $exception->getMessage()], 500);
}
