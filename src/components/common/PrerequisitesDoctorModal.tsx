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
  DownloadCloud,
} from 'lucide-react';
import { getHaDiagnostics, fixHaConfiguration, repairAllHaThemes, getGithubStatus, saveGithubToken, waitForAddonBackUp, GithubStatus, DiagnosticsResult } from '../../services/haService';
import { KeyRound } from 'lucide-react';
import { GithubIcon } from './icons/GithubIcon';
import { CustomComponentsPanel } from './CustomComponentsPanel';
import { ThemeConfig } from '../../types/theme';

interface PrerequisitesDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigFixed?: () => void;
  themes?: ThemeConfig[];
}

export const PrerequisitesDoctorModal: React.FC<PrerequisitesDoctorModalProps> = ({
  isOpen,
  onClose,
  onConfigFixed,
  themes = [],
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'custom-components'>('diagnostics');
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null);
  const [fixMessage, setFixMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [githubStatus, setGithubStatus] = useState<GithubStatus>({ tokenConfigured: false, targetRepo: 'HomeRiz/hats', canSaveToken: false });
  const [tokenInput, setTokenInput] = useState('');
  const [savingToken, setSavingToken] = useState(false);
  const [tokenMessage, setTokenMessage] = useState<string | null>(null);

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
      setTokenMessage(null);
      setTokenInput('');
      getGithubStatus().then(setGithubStatus);
    }
  }, [isOpen]);

  const applyTokenChange = async (token: string, savedMessage: string) => {
    setSavingToken(true);
    setTokenMessage(null);
    const res = await saveGithubToken(token);
    if (!res.success) {
      setSavingToken(false);
      setTokenMessage(`❌ ${res.error}`);
      return;
    }
    setTokenInput('');
    if (res.restarting) {
      setTokenMessage('Saved. Restarting HATS to apply it (a few seconds)...');
      const backUp = await waitForAddonBackUp();
      setSavingToken(false);
      setTokenMessage(backUp ? savedMessage : '⚠️ Saved, but HATS did not come back up in time. Reopen this dialog to check, or restart it from Settings, Add-ons, HATS.');
      getGithubStatus().then(setGithubStatus);
    } else {
      setSavingToken(false);
      setTokenMessage(savedMessage);
      getGithubStatus().then(setGithubStatus);
    }
  };

  const handleSaveToken = () =>
    applyTokenChange(tokenInput.trim(), '✅ GitHub token saved and applied. It stays on the add-on server and is used for theme pull requests.');

  const handleClearToken = () => applyTokenChange('', 'Token removed.');

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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in cursor-pointer"
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

        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-900/90">
          {(['diagnostics', 'custom-components'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'diagnostics' ? 'Diagnostics' : 'Custom Components'}
            </button>
          ))}
        </div>

        {activeTab === 'custom-components' ? (
          <div className="overflow-y-auto flex-1">
            <CustomComponentsPanel
              themes={themes}
              isActive={isOpen && activeTab === 'custom-components'}
              diagnostics={diagnostics}
              isCardModInstalled={Boolean(isCardModOnDisk || isCardModInConfig)}
              getHacsUrl={getHacsUrl}
            />
          </div>
        ) : (
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
              <GithubIcon className="w-3.5 h-3.5 text-purple-400" />
              GitHub Token for Theme Submissions
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <p className="text-[11px] text-slate-400">
                Used only by <span className="font-semibold text-slate-300">Send PR / Issue</span> to fork {githubStatus.targetRepo}, commit your
                theme and open a pull request. It stays on the add-on server, is only sent to api.github.com, and is never shown back in
                this UI.
              </p>

              <div className="flex items-center gap-2 text-[11px]">
                {githubStatus.tokenConfigured ? (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>A token is saved</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                    No token saved
                  </span>
                )}
              </div>

              {githubStatus.canSaveToken ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <KeyRound className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <input
                        type="password"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        placeholder={githubStatus.tokenConfigured ? 'Enter a new token to replace it' : 'ghp_xxxxxxxxxxxx'}
                        autoComplete="off"
                        title="Classic token: tick only public_repo. Fine-grained token: Contents + Pull requests, Read and write."
                        className="w-full bg-transparent text-slate-200 text-xs font-mono outline-none"
                      />
                    </div>
                    <button
                      onClick={handleSaveToken}
                      disabled={savingToken || !tokenInput.trim()}
                      title="Save this token to the add-on's own Configuration and restart HATS to apply it (a few seconds)."
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shrink-0"
                    >
                      {savingToken ? 'Saving...' : 'Save'}
                    </button>
                    {githubStatus.tokenConfigured && (
                      <button
                        onClick={handleClearToken}
                        disabled={savingToken}
                        title="Remove the saved token"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold shrink-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {tokenMessage && <p className="text-[11px] text-slate-300">{tokenMessage}</p>}
                </>
              ) : (
                <p className="text-[11px] text-amber-400">
                  Saving from here needs HATS running as a Home Assistant Add-on. In standalone/dev mode, paste the token directly in the
                  Send PR / Issue dialog instead (used once, never saved).
                </p>
              )}

              <details className="text-[11px] text-slate-400">
                <summary className="cursor-pointer text-slate-300 font-semibold">Prefer secrets.yaml instead?</summary>
                <div className="pt-1.5 space-y-1">
                  <p>
                    Add a line to <code className="text-amber-200">/config/secrets.yaml</code>, e.g. <code className="text-amber-200">hats_github_token: ghp_xxxxxxxxxxxx</code>,
                    then in <span className="text-slate-300">Settings → Add-ons → HATS → Configuration</span>, switch to YAML mode and set{' '}
                    <code className="text-amber-200">github_token: !secret hats_github_token</code>.
                  </p>
                  <p>
                    Known Home Assistant caveat: re-saving that Configuration page from the UI afterwards can expand the <code className="text-amber-200">!secret</code> reference back into the plain token on screen. The Save button above avoids this entirely by writing the token directly, without ever displaying it.
                  </p>
                </div>
              </details>

              <p className="text-[11px] text-slate-500">
                Token scope: classic token &rarr; tick only <span className="font-semibold">public_repo</span>. Private repository &rarr;
                use a fine-grained token limited to that repository with <span className="font-semibold">Contents</span> and{' '}
                <span className="font-semibold">Pull requests</span> and <span className="font-semibold">Issues</span> set to Read and write. Avoid <code>repo</code>, <code>admin:*</code>,{' '}
                <code>delete_repo</code> and <code>user</code>.
              </p>
            </div>
          </div>
        </div>
        )}

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
