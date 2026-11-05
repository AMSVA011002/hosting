<?php
declare(strict_types=1);

// PostgreSQL 17.4 JSONB & Extension Inspector
$extensions = db_query('postgres', 'SELECT extname, extversion, installed, description FROM pg_extensions_registry ORDER BY id ASC');
$auditLogs  = db_query('postgres', 'SELECT endpoint, http_method, status_code, duration_ms, client_ip FROM api_audit_logs ORDER BY id DESC LIMIT 10');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>PostgreSQL 17.4 Explorer — XPGAMPP</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b1320; color: #f1f5f9; padding: 24px; margin: 0; }
    .panel { background: #162238; border: 1px solid #2b3f66; border-radius: 8px; padding: 18px; margin-bottom: 18px; }
    h2 { margin-top: 0; color: #60a5fa; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 8px 10px; border-bottom: 1px solid #233554; text-align: left; }
    code { color: #93c5fd; background: #0f172a; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="panel">
    <h2>PostgreSQL 17.4 Installed Extensions Registry</h2>
    <table>
      <thead>
        <tr><th>Extension</th><th>Version</th><th>Status</th><th>Description</th></tr>
      </thead>
      <tbody>
        <?php foreach ($extensions as $ext): ?>
        <tr>
          <td><code><?= $ext['extname'] ?></code></td>
          <td><?= $ext['extversion'] ?></td>
          <td><?= $ext['installed'] ? 'INSTALLED' : 'AVAILABLE' ?></td>
          <td><?= $ext['description'] ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <div class="panel">
    <h2>PostgreSQL 17.4 API Audit Stream (JSONB Backed)</h2>
    <table>
      <thead>
        <tr><th>Method</th><th>Endpoint</th><th>HTTP Status</th><th>Duration</th><th>Client IP</th></tr>
      </thead>
      <tbody>
        <?php foreach ($auditLogs as $log): ?>
        <tr>
          <td><code><?= $log['http_method'] ?></code></td>
          <td><strong><?= $log['endpoint'] ?></strong></td>
          <td><?= $log['status_code'] ?></td>
          <td><?= $log['duration_ms'] ?> ms</td>
          <td><?= $log['client_ip'] ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</body>
</html>
