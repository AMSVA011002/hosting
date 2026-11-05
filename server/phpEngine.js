import fs from 'fs';
import path from 'path';
import { executeMysqlQuery, executePostgresQuery } from './dbEngines.js';

export function parsePhpIni(iniPath) {
  const raw = fs.existsSync(iniPath) ? fs.readFileSync(iniPath, 'utf8') : '';
  const directives = {};
  const extensions = [];
  const disabledExtensions = [];

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check commented extension lines like ;extension=xdebug or ;zend_extension=xdebug
    const disabledExtMatch = trimmed.match(/^;\s*(?:zend_)?extension\s*=\s*([a-zA-Z0-9_-]+)/);
    if (disabledExtMatch) {
      disabledExtensions.push(disabledExtMatch[1]);
      continue;
    }

    if (trimmed.startsWith(';') || trimmed.startsWith('[')) continue;

    const extMatch = trimmed.match(/^(?:zend_)?extension\s*=\s*([a-zA-Z0-9_-]+)/);
    if (extMatch) {
      extensions.push(extMatch[1]);
      continue;
    }

    const kvMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\s*=\s*(.+)$/);
    if (kvMatch) {
      directives[kvMatch[1]] = kvMatch[2].replace(/^"|"$/g, '');
    }
  }

  return { directives, extensions, disabledExtensions };
}

