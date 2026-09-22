import React, { useState } from 'react';
import { ThemeConfig } from '../../types/theme';

interface MockMushroomCardProps {
  theme: ThemeConfig;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  activeColor?: string;
  defaultActive?: boolean;
}

export const MockMushroomCard: React.FC<MockMushroomCardProps> = ({
  theme,
  icon,
  title,
  subtitle,
  activeColor,
  defaultActive = false,
}) => {
  const [isActive, setIsActive] = useState(defaultActive);
  const color = activeColor || theme.palette.accent || theme.palette.primary;

  return (
    <div
      onClick={() => setIsActive(!isActive)}
      className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer select-none transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        borderRadius: `${theme.engine.mushRadius || 20}px`,
        backgroundColor: isActive ? `${color}20` : 'rgba(255, 255, 255, 0.05)',
        border: isActive ? `1.5px solid ${color}60` : '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md"
        style={{
          backgroundColor: isActive ? color : 'rgba(255, 255, 255, 0.12)',
          color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
          boxShadow: isActive ? `0 0 16px -2px ${color}` : 'none',
        }}
      >
        {icon}
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-white/95 truncate">{title}</span>
        <span className="text-[11px] font-medium text-white/60 truncate">{subtitle}</span>
      </div>
    </div>
  );
};
