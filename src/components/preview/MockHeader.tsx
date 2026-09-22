import React from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Pencil, 
  LayoutGrid, 
  DoorOpen,
  Thermometer,
  Zap 
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';

interface MockHeaderProps {
  theme: ThemeConfig;
  activeView?: string;
  setActiveView?: (view: string) => void;
  previewMode?: 'dark' | 'light';
}

export const MockHeader: React.FC<MockHeaderProps> = ({
  theme,
  activeView = 'home',
  setActiveView,
  previewMode = 'dark',
}) => {
  const views = [
    { id: 'home', label: 'Home', isText: true },
    { id: 'overview', icon: <LayoutGrid className="w-4 h-4" />, title: 'Overview' },
    { id: 'rooms', icon: <DoorOpen className="w-4 h-4" />, title: 'Rooms' },
    { id: 'climate', icon: <Thermometer className="w-4 h-4" />, title: 'Climate' },
    { id: 'energy', icon: <Zap className="w-4 h-4" />, title: 'Energy' },
  ];

  const isLight = previewMode === 'light';
  const headerBg = isLight 
    ? (theme.light?.primaryBackground ? `${theme.light.primaryBackground}` : 'rgba(230, 235, 245, 0.75)')
    : (theme.background.avgColor ? `${theme.background.avgColor}90` : 'rgba(18, 20, 30, 0.45)');
  const textClass = isLight ? 'text-slate-800' : 'text-white';
  const subTextClass = isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-black/5' : 'text-white/60 hover:text-white/90 hover:bg-white/5';
  const iconButtonHover = isLight ? 'hover:bg-black/10 hover:text-slate-900' : 'hover:bg-white/10 hover:text-white';

  return (
    <div 
      className="h-12 w-full flex items-center justify-between px-3 relative z-10 border-b border-white/10 transition-colors select-none shrink-0"
      style={{
        backgroundColor: headerBg,
        backdropFilter: 'blur(20px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
      }}
    >
      <div className="flex items-center gap-1.5 h-full">
        {views.map((view) => {
          const isActive = activeView === view.id;
          return (
            <button
              key={view.id}
              onClick={() => setActiveView && setActiveView(view.id)}
              title={view.title || view.label}
              className={`h-full px-3 flex items-center gap-1.5 text-xs font-semibold transition-all relative ${
                isActive
                  ? textClass
                  : subTextClass
              }`}
            >
              {view.isText ? (
                <span>{view.label}</span>
              ) : (
                view.icon
              )}
              {isActive && (
                <div 
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full"
                  style={{ backgroundColor: theme.palette.accent || theme.palette.primary || '#FFFFFF' }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className={`flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
        <button 
          title="Add Card"
          className={`p-1.5 rounded-full transition-colors ${iconButtonHover}`}
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          title="Search"
          className={`p-1.5 rounded-full transition-colors ${iconButtonHover}`}
        >
          <Search className="w-3.5 h-3.5" />
        </button>
        <button 
          title="Assist / Chat"
          className={`p-1.5 rounded-full transition-colors ${iconButtonHover}`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
        <button 
          title="Edit Dashboard"
          className={`p-1.5 rounded-full transition-colors ${iconButtonHover}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
