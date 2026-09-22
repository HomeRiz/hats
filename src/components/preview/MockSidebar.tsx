import React from 'react';
import { Home, LayoutDashboard, Compass, Cpu, Settings, Power } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';

interface MockSidebarProps {
  theme: ThemeConfig;
}

export const MockSidebar: React.FC<MockSidebarProps> = ({ theme }) => {
  const items = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Overview', active: true },
    { icon: <Compass className="w-4 h-4" />, label: 'Map' },
    { icon: <Cpu className="w-4 h-4" />, label: 'Energy' },
    { icon: <Settings className="w-4 h-4" />, label: 'Settings' },
  ];

  return (
    <div 
      className="w-16 md:w-48 h-full border-r border-white/10 flex flex-col justify-between py-3 select-none shrink-0"
      style={{
        backgroundColor: 'rgba(12, 14, 20, 0.45)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <div className="space-y-4">
        <div className="px-3 flex items-center gap-2 text-white/90 font-bold text-xs">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
            <Home className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="hidden md:inline truncate font-semibold">Smart Home</span>
        </div>

        <div className="space-y-1 px-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                item.active
                  ? 'text-white font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/10'
              }`}
              style={item.active ? { backgroundColor: `${theme.palette.accent}25`, borderLeft: `3px solid ${theme.palette.accent}` } : {}}
            >
              <div style={item.active ? { color: theme.palette.accent } : {}}>{item.icon}</div>
              <span className="hidden md:inline truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 pt-2 border-t border-white/10 flex items-center justify-between text-white/50 text-[10px]">
        <span className="hidden md:inline">2026.9.2</span>
        <Power className="w-3.5 h-3.5 text-red-400/80 hover:text-red-400 cursor-pointer" />
      </div>
    </div>
  );
};
