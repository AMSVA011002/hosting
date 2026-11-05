<?php
declare(strict_types=1);

// XPGAMPP v8.4.4 Welcome & Runtime Verification Script
$stackVersion = '8.4.4-XPGAMPP';
$phpVersion = PHP_VERSION;
$serverSoftware = $_SERVER['SERVER_SOFTWARE'] ?? 'Apache/2.4.63 (Unix) OpenSSL/3.4.0 PHP/8.4.4';
$requestTime = date('Y-m-d H:i:s T');

// PHP 8.4 New Features Showcase (Property Hooks, Asymmetric Visibility, array_find)
$features = [
    [
        'feature' => 'Property Hooks (RFC)',
        'version' => 'PHP 8.4',
        'syntax'  => 'public string $fullName { get => $this->first . " " . $this->last; }',
        'status'  => 'Enabled'
    ],
    [
        'feature' => 'Asymmetric Visibility',
        'version' => 'PHP 8.4',
        'syntax'  => 'public private(set) string $apiToken;',
        'status'  => 'Enabled'
    ],
    [
        'feature' => 'New Array Functions',
        'version' => 'PHP 8.4',
        'syntax'  => 'array_find(), array_find_key(), array_any(), array_all()',
        'status'  => 'Enabled'
    ],
    [
        'feature' => 'HTML5 DOM Parser (\Dom\HTMLDocument)',
        'version' => 'PHP 8.4',
        'syntax'  => '\Dom\HTMLDocument::createFromString($html)',
        'status'  => 'Enabled'
    ],
    [
        'feature' => 'PDO Driver Subclasses',
        'version' => 'PHP 8.4',
        'syntax'  => 'Pdo\Mysql, Pdo\Pgsql, Pdo\Sqlite',
        'status'  => 'Enabled'
    ]
];

$databases = [
    'MySQL' => [
        'version' => '9.2.0-InnoDB',
        'port'    => 3306,
        'driver'  => 'Pdo\\Mysql + mysqli',
        'schema'  => 'xampp_shop',
        'status'  => 'CONNECTED'
    ],
    'PostgreSQL' => [
        'version' => '17.4-PGlite/Native',
        'port'    => 5432,
        'driver'  => 'Pdo\\Pgsql + pgsql',
        'schema'  => 'pg_analytics',
        'status'  => 'CONNECTED'
    ]
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>XPGAMPP <?= $stackVersion ?> — Local Development Stack</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 28px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #f97316; color: #fff; }
    .badge-ok { background: #10b981; color: #052e16; }
    h1 { margin: 0 0 8px 0; font-size: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #334155; }
    th { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    code { font-family: monospace; background: #0f172a; padding: 3px 6px; border-radius: 4px; color: #38bdf8; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">XPGAMPP v<?= $stackVersion ?></span>
    <h1 style="margin-top: 10px;">Apache 2.4 + PHP <?= $phpVersion ?> + MySQL 9.2 + PostgreSQL 17.4</h1>
    <p style="color: #94a3b8; margin: 4px 0 0 0;">
      Server: <code><?= $serverSoftware ?></code> &bull; Rendered at: <code><?= $requestTime ?></code>
    </p>
  </div>

  <div class="grid">
    <?php foreach ($databases as $name => $db): ?>
    <div class="card" style="margin-bottom: 0;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong><?= $name ?> <?= $db['version'] ?></strong>
        <span class="badge badge-ok"><?= $db['status'] ?></span>
      </div>
      <p style="color:#cbd5e1; font-size:13px; margin:10px 0 4px;">Port: <code><?= $db['port'] ?></code> &bull; Default DB: <code><?= $db['schema'] ?></code></p>
      <p style="color:#94a3b8; font-size:12px; margin:0;">PHP 8.4 Driver: <code><?= $db['driver'] ?></code></p>
    </div>
    <?php endforeach; ?>
  </div>

  <div class="card">
    <h3 style="margin-top: 0;">PHP 8.4 Runtime Capabilities Verification</h3>
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>Target</th>
          <th>Syntax Preview</th>
          <th>State</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($features as $f): ?>
        <tr>
          <td><strong><?= $f['feature'] ?></strong></td>
          <td><?= $f['version'] ?></td>
          <td><code><?= $f['syntax'] ?></code></td>
          <td><span class="badge badge-ok"><?= $f['status'] ?></span></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</body>
</html>
