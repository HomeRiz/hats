import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
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
  Puzzle
} from 'lucide-react';
import { getHaDiagnostics, fixHaConfiguration, DiagnosticsResult } from '../../services/haService';

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
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null);
  const [fixMessage, setFixMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleAutoFix = async () => {
    setFixing(true);
    setFixMessage(null);
    const res = await fixHaConfiguration({ addThemes: true, addCardMod: true });
    setFixing(false);
    if (res.success) {
      setFixMessage('✅ configuration.yaml successfully updated and themes reloaded in Home Assistant!');
      fetchDiagnostics();
      if (onConfigFixed) onConfigFixed();
    } else {
      setFixMessage(`❌ ${res.message}`);
    }
  };

  const yamlSnippet = `# Load frontend themes from themes folder\nfrontend:\n  themes: !include_dir_merge_named themes\n  extra_module_url:\n    - /hacsfiles/lovelace-card-mod/card-mod.js`;

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(yamlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
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
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                    Action Recommended
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Inspect and 1-click configure required dependencies for themes & card-mod
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

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {diagnostics?.hasCardMod ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-200 text-sm">
                    lovelace-card-mod (<code className="text-xs text-blue-300">extra_module_url</code>)
                  </div>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    {diagnostics?.hasCardMod
                      ? "Registered! Glassmorphism, backdrop-blur, custom specular sheens, and card shaders will render."
                      : "Required for glassmorphism and theme animations. Can be auto-injected into extra_module_url."}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase shrink-0 ${
                diagnostics?.hasCardMod 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {diagnostics?.hasCardMod ? 'Active' : 'Missing'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {diagnostics?.hasHacs ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-200 text-sm">HACS (Home Assistant Community Store)</div>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    {diagnostics?.hasHacs
                      ? "Detected. You can install custom Lovelace cards and frontend resources seamlessly."
                      : "Optional companion for 1-click community card installs."}
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
          </div>

          {(!diagnostics?.hasThemesDirective || !diagnostics?.hasCardMod) && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-purple-900/30 border border-indigo-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    1-Click Auto-Configuration
                  </h4>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Automatically inject missing theme directives and card-mod URLs into your <code className="text-blue-300">configuration.yaml</code> with automatic backup.
                  </p>
                </div>
                <button
                  onClick={handleAutoFix}
                  disabled={fixing}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 shrink-0 transition-all disabled:opacity-50"
                >
                  <Wrench className={`w-3.5 h-3.5 ${fixing ? 'animate-spin' : ''}`} />
                  <span>{fixing ? 'Patching...' : 'Auto-Fix Now'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                Manual YAML Reference (<code className="text-xs text-blue-300">configuration.yaml</code>)
              </label>
              <button
                onClick={handleCopyYaml}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
              {yamlSnippet}
            </pre>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Puzzle className="w-3.5 h-3.5 text-purple-400" />
              Recommended Lovelace Add-ons & Cards
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">lovelace-card-mod</div>
                  <div className="text-[10px] text-slate-400">Glass blur & CSS theme animations</div>
                </div>
                <a
                  href="https://github.com/thomasloven/lovelace-card-mod"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Mushroom Cards</div>
                  <div className="text-[10px] text-slate-400">Modern sleek UI sliders & chips</div>
                </div>
                <a
                  href="https://github.com/piitaya/lovelace-mushroom"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Bubble Card</div>
                  <div className="text-[10px] text-slate-400">Pop-up glassmorphism subviews</div>
                </div>
                <a
                  href="https://github.com/Clooos/Bubble-Card"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Layout Card</div>
                  <div className="text-[10px] text-slate-400">Advanced CSS grid & masonry</div>
                </div>
                <a
                  href="https://github.com/thomasloven/lovelace-layout-card"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
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
