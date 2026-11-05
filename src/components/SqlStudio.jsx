import React, { useState, useEffect } from 'react';
import {
  Database,
  Play,
  Table,
  RefreshCw,
  Download,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Key,
  Layers,
} from 'lucide-react';

const PRESET_QUERIES = {
  mysql: [
    {
      label: 'All Products (xampp_shop)',
      sql: 'SELECT id, sku, name, category, price, stock, status FROM products ORDER BY id ASC;',
    },
    {
      label: 'Orders ⋈ Customers Join',
      sql: 'SELECT o.order_number, c.full_name, c.tier, c.country, o.total_amount, o.payment_method, o.order_status\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nORDER BY o.total_amount DESC;',
    },
    {
      label: 'Virtual Host Routes',
      sql: 'SELECT id, domain, doc_root, php_version, ssl_enabled, active FROM vhost_routes;',
    },
    {
      label: 'SHOW TABLES',
      sql: 'SHOW TABLES;',
    },
    {
      label: 'DESCRIBE products',
      sql: 'DESCRIBE products;',
    },
    {
      label: 'SHOW VARIABLES (MySQL 9.2)',
      sql: 'SHOW VARIABLES;',
    },
    {
      label: 'Insert New Product Row',
      sql: "INSERT INTO products (sku, name, category, price, stock, status)\nVALUES ('XMP-9900', 'Dedicated PG17 + MySQL9 Dual Node', 'Bundle', 129.00, 35, 'active');",
    },
  ],
  postgres: [
    {
      label: 'Service Telemetry & JSONB',
      sql: "SELECT id, service_name, engine_version, avg_latency_ms, memory_mb, active_connections, metadata->>'jit' AS php_jit, metadata\nFROM service_telemetry\nORDER BY id ASC;",
    },
    {
      label: 'API Audit Stream',
      sql: 'SELECT id, http_method, endpoint, status_code, duration_ms, client_ip, payload, created_at\nFROM api_audit_logs\nORDER BY id DESC;',
    },
    {
      label: 'PG 17 Extensions Registry',
      sql: 'SELECT id, extname, extversion, installed, description\nFROM pg_extensions_registry\nORDER BY id ASC;',
    },
    {
      label: 'PostgreSQL 17 Version',
      sql: 'SELECT version();',
    },
    {
      label: 'List Public Tables (\\dt)',
      sql: '\\dt',
    },
    {
      label: 'JSONB Filter Query',
      sql: "SELECT service_name, engine_version, metadata\nFROM service_telemetry\nWHERE (metadata->>'workers')::int >= 32 OR metadata ? 'shared_buffers';",
    },
    {
      label: 'Insert Audit Log Entry',
      sql: "INSERT INTO api_audit_logs (endpoint, http_method, status_code, duration_ms, client_ip, payload)\nVALUES ('/api/sql/studio', 'POST', 200, 0.74, '127.0.0.1', '{\"studio\": \"pgAdmin-17\", \"ssl\": true}'::jsonb)\nRETURNING *;",
    },
  ],
};

