<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

$messages = [];
$success = false;

try {
    $rootPdo = msdeaf_db_root_pdo();
    $rootPdo->exec('CREATE DATABASE IF NOT EXISTS ' . msdeaf_db_identifier() . ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $messages[] = 'Database `' . MSDEAF_DB_NAME . '` is ready.';

    $pdo = msdeaf_db_pdo();
    msdeaf_create_schema($pdo);
    $messages[] = 'Tables `site_settings`, `timeline_events`, and `admin_users` are ready.';

    msdeaf_seed_admin_user($pdo);
    $messages[] = 'Default admin account is ready.';

    msdeaf_seed_from_data($pdo, isset($_GET['reset']) && $_GET['reset'] === '1');
    $messages[] = isset($_GET['reset']) && $_GET['reset'] === '1'
        ? 'Timeline data was reset from data.json.'
        : 'Timeline data was seeded from data.json when needed.';

    $success = true;
} catch (Throwable $exception) {
    $messages[] = 'Setup failed: ' . $exception->getMessage();
}
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MSDeaf Timeline Database Setup</title>
  <style>
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      background: #0d1b2a;
      color: #e0e6f0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 2rem;
    }

    .setup-card {
      width: min(760px, 100%);
      background: #142333;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
    }

    h1 {
      margin: 0 0 0.75rem;
      color: #fff;
    }

    p, li {
      color: #9ab4d4;
      line-height: 1.65;
    }

    .status {
      color: <?php echo $success ? '#9be7b1' : '#ff9b9b'; ?>;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .hint {
      margin-top: 1.5rem;
      padding: 1rem;
      border-radius: 14px;
      background: rgba(13, 27, 42, 0.95);
    }

    code {
      color: #ffd27d;
    }

    a {
      color: #8fc7ff;
    }
  </style>
</head>
<body>
  <section class="setup-card">
    <p class="status"><?php echo $success ? 'Setup completed.' : 'Setup did not complete.'; ?></p>
    <h1>MSDeaf Timeline MySQL Setup</h1>
    <ul>
      <?php foreach ($messages as $message): ?>
        <li><?php echo htmlspecialchars($message, ENT_QUOTES, 'UTF-8'); ?></li>
      <?php endforeach; ?>
    </ul>

    <div class="hint">
      <p>Database name: <code><?php echo htmlspecialchars(MSDEAF_DB_NAME, ENT_QUOTES, 'UTF-8'); ?></code></p>
      <p>Default admin username: <code><?php echo htmlspecialchars(MSDEAF_DEFAULT_ADMIN_USERNAME, ENT_QUOTES, 'UTF-8'); ?></code></p>
      <p>Default admin password: <code><?php echo htmlspecialchars(MSDEAF_DEFAULT_ADMIN_PASSWORD, ENT_QUOTES, 'UTF-8'); ?></code></p>
      <p>Open <a href="index.html">index.html</a> after setup. Add <code>?reset=1</code> to this page if you want to force reseeding from <code>data.json</code>.</p>
    </div>
  </section>
</body>
</html>
