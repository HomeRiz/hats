import React, { useEffect, useState } from 'react';
import { 
  GitPullRequest,
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Send
} from 'lucide-react';
import { GithubIcon } from '../common/icons/GithubIcon';
import { ThemeConfig } from '../../types/theme';
import { validateThemeForSubmission } from '../../services/githubService';
import { getGithubStatus, submitThemeViaServer, submitIssueViaServer, GithubStatus } from '../../services/haService';

interface SubmitPrModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  onSubmitSuccess: (theme: ThemeConfig, prUrl: string) => void;
}

export const SubmitPrModal: React.FC<SubmitPrModalProps> = ({
  isOpen,
  onClose,
  theme,
  onSubmitSuccess,
}) => {
  const [githubToken, setGithubToken] = useState('');
  const [prTitle, setPrTitle] = useState(`Add new theme: ${theme.name} (${theme.category})`);
  const [prDescription, setPrDescription] = useState(
    `Proposed new theme for the official HATS (Home Assistant Theme Store) Collection.\n\n` +
    `**Aesthetic / Category:** ${theme.category}\n` +
    `**Engine:** ${theme.engine.engineType}\n` +
    `**Description:** ${theme.description}`
  );
  const [mode, setMode] = useState<'pr' | 'issue'>('pr');
  const [issueKind, setIssueKind] = useState<'bug' | 'removal'>('bug');
  const [issueTheme, setIssueTheme] = useState(theme.name);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueBody, setIssueBody] = useState('');
  const [submittedIssueUrl, setSubmittedIssueUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPrUrl, setSubmittedPrUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [githubStatus, setGithubStatus] = useState<GithubStatus>({ tokenConfigured: false, targetRepo: 'HomeRiz/hats', canSaveToken: false });

  useEffect(() => {
    if (isOpen) getGithubStatus().then(setGithubStatus);
  }, [isOpen]);

  if (!isOpen) return null;

  const validationIssues = validateThemeForSubmission(theme);
  const hasErrors = mode === 'pr' && validationIssues.some(i => i.type === 'error');
  const missingToken = !githubStatus.tokenConfigured && !githubToken.trim();
  const canSubmit = !isSubmitting && !hasErrors && !missingToken && (mode === 'pr' || issueTitle.trim().length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    if (mode === 'issue') {
      const issueRes = await submitIssueViaServer({
        kind: issueKind,
        themeName: issueTheme.trim() || undefined,
        title: issueTitle.trim(),
        body: issueBody,
        token: githubStatus.tokenConfigured ? undefined : githubToken.trim(),
      });
      setIsSubmitting(false);
      setGithubToken('');
      if (issueRes.success && issueRes.issueUrl) setSubmittedIssueUrl(issueRes.issueUrl);
      else setErrorMsg(issueRes.error || 'Failed to open the issue');
      return;
    }

    const res = await submitThemeViaServer(theme, {
      title: prTitle,
      body: prDescription,
      token: githubStatus.tokenConfigured ? undefined : githubToken.trim(),
    });

    setIsSubmitting(false);
    setGithubToken('');

    if (res.success && res.prUrl) {
      setSubmittedPrUrl(res.prUrl);
      onSubmitSuccess(theme, res.prUrl);
    } else {
      setErrorMsg(res.error || 'Failed to submit PR');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <GitPullRequest className="w-4 h-4 text-purple-400" />
            <span>Contribute to HATS: send a PR or open an issue</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {submittedIssueUrl ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Issue Opened!</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Your issue was opened on {githubStatus.targetRepo}. A maintainer will take a look.
                </p>
              </div>
              <a
                href={submittedIssueUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition-all"
              >
                <GithubIcon className="w-4 h-4" />
                <span>View Issue on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          ) : submittedPrUrl ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pull Request Proposed!</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Your theme was committed to a branch of your fork and a pull request was opened on {githubStatus.targetRepo}. A maintainer will review it before it joins the HATS collection.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={submittedPrUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition-all"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>View Pull Request on GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
                {([['pr', 'Send a PR (add a theme)'], ['issue', 'Open an issue (bug / removal)']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setMode(value); setErrorMsg(null); }}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      mode === value ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {mode === 'issue' ? (
                <>
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">What is this about?</label>
                <select
                  value={issueKind}
                  onChange={(e) => setIssueKind(e.target.value as 'bug' | 'removal')}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-200"
                >
                  <option value="bug">Report a bug with a theme</option>
                  <option value="removal">Request removal of a theme (does not fit, or repeats another theme)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Theme name</label>
                <input
                  type="text"
                  value={issueTheme}
                  onChange={(e) => setIssueTheme(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Issue title</label>
                <input
                  type="text"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  placeholder={issueKind === 'removal' ? 'Remove theme: ...' : 'Bug in theme: ...'}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Details</label>
                <textarea
                  value={issueBody}
                  onChange={(e) => setIssueBody(e.target.value)}
                  rows={5}
                  placeholder={issueKind === 'removal' ? 'Why should it be removed? If it repeats another theme, name it.' : 'What is wrong, and how can it be reproduced?'}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-200 resize-none text-[11px]"
                />
              </div>

                </>
              ) : (
                <>
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pre-flight Theme Verification</span>
                </span>

                <div className="space-y-1.5">
                  {validationIssues.length === 0 ? (
                    <p className="text-emerald-400 text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Theme parameters pass all checks! Ready to submit.</span>
                    </p>
                  ) : (
                    validationIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 text-[11px] ${
                          issue.type === 'error' ? 'text-red-400' : 'text-amber-400'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{issue.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">PR Title</label>
                <input
                  type="text"
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">PR Description / Proposal Rationale</label>
                <textarea
                  value={prDescription}
                  onChange={(e) => setPrDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-200 resize-none font-mono text-[11px]"
                />
              </div>

                </>
              )}

              {githubStatus.tokenConfigured ? (
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    Using the GitHub token saved in the HATS add-on configuration. It stays on the server and is never sent to your browser.
                  </span>
                </div>
              ) : (
                <div className="space-y-1 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <label className="text-slate-300 font-semibold flex items-center justify-between">
                    <span>GitHub Personal Access Token</span>
                    <span className="text-[10px] text-slate-500">only public_repo</span>
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    autoComplete="off"
                    required
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">
                    Used once for this submission and then discarded. To stop pasting it every time, save it under Settings, Add-ons, HATS,
                    Configuration, "GitHub token". Create a classic token and tick only <b>public_repo</b>.
                  </p>
                </div>
              )}

              {isSubmitting && (
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[11px]">
                  {mode === 'issue' ? 'Opening the issue on GitHub...' : 'Forking, committing and opening the pull request on GitHub. This can take up to 30 seconds...'}
                </div>
              )}

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-[11px]">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold disabled:opacity-50 transition-all shadow-md shadow-purple-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{mode === 'issue' ? (isSubmitting ? 'Opening issue...' : 'Open Issue') : (isSubmitting ? 'Packaging PR...' : 'Create Pull Request')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
