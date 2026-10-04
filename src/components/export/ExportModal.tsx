import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  CheckCircle2,
  X,
  FileText,
  Code2,
  Zap,
  RefreshCw,
  RotateCcw,
  Power,
  ExternalLink,
  User,
  AlertTriangle,
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { generateHomeAssistantThemeYaml, generatePerViewSnippet } from '../../services/yamlGenerator';
import { 
  applyThemeDirectlyToHa, 
  reloadHomeAssistantThemes, 
  restartHomeAssistant 
} from '../../services/haService';
import { copyText } from '../../utils/copyText';
import { downloadFile } from '../../utils/download';
import { buildThemeBundle } from '../../services/themeBundle';
import { useStandalone } from '../../state/useStandalone';
import { IS_HOSTED } from '../../runtime';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  onThemeSaved?: (theme: ThemeConfig) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeSaved,
}) => {
  const standalone = useStandalone();
  const [activeTab, setActiveTab] = useState<'theme' | 'view'>('theme');
  const [copied, setCopied] = useState(false);
  const [copiedThemeName, setCopiedThemeName] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [installingToHa, setInstallingToHa] = useState(false);
  const [installResult, setInstallResult] = useState<{
    success: boolean;
    isNewTheme: boolean;
    message: string;
    filePath?: string;
  } | null>(null);

  const [isReloadingThemes, setIsReloadingThemes] = useState(false);
  const [themesReloadSuccess, setThemesReloadSuccess] = useState(false);

  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [isRestartingHa, setIsRestartingHa] = useState(false);
  const [restartMessage, setRestartMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAlreadyInstalled = Boolean(theme.isInstalled);
  const canInstall = !IS_HOSTED && !standalone;

  const yamlContent = activeTab === 'theme' 
    ? generateHomeAssistantThemeYaml(theme, 'local')
    : generatePerViewSnippet(theme);

  const handleCopy = async () => {
    if (!(await copyText(yamlContent))) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyThemeName = async () => {
    if (!(await copyText(theme.name))) return;
    setCopiedThemeName(true);
    setTimeout(() => setCopiedThemeName(false), 2000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const bundle = await buildThemeBundle(theme);
      downloadFile(bundle.fileName, bundle.bytes as BlobPart, 'application/zip');
    } catch (err: any) {
      setDownloadError(err?.message || 'Could not build the zip file');
    } finally {
      setDownloading(false);
    }
  };

  const handleInstallToHa = async () => {
    setInstallingToHa(true);
    setInstallResult(null);
    setShowRestartConfirm(false);
    setRestartMessage(null);

    const wasNew = !theme.isInstalled;
    const res = await applyThemeDirectlyToHa(theme);
    setInstallingToHa(false);

    if (res.success) {
      setInstallResult({
        success: true,
        isNewTheme: wasNew,
        message: res.message,
        filePath: res.filePath,
      });
      if (onThemeSaved) {
        onThemeSaved({ ...theme, isInstalled: true });
      }
    } else {
      setInstallResult({
        success: false,
        isNewTheme: wasNew,
        message: res.message,
      });
    }
  };

  const handleOpenUserProfile = () => {
    if (typeof window !== 'undefined') {
      if (window.top && window.top !== window) {
        window.top.location.href = '/profile';
      } else {
        window.open('/profile', '_blank');
      }
    }
  };

  const handleReloadThemes = async () => {
    setIsReloadingThemes(true);
    setThemesReloadSuccess(false);
    try {
      const ok = await reloadHomeAssistantThemes();
      if (ok) {
        setThemesReloadSuccess(true);
        setTimeout(() => setThemesReloadSuccess(false), 3000);
      }
    } finally {
      setIsReloadingThemes(false);
    }
  };

  const handleRefreshDashboard = () => {
    if (typeof window !== 'undefined') {
      if (window.top && window.top !== window) {
        window.top.location.reload();
      } else {
        window.location.reload();
      }
    }
  };

  const handleRestartHa = async () => {
    setIsRestartingHa(true);
    setShowRestartConfirm(false);
    const res = await restartHomeAssistant();
    setIsRestartingHa(false);
    setRestartMessage(res.message);
  };

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Download className="w-4 h-4 text-blue-400" />
            <span>{canInstall ? 'Export & Install' : 'Export'}: <span className="text-blue-300 font-semibold">{theme.name}</span></span>
            {isAlreadyInstalled && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                Installed
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {installResult && installResult.success && (
          <div className="border-b border-slate-800 p-4 transition-all">
            {installResult.isNewTheme ? (
              <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-blue-950/70 border border-emerald-500/40 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Theme Installed! Now Apply it in Home Assistant</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-600/40">
                    New Theme
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Home Assistant themes are activated per-user in your <strong>User Profile</strong> or dashboard view settings.
                </p>

                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-400">Theme Name:</span>
                    <span className="font-semibold text-white font-mono">{theme.name}</span>
                  </div>
                  <button
                    onClick={handleCopyThemeName}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 shrink-0 transition-colors"
                  >
                    {copiedThemeName ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedThemeName ? 'Copied!' : 'Copy Name'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleOpenUserProfile}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span>Open User Profile to Apply Theme</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/40 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                    <span>Active Theme Updated in Home Assistant</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-600/40">
                    Updated
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Your modifications have been written to <code className="text-blue-300 bg-slate-950 px-1 py-0.5 rounded text-[11px] font-mono">/config/themes/{theme.id}.yaml</code> and themes have been automatically reloaded.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={handleReloadThemes}
                    disabled={isReloadingThemes}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isReloadingThemes ? 'animate-spin' : ''}`} />
                    <span>{themesReloadSuccess ? 'Themes Reloaded!' : isReloadingThemes ? 'Reloading...' : 'Reload Themes'}</span>
                  </button>

                  <button
                    onClick={handleRefreshDashboard}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Refresh Lovelace</span>
                  </button>

                  <button
                    onClick={() => setShowRestartConfirm(true)}
                    disabled={isRestartingHa}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 font-semibold text-xs border border-amber-700/50 transition-colors disabled:opacity-50"
                  >
                    <Power className={`w-3.5 h-3.5 text-amber-400 ${isRestartingHa ? 'animate-pulse' : ''}`} />
                    <span>{isRestartingHa ? 'Restarting...' : 'Restart HA Core'}</span>
                  </button>
                </div>

                {showRestartConfirm && (
                  <div className="p-3 rounded-lg bg-amber-950/80 border border-amber-500/60 space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-amber-200 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Restart Home Assistant Core?</span>
                    </div>
                    <p className="text-[11px] text-amber-300/90 leading-relaxed">
                      This will restart Home Assistant services (taking ~20–30s). Are you sure you want to proceed?
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setShowRestartConfirm(false)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRestartHa}
                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow"
                      >
                        Confirm Restart
                      </button>
                    </div>
                  </div>
                )}

                {restartMessage && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-amber-500/40 text-xs text-amber-300 text-center font-medium">
                    {restartMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-slate-950/60 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'theme'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Complete Theme YAML (/config/themes)</span>
          </button>

          <button
            onClick={() => setActiveTab('view')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'view'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Per-View card_mod Snippet (UIX / card-mod)</span>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto bg-slate-950">
          {activeTab === 'view' && (
            <div className="mb-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-300 leading-relaxed space-y-2">
              <p>
                <strong className="text-white">What it does.</strong> The theme sets one background for the whole dashboard.
                This snippet gives a single dashboard view its own background, using the image of this theme. It is optional.
              </p>
              <ol className="list-decimal pl-5 space-y-0.5">
                <li>Open the dashboard and click the pencil icon (Edit dashboard).</li>
                <li>Open the three dots menu and choose <strong>Raw configuration editor</strong>.</li>
                <li>
                  Under <code className="text-blue-300">views:</code>, paste the snippet as a new view, or copy only its{' '}
                  <code className="text-blue-300">card_mod:</code> block into a view you already have.
                </li>
                <li>Change <code className="text-blue-300">title</code> and <code className="text-blue-300">path</code> if needed, then save.</li>
              </ol>
              <p>This needs UIX or card-mod. The downloaded zip contains this snippet and the same steps in its README.</p>
            </div>
          )}
          <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
            {yamlContent}
          </pre>
        </div>

        <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900">
          <span className="text-[11px] text-slate-400">
            {activeTab === 'view'
              ? 'Optional. Gives one dashboard view its own background.'
              : !canInstall
              ? 'Copy the YAML, or download a zip with every file in the folder Home Assistant expects.'
              : isAlreadyInstalled
              ? 'Click "Save Changes" to update /config/themes and reload HA.'
              : 'Click "Install Directly" to save to /config/themes and reload HA.'}
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              title="Zip with the theme file, the background image and a README, in the folder layout Home Assistant expects"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Preparing...' : 'Download .zip'}</span>
            </button>

            {canInstall && (
            <button
              onClick={handleInstallToHa}
              disabled={installingToHa}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50 ${
                isAlreadyInstalled
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {installingToHa 
                  ? (isAlreadyInstalled ? 'Saving Changes...' : 'Installing...') 
                  : (isAlreadyInstalled ? 'Save Changes to Home Assistant' : 'Install Directly to Home Assistant')}
              </span>
            </button>
            )}
          </div>
        </div>

        {downloadError && (
          <div className="bg-red-500/10 border-t border-red-500/30 p-2.5 text-center text-xs font-medium text-red-400">
            {downloadError}
          </div>
        )}

        {installResult && !installResult.success && (
          <div className="bg-red-500/10 border-t border-red-500/30 p-2.5 text-center text-xs font-medium text-red-400">
            {installResult.message}
          </div>
        )}
      </div>
    </div>
  );
};

