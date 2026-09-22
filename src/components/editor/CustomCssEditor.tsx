import React from 'react';
import { Code, Sparkles } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';

interface CustomCssEditorProps {
  theme: ThemeConfig;
  onChange: (updates: Partial<ThemeConfig>) => void;
}

export const CustomCssEditor: React.FC<CustomCssEditorProps> = ({ theme, onChange }) => {
  const cssSnippets = [
    {
      name: 'Pulsing Card Neon Glow',
      css: `@keyframes neonPulse {
  0% { box-shadow: 0 0 15px var(--ultimate-glow-color); }
  50% { box-shadow: 0 0 35px var(--ultimate-glow-color); }
  100% { box-shadow: 0 0 15px var(--ultimate-glow-color); }
}
ha-card {
  animation: neonPulse 3s infinite ease-in-out;
}`,
    },
    {
      name: 'Rounded Gradient Border',
      css: `ha-card {
  border: 2px solid transparent !important;
  background-clip: padding-box, border-box !important;
  background-origin: padding-box, border-box !important;
}`,
    },
    {
      name: 'Playful Storybook Font Injection',
      css: `@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap');
ha-card, app-header, hui-view {
  font-family: 'Fredoka', 'Inter', sans-serif !important;
}`,
    },
  ];

  return (
    <div className="space-y-6 text-slate-200 text-xs">
      <div className="space-y-2">
        <label className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick CSS Snippets</span>
        </label>

        <div className="grid grid-cols-1 gap-2">
          {cssSnippets.map((snip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                const existing = theme.customCss ? `${theme.customCss}\n\n` : '';
                onChange({ customCss: `${existing}/* ${snip.name} */\n${snip.css}` });
              }}
              className="p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 flex items-center justify-between transition-colors text-left"
            >
              <span className="font-semibold text-xs text-white">{snip.name}</span>
              <span className="text-[10px] text-blue-400">+ Add</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <Code className="w-3.5 h-3.5 text-blue-400" />
          <span>Custom card-mod Injected CSS</span>
        </div>

        <p className="text-[11px] text-slate-400">
          Write custom CSS rules injected directly into Home Assistant's Lovelace cards shadow roots:
        </p>

        <textarea
          value={theme.customCss || ''}
          onChange={(e) => onChange({ customCss: e.target.value })}
          placeholder={`ha-card {\n  /* Custom shadow, animation or border override */\n}`}
          rows={10}
          className="w-full bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-blue-500 leading-relaxed resize-none"
        />
      </div>
    </div>
  );
};
