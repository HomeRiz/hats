import React from 'react';
import { 
  Home, 
  Package, 
  MapPin, 
  Zap,
  BookOpen,
  History,
  PlayCircle,
  Settings, 
  Bell, 
  Menu 
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';

interface MockSidebarProps {
  theme: ThemeConfig;
  activeItem?: string;
  onSelectItem?: (label: string) => void;
  previewMode?: 'dark' | 'light';
}

const HatsTopHatIcon: React.FC<{ className?: string; color?: string }> = ({ className = "w-4 h-4", color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M7 4H17V14H7V4Z" fill={color} />
    <rect x="7" y="12" width="10" height="2.5" fill="#FFD60A" />
    <ellipse cx="12" cy="15.5" rx="8.5" ry="2" fill={color} />
  </svg>
);

export const MockSidebar: React.FC<MockSidebarProps> = ({ 
  theme, 
  activeItem = 'Smart Home',
  onSelectItem,
  previewMode = 'dark',
}) => {
  const { engine, palette } = theme;
  const sidebarStyle = engine.sidebarStyle || 'translucent';
  const sidebarOpacity = engine.sidebarOpacity ?? 0.45;
  const sidebarBlur = engine.sidebarBlur ?? 20;
  const isLight = previewMode === 'light';

  let sidebarBg = isLight 
    ? `rgba(240, 243, 250, ${sidebarOpacity})` 
    : `rgba(18, 20, 30, ${sidebarOpacity})`;
  let sidebarFilter = `blur(${sidebarBlur}px) saturate(${engine.saturateAmount || 1.4})`;

  if (sidebarStyle === 'opaque') {
    sidebarBg = isLight ? 'rgba(240, 243, 250, 0.96)' : 'rgba(18, 20, 30, 0.96)';
    sidebarFilter = 'none';
  } else if (sidebarStyle === 'transparent') {
    sidebarBg = 'transparent';
    sidebarFilter = `blur(${sidebarBlur}px) saturate(${engine.saturateAmount || 1.4})`;
  }

  const topItems = [
    { icon: <Home className="w-4 h-4" />, label: 'Smart Home' },
    { icon: <Zap className="w-4 h-4 text-amber-400" />, label: 'Energy' },
    { icon: <MapPin className="w-4 h-4" />, label: 'Map' },
    { icon: <BookOpen className="w-4 h-4" />, label: 'Logbook' },
    { icon: <History className="w-4 h-4" />, label: 'History' },
    { icon: <PlayCircle className="w-4 h-4" />, label: 'Media' },
    { icon: <Package className="w-4 h-4" />, label: 'HACS' },
    { icon: <HatsTopHatIcon className="w-4 h-4 text-purple-300" color="#BF5AF2" />, label: 'HATS' },
  ];

  const bottomItems = [
    { icon: <Settings className="w-4 h-4" />, label: 'Settings' },
    { icon: <Bell className="w-4 h-4" />, label: 'Notifications' },
  ];

  const defaultText = isLight ? 'text-slate-700 hover:text-slate-900 hover:bg-black/5' : 'text-slate-300 hover:text-white hover:bg-white/10';
  const headerText = isLight ? 'text-slate-900' : 'text-white/95';
  const headerBtnHover = isLight ? 'text-slate-700 hover:bg-black/10' : 'text-white/80 hover:bg-white/10';
  const borderCol = isLight ? 'border-black/10' : 'border-white/10';

  return (
    <aside 
      className={`w-14 sm:w-48 md:w-56 h-full border-r ${borderCol} flex flex-col justify-between py-2 select-none shrink-0 overflow-y-auto transition-all duration-300`}
      style={{
        backgroundColor: sidebarBg,
        backdropFilter: sidebarFilter,
        WebkitBackdropFilter: sidebarFilter,
        boxShadow: isLight ? '4px 0 24px -8px rgba(0, 0, 0, 0.1)' : '4px 0 24px -8px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="space-y-2">
        <div className={`px-3 py-1 flex items-center gap-3 font-bold text-xs ${headerText}`}>
          <button className={`p-1 rounded-lg transition-colors ${headerBtnHover}`}>
            <Menu className="w-4 h-4" />
          </button>
          <span className="hidden sm:inline font-bold text-xs tracking-wide truncate">Home Assistant</span>
        </div>

        <div className={`h-px ${borderCol} mx-2`} />

        <nav className="space-y-0.5 px-1.5">
          {topItems.map((item, idx) => {
            const isActive = activeItem === item.label;
            return (
              <button
                key={idx}
                onClick={() => onSelectItem && onSelectItem(item.label)}
                title={item.label}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all text-left group ${
                  isActive
                    ? 'text-white font-bold shadow-sm'
                    : defaultText
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: `${theme.palette.primary}E0`,
                        borderLeft: `3px solid ${theme.palette.primary}`,
                        color: '#FFFFFF',
                      }
                    : {}
                }
              >
                <div 
                  className="shrink-0 transition-transform group-hover:scale-110"
                  style={isActive ? { color: '#FFFFFF' } : {}}
                >
                  {item.icon}
                </div>
                <span className="hidden sm:inline truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className={`space-y-1 px-1.5 pt-2 border-t ${borderCol}`}>
        {bottomItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectItem && onSelectItem(item.label)}
            title={item.label}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors text-left ${defaultText}`}
          >
            <div className="shrink-0">{item.icon}</div>
            <span className="hidden sm:inline truncate">{item.label}</span>
          </button>
        ))}

        <div className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-colors mt-1 ${isLight ? 'hover:bg-black/5' : 'hover:bg-white/10'} cursor-pointer`}>
          <div 
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow"
            style={{ backgroundColor: theme.palette.accent || theme.palette.primary }}
          >
            H
          </div>
          <span className={`hidden sm:inline text-xs font-semibold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Home Assistant</span>
        </div>
      </div>
    </aside>
  );
};
