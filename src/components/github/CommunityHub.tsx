import React from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  GitPullRequest, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MessageSquare,
  Sparkles,
  Users
} from 'lucide-react';
import { CommunityThemeSubmission, ThemeConfig } from '../../types/theme';

interface CommunityHubProps {
  submissions: CommunityThemeSubmission[];
  onVote: (submissionId: string, type: 'up' | 'down') => void;
  onApplyTheme: (theme: ThemeConfig) => void;
  onOpenSubmitPr: () => void;
}

export const CommunityHub: React.FC<CommunityHubProps> = ({
  submissions,
  onVote,
  onApplyTheme,
  onOpenSubmitPr,
}) => {
  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto max-w-6xl mx-auto space-y-6 text-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Community Theme Hub & Governance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Propose, vote on, and review themes. Themes accepted by the community become part of the official <strong>Home Assistant Ultimate Themes</strong> release.
          </p>
        </div>

        <button
          onClick={onOpenSubmitPr}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all"
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>Propose New Theme</span>
        </button>
      </div>

      <div className="space-y-4">
        {submissions.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
              <Users className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-white">No Community Proposals Yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Be the first to submit a custom theme to the official Home Assistant repository! Propose your theme via GitHub Pull Request to share it with the world.
              </p>
            </div>
            <button
              onClick={onOpenSubmitPr}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 transition-all"
            >
              <GitPullRequest className="w-4 h-4" />
              <span>Propose Your Theme</span>
            </button>
          </div>
        ) : (
          submissions.map((sub) => {
            const { theme } = sub;
            return (
              <div
                key={sub.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-slate-700/80 transition-all"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <div
                    className="w-16 h-16 rounded-xl shrink-0 border border-white/10 shadow-sm flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: theme.background.type === 'gradient'
                        ? theme.background.gradientString
                        : (theme.background.imageUrl ? `url(${theme.background.imageUrl}) center / cover` : theme.palette.primary),
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg border border-white/30 backdrop-blur-sm"
                      style={{ backgroundColor: `${theme.palette.accent}50` }}
                    />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-white truncate">{theme.name}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                        {theme.category}
                      </span>

                      {sub.status === 'approved' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Accepted in Official Pack</span>
                        </span>
                      )}
                      {sub.status === 'pending' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Community Voting</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1">{theme.description}</p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Proposed by @{theme.authorGithub || theme.author}</span>
                      {sub.prUrl && (
                        <a
                          href={sub.prUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                          <GitPullRequest className="w-3 h-3" />
                          <span>GitHub PR</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => onVote(sub.id, 'up')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        sub.userVoted === 'up'
                          ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{sub.upvotes}</span>
                    </button>

                    <button
                      onClick={() => onVote(sub.id, 'down')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        sub.userVoted === 'down'
                          ? 'bg-red-600/30 text-red-400 border border-red-500/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>{sub.downvotes}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onApplyTheme(theme)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    Load in Studio
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
