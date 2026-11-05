import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import {
  initDatabases,
  executeMysqlQuery,
  executePostgresQuery,
  getDatabasesMetadata,
} from './dbEngines.js';
import { parsePhpIni, generatePhpInfoHtml, executePhpFile } from './phpEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const HTDOCS_DIR = path.join(ROOT_DIR, 'htdocs');
const LOGS_DIR = path.join(ROOT_DIR, 'var', 'log');
const PHP_INI_PATH = path.join(ROOT_DIR, 'etc', 'php', 'php.ini');

fs.mkdirSync(LOGS_DIR, { recursive: true });
fs.mkdirSync(HTDOCS_DIR, { recursive: true });

const CONFIG_REGISTRY = {
  'php.ini': {
    label: 'php.ini (PHP 8.4.4)',
    service: 'php',
    path: path.join(ROOT_DIR, 'etc', 'php', 'php.ini'),
  },
  'php-fpm.conf': {
    label: 'php-fpm.conf (FPM Pool)',
    service: 'php',
    path: path.join(ROOT_DIR, 'etc', 'php', 'php-fpm.conf'),
  },
  'httpd.conf': {
    label: 'httpd.conf (Apache 2.4.63)',
    service: 'apache',
    path: path.join(ROOT_DIR, 'etc', 'apache2', 'httpd.conf'),
  },
  'httpd-vhosts.conf': {
    label: 'httpd-vhosts.conf (Virtual Hosts)',
    service: 'apache',
    path: path.join(ROOT_DIR, 'etc', 'apache2', 'httpd-vhosts.conf'),
  },
  'my.cnf': {
    label: 'my.cnf (MySQL 9.2.0)',
    service: 'mysql',
    path: path.join(ROOT_DIR, 'etc', 'mysql', 'my.cnf'),
  },
  'postgresql.conf': {
    label: 'postgresql.conf (PostgreSQL 17.4)',
    service: 'postgres',
    path: path.join(ROOT_DIR, 'etc', 'postgresql', 'postgresql.conf'),
  },
  'pg_hba.conf': {
    label: 'pg_hba.conf (PG Auth)',
    service: 'postgres',
    path: path.join(ROOT_DIR, 'etc', 'postgresql', 'pg_hba.conf'),
  },
  'docker-compose.yml': {
    label: 'docker-compose.yml (Container Stack)',
    service: 'docker',
    path: path.join(ROOT_DIR, 'docker-compose.yml'),
  },
};

const LOG_FILES = {
  'apache_access.log': path.join(LOGS_DIR, 'apache_access.log'),
  'apache_error.log': path.join(LOGS_DIR, 'apache_error.log'),
  'php_error.log': path.join(LOGS_DIR, 'php_error.log'),
  'mysql_error.log': path.join(LOGS_DIR, 'mysql_error.log'),
  'postgresql.log': path.join(LOGS_DIR, 'postgresql.log'),
};

const consoleEvents = [];

function appendLog(logFile, level, moduleName, message) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp,
    level,
    module: moduleName,
    message,
  };
  consoleEvents.push(entry);
  if (consoleEvents.length > 250) consoleEvents.shift();

  const filePath = LOG_FILES[logFile];
  if (filePath) {
    fs.appendFileSync(filePath, `[${timestamp}] [${level.toUpperCase()}] [${moduleName}] ${message}\n`);
  }
}

// Initialize initial log files if empty
function seedInitialLogs() {
  for (const [, fPath] of Object.entries(LOG_FILES)) {
    if (!fs.existsSync(fPath)) {
      fs.writeFileSync(fPath, '');
    }
  }
  appendLog('apache_error.log', 'info', 'System', 'XPGAMPP Control Panel v8.4.4 initialized (Linux x86_64)');
  appendLog('apache_error.log', 'info', 'Apache', 'Apache/2.4.63 (Unix) OpenSSL/3.4.0 PHP/8.4.4 configured -- resuming normal operations');
  appendLog('php_error.log', 'info', 'PHP-FPM', 'PHP 8.4.4 (ZTS) fpm-fcgi pool [www] started on 127.0.0.1:9000 (OPcache JIT: tracing)');
  appendLog('mysql_error.log', 'info', 'MySQL', 'mysqld 9.2.0-Community (InnoDB) ready for connections on port 3306, socket /var/run/mysqld.sock');
  appendLog('postgresql.log', 'info', 'PostgreSQL', 'PostgreSQL 17.4 database system is ready to accept connections on port 5432');
}

