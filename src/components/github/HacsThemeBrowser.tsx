import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Eye, Search, Star, AlertTriangle } from 'lucide-react';
import {
  fetchHacsIndex,
  filterHacsThemes,
  isUsableLicense,
  themeCount,
  HacsIndex,
  HacsLicenseFilter,
  HacsSort,
} from '../../services/hacsThemeIndex';
import { previewUrlForRepo } from '../../services/previewParams';

const PAGE = 24;

export const HacsThemeBrowser: React.FC = () => {
  const [index, setIndex] = useState<HacsIndex | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<HacsSort>('stars');
  const [license, setLicense] = useState<HacsLicenseFilter>('all');
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    let cancelled = false;
    fetchHacsIndex()
      .then((result) => !cancelled && setIndex(result))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(
    () => (index ? filterHacsThemes(index.themes, { query, sort, license }) : []),
    [index, query, sort, license],
  );

  const select = 'px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500';

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white">Browse HACS themes</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Every theme repository in the HACS catalog. Preview one in your own HATS, then install it. HATS hosts none of these files, it only points at the author's repository.
        </p>
      </div>

      {error && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{error} You can still preview any repo with the GitHub button in the top bar.</span>
        </div>
      )}

      {!index && !error && <p className="text-xs text-slate-400">Loading the theme index...</p>}

      {index && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[12rem]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShown(PAGE);
                }}
                placeholder="Search repos and theme names"
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as HacsSort)} className={select} aria-label="Sort">
              <option value="stars">Most stars</option>
              <option value="updated">Recently updated</option>
              <option value="name">Name</option>
            </select>
            <select
              value={license}
              onChange={(e) => {
                setLicense(e.target.value as HacsLicenseFilter);
                setShown(PAGE);
              }}
              className={select}
              aria-label="License"
            >
              <option value="all">Any license</option>
              <option value="licensed">Has a license</option>
              <option value="unlicensed">No license</option>
            </select>
          </div>

          <p className="text-[11px] text-slate-500">
            {results.length} of {index.themes.length} repositories
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.slice(0, shown).map((entry) => {
              const licensed = isUsableLicense(entry.license);
              return (
                <div key={entry.full_name} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-white break-all">{entry.full_name}</span>
                    <span className="flex items-center gap-1 text-[11px] text-amber-300 shrink-0">
                      <Star className="w-3 h-3" />
                      {entry.stars}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{themeCount(entry)} themes</span>
                    <span className={`px-1.5 py-0.5 rounded ${licensed ? 'bg-emerald-900/40 text-emerald-300' : 'bg-amber-900/40 text-amber-300'}`}>
                      {licensed ? entry.license : 'No license'}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-auto pt-1">
                    <button
                      onClick={() => window.location.assign(previewUrlForRepo(entry.full_name, window.location))}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                    <a
                      href={`https://github.com/${entry.full_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open the repository on GitHub"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {results.length > shown && (
            <button
              onClick={() => setShown((n) => n + PAGE)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Show more
            </button>
          )}
        </>
      )}
    </section>
  );
};
