import { PGlite } from '@electric-sql/pglite';
import initSqlJs from 'sql.js';

let pgDb = null;
let mysqlDb = null;
let SQL = null;

export async function initDatabases() {
  // 1. Initialize PostgreSQL 17.4 Engine (PGlite)
  pgDb = new PGlite();
  await pgDb.exec(`
    CREATE TABLE IF NOT EXISTS service_telemetry (
      id SERIAL PRIMARY KEY,
      service_name VARCHAR(64) NOT NULL,
      engine_version VARCHAR(32) NOT NULL,
      avg_latency_ms NUMERIC(8,2) NOT NULL,
      memory_mb INTEGER NOT NULL,
      active_connections INTEGER NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS api_audit_logs (
      id SERIAL PRIMARY KEY,
      endpoint VARCHAR(128) NOT NULL,
      http_method VARCHAR(12) NOT NULL,
      status_code INTEGER NOT NULL,
      duration_ms NUMERIC(8,2) NOT NULL,
      client_ip VARCHAR(45) NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pg_extensions_registry (
      id SERIAL PRIMARY KEY,
      extname VARCHAR(64) NOT NULL UNIQUE,
      extversion VARCHAR(24) NOT NULL,
      installed BOOLEAN NOT NULL DEFAULT TRUE,
      description TEXT NOT NULL
    );
  `);

  const pgCount = await pgDb.query('SELECT COUNT(*)::int AS cnt FROM service_telemetry');
  if (pgCount.rows[0].cnt === 0) {
    await pgDb.exec(`
      INSERT INTO service_telemetry (service_name, engine_version, avg_latency_ms, memory_mb, active_connections, metadata) VALUES
        ('Apache HTTP Server', '2.4.63 (Event MPM)', 1.42, 118, 24, '{"workers": 64, "tls": "TLSv1.3", "keepalive": true}'::jsonb),
        ('PHP-FPM Runtime', '8.4.4 (ZTS OPcache JIT)', 2.15, 164, 12, '{"jit": "tracing", "jit_buffer": "128M", "memory_limit": "512M"}'::jsonb),
        ('MySQL InnoDB Server', '9.2.0-Community', 0.89, 412, 18, '{"buffer_pool": "512M", "charset": "utf8mb4_0900_ai_ci"}'::jsonb),
        ('PostgreSQL Server', '17.4 (WAL Replica)', 0.64, 286, 15, '{"shared_buffers": "256MB", "parallel_workers": 8, "jsonb_accel": true}'::jsonb);

      INSERT INTO api_audit_logs (endpoint, http_method, status_code, duration_ms, client_ip, payload) VALUES
        ('/htdocs/dashboard/index.php', 'GET', 200, 3.40, '127.0.0.1', '{"module": "welcome", "php": "8.4.4"}'::jsonb),
        ('/htdocs/shop-api/index.php', 'GET', 200, 6.12, '127.0.0.1', '{"mysql_rows": 6, "pg_rows": 4}'::jsonb),
        ('/api/sql/query', 'POST', 200, 1.85, '127.0.0.1', '{"engine": "postgres", "database": "pg_analytics"}'::jsonb),
        ('/htdocs/pg-explorer/index.php', 'GET', 200, 4.21, '127.0.0.1', '{"jsonb": true, "extensions_checked": 6}'::jsonb),
        ('/htdocs/dashboard/phpinfo.php', 'GET', 200, 2.08, '127.0.0.1', '{"section": "ALL"}'::jsonb);

      INSERT INTO pg_extensions_registry (extname, extversion, installed, description) VALUES
        ('plpgsql', '1.0', TRUE, 'PL/pgSQL procedural language built into PostgreSQL 17'),
        ('pg_stat_statements', '1.11', TRUE, 'Track planning and execution statistics of all SQL statements executed'),
        ('uuid-ossp', '1.1', TRUE, 'Functions to generate universally unique identifiers (UUIDs)'),
        ('pgcrypto', '1.3', TRUE, 'Cryptographic functions for PostgreSQL 17'),
        ('hstore', '1.8', TRUE, 'Data type for storing sets of (key, value) pairs'),
        ('vector', '0.8.0', TRUE, 'pgvector open-source vector similarity search for PostgreSQL 17');
    `);
  }

  // 2. Initialize MySQL 9.2 Engine (SQL.js + MySQL 9.2 Compatibility Layer)
  SQL = await initSqlJs();
  mysqlDb = new SQL.Database();

  mysqlDb.run(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      tier TEXT NOT NULL DEFAULT 'Standard',
      country TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      order_status TEXT NOT NULL,
      ordered_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE vhost_routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT NOT NULL UNIQUE,
      doc_root TEXT NOT NULL,
      php_version TEXT NOT NULL DEFAULT '8.4.4',
      ssl_enabled INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1
    );

    INSERT INTO products (sku, name, category, price, stock, status) VALUES
      ('XMP-8401', 'Pro NVMe Cloud Instance (PHP 8.4 Ready)', 'Compute', 49.00, 120, 'active'),
      ('XMP-9202', 'Dedicated MySQL 9.2 Cluster Node', 'Database', 89.00, 45, 'active'),
      ('XMP-1703', 'PostgreSQL 17 High-IOPS Volume', 'Database', 79.00, 62, 'active'),
      ('XMP-2404', 'Wildcard TLS 1.3 Certificate Pack', 'Security', 24.50, 500, 'active'),
      ('XMP-6005', 'Redis 7.4 In-Memory Cache Addon', 'Caching', 19.00, 210, 'active'),
      ('XMP-7706', 'Zero-Downtime Worker Pool Balancer', 'Networking', 35.00, 85, 'active');

    INSERT INTO customers (full_name, email, tier, country) VALUES
      ('Elena Rostova', 'elena@ RostovaLabs.io', 'Enterprise', 'Germany'),
      ('Marcus Vance', 'mvance@cloudscale.dev', 'Pro', 'United States'),
      ('Akira Takahashi', 'akira@neostack.jp', 'Enterprise', 'Japan'),
      ('Priya Nair', 'priya@finpulse.lk', 'Pro', 'Sri Lanka'),
      ('Lucas Meyer', 'lucas@alpinehost.ch', 'Standard', 'Switzerland');

    INSERT INTO orders (order_number, customer_id, total_amount, payment_method, order_status) VALUES
      ('ORD-2026-901', 1, 217.00, 'Wire / SEPA', 'COMPLETED'),
      ('ORD-2026-902', 2, 138.00, 'Stripe Card', 'COMPLETED'),
      ('ORD-2026-903', 3, 305.50, 'Corporate Invoice', 'COMPLETED'),
      ('ORD-2026-904', 4, 108.00, 'Stripe Card', 'PROCESSING'),
      ('ORD-2026-905', 5, 49.00, 'PayPal', 'COMPLETED');

    INSERT INTO vhost_routes (domain, doc_root, php_version, ssl_enabled, active) VALUES
      ('localhost', '/home/user/hosting/htdocs/dashboard', '8.4.4', 1, 1),
      ('shop.local', '/home/user/hosting/htdocs/shop-api', '8.4.4', 1, 1),
      ('pg-explorer.local', '/home/user/hosting/htdocs/pg-explorer', '8.4.4', 1, 1),
      ('mysql-bench.local', '/home/user/hosting/htdocs/mysql-bench', '8.4.4', 1, 1);
  `);
}

export async function executePostgresQuery(rawSql) {
  const start = performance.now();
  const trimmed = rawSql.trim();

  // Support psql meta-commands like \dt or \l or SELECT version()
  if (/^\\dt/i.test(trimmed) || /^SHOW\s+TABLES/i.test(trimmed)) {
    const res = await pgDb.query(`
      SELECT schemaname AS schema, tablename AS table_name, tableowner AS owner
      FROM pg_catalog.pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY tablename;
    `);
    return {
      engine: 'postgres',
      version: 'PostgreSQL 17.4',
      columns: ['schema', 'table_name', 'owner'],
      rows: res.rows,
      rowCount: res.rows.length,
      durationMs: +(performance.now() - start).toFixed(2),
    };
  }

  if (/^SELECT\s+version\(\)\s*;?$/i.test(trimmed)) {
    return {
      engine: 'postgres',
      version: 'PostgreSQL 17.4',
      columns: ['version'],
      rows: [
        {
          version:
            'PostgreSQL 17.4 (XPGAMPP-17.4-PGlite on x86_64-pc-linux-gnu, compiled by gcc 13.2.0, 64-bit)',
        },
      ],
      rowCount: 1,
      durationMs: +(performance.now() - start).toFixed(2),
    };
  }

  const res = await pgDb.query(trimmed);
  const columns =
    res.fields && res.fields.length > 0
      ? res.fields.map((f) => f.name)
      : res.rows && res.rows[0]
      ? Object.keys(res.rows[0])
      : [];

  return {
    engine: 'postgres',
    version: 'PostgreSQL 17.4',
    columns,
    rows: res.rows || [],
    rowCount: res.rows?.length ? res.rows.length : (res.affectedRows ?? 0),
    durationMs: +(performance.now() - start).toFixed(2),
  };
}

export function executeMysqlQuery(rawSql) {
  const start = performance.now();
  const trimmed = rawSql.trim().replace(/;+\s*$/, '');

  // Handle MySQL meta-queries
  if (/^SHOW\s+DATABASES$/i.test(trimmed)) {
    const rows = [
      { Database: 'information_schema' },
      { Database: 'mysql' },
      { Database: 'performance_schema' },
      { Database: 'sys' },
      { Database: 'xampp_shop' },
    ];
    return {
      engine: 'mysql',
      version: 'MySQL 9.2.0',
      columns: ['Database'],
      rows,
      rowCount: rows.length,
      durationMs: +(performance.now() - start).toFixed(2),
    };
  }

  if (/^SHOW\s+(FULL\s+)?TABLES$/i.test(trimmed)) {
    const stmt = mysqlDb.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const names = stmt[0]?.values.map((v) => v[0]) || [];
    const rows = names.map((n) => ({
      Tables_in_xampp_shop: n,
      Table_type: 'BASE TABLE',
    }));
    return {
      engine: 'mysql',
      version: 'MySQL 9.2.0',
      columns: ['Tables_in_xampp_shop', 'Table_type'],
      rows,
      rowCount: rows.length,
      durationMs: +(performance.now() - start).toFixed(2),
    };
  }

  const descMatch = trimmed.match(/^(?:DESCRIBE|DESC|SHOW\s+COLUMNS\s+FROM)\s+[`"]?([a-zA-Z0-9_]+)[`"]?$/i);
  if (descMatch) {
    const tableName = descMatch[1];
    const info = mysqlDb.exec(`PRAGMA table_info("${tableName}")`);
    if (!info.length) {
      throw new Error(`ERROR 1146 (42S02): Table 'xampp_shop.${tableName}' doesn't exist`);
    }
    const rows = info[0].values.map((col) => ({
      Field: col[1],
      Type: col[2] === 'INTEGER' ? 'int(11)' : col[2] === 'REAL' ? 'decimal(10,2)' : 'varchar(255)',
      Null: col[3] ? 'NO' : 'YES',
      Key: col[5] ? 'PRI' : '',
      Default: col[4],
      Extra: col[5] ? 'auto_increment' : '',
    }));
    return {
      engine: 'mysql',
      version: 'MySQL 9.2.0',
      columns: ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
      rows,
      rowCount: rows.length,
      durationMs: +(performance.now() - start).toFixed(2),
    };
  }

  if (/^SHOW\s+(?:GLOBAL\s+)?VARIABLES/i.test(trimmed)) {
    const rows = [
      { Variable_name: 'version', Value: '9.2.0-MySQL-Community-XPGAMPP' },
      { Variable_name: 'version_comment', Value: 'MySQL Community Server - GPL (XPGAMPP Stack)' },
      { Variable_name: 'port', Value: '3306' },
      { Variable_name: 'character_set_server', Value: 'utf8mb4' },
      { Variable_name: 'collation_server', Value: 'utf8mb4_0900_ai_ci' },
      { Variable_name: 'default_storage_engine', Value: 'InnoDB' },
      { Variable_name: 'innodb_buffer_pool_size', Value: '536870912' },
      { Variable_name: 'max_connections', Value: '200' },
    ];
    return {
      engine: 'mysql',
      version: 'MySQL 9.2.0',
      columns: ['Variable_name', 'Value'],
      rows,
      rowCount: rows.length,
      durationMs: +(performance.now() - start).toFixed(2),
    };
  }

  if (/^SELECT\s+VERSION\(\)/i.test(trimmed)) {
    return {
      engine: 'mysql',
      version: 'MySQL 9.2.0',
      columns: ['VERSION()', 'DATABASE()', 'USER()'],
      rows: [
        {
          'VERSION()': '9.2.0-MySQL-Community-XPGAMPP',
          'DATABASE()': 'xampp_shop',
          'USER()': 'root@localhost',
        },
      ],
      rowCount: 1,
      durationMs: +(performance.now() - start).toFixed(2),
    };
  }

  // Normalize MySQL DDL syntax (AUTO_INCREMENT, ENGINE=InnoDB) for SQL.js execution
  const normalizedSql = trimmed
    .replace(/INT\s+PRIMARY\s+KEY\s+AUTO_INCREMENT/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
    .replace(/\)\s*ENGINE\s*=\s*[a-zA-Z0-9_]+.*$/i, ')')
    .replace(/NOW\(\)/gi, "datetime('now')");

  const res = mysqlDb.exec(normalizedSql);
  if (!res || res.length === 0) {
    const modified = mysqlDb.getRowsModified();
    return {
      engine: 'mysql',
      version: 'MySQL 9.2.0',
      columns: ['Status', 'Affected_Rows'],
      rows: [{ Status: 'Query OK', Affected_Rows: modified }],
      rowCount: modified,
      durationMs: +(performance.now() - start).toFixed(2),
    };
  }

  const first = res[0];
  const columns = first.columns;
  const rows = first.values.map((vals) => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = vals[i];
    });
    return obj;
  });

  return {
    engine: 'mysql',
    version: 'MySQL 9.2.0',
    columns,
    rows,
    rowCount: rows.length,
    durationMs: +(performance.now() - start).toFixed(2),
  };
}