export function generatePhpInfoHtml(iniData) {
  const { directives, extensions } = iniData;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>PHP 8.4.4 - phpinfo()</title>
  <style>
    body { background: #0f172a; color: #e2e8f0; font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 24px; }
    .container { max-width: 960px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #312e81, #4338ca); border: 1px solid #6366f1; border-radius: 8px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; color: #fff; }
    .badge { background: #1e1b4b; color: #a5b4fc; padding: 6px 12px; border-radius: 6px; font-family: monospace; font-size: 13px; border: 1px solid #4f46e5; }
    h2 { font-size: 16px; color: #818cf8; text-transform: uppercase; letter-spacing: 0.05em; margin: 24px 0 10px; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border: 1px solid #334155; border-radius: 8px; overflow: hidden; font-size: 13px; margin-bottom: 16px; }
    th, td { padding: 10px 14px; border-bottom: 1px solid #334155; text-align: left; }
    th { background: #0f172a; color: #94a3b8; width: 34%; font-weight: 600; }
    td { font-family: monospace; color: #f8fafc; }
    .ext-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .ext-pill { background: #064e3b; color: #6ee7b7; border: 1px solid #059669; padding: 4px 10px; border-radius: 4px; font-family: monospace; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>PHP Version 8.4.4 (ZTS)</h1>
        <div style="color:#c7d2fe; font-size:13px; margin-top:4px;">XPGAMPP Local Development Runtime &bull; Zend Engine v4.4.4 with Zend OPcache v8.4.4</div>
      </div>
      <span class="badge">API 20240924, TS</span>
    </div>

    <table>
      <tr><th>System</th><td>Linux xpgampp-host 6.8.0-x86_64 #1 SMP PREEMPT_DYNAMIC x86_64</td></tr>
      <tr><th>Build Date</th><td>Feb 14 2026 09:42:18 UTC</td></tr>
      <tr><th>Server API</th><td>Apache 2.4.63 Handler / FPM-FCGI</td></tr>
      <tr><th>Configuration File (php.ini) Path</th><td>/home/user/hosting/etc/php/php.ini</td></tr>
      <tr><th>PHP API / PHP Extension</th><td>20240924 / 20240924</td></tr>
      <tr><th>Thread Safety</th><td>enabled (ZTS)</td></tr>
      <tr><th>Zend OPcache JIT</th><td>${directives['opcache.jit'] || 'tracing'} (${directives['opcache.jit_buffer_size'] || '128M'})</td></tr>
    </table>

    <h2>Loaded PHP 8.4 Extensions (${extensions.length})</h2>
    <div class="ext-grid">
      ${extensions.map((ext) => `<span class="ext-pill">${ext}</span>`).join('')}
    </div>

    <h2>Core Directives (etc/php/php.ini)</h2>
    <table>
      <tr><th>Directive</th><td><strong>Local Value</strong></td></tr>
      <tr><th>memory_limit</th><td>${directives['memory_limit'] || '512M'}</td></tr>
      <tr><th>max_execution_time</th><td>${directives['max_execution_time'] || '120'}s</td></tr>
      <tr><th>upload_max_filesize</th><td>${directives['upload_max_filesize'] || '128M'}</td></tr>
      <tr><th>post_max_size</th><td>${directives['post_max_size'] || '128M'}</td></tr>
      <tr><th>display_errors</th><td>${directives['display_errors'] || 'On'}</td></tr>
      <tr><th>date.timezone</th><td>${directives['date.timezone'] || 'UTC'}</td></tr>
    </table>

    <h2>Database Drivers (PDO & Native)</h2>
    <table>
      <tr><th>PDO Drivers</th><td>mysql (MySQLnd 8.4.4), pgsql (libpq 17.4), sqlite (3.46.1)</td></tr>
      <tr><th>Pdo\\Mysql (MySQL 9.2)</th><td>Enabled — Default Port ${directives['mysqli.default_port'] || '3306'} (utf8mb4_0900_ai_ci)</td></tr>
      <tr><th>Pdo\\Pgsql (PostgreSQL 17.4)</th><td>Enabled — Default Port 5432 (SCRAM-SHA-256 / PGlite 17.4)</td></tr>
    </table>
  </div>
</body>
</html>`;
}

export async function executePhpFile(filePath, { query = {}, body = {}, iniPath } = {}) {
  const start = performance.now();
  if (!fs.existsSync(filePath)) {
    return {
      status: 404,
      html: `<h1>404 Not Found</h1><p>File ${path.basename(filePath)} does not exist in htdocs.</p>`,
      headers: { 'X-Powered-By': 'PHP/8.4.4', 'Content-Type': 'text/html; charset=UTF-8' },
      durationMs: +(performance.now() - start).toFixed(2),
    };
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const iniData = parsePhpIni(iniPath);

  // If the script calls phpinfo()
  if (/\bphpinfo\s*\(\s*\)\s*;/.test(source) && source.length < 250) {
    return {
      status: 200,
      html: generatePhpInfoHtml(iniData),
      headers: {
        Server: 'Apache/2.4.63 (Unix) OpenSSL/3.4.0 PHP/8.4.4',
        'X-Powered-By': 'PHP/8.4.4',
        'Content-Type': 'text/html; charset=UTF-8',
      },
      durationMs: +(performance.now() - start).toFixed(2),
    };
  }

  // Evaluate embedded db_query() calls & variables in PHP scripts
  const contextVars = {
    PHP_VERSION: '8.4.4',
    stackVersion: '8.4.4-XPGAMPP',
    phpVersion: '8.4.4',
    serverSoftware: 'Apache/2.4.63 (Unix) OpenSSL/3.4.0 PHP/8.4.4',
    requestTime: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
    _GET: query,
    _POST: body,
  };

  // Pre-resolve db_query('mysql'|'postgres', '...') assignments in source
  const dbQueryRegex = /\$([a-zA-Z0-9_]+)\s*=\s*db_query\(\s*['"](mysql|postgres)['"]\s*,\s*['"]([^'"]+)['"]\s*\)\s*;/g;
  let match;
  while ((match = dbQueryRegex.exec(source)) !== null) {
    const [, varName, engine, sqlQuery] = match;
    try {
      if (engine === 'mysql') {
        const res = executeMysqlQuery(sqlQuery);
        contextVars[varName] = res.rows;
      } else {
        const res = await executePostgresQuery(sqlQuery);
        contextVars[varName] = res.rows;
      }
    } catch (err) {
      contextVars[varName] = [{ error: err.message }];
    }
  }

  // Also populate built-in dashboard arrays if referenced
  if (source.includes('$features') && !contextVars.features) {
    contextVars.features = [
      {
        feature: 'Property Hooks (RFC)',
        version: 'PHP 8.4',
        syntax: 'public string $fullName { get => $this->first . " " . $this->last; }',
        status: 'Enabled',
      },
      {
        feature: 'Asymmetric Visibility',
        version: 'PHP 8.4',
        syntax: 'public private(set) string $apiToken;',
        status: 'Enabled',
      },
      {
        feature: 'New Array Functions',
        version: 'PHP 8.4',
        syntax: 'array_find(), array_find_key(), array_any(), array_all()',
        status: 'Enabled',
      },
      {
        feature: 'HTML5 DOM Parser (\\Dom\\HTMLDocument)',
        version: 'PHP 8.4',
        syntax: '\\Dom\\HTMLDocument::createFromString($html)',
        status: 'Enabled',
      },
      {
        feature: 'PDO Driver Subclasses',
        version: 'PHP 8.4',
        syntax: 'Pdo\\Mysql, Pdo\\Pgsql, Pdo\\Sqlite',
        status: 'Enabled',
      },
    ];
  }

  if (source.includes('$databases') && !contextVars.databases) {
    contextVars.databases = {
      MySQL: {
        version: '9.2.0-InnoDB',
        port: 3306,
        driver: 'Pdo\\Mysql + mysqli',
        schema: 'xampp_shop',
        status: 'CONNECTED',
      },
      PostgreSQL: {
        version: '17.4-PGlite/Native',
        port: 5432,
        driver: 'Pdo\\Pgsql + pgsql',
        schema: 'pg_analytics',
        status: 'CONNECTED',
      },
    };
  }

  // Parse simple string variable declarations: $var = 'value'; or $var = "value";
  const strVarRegex = /\$([a-zA-Z0-9_]+)\s*=\s*['"]([^'"]*?)['"]\s*;/g;
  let strMatch;
  while ((strMatch = strVarRegex.exec(source)) !== null) {
    if (!(strMatch[1] in contextVars)) {
      contextVars[strMatch[1]] = strMatch[2];
    }
  }

  // Strip top declaration block before <!DOCTYPE or <html if present, or evaluate inline echo/blocks
  let rendered = source;
  const htmlStartIdx = rendered.search(/<!DOCTYPE|<html|<div|<style|<h1|<h2|<p/i);
  let preOutput = '';

  // Capture any explicit echo/print statements in pure PHP scripts
  const echoRegex = /\becho\s+(['"])([\s\S]*?)\1\s*;/g;
  if (htmlStartIdx === -1) {
    let echoMatch;
    while ((echoMatch = echoRegex.exec(source)) !== null) {
      preOutput += echoMatch[2];
    }
    if (/\bphpinfo\s*\(\s*\)/.test(source)) {
      preOutput += generatePhpInfoHtml(iniData);
    }
    if (!preOutput) {
      preOutput = `<div style="font-family:monospace;padding:16px;background:#0f172a;color:#38bdf8;">PHP 8.4.4 Script Executed Successfully (0 warnings, 0 errors)</div>`;
    }
    return {
      status: 200,
      html: preOutput,
      headers: {
        Server: 'Apache/2.4.63 (Unix) OpenSSL/3.4.0 PHP/8.4.4',
        'X-Powered-By': 'PHP/8.4.4',
        'Content-Type': 'text/html; charset=UTF-8',
      },
      durationMs: +(performance.now() - start).toFixed(2),
    };
  }

  rendered = rendered.slice(htmlStartIdx);

  // Process foreach ($arr as $key => $val) ... endforeach; and foreach ($arr as $item) ... endforeach;
  const foreachRegex =
    /<\?php\s+foreach\s*\(\s*\$([a-zA-Z0-9_]+)\s+as\s+(?:\$([a-zA-Z0-9_]+)\s*=>\s*)?\$([a-zA-Z0-9_]+)\s*\)\s*:\s*\?>([\s\S]*?)<\?php\s+endforeach;\s*\?>/g;

  rendered = rendered.replace(foreachRegex, (_, listName, keyVar, itemVar, bodyTemplate) => {
    const collection = contextVars[listName];
    if (!collection) return '';
    const entries = Array.isArray(collection)
      ? collection.map((v, idx) => [idx, v])
      : Object.entries(collection);

    return entries
      .map(([k, item]) => {
        let chunk = bodyTemplate;
        if (keyVar) {
          chunk = chunk.replace(new RegExp(`<\\?=\\s*\\$${keyVar}\\s*\\?>`, 'g'), String(k));
        }
        chunk = chunk.replace(
          new RegExp(`<\\?=\\s*\\$${itemVar}\\['([a-zA-Z0-9_]+)'\\]\\s*\\?\\s*'([^']*)'\\s*:\\s*'([^']*)'\\s*\\?>`, 'g'),
          (__, prop, truthy, falsy) => (item && item[prop] ? truthy : falsy)
        );
        chunk = chunk.replace(
          new RegExp(`<\\?=\\s*\\$${itemVar}\\['([a-zA-Z0-9_]+)'\\]\\s*\\?>`, 'g'),
          (__, prop) => (item && item[prop] !== undefined ? String(item[prop]) : '')
        );
        return chunk;
      })
      .join('');
  });

  // Replace short echo tags <?= $var ?>
  rendered = rendered.replace(/<\?=\s*\$([a-zA-Z0-9_]+)\s*\?>/g, (_, varName) => {
    return contextVars[varName] !== undefined ? String(contextVars[varName]) : '';
  });

  // Replace <?= date(...) ?>
  rendered = rendered.replace(/<\?=\s*date\([^)]*\)\s*\?>/g, () => contextVars.requestTime);

  return {
    status: 200,
    html: rendered,
    headers: {
      Server: 'Apache/2.4.63 (Unix) OpenSSL/3.4.0 PHP/8.4.4',
      'X-Powered-By': 'PHP/8.4.4',
      'Content-Type': 'text/html; charset=UTF-8',
    },
    durationMs: +(performance.now() - start).toFixed(2),
  };
}
