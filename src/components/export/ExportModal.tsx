import React, { useState } from 'react';
import { Download, Copy, Check, X, FileText, Code2, Zap } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { generateHomeAssistantThemeYaml, generatePerViewSnippet } from '../../services/yamlGenerator';
import { applyThemeDirectlyToHa } from '../../services/haService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'view'>('theme');
  const [copied, setCopied] = useState(false);
  const [installingToHa, setInstallingToHa] = useState(false);
  const [haInstallStatus, setHaInstallStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const yamlContent = activeTab === 'theme' 
    ? generateHomeAssistantThemeYaml(theme, 'local')
    : generatePerViewSnippet(theme);

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab === 'theme' ? `${theme.id}.yaml` : 'per-view-background.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Download className="w-4 h-4 text-blue-400" />
            <span>Export & Install Home Assistant Theme</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

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
            <span>Per-View card_mod Snippet</span>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto bg-slate-950">
          <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
            {yamlContent}
          </pre>
        </div>

        <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900">
          <span className="text-[11px] text-slate-400">
            {activeTab === 'theme' 
              ? 'Click "Install Directly" to save to /config/themes and reload HA.'
              : 'Paste into Lovelace view raw configuration editor.'}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={async () => {
                setInstallingToHa(true);
                const res = await applyThemeDirectlyToHa(theme);
                setInstallingToHa(false);
                setHaInstallStatus(res.message);
                setTimeout(() => setHaInstallStatus(null), 6000);
              }}
              disabled={installingToHa}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{installingToHa ? 'Installing...' : 'Install Directly to Home Assistant'}</span>
            </button>
          </div>
        </div>

        {haInstallStatus && (
          <div className="bg-emerald-500/10 border-t border-emerald-500/30 p-2.5 text-center text-xs font-medium text-emerald-400">
            {haInstallStatus}
          </div>
        )}
      </div>
    </div>
  );
};
