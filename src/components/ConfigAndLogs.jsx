import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  FileText,
  Cpu,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Container,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';

const ALL_PHP84_EXTENSIONS = [
  { name: 'pdo_mysql', desc: 'MySQL 9.2 PDO Driver (Pdo\\Mysql)' },
  { name: 'mysqli', desc: 'MySQLnd Native Driver' },
  { name: 'pdo_pgsql', desc: 'PostgreSQL 17 PDO Driver (Pdo\\Pgsql)' },
  { name: 'pgsql', desc: 'PostgreSQL Native libpq Binding' },
  { name: 'opcache', desc: 'Zend OPcache + Tracing JIT Engine' },
  { name: 'redis', desc: 'PHPRedis In-Memory Cache Extension' },
  { name: 'curl', desc: 'Client URL HTTP/3 Library' },
  { name: 'gd', desc: 'GD Graphics & WebP/AVIF Processing' },
  { name: 'intl', desc: 'ICU Internationalization Functions' },
  { name: 'mbstring', desc: 'Multibyte UTF-8 String Functions' },
  { name: 'zip', desc: 'Libzip Archive Management' },
  { name: 'sodium', desc: 'Libsodium Modern Cryptography' },
  { name: 'ffi', desc: 'Foreign Function Interface (C Bindings)' },
  { name: 'xdebug', desc: 'Xdebug 3.4 Step Debugger & Profiler' },
];

