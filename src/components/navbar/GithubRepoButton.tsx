import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GithubIcon } from '../common/icons/GithubIcon';
import { previewUrlForRepo, repoSlugFromInput } from '../../services/previewParams';

export const GithubRepoButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const box = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!box.current?.contains(target) && !panel.current?.contains(target)) setOpen(false);
    };
    const hide = () => setOpen(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('resize', hide);
    window.addEventListener('blur', hide);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('resize', hide);
      window.removeEventListener('blur', hide);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      const rect = box.current?.getBoundingClientRect();
      if (rect) setPosition({ top: rect.bottom + 8, left: Math.max(8, rect.right - 320) });
    }
    setOpen((o) => !o);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = repoSlugFromInput(value);
    if (!slug) {
      setError('Paste a github.com repo link or owner/name');
      return;
    }
    window.location.assign(previewUrlForRepo(slug, window.location));
  };

  return (
    <div ref={box} className="relative hidden md:block">
      <button
        onClick={toggle}
        title="Preview any theme repo from GitHub"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
      >
        <GithubIcon className="w-3.5 h-3.5" />
        <span>GitHub</span>
      </button>
      {open && createPortal(
        <form
          ref={panel}
          onSubmit={submit}
          style={{ position: 'fixed', top: position.top, left: position.left }}
          className="w-80 z-[55] p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-xl space-y-2"
        >
          <label className="block text-[11px] font-semibold text-slate-300">Theme repository</label>
          <input
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
            placeholder="https://github.com/owner/theme-repo"
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            Preview in HATS
          </button>
        </form>,
        document.body,
      )}
    </div>
  );
};
