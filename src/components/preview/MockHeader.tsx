import React from 'react';
import { Menu, MoreVertical, Bell, Search, Mic } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';

interface MockHeaderProps {
  theme: ThemeConfig;
  activeView: string;
  setActiveView: (view: 'home' | 'climate' | 'media' | 'security') => void;
}

export const MockHeader: React.FC<MockHeaderProps> = ({
  theme,
  activeView,
  setActiveView,
}) => {
  const views = [
    { id: 'home', name: 'Overview', icon: '🏠' },
    { id: 'climate', name: 'Climate', icon: '🌡️' },
    { id: 'media', name: 'Entertainment', icon: '🎵' },
    { id: 'security', name: 'Security', icon: '🛡️' },
  ];

  return (
    <div 
      className="h-12 w-full flex items-center justify-between px-3 relative z-10 border-b border-white/10 transition-colors"
      style={{
        backgroundColor: theme.background.avgColor ? `${theme.background.avgColor}aa` : 'rgba(18, 18, 24, 0.45)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
      }}
    >
      <div className="flex items-center gap-2">
        <button className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition-colors">
          <Menu className="w-4 h-4" />
        </button>
        <span className="font-semibold text-xs text-white/90 tracking-wide">Home Assistant</span>
      </div>

      <div className="flex items-center gap-1">
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id as any)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${
              activeView === view.id
                ? 'bg-white/20 text-white shadow-sm font-semibold'
                : 'text-white/60 hover:text-white/90 hover:bg-white/10'
            }`}
            style={activeView === view.id ? { borderBottom: `2px solid ${theme.palette.accent}` } : {}}
          >
            <span>{view.icon}</span>
            <span className="hidden sm:inline">{view.name}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 text-white/70">
        <button className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors">
          <Mic className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors">
          <Search className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors">
          <Bell className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors">
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