const services = {
  apache: {
    id: 'apache',
    name: 'Apache Web Server',
    version: '2.4.63',
    status: 'running',
    pids: [1420, 1421],
    ports: [8080, 8443],
    protocol: 'HTTP/1.1, HTTP/2',
    startedAt: Date.now() - 1800 * 1000,
    cpuPct: 1.4,
    memoryMb: 118,
    requestsServed: 42,
    configKeys: ['httpd.conf', 'httpd-vhosts.conf'],
    logKeys: ['apache_access.log', 'apache_error.log'],
    adminType: 'htdocs',
  },
  php: {
    id: 'php',
    name: 'PHP-FPM Runtime',
    version: '8.4.4 (ZTS)',
    status: 'running',
    pids: [1488, 1489, 1490],
    ports: [9000],
    protocol: 'FastCGI / Zend JIT',
    startedAt: Date.now() - 1795 * 1000,
    cpuPct: 0.9,
    memoryMb: 164,
    requestsServed: 42,
    configKeys: ['php.ini', 'php-fpm.conf'],
    logKeys: ['php_error.log'],
    adminType: 'phpinfo',
  },
  mysql: {
    id: 'mysql',
    name: 'MySQL Database',
    version: '9.2.0 (InnoDB)',
    status: 'running',
    pids: [1542],
    ports: [3306],
    protocol: 'MySQL X / TCP',
    startedAt: Date.now() - 1790 * 1000,
    cpuPct: 1.8,
    memoryMb: 412,
    queriesExecuted: 28,
    configKeys: ['my.cnf'],
    logKeys: ['mysql_error.log'],
    adminType: 'mysql-studio',
  },
  postgres: {
    id: 'postgres',
    name: 'PostgreSQL Server',
    version: '17.4 (PGlite/WAL)',
    status: 'running',
    pids: [1610, 1611],
    ports: [5432],
    protocol: 'PG Wire v3.0',
    startedAt: Date.now() - 1785 * 1000,
    cpuPct: 1.1,
    memoryMb: 286,
    queriesExecuted: 31,
    configKeys: ['postgresql.conf', 'pg_hba.conf'],
    logKeys: ['postgresql.log'],
    adminType: 'postgres-studio',
  },
};

// Optional standalone Apache/htdocs HTTP listener on port 8080 when Apache service is running
let apacheHttpServer = null;

function syncApachePortListener() {
  if (services.apache.status === 'running' && !apacheHttpServer) {
    try {
      const app8080 = express();
      app8080.use(express.urlencoded({ extended: true }));
      app8080.use(express.json());
      app8080.use(async (req, res) => {
        if (services.php.status !== 'running') {
          return res.status(503).send('<h1>503 Service Unavailable</h1><p>PHP-FPM 8.4.4 service is stopped in XPGAMPP Control Panel.</p>');
        }
        const rel = req.path === '/' ? 'dashboard/index.php' : req.path.replace(/^\/+/, '');
        let target = path.join(HTDOCS_DIR, rel);
        if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
          target = path.join(target, 'index.php');
        }
        const out = await executePhpFile(target, {
          query: req.query,
          body: req.body,
          iniPath: PHP_INI_PATH,
        });
        services.apache.requestsServed += 1;
        appendLog('apache_access.log', 'info', 'Apache', `${req.ip || '127.0.0.1'} "${req.method} ${req.path} HTTP/1.1" ${out.status} (${out.durationMs}ms)`);
        res.status(out.status).set(out.headers).send(out.html);
      });
      apacheHttpServer = http.createServer(app8080);
      apacheHttpServer.on('error', () => {
        // Port 8080 might already be in use; ignore gracefully
      });
      apacheHttpServer.listen(8080, '0.0.0.0');
    } catch {
      // Ignore if port 8080 unavailable
    }
  } else if (services.apache.status !== 'running' && apacheHttpServer) {
    try {
      apacheHttpServer.close();
    } catch {
      // Ignore
    }
    apacheHttpServer = null;
  }
}