export default function SqlStudio({ initialEngine = 'mysql', services, onRefreshStatus }) {
  const [engine, setEngine] = useState(initialEngine);
  const [metadata, setMetadata] = useState(null);
  const [sql, setSql] = useState(PRESET_QUERIES[initialEngine][0].sql);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedTable, setExpandedTable] = useState(null);

  useEffect(() => {
    setEngine(initialEngine);
    setSql(PRESET_QUERIES[initialEngine][0].sql);
    runQuery(initialEngine, PRESET_QUERIES[initialEngine][0].sql);
  }, [initialEngine]);

  const fetchMetadata = async () => {
    try {
      const res = await fetch('/api/sql/metadata');
      const data = await res.json();
      if (res.ok) setMetadata(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  const runQuery = async (targetEngine = engine, targetSql = sql) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sql/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine: targetEngine, sql: targetSql }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to execute query');
        setResult(null);
      } else {
        setResult(data);
        if (data.metadata) setMetadata(data.metadata);
        if (onRefreshStatus) onRefreshStatus();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEngineSwitch = (nextEngine) => {
    setEngine(nextEngine);
    const defaultQuery = PRESET_QUERIES[nextEngine][0].sql;
    setSql(defaultQuery);
    runQuery(nextEngine, defaultQuery);
  };

  const handleTableSelect = (tableName) => {
    setExpandedTable(expandedTable === tableName ? null : tableName);
    const q = `SELECT * FROM ${tableName} LIMIT 50;`;
    setSql(q);
    runQuery(engine, q);
  };

  const exportResultsJson = () => {
    if (!result?.rows) return;
    const blob = new Blob([JSON.stringify(result.rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${engine}-query-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentMeta = metadata ? metadata[engine] : null;
  const serviceState = services?.find((s) => s.id === engine)?.status || 'running';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left Sidebar: Engine Switcher & Schema Browser */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Database Engine Target
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleEngineSwitch('mysql')}
              className={`px-3 py-2.5 rounded-lg border text-left transition cursor-pointer ${
                engine === 'mysql'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">MySQL 9.2</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  :3306
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">xampp_shop (InnoDB)</div>
            </button>

            <button
              onClick={() => handleEngineSwitch('postgres')}
              className={`px-3 py-2.5 rounded-lg border text-left transition cursor-pointer ${
                engine === 'postgres'
                  ? 'bg-sky-500/15 border-sky-500 text-sky-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">PostgreSQL 17</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                  :5432
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">pg_analytics (WAL)</div>
            </button>
          </div>
        </div>

        {/* Service Status Banner */}
        <div
          className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between ${
            serviceState === 'running'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          <span className="flex items-center gap-1.5 font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                serviceState === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {engine === 'mysql' ? 'mysqld 9.2.0' : 'postgres 17.4'}
          </span>
          <span className="font-mono uppercase text-[11px]">{serviceState}</span>
        </div>

        {/* Schema & Tables List */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              {currentMeta ? `Schema: ${currentMeta.database}` : 'Tables'}
            </span>
            <button
              onClick={fetchMetadata}
              className="text-slate-400 hover:text-slate-200 p-1 rounded cursor-pointer"
              title="Refresh Schema"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            {currentMeta?.tables?.map((tbl) => (
              <div
                key={tbl.name}
                className="border border-slate-800/90 rounded-lg bg-slate-950/60 overflow-hidden"
              >
                <button
                  onClick={() => handleTableSelect(tbl.name)}
                  className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-xs font-mono font-medium text-slate-200">
                    <Table className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    {tbl.name}
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {tbl.rowCount} rows
                  </span>
                </button>

                {expandedTable === tbl.name && tbl.columns && (
                  <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 space-y-1">
                    {tbl.columns.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-center justify-between text-[11px] font-mono"
                      >
                        <span className="text-slate-300 flex items-center gap-1">
                          {col.pk && <Key className="w-2.5 h-2.5 text-amber-400" />}
                          {col.name}
                        </span>
                        <span className="text-slate-500">{col.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Main Area: Query Editor & Results Table */}
      <div className="lg:col-span-9 flex flex-col gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Database
                className={`w-4 h-4 ${engine === 'mysql' ? 'text-amber-400' : 'text-sky-400'}`}
              />
              <h3 className="text-sm font-semibold text-slate-100">
                {engine === 'mysql'
                  ? 'phpMyAdmin Studio — MySQL 9.2.0 Community (InnoDB)'
                  : 'pgAdmin Studio — PostgreSQL 17.4 (PGlite / Native)'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => runQuery(engine, sql)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow transition cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {loading ? 'Executing...' : 'Execute SQL'}
              </button>
              {result?.rows?.length > 0 && (
                <button
                  onClick={exportResultsJson}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON
                </button>
              )}
            </div>
          </div>

          {/* Preset Query Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-orange-400" /> Presets:
            </span>
            {PRESET_QUERIES[engine].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setSql(preset.sql);
                  runQuery(engine, preset.sql);
                }}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* SQL Code Textarea */}
          <div className="relative">
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  runQuery(engine, sql);
                }
              }}
              rows={5}
              spellCheck={false}
              className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 text-emerald-300 focus:outline-none focus:border-orange-500 resize-y"
              placeholder="Write SQL query here... (Press Ctrl+Enter to execute)"
            />
            <span className="absolute bottom-2.5 right-3 text-[10px] font-mono text-slate-500">
              Ctrl + Enter to Run
            </span>
          </div>
        </div>

        {/* Query Result / Error Output */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs font-mono flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-300 mb-0.5">SQL Execution Error</div>
                {error}
              </div>
            </div>
          )}

          {!error && result && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {result.version} &bull; {result.rowCount} row(s) returned
                  </span>
                </div>
                <div className="font-mono text-slate-400">
                  Execution Time: <span className="text-slate-200 font-semibold">{result.durationMs} ms</span>
                </div>
              </div>

              {result.rows && result.rows.length > 0 ? (
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] sticky top-0">
                      <tr>
                        {result.columns.map((col) => (
                          <th key={col} className="py-2.5 px-3 border-b border-slate-800 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 font-mono">
                      {result.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-800/40">
                          {result.columns.map((col) => {
                            const val = row[col];
                            const formatted =
                              val === null || val === undefined
                                ? 'NULL'
                                : typeof val === 'object'
                                ? JSON.stringify(val)
                                : String(val);
                            return (
                              <td
                                key={col}
                                className="py-2 px-3 text-slate-200 whitespace-nowrap max-w-xs truncate"
                                title={formatted}
                              >
                                {val === null ? (
                                  <span className="text-slate-500 italic">NULL</span>
                                ) : typeof val === 'object' ? (
                                  <span className="text-sky-300">{formatted}</span>
                                ) : (
                                  formatted
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 font-mono">
                  <Terminal className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  Statement executed successfully. 0 rows returned.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
