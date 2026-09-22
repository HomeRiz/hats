import React from 'react';
import { 
  Home, 
  FileCode, 
  Package, 
  Cpu, 
  Terminal, 
  Code, 
  MapPin, 
  Sparkles, 
  Settings, 
  Bell, 
  Menu 
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';

interface MockSidebarProps {
  theme: ThemeConfig;
  activeItem?: string;
  onSelectItem?: (label: string) => void;
}

export const MockSidebar: React.FC<MockSidebarProps> = ({ 
  theme, 
  activeItem = 'Smart Home',
  onSelectItem 
}) => {
  const { engine, palette } = theme;
  const sidebarStyle = engine.sidebarStyle || 'translucent';
  const sidebarOpacity = engine.sidebarOpacity ?? 0.45;
  const sidebarBlur = engine.sidebarBlur ?? 20;

  let sidebarBg = `rgba(18, 20, 30, ${sidebarOpacity})`;
  let sidebarFilter = `blur(${sidebarBlur}px) saturate(${engine.saturateAmount || 1.4})`;

  if (sidebarStyle === 'opaque') {
    sidebarBg = 'rgba(18, 20, 30, 0.96)';
    sidebarFilter = 'none';
  } else if (sidebarStyle === 'transparent') {
    sidebarBg = 'transparent';
    sidebarFilter = `blur(${sidebarBlur}px) saturate(${engine.saturateAmount || 1.4})`;
  }

  const topItems = [
    { icon: <Home className="w-4 h-4" />, label: 'Smart Home' },
    { icon: <FileCode className="w-4 h-4" />, label: 'File editor' },
    { icon: <Package className="w-4 h-4" />, label: 'HACS' },
    { icon: <Cpu className="w-4 h-4" />, label: 'Home Assistant MCP Server' },
    { icon: <Terminal className="w-4 h-4" />, label: 'Terminal' },
    { icon: <Code className="w-4 h-4" />, label: 'OpenCode' },
    { icon: <MapPin className="w-4 h-4" />, label: 'Map' },
    { icon: <Sparkles className="w-4 h-4 text-purple-300" />, label: 'HATS' },
  ];

  const bottomItems = [
    { icon: <Settings className="w-4 h-4" />, label: 'Settings' },
    { icon: <Bell className="w-4 h-4" />, label: 'Notifications' },
  ];

  return (
    <aside 
      className="w-14 sm:w-48 md:w-56 h-full border-r border-white/10 flex flex-col justify-between py-2 select-none shrink-0 overflow-y-auto transition-all duration-300"
      style={{
        backgroundColor: sidebarBg,
        backdropFilter: sidebarFilter,
        WebkitBackdropFilter: sidebarFilter,
        boxShadow: '4px 0 24px -8px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="space-y-2">
        <div className="px-3 py-1 flex items-center gap-3 text-white/95 font-bold text-xs">
          <button className="p-1 rounded-lg text-white/80 hover:bg-white/10 transition-colors">
            <Menu className="w-4 h-4" />
          </button>
          <span className="hidden sm:inline font-bold text-white text-xs tracking-wide truncate">Home Assistant</span>
        </div>

        <div className="h-px bg-white/10 mx-2" />

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
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: `${theme.palette.primary}35`,
                        borderLeft: `3px solid ${theme.palette.primary}`,
                        color: '#FFFFFF',
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

      <div className="space-y-1 px-1.5 pt-2 border-t border-white/10">
        {bottomItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectItem && onSelectItem(item.label)}
            title={item.label}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-left"
          >
            <div className="shrink-0">{item.icon}</div>
            <span className="hidden sm:inline truncate">{item.label}</span>
          </button>
        ))}

        <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors mt-1">
          <div 
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow"
            style={{ backgroundColor: theme.palette.accent || theme.palette.primary }}
          >
            t
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-slate-200 truncate">testha</span>
        </div>
      </div>
    </aside>
  );
};
