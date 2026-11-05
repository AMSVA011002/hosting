import React, { useState, useEffect } from 'react';
import {
  Folder,
  FileCode,
  Play,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
  Code2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function HtdocsManager({ onRefreshStatus }) {
  const [tree, setTree] = useState([]);
  const [selectedPath, setSelectedPath] = useState('dashboard/index.php');
  const [fileContent, setFileContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [execResult, setExecResult] = useState(null);
  const [execError, setExecError] = useState(null);
  const [newPathInput, setNewPathInput] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'preview' | 'code'

  const fetchTree = async () => {
    try {
      const res = await fetch('/api/htdocs');
      const data = await res.json();
      if (res.ok) setTree(data.tree || []);
    } catch {
      // ignore
    }
  };

  const loadAndRunFile = async (relPath) => {
    setSelectedPath(relPath);
    try {
      const res = await fetch(`/api/htdocs/file?path=${encodeURIComponent(relPath)}`);
      const data = await res.json();
      if (res.ok) {
        setFileContent(data.content);
        await executeScript(relPath);
      }
    } catch {
      // ignore
    }
  };

  const executeScript = async (relPath = selectedPath) => {
    setRunning(true);
    setExecError(null);
    try {
      const res = await fetch('/api/htdocs/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: relPath }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExecError(data.error || 'Execution failed');
        setExecResult(null);
      } else {
        setExecResult(data);
        if (onRefreshStatus) onRefreshStatus();
      }
    } catch (err) {
      setExecError(err.message);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    fetchTree();
    loadAndRunFile('dashboard/index.php');
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/htdocs/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedPath, content: fileContent }),
      });
      if (res.ok) {
        await executeScript(selectedPath);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    const cleaned = newPathInput.trim().replace(/^\/+/, '');
    if (!cleaned) return;
    const defaultPhp = `<?php\ndeclare(strict_types=1);\n\n$title = 'New PHP 8.4 App (${cleaned})';\n$products = db_query('mysql', 'SELECT sku, name, price FROM products LIMIT 3');\n?>\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8" />\n  <title><?= $title ?></title>\n  <style>body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; }</style>\n</head>\n<body>\n  <h1><?= $title ?></h1>\n  <p>Running on PHP <?= $phpVersion ?> at <?= $requestTime ?></p>\n</body>\n</html>\n`;

    const res = await fetch('/api/htdocs/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: cleaned, content: defaultPhp }),
    });
    const data = await res.json();
    if (res.ok) {
      setTree(data.tree || []);
      setShowNewModal(false);
      setNewPathInput('');
      await loadAndRunFile(cleaned);
    }
  };

  const handleDeleteFile = async (relPath) => {
    const res = await fetch(`/api/htdocs/file?path=${encodeURIComponent(relPath)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (res.ok) {
      setTree(data.tree || []);
      if (selectedPath === relPath) {
        loadAndRunFile('dashboard/index.php');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left Sidebar: htdocs Directory Tree */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              DocumentRoot Explorer
            </div>
            <div className="text-[11px] font-mono text-orange-400 mt-0.5">/hosting/htdocs/</div>
          </div>
          <button
            onClick={() => setShowNewModal(!showNewModal)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>

        {showNewModal && (
          <form
            onSubmit={handleCreateFile}
            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2"
          >
            <label className="block text-[11px] text-slate-400">
              Relative path in <code>htdocs/</code>:
            </label>
            <input
              type="text"
              value={newPathInput}
              onChange={(e) => setNewPathInput(e.target.value)}
              placeholder="e.g. my-app/index.php"
              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 focus:outline-none focus:border-orange-500"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 rounded bg-orange-600 text-white text-[11px] font-semibold cursor-pointer"
              >
                Create PHP File
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2 overflow-y-auto max-h-[480px] pr-1">
          {tree.map((item) => (
            <div
              key={item.path}
              className="border border-slate-800/80 rounded-lg bg-slate-950/60 p-2"
            >
              {item.type === 'directory' ? (
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 px-1.5 py-1">
                    <Folder className="w-3.5 h-3.5 fill-amber-400/20 text-amber-400" />
                    <span>{item.name}/</span>
                  </div>
                  <div className="mt-1 pl-3 space-y-1">
                    {item.children?.map((child) => (
                      <div
                        key={child.path}
                        className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-mono transition ${
                          selectedPath === child.path
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                            : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <button
                          onClick={() => loadAndRunFile(child.path)}
                          className="flex items-center gap-1.5 truncate text-left flex-1 cursor-pointer"
                        >
                          <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="truncate">{child.name}</span>
                        </button>
                        {child.path !== 'dashboard/index.php' && (
                          <button
                            onClick={() => handleDeleteFile(child.path)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                            title="Delete file"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => loadAndRunFile(item.path)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-mono cursor-pointer ${
                    selectedPath === item.path
                      ? 'bg-orange-500/20 text-orange-300'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-sky-400" />
                  {item.name}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Main Area: Code Editor & Live PHP 8.4 Viewport */}
      <div className="lg:col-span-9 flex flex-col gap-4">
        {/* Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-semibold">
              PHP 8.4.4
            </span>
            <span className="font-mono text-xs text-slate-200">
              /htdocs/<strong className="text-orange-400">{selectedPath}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
              {['split', 'code', 'preview'].map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-2.5 py-1 rounded-md capitalize cursor-pointer ${
                    viewMode === m ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-sky-400" />
              {saving ? 'Saving...' : 'Save File'}
            </button>

            <button
              onClick={() => executeScript(selectedPath)}
              disabled={running}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {running ? 'Running...' : 'Run in PHP 8.4'}
            </button>

            <a
              href={`/htdocs/${selectedPath}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/20 border border-orange-500/40 hover:bg-orange-600/30 text-orange-300 text-xs font-medium transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Route
            </a>
          </div>
        </div>

        {/* Editor & Live Preview Grid */}
        <div
          className={`grid gap-4 ${
            viewMode === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {(viewMode === 'split' || viewMode === 'code') && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-mono">
                  <Code2 className="w-3.5 h-3.5 text-orange-400" />
                  Source Editor ({selectedPath})
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  db_query(&apos;mysql&apos; | &apos;postgres&apos;, $sql) supported
                </span>
              </div>
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                rows={18}
                spellCheck={false}
                className="w-full flex-1 font-mono text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-orange-500 resize-y"
              />
            </div>
          )}

          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800 text-xs">
                <span className="flex items-center gap-1.5 font-mono text-slate-300">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Apache 2.4.63 + PHP 8.4.4 Output
                </span>
                {execResult && (
                  <span className="flex items-center gap-2 font-mono text-[11px] text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    HTTP {execResult.status} &bull; {execResult.durationMs} ms
                  </span>
                )}
              </div>

              {execError ? (
                <div className="p-4 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs font-mono flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>{execError}</div>
                </div>
              ) : (
                <iframe
                  title="PHP 8.4 Execution Output"
                  srcDoc={execResult?.html || '<body style="background:#0f172a;color:#94a3b8;font-family:sans-serif;padding:20px;">Executing PHP 8.4.4 script...</body>'}
                  className="w-full h-[400px] rounded-lg border border-slate-800 bg-slate-950"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
