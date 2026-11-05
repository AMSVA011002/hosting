<?php
declare(strict_types=1);

// MySQL 9.2 InnoDB Orders & Customer Analytics Benchmark
$orders = db_query('mysql', 'SELECT o.order_number, c.full_name, c.tier, o.total_amount, o.payment_method, o.order_status FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY o.id DESC');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>MySQL 9.2 InnoDB Benchmark — XPGAMPP</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f141c; color: #f8fafc; padding: 24px; margin: 0; }
    .box { background: #1a2332; border: 1px solid #2e3d52; border-radius: 8px; padding: 18px; }
    h2 { margin-top: 0; color: #f59e0b; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 9px 12px; border-bottom: 1px solid #2a374b; text-align: left; }
    code { color: #fbbf24; }
  </style>
</head>
<body>
  <div class="box">
    <h2>MySQL 9.2.0 Join Query Benchmark (orders ⋈ customers)</h2>
    <table>
      <thead>
        <tr><th>Order #</th><th>Customer</th><th>Tier</th><th>Total ($)</th><th>Payment</th><th>Status</th></tr>
      </thead>
      <tbody>
        <?php foreach ($orders as $o): ?>
        <tr>
          <td><code><?= $o['order_number'] ?></code></td>
          <td><strong><?= $o['full_name'] ?></strong></td>
          <td><?= $o['tier'] ?></td>
          <td>$<?= $o['total_amount'] ?></td>
          <td><?= $o['payment_method'] ?></td>
          <td><?= $o['order_status'] ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</body>
</html>
