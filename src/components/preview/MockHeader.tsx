import React from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Pencil, 
  LayoutGrid, 
  Columns, 
  User, 
  Zap 
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';

interface MockHeaderProps {
  theme: ThemeConfig;
  activeView?: string;
  setActiveView?: (view: string) => void;
}

export const MockHeader: React.FC<MockHeaderProps> = ({
  theme,
  activeView = 'home',
  setActiveView,
}) => {
  const views = [
    { id: 'home', label: 'Home', isText: true },
    { id: 'grid', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'columns', icon: <Columns className="w-4 h-4" /> },
    { id: 'user', icon: <User className="w-4 h-4" /> },
    { id: 'zap', icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div 
      className="h-12 w-full flex items-center justify-between px-3 relative z-10 border-b border-white/10 transition-colors select-none shrink-0"
      style={{
        backgroundColor: theme.background.avgColor ? `${theme.background.avgColor}90` : 'rgba(18, 20, 30, 0.45)',
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
              className={`h-full px-3 flex items-center gap-1.5 text-xs font-semibold transition-all relative ${
                isActive
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/5'
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

      <div className="flex items-center gap-1 text-white/80">
        <button 
          title="Add Card"
          className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          title="Search"
          className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
        <button 
          title="Assist / Chat"
          className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
        <button 
          title="Edit Dashboard"
          className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
