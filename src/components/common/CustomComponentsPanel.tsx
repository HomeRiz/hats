import React, { useMemo, useState } from 'react';
import { Puzzle, CheckCircle2, XCircle, HelpCircle, ExternalLink, Check, DownloadCloud } from 'lucide-react';
import { GithubIcon } from './icons/GithubIcon';
import { ThemeConfig, RequiredIntegration } from '../../types/theme';
import { useHacsRepositories } from '../../services/useHacsRepositories';
import { getIntegrationStatus, IntegrationState } from '../../services/integrationStatus';
import { DiagnosticsResult } from '../../services/haService';

interface CustomComponentsPanelProps {
  themes: ThemeConfig[];
  isActive: boolean;
  diagnostics: DiagnosticsResult | null;
  isCardModInstalled: boolean;
  getHacsUrl: (repoId: string | number) => string;
}

const RECOMMENDED_CARDS = [
  { id: 'card-mod', name: 'lovelace-card-mod', desc: 'Glass blur & CSS theme shaders', hacsId: 190927524 },
  { id: 'mushroom', name: 'Mushroom Cards', desc: 'Modern sleek UI sliders & chips', hacsId: 444350375 },
  { id: 'bubble-card', name: 'Bubble Card', desc: 'Pop-up glassmorphism subviews', hacsId: 680112919 },
  { id: 'layout-card', name: 'Layout Card', desc: 'Advanced CSS grid & masonry', hacsId: 156434866 },
] as const;

const STATE_LABEL: Record<IntegrationState, string> = {
  installed: 'Installed',
  not_installed: 'In HACS - not installed',
  unknown_to_hacs: 'Not found in HACS',
};

const STATE_STYLE: Record<IntegrationState, string> = {
  installed: 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300',
  not_installed: 'bg-amber-950/50 border-amber-700/60 text-amber-300',
  unknown_to_hacs: 'bg-slate-800/60 border-slate-700/60 text-slate-400',
};

const STATE_ICON: Record<IntegrationState, React.ReactNode> = {
  installed: <CheckCircle2 className="w-3.5 h-3.5" />,
  not_installed: <XCircle className="w-3.5 h-3.5" />,
  unknown_to_hacs: <HelpCircle className="w-3.5 h-3.5" />,
};

export const CustomComponentsPanel: React.FC<CustomComponentsPanelProps> = ({
  themes,
  isActive,
  diagnostics,
  isCardModInstalled,
  getHacsUrl,
}) => {
  const { repositories, loading, available } = useHacsRepositories(isActive);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');

  const themesWithIntegrations = useMemo(
    () => themes.filter((t) => (t.requirements?.requiredIntegrations?.length ?? 0) > 0),
    [themes]
  );

  const selectedTheme = themesWithIntegrations.find((t) => t.id === selectedThemeId) ?? themesWithIntegrations[0];
  const requiredIntegrations = selectedTheme?.requirements?.requiredIntegrations ?? [];

  const openIntegration = (integration: RequiredIntegration) => {
    const status = getIntegrationStatus(integration, repositories);
    if (status.hacsRepoId) {
      window.open(getHacsUrl(status.hacsRepoId), '_blank', 'noopener,noreferrer');
    } else if (integration.repoFullName) {
      window.open(`https://github.com/${integration.repoFullName}`, '_blank', 'noopener,noreferrer');
    }
  };

  const recommendedCardsWithStatus = RECOMMENDED_CARDS.map((card) => ({
    ...card,
    installed: card.id === 'card-mod' ? isCardModInstalled : Boolean(diagnostics?.detectedCards.includes(card.id)),
  }));

  return (
    <div className="p-6 space-y-6 text-xs">
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Puzzle className="w-3.5 h-3.5 text-purple-400" />
          Recommended Lovelace Add-ons & Cards
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {recommendedCardsWithStatus.map((card) => (
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

      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Puzzle className="w-3.5 h-3.5 text-purple-400" />
          Theme-Required Integrations
        </h3>

        {themesWithIntegrations.length === 0 ? (
          <div className="p-6 text-center text-slate-400 space-y-2">
            <Puzzle className="w-8 h-8 mx-auto text-slate-600" />
            <p>None of your current themes require a custom integration.</p>
            <p className="text-slate-500">This list fills in automatically as themes needing one are added or imported.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <select
              value={selectedTheme?.id ?? ''}
              onChange={(e) => setSelectedThemeId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-purple-500/60"
            >
              {themesWithIntegrations.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {!available && !loading && (
              <div className="p-3 rounded-xl border border-amber-700/60 bg-amber-950/40 text-amber-300">
                Couldn't reach HACS - showing requirements without live installed status. Is HACS installed and running?
              </div>
            )}

            <div className="space-y-2">
              {requiredIntegrations.map((integration) => {
                const status = getIntegrationStatus(integration, repositories);
                return (
                  <button
                    key={integration.domain}
                    type="button"
                    onClick={() => openIntegration(integration)}
                    title={
                      status.state === 'unknown_to_hacs'
                        ? 'Not matched in HACS - opens the repository on GitHub, add it as a custom repository in HACS to install'
                        : 'Opens this integration in HACS'
                    }
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-200 truncate">{integration.name}</div>
                      <div className="text-slate-500 text-[11px] truncate">domain: {integration.domain}</div>
                    </div>
                    <span
                      className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium ${STATE_STYLE[status.state]}`}
                    >
                      {STATE_ICON[status.state]}
                      {STATE_LABEL[status.state]}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </span>
                  </button>
                );
              })}
            </div>

            {requiredIntegrations.some((i) => getIntegrationStatus(i, repositories).state === 'unknown_to_hacs') && (
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 space-y-1.5">
                <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <GithubIcon className="w-3.5 h-3.5" />
                  Adding an integration HACS doesn't know about
                </p>
                <p>
                  Open HACS &rarr; the &vellip; menu &rarr; <strong className="text-slate-300">Custom repositories</strong>,
                  paste the repository URL (opened above), and pick category <strong className="text-slate-300">Integration</strong>.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
