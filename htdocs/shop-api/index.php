<?php
declare(strict_types=1);

// Shop Inventory & Cross-DB Bridge (MySQL 9.2 + PostgreSQL 17.4)
$mysqlProducts = db_query('mysql', 'SELECT id, sku, name, category, price, stock, status FROM products ORDER BY id ASC');
$pgTelemetry   = db_query('postgres', 'SELECT service_name, engine_version, avg_latency_ms, active_connections FROM service_telemetry ORDER BY id ASC');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Shop API & Dual-DB Explorer (MySQL 9.2 + PG 17)</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #090d16; color: #e2e8f0; padding: 24px; margin: 0; }
    .section { background: #131c2e; border: 1px solid #263554; border-radius: 8px; padding: 18px; margin-bottom: 18px; }
    h2 { margin: 0 0 12px 0; font-size: 18px; color: #38bdf8; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 9px 12px; border-bottom: 1px solid #1e293b; text-align: left; }
    th { color: #94a3b8; text-transform: uppercase; font-size: 11px; }
    .pill { background: #0284c7; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="section">
    <h2>MySQL 9.2 (xampp_shop.products) — Live Query Results</h2>
    <table>
      <thead>
        <tr><th>ID</th><th>SKU</th><th>Product Name</th><th>Category</th><th>Price ($)</th><th>Stock</th><th>Status</th></tr>
      </thead>
      <tbody>
        <?php foreach ($mysqlProducts as $row): ?>
        <tr>
          <td>#<?= $row['id'] ?></td>
          <td><code><?= $row['sku'] ?></code></td>
          <td><strong><?= $row['name'] ?></strong></td>
          <td><?= $row['category'] ?></td>
          <td>$<?= $row['price'] ?></td>
          <td><?= $row['stock'] ?> units</td>
          <td><span class="pill"><?= $row['status'] ?></span></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>PostgreSQL 17.4 (pg_analytics.service_telemetry) — Live Query Results</h2>
    <table>
      <thead>
        <tr><th>Service</th><th>Engine Version</th><th>Avg Latency (ms)</th><th>Active Connections</th></tr>
      </thead>
      <tbody>
        <?php foreach ($pgTelemetry as $row): ?>
        <tr>
          <td><strong><?= $row['service_name'] ?></strong></td>
          <td><code><?= $row['engine_version'] ?></code></td>
          <td><?= $row['avg_latency_ms'] ?> ms</td>
          <td><?= $row['active_connections'] ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</body>
</html>
