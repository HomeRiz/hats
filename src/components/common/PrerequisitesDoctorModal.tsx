import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Wrench,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  X,
  FileCode,
  Sparkles,
  Layers,
  Puzzle,
  DownloadCloud,
} from 'lucide-react';
import { getHaDiagnostics, fixHaConfiguration, repairAllHaThemes, DiagnosticsResult } from '../../services/haService';

interface PrerequisitesDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigFixed?: () => void;
}

export const PrerequisitesDoctorModal: React.FC<PrerequisitesDoctorModalProps> = ({
  isOpen,
  onClose,
  onConfigFixed,
}) => {
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null);
  const [fixMessage, setFixMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const haHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const getHacsUrl = (repoId: string | number) => `http://${haHost}:8123/hacs/repository/${repoId}`;

  const fetchDiagnostics = async () => {
    setLoading(true);
    const data = await getHaDiagnostics();
    setDiagnostics(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
      setFixMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const exactCardModUrl = diagnostics?.cardModExactUrl || `/hacsfiles/lovelace-card-mod/card-mod.js?hacstag=${diagnostics?.cardModHacstag || '190927524421'}`;
  const cardModTag = diagnostics?.cardModHacstag || (exactCardModUrl.includes('hacstag=') ? exactCardModUrl.split('hacstag=')[1] : '');

  const handleAutoFix = async () => {
    setFixing(true);
    setFixMessage(null);
    const res = await fixHaConfiguration({ 
      addThemes: true, 
      addCardMod: true,
      exactUrl: exactCardModUrl
    });
    setFixing(false);
    if (res.success) {
      setFixMessage(`✅ configuration.yaml successfully updated with live HA module: ${exactCardModUrl}`);
      fetchDiagnostics();
      if (onConfigFixed) onConfigFixed();
    } else {
      setFixMessage(`❌ ${res.message}`);
    }
  };

  const handleRepairThemes = async () => {
    setRepairing(true);
    setRepairStatus('Scanning and sanitizing all installed themes on disk...');
    const res = await repairAllHaThemes();
    setRepairing(false);
    if (res.success) {
      setRepairStatus(`✅ ${res.message}`);
      fetchDiagnostics();
    } else {
      setRepairStatus(`❌ ${res.message}`);
    }
  };

  const yamlSnippet = `# Load frontend themes from themes folder\nfrontend:\n  themes: !include_dir_merge_named themes\n  extra_module_url:\n    - ${exactCardModUrl}`;
  const themesDirectiveOnly = `frontend:\n  themes: !include_dir_merge_named themes`;
  const cardModDirectiveOnly = `frontend:\n  extra_module_url:\n    - ${exactCardModUrl}`;

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (_) {
      return false;
    }
  };

  const handleCopyYaml = async (textToCopy: string = yamlSnippet) => {
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCardModOnDisk = Boolean(diagnostics?.cardModOnDisk);
  const isCardModInConfig = Boolean(diagnostics?.hasCardModInConfig);
  const isCardModNeedsConfig = Boolean(diagnostics?.cardModNeedsConfig);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Home Assistant Environment Doctor
                {diagnostics?.readyForGlassmorphism ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                    Ready
                  </span>
                ) : isCardModNeedsConfig ? (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold animate-pulse">
                    Plugin Detected • YAML Fix Needed
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                    Action Recommended
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Inspect, install missing plugins via HACS, and 1-click configure required YAML directives
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDiagnostics}
              disabled={loading}
              title="Refresh status"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {fixMessage && (
            <div className={`p-3 rounded-xl border text-xs font-medium ${
              fixMessage.startsWith('✅') 
                ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-200'
                : 'bg-rose-950/50 border-rose-700/60 text-rose-200'
            }`}>
              {fixMessage}
            </div>
          )}

          {isCardModNeedsConfig && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-2 shadow-lg shadow-amber-950/30">
              <div className="flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping mt-1 shrink-0" />
                <div className="flex-1">
                  <h4 className="font-bold text-amber-200 text-sm flex items-center gap-1.5">
                    card-mod Detected on Disk!
                  </h4>
                  <p className="text-amber-300/80 text-xs mt-0.5 leading-relaxed">
                    The plugin was found in <code className="text-amber-200 bg-amber-950/60 px-1 py-0.5 rounded">/config/www/community/lovelace-card-mod</code>. 
                    Click <strong>Auto-Fix YAML Bridge</strong> below to register it in <code className="text-amber-200">configuration.yaml</code> with tag <code className="text-amber-200">?hacstag={cardModTag}</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Core Prerequisites
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {diagnostics?.hasThemesDirective ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-200 text-sm">
                    Themes Include Directive (<code className="text-xs text-blue-300">frontend.themes</code>)
                  </div>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    {diagnostics?.hasThemesDirective
                      ? "Configured in configuration.yaml. Home Assistant loads all themes from '/config/themes'."
                      : "Missing from configuration.yaml. Themes will not be registered by Home Assistant until added."}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase shrink-0 ${
                diagnostics?.hasThemesDirective 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {diagnostics?.hasThemesDirective ? 'Configured' : 'Missing'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {isCardModInConfig ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : isCardModOnDisk ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                      lovelace-card-mod (<code className="text-xs text-blue-300">extra_module_url</code>)
                      {isCardModOnDisk && !isCardModInConfig && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-500/30">
                          Detected on disk
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">
                      {isCardModInConfig
                        ? `Registered in configuration.yaml (?hacstag=${cardModTag}). Glassmorphism, backdrop-blur, and shaders will render.`
                        : isCardModOnDisk
                        ? `Downloaded in /config/www/community/! Click Auto-Fix to link it into configuration.yaml.`
                        : `Required for liquid glassmorphism, blur effects, and card animations. Install from HACS repository.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${
                    isCardModInConfig 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : isCardModOnDisk
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {isCardModInConfig ? 'Active' : isCardModOnDisk ? 'On Disk' : 'Not Installed'}
                  </span>
                </div>
              </div>

              {!isCardModOnDisk && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Step 1: Install plugin in HACS, then return here to Auto-Fix.
                  </span>
                  <a
                    href={getHacsUrl(190927524)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>Install via HACS</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className={`w-5 h-5 ${diagnostics?.hasHacs ? 'text-emerald-400' : 'text-slate-500'} shrink-0 mt-0.5`} />
                <div>
                  <div className="font-semibold text-slate-200 text-sm">HACS (Home Assistant Community Store)</div>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    {diagnostics?.hasHacs
                      ? "Detected. You can install custom Lovelace cards and frontend resources with 1 click."
                      : "Optional companion for installing community Lovelace cards."}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase shrink-0 ${
                diagnostics?.hasHacs 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {diagnostics?.hasHacs ? 'Installed' : 'Optional'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                      <span>Theme Safety & Pointer Isolation Guard</span>
                      <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono border border-cyan-500/30">
                        Active Protection
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">
                      Automatically scans all installed YAML themes in <code className="text-xs text-blue-300">/config/themes</code> for pointer-intercepting fixed overlays, unescaped quotes, or syntax bugs, repairing them with zero downtime.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRepairThemes}
                  disabled={repairing}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/90 hover:bg-cyan-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${repairing ? 'animate-spin' : ''}`} />
                  <span>{repairing ? 'Scanning...' : 'Scan & Repair Themes'}</span>
                </button>
              </div>

              {repairStatus && (
                <div className="text-[11px] p-2 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-cyan-200 font-medium">
                  {repairStatus}
                </div>
              )}
            </div>
          </div>

          {(!diagnostics?.hasThemesDirective || isCardModNeedsConfig || !isCardModInConfig) && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40 border border-indigo-500/50 space-y-3 shadow-lg shadow-indigo-950/40">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    1-Click Auto-Configuration Bridge
                  </h4>
                  <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                    Automatically inject missing theme directives and <code className="text-blue-300">extra_module_url</code> into <code className="text-blue-300">configuration.yaml</code> with automatic backup.
                  </p>
                </div>
                <button
                  onClick={handleAutoFix}
                  disabled={fixing}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/30 flex items-center gap-2 shrink-0 transition-all disabled:opacity-50"
                >
                  <Wrench className={`w-3.5 h-3.5 ${fixing ? 'animate-spin' : ''}`} />
                  <span>{fixing ? 'Patching...' : 'Auto-Fix YAML Bridge'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                Manual YAML Reference (<code className="text-xs text-blue-300">configuration.yaml</code>)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopyYaml(themesDirectiveOnly)}
                  title="Copy only the themes directive"
                  className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  <Copy className="w-2.5 h-2.5" />
                  <span>Copy Themes Only</span>
                </button>
                <button
                  onClick={() => handleCopyYaml(cardModDirectiveOnly)}
                  title="Copy only the card-mod extra_module_url directive"
                  className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  <Copy className="w-2.5 h-2.5" />
                  <span>Copy card-mod Only</span>
                </button>
                <button
                  onClick={() => handleCopyYaml(yamlSnippet)}
                  title="Copy entire frontend YAML block"
                  className="text-[11px] text-slate-200 hover:text-white font-semibold flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied All!' : 'Copy All'}</span>
                </button>
              </div>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed select-text cursor-text">
              {yamlSnippet}
            </pre>
            <p className="text-[11px] text-slate-500">
              Tip: You can manually highlight and select any part of the text above, or click the individual copy buttons.
            </p>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Puzzle className="w-3.5 h-3.5 text-purple-400" />
              Recommended Lovelace Add-ons & Cards
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'card-mod',
                  name: 'lovelace-card-mod',
                  desc: 'Glass blur & CSS theme shaders',
                  hacsId: 190927524,
                  installed: Boolean(isCardModOnDisk || isCardModInConfig),
                },
                {
                  id: 'mushroom',
                  name: 'Mushroom Cards',
                  desc: 'Modern sleek UI sliders & chips',
                  hacsId: 444350375,
                  installed: Boolean(diagnostics?.detectedCards.includes('mushroom')),
                },
                {
                  id: 'bubble-card',
                  name: 'Bubble Card',
                  desc: 'Pop-up glassmorphism subviews',
                  hacsId: 680112919,
                  installed: Boolean(diagnostics?.detectedCards.includes('bubble-card')),
                },
                {
                  id: 'layout-card',
                  name: 'Layout Card',
                  desc: 'Advanced CSS grid & masonry',
                  hacsId: 156434866,
                  installed: Boolean(diagnostics?.detectedCards.includes('layout-card')),
                },
              ].map((card) => (
                <div key={card.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>{card.name}</span>
                      {card.installed && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400">{card.desc}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {card.installed ? (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Installed</span>
                      </span>
                    ) : (
                      <a
                        href={getHacsUrl(card.hacsId)}
                        target="_blank"
                        rel="noreferrer"
                        title="Install via HACS"
                        className="px-2.5 py-1 rounded-md bg-blue-600/80 hover:bg-blue-600 text-white font-medium text-[10px] flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <DownloadCloud className="w-3 h-3" />
                        <span>Install in HACS</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-end bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