export async function createServer() {
  await initDatabases();
  seedInitialLogs();
  syncApachePortListener();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 1. Stack Status & Telemetry
  app.get('/api/status', (req, res) => {
    const iniData = parsePhpIni(PHP_INI_PATH);
    const now = Date.now();
    const serviceList = Object.values(services).map((svc) => ({
      ...svc,
      uptimeSeconds: svc.status === 'running' && svc.startedAt ? Math.floor((now - svc.startedAt) / 1000) : 0,
    }));

    res.json({
      stackName: 'XPGAMPP Control Panel',
      stackVersion: '8.4.4-2026',
      os: 'Linux x86_64 (Sandbox Engine)',
      rootDir: ROOT_DIR,
      htdocsDir: HTDOCS_DIR,
      services: serviceList,
      phpConfig: iniData,
      consoleEvents: consoleEvents.slice(-80),
    });
  });

  // 2. Service Control (Start / Stop / Restart single service)
  app.post('/api/services/:id/:action', (req, res) => {
    const { id, action } = req.params;
    const svc = services[id];
    if (!svc) {
      return res.status(404).json({ error: `Unknown service: ${id}` });
    }

    const basePid = Math.floor(2000 + Math.random() * 6000);
    const logFile = svc.logKeys[0];

    if (action === 'start') {
      svc.status = 'running';
      svc.pids = id === 'php' ? [basePid, basePid + 1, basePid + 2] : id === 'apache' || id === 'postgres' ? [basePid, basePid + 1] : [basePid];
      svc.startedAt = Date.now();
      appendLog(logFile, 'info', svc.name, `Service started (PID ${svc.pids.join(', ')}) listening on port(s) ${svc.ports.join(', ')}`);
    } else if (action === 'stop') {
      appendLog(logFile, 'warn', svc.name, `Stopping service (PID ${svc.pids.join(', ')})... State changed to STOPPED`);
      svc.status = 'stopped';
      svc.pids = [];
      svc.startedAt = null;
    } else if (action === 'restart') {
      svc.status = 'running';
      svc.pids = id === 'php' ? [basePid, basePid + 1, basePid + 2] : id === 'apache' || id === 'postgres' ? [basePid, basePid + 1] : [basePid];
      svc.startedAt = Date.now();
      appendLog(logFile, 'info', svc.name, `Service gracefully restarted with new PID(s) ${svc.pids.join(', ')} on port(s) ${svc.ports.join(', ')}`);
    } else {
      return res.status(400).json({ error: `Invalid action: ${action}` });
    }

    if (id === 'apache') {
      syncApachePortListener();
    }

    res.json({ ok: true, service: svc, consoleEvents: consoleEvents.slice(-80) });
  });

  // 3. Bulk Service Control (Start All / Stop All / Restart All)
  app.post('/api/services-all/:action', (req, res) => {
    const { action } = req.params;
    for (const [id, svc] of Object.entries(services)) {
      const basePid = Math.floor(2000 + Math.random() * 6000);
      const logFile = svc.logKeys[0];
      if (action === 'start' || action === 'restart') {
        svc.status = 'running';
        svc.pids = id === 'php' ? [basePid, basePid + 1, basePid + 2] : [basePid, basePid + 1];
        svc.startedAt = Date.now();
        appendLog(logFile, 'info', svc.name, `[Bulk ${action.toUpperCase()}] Service active on port(s) ${svc.ports.join(', ')} (PID ${svc.pids.join(', ')})`);
      } else if (action === 'stop') {
        svc.status = 'stopped';
        svc.pids = [];
        svc.startedAt = null;
        appendLog(logFile, 'warn', svc.name, `[Bulk STOP] Service stopped.`);
      }
    }
    syncApachePortListener();
    res.json({ ok: true, services: Object.values(services), consoleEvents: consoleEvents.slice(-80) });
  });

  // 4. Dual Database Metadata & Query Execution (MySQL 9.2 + PostgreSQL 17.4)
  app.get('/api/sql/metadata', async (req, res) => {
    try {
      const metadata = await getDatabasesMetadata();
      res.json(metadata);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/sql/query', async (req, res) => {
    const { engine = 'mysql', sql = '' } = req.body;
    if (!sql.trim()) {
      return res.status(400).json({ error: 'SQL query cannot be empty' });
    }

    if (engine === 'mysql' && services.mysql.status !== 'running') {
      return res.status(503).json({
        error: 'ERROR 2002 (HY000): Can\'t connect to MySQL 9.2 server on \'127.0.0.1:3306\' (Service is STOPPED in Control Panel)',
      });
    }
    if (engine === 'postgres' && services.postgres.status !== 'running') {
      return res.status(503).json({
        error: 'psql: error: connection to server at "127.0.0.1", port 5432 failed: Connection refused (PostgreSQL 17.4 is STOPPED)',
      });
    }

    try {
      let result;
      if (engine === 'postgres') {
        result = await executePostgresQuery(sql);
        services.postgres.queriesExecuted += 1;
        appendLog('postgresql.log', 'info', 'PostgreSQL', `STATEMENT: ${sql.replace(/\s+/g, ' ').slice(0, 120)} (${result.durationMs} ms)`);
      } else {
        result = executeMysqlQuery(sql);
        services.mysql.queriesExecuted += 1;
        appendLog('mysql_error.log', 'info', 'MySQL', `[Query] ${sql.replace(/\s+/g, ' ').slice(0, 120)} -> ${result.rowCount} row(s) (${result.durationMs} ms)`);
      }
      const metadata = await getDatabasesMetadata();
      res.json({ ...result, metadata });
    } catch (err) {
      const logKey = engine === 'postgres' ? 'postgresql.log' : 'mysql_error.log';
      appendLog(logKey, 'error', engine === 'postgres' ? 'PostgreSQL' : 'MySQL', `QUERY ERROR: ${err.message}`);
      res.status(400).json({ error: err.message });
    }
  });

  // 5. htdocs Project & File Manager
  function scanHtdocs(dir, relBase = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const items = [];
    for (const entry of entries) {
      const relPath = relBase ? `${relBase}/${entry.name}` : entry.name;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        items.push({
          name: entry.name,
          path: relPath,
          type: 'directory',
          children: scanHtdocs(fullPath, relPath),
        });
      } else {
        const stat = fs.statSync(fullPath);
        items.push({
          name: entry.name,
          path: relPath,
          type: 'file',
          size: stat.size,
          updatedAt: stat.mtime.toISOString(),
        });
      }
    }
    return items;
  }

  app.get('/api/htdocs', (req, res) => {
    res.json({
      root: HTDOCS_DIR,
      tree: scanHtdocs(HTDOCS_DIR),
    });
  });

  app.get('/api/htdocs/file', (req, res) => {
    const relPath = String(req.query.path || '');
    const safePath = path.resolve(HTDOCS_DIR, relPath);
    if (!safePath.startsWith(HTDOCS_DIR) || !fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'File not found in htdocs' });
    }
    const content = fs.readFileSync(safePath, 'utf8');
    res.json({ path: relPath, content });
  });

  app.post('/api/htdocs/file', (req, res) => {
    const { path: relPath, content = '', isDirectory = false } = req.body;
    if (!relPath) return res.status(400).json({ error: 'Path is required' });
    const safePath = path.resolve(HTDOCS_DIR, relPath.replace(/^\/+/, ''));
    if (!safePath.startsWith(HTDOCS_DIR)) {
      return res.status(403).json({ error: 'Invalid path outside htdocs' });
    }
    if (isDirectory) {
      fs.mkdirSync(safePath, { recursive: true });
      appendLog('apache_error.log', 'info', 'htdocs', `Created project directory htdocs/${relPath}`);
    } else {
      fs.mkdirSync(path.dirname(safePath), { recursive: true });
      fs.writeFileSync(safePath, content, 'utf8');
      appendLog('apache_error.log', 'info', 'htdocs', `Saved file htdocs/${relPath} (${content.length} bytes)`);
    }
    res.json({ ok: true, tree: scanHtdocs(HTDOCS_DIR) });
  });

  app.delete('/api/htdocs/file', (req, res) => {
    const relPath = String(req.query.path || '');
    const safePath = path.resolve(HTDOCS_DIR, relPath.replace(/^\/+/, ''));
    if (!safePath.startsWith(HTDOCS_DIR) || safePath === HTDOCS_DIR || !fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'Target not found' });
    }
    fs.rmSync(safePath, { recursive: true, force: true });
    appendLog('apache_error.log', 'warn', 'htdocs', `Deleted htdocs/${relPath}`);
    res.json({ ok: true, tree: scanHtdocs(HTDOCS_DIR) });
  });

  // Execute a PHP script in htdocs and return output + headers + timing
  app.post('/api/htdocs/execute', async (req, res) => {
    const { path: relPath = 'dashboard/index.php', query = {}, body = {} } = req.body;
    if (services.apache.status !== 'running') {
      return res.status(503).json({
        error: 'Apache 2.4.63 Web Server is currently STOPPED. Start Apache in the Control Panel to serve htdocs.',
      });
    }
    if (services.php.status !== 'running') {
      return res.status(503).json({
        error: 'PHP-FPM 8.4.4 Runtime is currently STOPPED. Start PHP-FPM in the Control Panel to execute .php scripts.',
      });
    }

    const safePath = path.resolve(HTDOCS_DIR, relPath.replace(/^\/+/, ''));
    if (!safePath.startsWith(HTDOCS_DIR)) {
      return res.status(403).json({ error: 'Forbidden path' });
    }

    const result = await executePhpFile(safePath, { query, body, iniPath: PHP_INI_PATH });
    services.apache.requestsServed += 1;
    services.php.requestsServed += 1;
    appendLog('apache_access.log', 'info', 'Apache', `127.0.0.1 "GET /htdocs/${relPath} HTTP/1.1" ${result.status} (${result.durationMs}ms)`);
    res.json(result);
  });

  // Direct browser preview route for /htdocs/*
  app.use('/htdocs', async (req, res) => {
    if (services.apache.status !== 'running') {
      return res.status(503).send('<h1>503 Service Unavailable</h1><p>Apache 2.4.63 is stopped in XPGAMPP Control Panel.</p>');
    }
    if (services.php.status !== 'running') {
      return res.status(503).send('<h1>503 Bad Gateway (FastCGI)</h1><p>PHP-FPM 8.4.4 is stopped in XPGAMPP Control Panel.</p>');
    }
    const rel = req.path.replace(/^\/+/, '') || 'dashboard/index.php';
    let safePath = path.resolve(HTDOCS_DIR, rel);
    if (!safePath.startsWith(HTDOCS_DIR)) {
      return res.status(403).send('Forbidden');
    }
    if (fs.existsSync(safePath) && fs.statSync(safePath).isDirectory()) {
      safePath = path.join(safePath, 'index.php');
    }
    const result = await executePhpFile(safePath, {
      query: req.query,
      body: req.body,
      iniPath: PHP_INI_PATH,
    });
    services.apache.requestsServed += 1;
    services.php.requestsServed += 1;
    appendLog('apache_access.log', 'info', 'Apache', `${req.ip || '127.0.0.1'} "${req.method} /htdocs/${rel} HTTP/1.1" ${result.status} (${result.durationMs}ms)`);
    res.status(result.status).set(result.headers).send(result.html);
  });

  // 6. Configuration File Manager (php.ini, my.cnf, postgresql.conf, httpd.conf, etc.)
  app.get('/api/configs', (req, res) => {
    const list = Object.entries(CONFIG_REGISTRY).map(([key, meta]) => ({
      key,
      label: meta.label,
      service: meta.service,
      path: meta.path,
    }));
    res.json({ configs: list });
  });

  app.get('/api/configs/:key', (req, res) => {
    const meta = CONFIG_REGISTRY[req.params.key];
    if (!meta) return res.status(404).json({ error: 'Unknown configuration file' });
    const content = fs.existsSync(meta.path) ? fs.readFileSync(meta.path, 'utf8') : '';
    res.json({ key: req.params.key, ...meta, content });
  });

  app.put('/api/configs/:key', (req, res) => {
    const meta = CONFIG_REGISTRY[req.params.key];
    if (!meta) return res.status(404).json({ error: 'Unknown configuration file' });
    const { content = '' } = req.body;
    fs.writeFileSync(meta.path, content, 'utf8');
    appendLog('apache_error.log', 'info', 'Config', `Updated configuration file ${req.params.key} (${meta.path}) and signaled ${meta.service.toUpperCase()}`);
    res.json({ ok: true, phpConfig: parsePhpIni(PHP_INI_PATH) });
  });

  // 7. Toggle PHP 8.4 Extension directly in etc/php/php.ini
  app.post('/api/php/extensions/toggle', (req, res) => {
    const { extension } = req.body;
    if (!extension) return res.status(400).json({ error: 'Extension name required' });

    let raw = fs.readFileSync(PHP_INI_PATH, 'utf8');
    const enabledRegex = new RegExp(`^(\\s*)((?:zend_)?extension\\s*=\\s*${extension}\\b.*)$`, 'm');
    const disabledRegex = new RegExp(`^(\\s*);\\s*((?:zend_)?extension\\s*=\\s*${extension}\\b.*)$`, 'm');

    if (disabledRegex.test(raw)) {
      raw = raw.replace(disabledRegex, '$1$2');
      appendLog('php_error.log', 'info', 'PHP-FPM', `Enabled PHP 8.4 extension [${extension}] in etc/php/php.ini`);
    } else if (enabledRegex.test(raw)) {
      raw = raw.replace(enabledRegex, '$1;$2');
      appendLog('php_error.log', 'warn', 'PHP-FPM', `Disabled PHP 8.4 extension [${extension}] in etc/php/php.ini`);
    } else {
      raw += `\nextension=${extension}\n`;
      appendLog('php_error.log', 'info', 'PHP-FPM', `Added and enabled PHP 8.4 extension [${extension}] in etc/php/php.ini`);
    }

    fs.writeFileSync(PHP_INI_PATH, raw, 'utf8');
    res.json({ ok: true, phpConfig: parsePhpIni(PHP_INI_PATH) });
  });

  // 8. Logs Viewer & Clear
  app.get('/api/logs/:logName', (req, res) => {
    const fPath = LOG_FILES[req.params.logName];
    if (!fPath) return res.status(404).json({ error: 'Log file not found' });
    const content = fs.existsSync(fPath) ? fs.readFileSync(fPath, 'utf8') : '';
    res.json({ logName: req.params.logName, path: fPath, content });
  });

  app.delete('/api/logs/:logName', (req, res) => {
    const fPath = LOG_FILES[req.params.logName];
    if (!fPath) return res.status(404).json({ error: 'Log file not found' });
    fs.writeFileSync(fPath, '');
    appendLog(req.params.logName, 'info', 'System', `Log file ${req.params.logName} truncated by user`);
    res.json({ ok: true });
  });

  // 9. phpinfo() Direct Endpoint
  app.get('/api/phpinfo', (req, res) => {
    const iniData = parsePhpIni(PHP_INI_PATH);
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.send(generatePhpInfoHtml(iniData));
  });

  return app;
}
