import React, { useState } from 'react';
import { X, Github, Download, CheckCircle2, AlertCircle, RefreshCw, Layers, ExternalLink } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { importThemesFromGitHubRepo } from '../../services/githubImporter';

interface GitHubImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThemesImported: (themes: ThemeConfig[]) => void;
}

export const GitHubImportModal: React.FC<GitHubImportModalProps> = ({
  isOpen,
  onClose,
  onThemesImported,
}) => {
  const [repoInput, setRepoInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [discoveredThemes, setDiscoveredThemes] = useState<ThemeConfig[]>([]);

  if (!isOpen) return null;

  const handleScanRepo = async () => {
    if (!repoInput.trim()) {
      setStatusMessage('Please enter a GitHub repository (e.g. "mattschwarz/tet-49-theme") or YAML URL.');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    setIsError(false);

    try {
      const res = await importThemesFromGitHubRepo(repoInput);
      if (res.success && res.themes.length > 0) {
        setDiscoveredThemes(res.themes);
        setStatusMessage(res.message);
        setIsError(false);
      } else {
        setStatusMessage(res.message || 'No themes could be extracted.');
        setIsError(true);
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to scan repository.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (discoveredThemes.length > 0) {
      onThemesImported(discoveredThemes);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-fade-in">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5 font-bold text-white text-base">
            <Github className="w-5 h-5 text-blue-400" />
            <span>Import Theme from Any GitHub Repository</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-300 leading-relaxed">
            Enter any public GitHub repository name or URL to automatically download, parse, and import community Home Assistant themes into your HATS library.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-200">
              GitHub Repository or Raw YAML URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScanRepo()}
                placeholder="e.g. mattschwarz/tet-49-theme or https://github.com/..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleScanRepo}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Scan Repo</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Popular: <button onClick={() => setRepoInput('mattschwarz/tet-49-theme')} className="text-blue-400 hover:underline">tet-49-theme</button>, <button onClick={() => setRepoInput('Nezz/homeassistant-visionos-theme')} className="text-blue-400 hover:underline">visionos-theme</button></span>
            </div>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
              isError 
                ? 'bg-rose-950/60 border-rose-800/80 text-rose-200' 
                : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
            }`}>
              {isError ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{statusMessage}</div>
            </div>
          )}

          {discoveredThemes.length > 0 && (
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  Found {discoveredThemes.length} Theme(s) to Import:
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {discoveredThemes.map((t, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.palette.primary }} />
                      <span className="font-semibold text-white">{t.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {t.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Cancel
          </button>
          {discoveredThemes.length > 0 && (
            <button
              onClick={handleConfirmImport}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all"
            >
              Import {discoveredThemes.length} Theme(s) to HATS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
