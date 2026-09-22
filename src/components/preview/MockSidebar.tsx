import React from 'react';
import { 
  Home, 
  LayoutDashboard, 
  Compass, 
  Zap, 
  BookOpen, 
  History, 
  Music, 
  Package, 
  Wrench, 
  Settings, 
  User, 
  Sparkles 
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';

interface MockSidebarProps {
  theme: ThemeConfig;
  activeItem?: string;
  onSelectItem?: (label: string) => void;
}

export const MockSidebar: React.FC<MockSidebarProps> = ({ 
  theme, 
  activeItem = 'Overview',
  onSelectItem 
}) => {
  const items = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Overview' },
    { icon: <Zap className="w-4 h-4" />, label: 'Energy' },
    { icon: <Compass className="w-4 h-4" />, label: 'Map' },
    { icon: <BookOpen className="w-4 h-4" />, label: 'Logbook' },
    { icon: <History className="w-4 h-4" />, label: 'History' },
    { icon: <Music className="w-4 h-4" />, label: 'Media' },
    { icon: <Sparkles className="w-4 h-4 text-purple-400" />, label: 'HATS' },
    { icon: <Package className="w-4 h-4" />, label: 'HACS' },
    { icon: <Wrench className="w-4 h-4" />, label: 'Developer Tools' },
    { icon: <Settings className="w-4 h-4" />, label: 'Settings' },
  ];

  return (
    <aside 
      className="w-14 sm:w-48 md:w-52 h-full border-r border-white/10 flex flex-col justify-between py-3 select-none shrink-0 overflow-y-auto"
      style={{
        backgroundColor: 'rgba(18, 20, 30, 0.75)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
        boxShadow: '4px 0 24px -8px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="space-y-3">
        <div className="px-3.5 py-1 flex items-center gap-2.5 text-white/95 font-bold text-xs">
          <div 
            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-md text-white font-bold"
            style={{ backgroundColor: theme.palette.primary }}
          >
            <Home className="w-4 h-4" />
          </div>
          <div className="hidden sm:flex flex-col truncate">
            <span className="font-extrabold text-white text-xs leading-none">Home Assistant</span>
            <span className="text-[9px] text-slate-400 leading-none mt-0.5">Smart Home</span>
          </div>
        </div>

        <div className="h-px bg-white/10 mx-2" />

        <nav className="space-y-0.5 px-1.5">
          {items.map((item, idx) => {
            const isActive = activeItem === item.label;
            return (
              <button
                key={idx}
                onClick={() => onSelectItem && onSelectItem(item.label)}
                title={item.label}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left group ${
                  isActive
                    ? 'text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: `${theme.palette.primary}30`,
                        borderLeft: `3px solid ${theme.palette.primary}`,
                        color: theme.palette.primary,
                      }
                    : {}
                }
              >
                <div 
                  className="shrink-0 transition-transform group-hover:scale-110"
                  style={isActive ? { color: theme.palette.primary } : {}}
                >
                  {item.icon}
                </div>
                <span className="hidden sm:inline truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-2 pt-2 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 px-1 py-1 rounded-xl w-full hover:bg-white/10 cursor-pointer transition-colors">
          <div className="relative">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow"
              style={{ backgroundColor: theme.palette.accent || theme.palette.primary }}
            >
              F
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 border border-slate-900 absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="hidden sm:flex flex-col truncate text-left">
            <span className="text-[11px] font-semibold text-slate-200 leading-none truncate">Florin</span>
            <span className="text-[9px] text-slate-400 leading-none mt-0.5">Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
