import React from 'react';
import { Puzzle } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { COMPONENT_CATALOG, resolveComponentSupport, withComponentSupport } from '../../services/componentSupport';

interface ComponentsEditorProps {
  theme: ThemeConfig;
  onChange: (updates: Partial<ThemeConfig>) => void;
}

export const ComponentsEditor: React.FC<ComponentsEditorProps> = ({ theme, onChange }) => {
  const support = resolveComponentSupport(theme);

  return (
    <div className="space-y-4 text-xs text-slate-300">
      <div className="flex items-start gap-2 text-slate-400">
        <Puzzle className="w-4 h-4 mt-0.5 text-purple-400 shrink-0" />
        <p>
          Choose which custom cards this theme supports. Turned on, the theme styles that card and lists it as a requirement.
          Turned off, the theme leaves it alone.
        </p>
      </div>

      <div className="space-y-2">
        {COMPONENT_CATALOG.map((info) => {
          const enabled = support[info.id];
          return (
            <label
              key={info.id}
              className={`flex items-start justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                enabled ? 'border-blue-500/40 bg-blue-600/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              <div className="space-y-0.5 min-w-0">
                <div className="font-semibold text-slate-100">{info.name}</div>
                <div className="text-[11px] text-slate-400">{info.summary}</div>
                <div className="text-[10px] text-slate-500">{info.effect}</div>
              </div>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => onChange(withComponentSupport(theme, info.id, e.target.checked))}
                aria-label={`Support ${info.name}`}
                className="mt-1 h-4 w-4 shrink-0 accent-blue-500"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
};