export async function getDatabasesMetadata() {
  // MySQL tables & counts
  const mysqlTablesStmt = mysqlDb.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  const mysqlTableNames = mysqlTablesStmt[0]?.values.map((v) => v[0]) || [];
  const mysqlTables = mysqlTableNames.map((name) => {
    const cntRes = mysqlDb.exec(`SELECT COUNT(*) FROM "${name}"`);
    const count = cntRes[0]?.values[0]?.[0] ?? 0;
    const colsRes = mysqlDb.exec(`PRAGMA table_info("${name}")`);
    const columns = (colsRes[0]?.values || []).map((c) => ({
      name: c[1],
      type: c[2] === 'INTEGER' ? 'INT' : c[2] === 'REAL' ? 'DECIMAL(10,2)' : 'VARCHAR',
      pk: Boolean(c[5]),
    }));
    return { name, rowCount: count, engine: 'InnoDB', collation: 'utf8mb4_0900_ai_ci', columns };
  });

  // PostgreSQL tables & counts
  const pgTablesRes = await pgDb.query(`
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);
  const pgTables = [];
  for (const row of pgTablesRes.rows) {
    const tName = row.tablename;
    const cntRes = await pgDb.query(`SELECT COUNT(*)::int AS cnt FROM "${tName}"`);
    const colsRes = await pgDb.query(
      `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `,
      [tName]
    );
    pgTables.push({
      name: tName,
      rowCount: cntRes.rows[0]?.cnt ?? 0,
      schema: 'public',
      columns: colsRes.rows.map((c) => ({
        name: c.column_name,
        type: c.data_type.toUpperCase(),
      })),
    });
  }

  return {
    mysql: {
      version: '9.2.0',
      database: 'xampp_shop',
      port: 3306,
      charset: 'utf8mb4_0900_ai_ci',
      tables: mysqlTables,
    },
    postgres: {
      version: '17.4',
      database: 'pg_analytics',
      port: 5432,
      encoding: 'UTF8',
      tables: pgTables,
    },
  };
}