export default function ConfigAndLogs({
  initialConfigKey = 'php.ini',
  initialSubTab = 'configs',
  phpConfig,
  onRefreshStatus,
}) {
  const [subTab, setSubTab] = useState(initialSubTab); // 'configs' | 'extensions' | 'logs' | 'docker'
  const [configsList, setConfigsList] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(initialConfigKey);
  const [configContent, setConfigContent] = useState('');
  const [configPath, setConfigPath] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  const [selectedLog, setSelectedLog] = useState('apache_access.log');
  const [logContent, setLogContent] = useState('');
  const [copiedCmd, setCopiedCmd] = useState('');

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    if (initialConfigKey) {
      setSelectedConfig(initialConfigKey);
      loadConfigFile(initialConfigKey);
    }
  }, [initialConfigKey]);

  useEffect(() => {
    fetch('/api/configs')
      .then((r) => r.json())
      .then((d) => setConfigsList(d.configs || []))
      .catch(() => {});
    loadConfigFile(selectedConfig);
    loadLogFile(selectedLog);
  }, []);

  const loadConfigFile = async (key) => {
    setSelectedConfig(key);
    try {
      const res = await fetch(`/api/configs/${encodeURIComponent(key)}`);
      const data = await res.json();
      if (res.ok) {
        setConfigContent(data.content);
        setConfigPath(data.path);
      }
    } catch {
      // ignore
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch(`/api/configs/${encodeURIComponent(selectedConfig)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: configContent }),
      });
      if (res.ok) {
        setSavedBanner(true);
        setTimeout(() => setSavedBanner(false), 2500);
        if (onRefreshStatus) onRefreshStatus();
      }
    } finally {
      setSavingConfig(false);
    }
  };

  const handleToggleExtension = async (extName) => {
    await fetch('/api/php/extensions/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extension: extName }),
    });
    if (selectedConfig === 'php.ini') {
      loadConfigFile('php.ini');
    }
    if (onRefreshStatus) onRefreshStatus();
  };

  const loadLogFile = async (logName) => {
    setSelectedLog(logName);
    try {
      const res = await fetch(`/api/logs/${encodeURIComponent(logName)}`);
      const data = await res.json();
      if (res.ok) setLogContent(data.content || '');
    } catch {
      // ignore
    }
  };

  const handleClearLog = async () => {
    await fetch(`/api/logs/${encodeURIComponent(selectedLog)}`, { method: 'DELETE' });
    loadLogFile(selectedLog);
    if (onRefreshStatus) onRefreshStatus();
  };

  const copyCommand = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(''), 2000);
  };

  const enabledExtensions = phpConfig?.extensions || [];

  return (
    <div className="space-y-4">
      {/* Sub-navigation bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
        {[
          { id: 'configs', label: 'Configuration Files (etc/)', icon: Settings },
          { id: 'extensions', label: 'PHP 8.4 Extensions & phpinfo()', icon: Cpu },
          { id: 'logs', label: 'Service Log Files (var/log/)', icon: FileText },
          { id: 'docker', label: 'Docker Compose & CLI Stack', icon: Container },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                subTab === tab.id
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Config File Editor */}
      {subTab === 'configs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
              Stack Config Registry
            </div>
            {configsList.map((cfg) => (
              <button
                key={cfg.key}
                onClick={() => loadConfigFile(cfg.key)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                  selectedConfig === cfg.key
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{cfg.label}</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {cfg.service}
                </span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 font-mono">{selectedConfig}</h3>
                <p className="text-[11px] font-mono text-slate-400">{configPath}</p>
              </div>
              <div className="flex items-center gap-2">
                {savedBanner && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Saved & Signaled Service
                  </span>
                )}
                <button
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingConfig ? 'Saving...' : 'Save & Reload Config'}
                </button>
              </div>
            </div>

            <textarea
              value={configContent}
              onChange={(e) => setConfigContent(e.target.value)}
              rows={18}
              spellCheck={false}
              className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-slate-200 focus:outline-none focus:border-orange-500 resize-y"
            />
          </div>
        </div>
      )}

      {/* 2. PHP 8.4 Extensions Switchboard & Live phpinfo() */}
      {subTab === 'extensions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                PHP 8.4.4 Dynamic Extensions Manager
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggling an extension updates <code>/etc/php/php.ini</code> and reloads PHP-FPM 8.4.
              </p>
            </div>

            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {ALL_PHP84_EXTENSIONS.map((ext) => {
                const isEnabled = enabledExtensions.includes(ext.name);
                return (
                  <div
                    key={ext.name}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800"
                  >
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-200">
                        extension={ext.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{ext.desc}</div>
                    </div>
                    <button
                      onClick={() => handleToggleExtension(ext.name)}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition cursor-pointer ${
                        isEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {isEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-200 font-mono">
                Live phpinfo() Diagnostic Output (PHP 8.4.4 ZTS)
              </span>
              <a
                href="/api/phpinfo"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-orange-400 hover:underline font-mono"
              >
                Open Fullscreen /api/phpinfo &rarr;
              </a>
            </div>
            <iframe
              key={enabledExtensions.join(',')}
              title="phpinfo"
              src="/api/phpinfo"
              className="w-full h-[460px] rounded-lg border border-slate-800 bg-slate-950"
            />
          </div>
        </div>
      )}

      {/* 3. Service Log Files Viewer */}
      {subTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'apache_access.log',
                'apache_error.log',
                'php_error.log',
                'mysql_error.log',
                'postgresql.log',
              ].map((lf) => (
                <button
                  key={lf}
                  onClick={() => loadLogFile(lf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                    selectedLog === lf
                      ? 'bg-orange-600 text-white font-semibold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {lf}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadLogFile(selectedLog)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button
                onClick={handleClearLog}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/60 hover:bg-rose-900/50 text-xs text-rose-300 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Log
              </button>
            </div>
          </div>

          <pre className="w-full h-[380px] overflow-y-auto font-mono text-xs bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-slate-300 whitespace-pre-wrap">
            {logContent || 'No log entries recorded yet.'}
          </pre>
        </div>
      )}

      {/* 4. Docker Compose & CLI Stack Guide */}
      {subTab === 'docker' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <Container className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm font-bold text-slate-100">
                Production Docker Compose Stack Included in Repository
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In addition to the embedded browser runtime, this repository includes a complete{' '}
              <code>docker-compose.yml</code>, custom <code>docker/php/Dockerfile</code> (compiling{' '}
              <code>pdo_mysql</code>, <code>pdo_pgsql</code>, <code>mysqli</code>, <code>pgsql</code>,{' '}
              <code>redis</code>, <code>gd</code>, <code>opcache</code>), SQL init scripts, and the{' '}
              <code>./xampp-ctl.sh</code> CLI controller.
            </p>

            <div className="space-y-2.5">
              {[
                {
                  title: 'Start Full Stack via CLI Script',
                  cmd: './xampp-ctl.sh start',
                },
                {
                  title: 'Launch Native Containers via Docker Compose',
                  cmd: 'docker compose up -d --build',
                },
                {
                  title: 'Check Service Status & Healthchecks',
                  cmd: './xampp-ctl.sh status',
                },
                {
                  title: 'Tail Unified Apache / PHP / MySQL / PostgreSQL Logs',
                  cmd: './xampp-ctl.sh logs',
                },
              ].map((item) => (
                <div
                  key={item.cmd}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-[11px] text-slate-400">{item.title}</div>
                    <code className="text-xs font-mono text-emerald-300">{item.cmd}</code>
                  </div>
                  <button
                    onClick={() => copyCommand(item.cmd)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Copy command"
                  >
                    {copiedCmd === item.cmd ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-5 h-5 text-orange-400" />
              <h3 className="text-sm font-bold text-slate-100">Container Services & Port Mapping</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                    <th className="py-2 px-2.5">Container</th>
                    <th className="py-2 px-2.5">Image / Engine</th>
                    <th className="py-2 px-2.5">Host Port</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  <tr>
                    <td className="py-2.5 px-2.5 text-slate-200 font-semibold">xpgampp-apache-php84</td>
                    <td className="py-2.5 px-2.5 text-indigo-300">php:8.4-apache (Custom Build)</td>
                    <td className="py-2.5 px-2.5 text-emerald-400">8080 / 8443</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-2.5 text-slate-200 font-semibold">xpgampp-mysql92</td>
                    <td className="py-2.5 px-2.5 text-amber-300">mysql:9.2 (InnoDB)</td>
                    <td className="py-2.5 px-2.5 text-emerald-400">3306</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-2.5 text-slate-200 font-semibold">xpgampp-postgres17</td>
                    <td className="py-2.5 px-2.5 text-sky-300">postgres:17-alpine</td>
                    <td className="py-2.5 px-2.5 text-emerald-400">5432</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-2.5 text-slate-200 font-semibold">xpgampp-phpmyadmin</td>
                    <td className="py-2.5 px-2.5 text-slate-300">phpmyadmin:latest</td>
                    <td className="py-2.5 px-2.5 text-emerald-400">8081</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-2.5 text-slate-200 font-semibold">xpgampp-pgadmin4</td>
                    <td className="py-2.5 px-2.5 text-slate-300">dpage/pgadmin4:latest</td>
                    <td className="py-2.5 px-2.5 text-emerald-400">8082</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              onClick={() => {
                setSelectedConfig('docker-compose.yml');
                loadConfigFile('docker-compose.yml');
                setSubTab('configs');
              }}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-orange-300 transition cursor-pointer"
            >
              Inspect / Edit docker-compose.yml in Config Editor &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
