import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Database,
  FolderCode,
  Settings,
  Play,
  Square,
  RotateCw,
  ExternalLink,
  FileText,
  Activity,
  Terminal,
  Cpu,
  ShieldCheck,
  Network,
  Container,
  Layers,
} from 'lucide-react';
import SqlStudio from './components/SqlStudio.jsx';
import HtdocsManager from './components/HtdocsManager.jsx';
import ConfigAndLogs from './components/ConfigAndLogs.jsx';

function formatUptime(sec) {
  if (!sec || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m ${s}s`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('control'); // 'control' | 'sql' | 'htdocs' | 'configs'
  const [sqlEngine, setSqlEngine] = useState('mysql');
  const [configTarget, setConfigTarget] = useState('php.ini');
  const [configSubTab, setConfigSubTab] = useState('configs');
  const [statusData, setStatusData] = useState(null);
  const [busyService, setBusyService] = useState(null);
  const [showNetstat, setShowNetstat] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (res.ok) setStatusData(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 4000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  const handleServiceAction = async (id, action) => {
    setBusyService(id);
    try {
      await fetch(`/api/services/${id}/${action}`, { method: 'POST' });
      await fetchStatus();
    } finally {
      setBusyService(null);
    }
  };

  const handleBulkAction = async (action) => {
    setBusyService('all');
    try {
      await fetch(`/api/services-all/${action}`, { method: 'POST' });
      await fetchStatus();
    } finally {
      setBusyService(null);
    }
  };

  const handleAdminClick = (svc) => {
    if (svc.id === 'apache') {
      setActiveTab('htdocs');
    } else if (svc.id === 'php') {
      setConfigSubTab('extensions');
      setActiveTab('configs');
    } else if (svc.id === 'mysql') {
      setSqlEngine('mysql');
      setActiveTab('sql');
    } else if (svc.id === 'postgres') {
      setSqlEngine('postgres');
      setActiveTab('sql');
    }
  };

  const handleConfigClick = (svc) => {
    const firstKey = svc.configKeys?.[0] || 'php.ini';
    setConfigTarget(firstKey);
    setConfigSubTab('configs');
    setActiveTab('configs');
  };

  const handleLogsClick = () => {
    setConfigSubTab('logs');
    setActiveTab('configs');
  };

  const services = statusData?.services || [];
  const consoleEvents = statusData?.consoleEvents || [];
  const phpConfig = statusData?.phpConfig || { directives: {}, extensions: [] };
  const runningCount = services.filter((s) => s.status === 'running').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Application Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 font-black text-lg tracking-tighter text-white">
              XP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white">
                  XPGAMPP Control Panel
                </h1>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  v8.4.4-2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Apache 2.4.63 &bull; PHP 8.4.4 (ZTS JIT) &bull; MySQL 9.2.0 &bull; PostgreSQL 17.4
              </p>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'control', label: 'Control Panel', icon: Server },
              { id: 'sql', label: 'Dual SQL Studio (MySQL 9 + PG 17)', icon: Database },
              { id: 'htdocs', label: 'htdocs & PHP 8.4 Runner', icon: FolderCode },
              { id: 'configs', label: 'Configs, Extensions & Logs', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-orange-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Stack Health Pill */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                runningCount === services.length
                  ? 'bg-emerald-400 animate-pulse'
                  : runningCount > 0
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-mono text-slate-300">
              {runningCount}/{services.length || 4} Daemons Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl w-full mx-auto px-4 py-5 flex-1 flex flex-col gap-5">
        {activeTab === 'control' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 9 Columns: XAMPP Service Matrix + Netstat + Stack Summary */}
            <div className="lg:col-span-9 space-y-5">
              {/* Classic XAMPP Modules Matrix */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-orange-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Modules & Service Daemons
                    </h2>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Root: <span className="text-slate-300">/home/user/hosting</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-mono text-[11px] uppercase">
                        <th className="py-3 px-4">Service / Module</th>
                        <th className="py-3 px-3">PID(s)</th>
                        <th className="py-3 px-3">Port(s)</th>
                        <th className="py-3 px-3">Uptime / RAM</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {services.map((svc) => {
                        const isRunning = svc.status === 'running';
                        const isBusy = busyService === svc.id || busyService === 'all';
                        return (
                          <tr
                            key={svc.id}
                            className="hover:bg-slate-800/30 transition"
                          >
                            {/* Module Name & Status Indicator */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`w-3 h-3 rounded-full shrink-0 ${
                                    isRunning
                                      ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                                      : 'bg-rose-500'
                                  }`}
                                />
                                <div>
                                  <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                                    {svc.name}
                                    <span
                                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                                        isRunning
                                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                      }`}
                                    >
                                      {svc.status}
                                    </span>
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                    v{svc.version} &bull; {svc.protocol}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* PIDs */}
                            <td className="py-3.5 px-3 font-mono text-slate-200">
                              {isRunning && svc.pids?.length ? svc.pids.join(', ') : '—'}
                            </td>

                            {/* Ports */}
                            <td className="py-3.5 px-3 font-mono">
                              {isRunning ? (
                                <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-emerald-300">
                                  {svc.ports.join(', ')}
                                </span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>

                            {/* Uptime / Memory */}
                            <td className="py-3.5 px-3 font-mono text-[11px] text-slate-300">
                              {isRunning ? (
                                <div>
                                  <div>Up: {formatUptime(svc.uptimeSeconds)}</div>
                                  <div className="text-slate-400">
                                    {svc.memoryMb} MB &bull; {svc.cpuPct}% CPU
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500">Offline</span>
                              )}
                            </td>

                            {/* Classic XAMPP Action Buttons: Start/Stop, Restart, Admin, Config, Logs */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-end gap-1.5">
                                {isRunning ? (
                                  <button
                                    onClick={() => handleServiceAction(svc.id, 'stop')}
                                    disabled={isBusy}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500/40 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs transition cursor-pointer"
                                  >
                                    <Square className="w-3 h-3 fill-current" />
                                    Stop
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleServiceAction(svc.id, 'start')}
                                    disabled={isBusy}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    Start
                                  </button>
                                )}

                                <button
                                  onClick={() => handleServiceAction(svc.id, 'restart')}
                                  disabled={isBusy}
                                  title="Restart Service"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                                >
                                  <RotateCw className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleAdminClick(svc)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-600/20 border border-orange-500/40 hover:bg-orange-600/30 text-orange-300 font-semibold text-xs transition cursor-pointer"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Admin
                                </button>

                                <button
                                  onClick={() => handleConfigClick(svc)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition cursor-pointer"
                                >
                                  Config
                                </button>

                                <button
                                  onClick={handleLogsClick}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition cursor-pointer"
                                >
                                  Logs
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Netstat Socket Table (when toggled) */}
              {showNetstat && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                      <Network className="w-4 h-4" />
                      Active TCP/IP Listening Sockets (Netstat Monitor)
                    </div>
                    <button
                      onClick={() => setShowNetstat(false)}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                          <th className="py-2 px-3">Proto</th>
                          <th className="py-2 px-3">Local Address</th>
                          <th className="py-2 px-3">Port</th>
                          <th className="py-2 px-3">PID</th>
                          <th className="py-2 px-3">Process / Daemon</th>
                          <th className="py-2 px-3">Socket State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {services.flatMap((svc) =>
                          svc.ports.map((port) => ({
                            proto: 'TCP',
                            addr: svc.id === 'php' ? '127.0.0.1' : '0.0.0.0',
                            port,
                            pid: svc.pids?.[0] || '—',
                            name: `${svc.name} (${svc.version})`,
                            state: svc.status === 'running' ? 'LISTEN' : 'CLOSED',
                          }))
                        ).map((sock, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 text-slate-300">{sock.proto}</td>
                            <td className="py-2 px-3 text-slate-300">{sock.addr}</td>
                            <td className="py-2 px-3 text-orange-400 font-bold">{sock.port}</td>
                            <td className="py-2 px-3 text-slate-300">{sock.pid}</td>
                            <td className="py-2 px-3 text-slate-200">{sock.name}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] ${
                                  sock.state === 'LISTEN'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {sock.state}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Quick Feature Cards: PHP 8.4 Runtime, MySQL 9.2 Studio, PostgreSQL 17 Studio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        PHP 8.4.4 Runtime
                      </span>
                      <Cpu className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">
                      Zend Engine 4.4.4 + JIT
                    </div>
                    <p className="text-xs text-slate-400">
                      Memory Limit: <code>{phpConfig.directives?.memory_limit || '512M'}</code> &bull;{' '}
                      {phpConfig.extensions?.length || 16} Extensions Active
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setConfigSubTab('extensions');
                        setActiveTab('configs');
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold transition cursor-pointer"
                    >
                      Extensions & phpinfo()
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        MySQL 9.2.0 Server
                      </span>
                      <Database className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">
                      InnoDB &bull; utf8mb4_0900_ai_ci
                    </div>
                    <p className="text-xs text-slate-400">
                      Port <code>3306</code> &bull; Default DB: <code>xampp_shop</code>
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setSqlEngine('mysql');
                        setActiveTab('sql');
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition cursor-pointer"
                    >
                      Open MySQL 9.2 Studio &rarr;
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                        PostgreSQL 17.4 Server
                      </span>
                      <Layers className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">
                      PGlite / WAL &bull; JSONB + Vector
                    </div>
                    <p className="text-xs text-slate-400">
                      Port <code>5432</code> &bull; Default DB: <code>pg_analytics</code>
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setSqlEngine('postgres');
                        setActiveTab('sql');
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-sky-500/20 border border-sky-500/40 hover:bg-sky-500/30 text-sky-300 text-xs font-semibold transition cursor-pointer"
                    >
                      Open PostgreSQL 17 Studio &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 3 Columns: Classic XAMPP Control Panel Utility Buttons */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2.5 h-fit">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-orange-400" />
                Stack Quick Actions
              </div>

              <button
                onClick={() => handleBulkAction('start')}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start All Services
              </button>

              <button
                onClick={() => handleBulkAction('stop')}
                className="w-full py-2 px-3 rounded-lg bg-rose-600/20 border border-rose-500/40 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop All Services
              </button>

              <button
                onClick={() => handleBulkAction('restart')}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Restart All Services
              </button>

              <hr className="border-slate-800 my-1" />

              <button
                onClick={() => setShowNetstat(!showNetstat)}
                className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Network className="w-3.5 h-3.5 text-sky-400" />
                  Netstat (Sockets)
                </span>
                <span className="text-[10px] font-mono text-slate-400">TCP</span>
              </button>

              <button
                onClick={() => setActiveTab('htdocs')}
                className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FolderCode className="w-3.5 h-3.5 text-amber-400" />
                  Explorer (htdocs)
                </span>
                <span className="text-[10px] font-mono text-slate-400">4 Apps</span>
              </button>

              <button
                onClick={() => {
                  setSqlEngine('mysql');
                  setActiveTab('sql');
                }}
                className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  phpMyAdmin (9.2)
                </span>
                <span className="text-[10px] font-mono text-amber-400">:3306</span>
              </button>

              <button
                onClick={() => {
                  setSqlEngine('postgres');
                  setActiveTab('sql');
                }}
                className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-sky-400" />
                  pgAdmin (17.4)
                </span>
                <span className="text-[10px] font-mono text-sky-400">:5432</span>
              </button>

              <button
                onClick={() => {
                  setConfigSubTab('extensions');
                  setActiveTab('configs');
                }}
                className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  phpinfo() 8.4.4
                </span>
                <span className="text-[10px] font-mono text-indigo-400">ZTS</span>
              </button>

              <button
                onClick={() => {
                  setConfigSubTab('docker');
                  setActiveTab('configs');
                }}
                className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Container className="w-3.5 h-3.5 text-emerald-400" />
                  Docker & CLI Stack
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Compose</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'sql' && (
          <SqlStudio
            initialEngine={sqlEngine}
            services={services}
            onRefreshStatus={fetchStatus}
          />
        )}

        {activeTab === 'htdocs' && <HtdocsManager onRefreshStatus={fetchStatus} />}

        {activeTab === 'configs' && (
          <ConfigAndLogs
            initialConfigKey={configTarget}
            initialSubTab={configSubTab}
            phpConfig={phpConfig}
            onRefreshStatus={fetchStatus}
          />
        )}

        {/* Persistent Bottom XAMPP Event Log Console */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-auto">
          <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono font-semibold text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-orange-400" />
              <span>XPGAMPP System Event Console</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {consoleEvents.length} events logged
            </span>
          </div>
          <div className="p-3 h-36 overflow-y-auto font-mono text-xs space-y-1 bg-slate-950/60">
            {consoleEvents
              .slice()
              .reverse()
              .map((ev) => (
                <div key={ev.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-500 shrink-0">[{ev.timestamp}]</span>
                  <span
                    className={`shrink-0 font-semibold ${
                      ev.level === 'error'
                        ? 'text-rose-400'
                        : ev.level === 'warn'
                        ? 'text-amber-400'
                        : 'text-sky-400'
                    }`}
                  >
                    [{ev.module}]
                  </span>
                  <span className="text-slate-300 break-all">{ev.message}</span>
                </div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
