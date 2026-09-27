import React, { useEffect, useState } from 'react';
import { normalizeHex } from '../../services/colorEngine';

interface HexColorFieldProps {
  value: string;
  onCommit: (hex: string) => void;
  label: string;
  size?: 'md' | 'sm';
}

const COMPLETE_LIVE = /^(?:#?[0-9a-f]{6}|rgba?\([^)]*\))$/i;

export const HexColorField: React.FC<HexColorFieldProps> = ({ value, onCommit, label, size = 'md' }) => {
  const current = normalizeHex(value) ?? '#888888';
  const [draft, setDraft] = useState(current);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(current);
  }, [current, focused]);

  const parsed = normalizeHex(draft);
  const invalid = draft.trim() !== '' && parsed === null;

  const commit = (text: string) => {
    const hex = normalizeHex(text);
    if (hex) {
      setDraft(hex);
      if (hex !== current) onCommit(hex);
    } else {
      setDraft(current);
    }
  };

  const swatch = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const text = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div className="flex items-center gap-1.5 min-w-0 flex-1">
      <input
        type="color"
        value={current}
        onChange={(e) => onCommit(e.target.value.toUpperCase())}
        title={`Pick ${label}`}
        aria-label={`Pick ${label}`}
        className={`${swatch} rounded cursor-pointer bg-transparent border-0 shrink-0`}
      />
      <input
        type="text"
        value={draft}
        spellCheck={false}
        autoComplete="off"
        maxLength={32}
        aria-label={`${label} code`}
        title={`${label}: type or paste #RRGGBB, #RGB or rgb(r, g, b)`}
        aria-invalid={invalid}
        onFocus={(e) => {
          setFocused(true);
          e.target.select();
        }}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          if (COMPLETE_LIVE.test(next.trim())) {
            const hex = normalizeHex(next);
            if (hex && hex !== current) onCommit(hex);
          }
        }}
        onBlur={() => {
          setFocused(false);
          commit(draft);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(draft);
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'Escape') {
            setDraft(current);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={`font-mono ${text} uppercase min-w-0 w-full bg-transparent text-slate-300 outline-none rounded px-1 py-0.5 border ${
          invalid ? 'border-red-500/70 text-red-300' : 'border-transparent focus:border-blue-500/60'
        }`}
      />
    </div>
  );
};
