import React, { useEffect } from 'react';
import { ThemeConfig } from '../../types/theme';
import { useLiveRenderPreview } from '../../contexts/LiveRenderPreviewContext';
import { themeToCssVars } from '../../services/themeToCssVars';
import { LiveRenderBooting } from './LiveRenderBooting';
import { LiveRenderFailed } from './LiveRenderFailed';

interface DashboardPreviewProps {
  theme: ThemeConfig;
  previewMode?: 'dark' | 'light';
  activeView?: 'home' | 'climate' | 'media' | 'security';
  setActiveView?: (view: any) => void;
}

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({
  theme,
  previewMode = 'dark',
}) => {
  const { ready, timedOut, registerSlot, applyTheme, retry } = useLiveRenderPreview();

  const useLiveRender = ready;

  useEffect(() => {
    if (!useLiveRender) return;
    const { name, vars } = themeToCssVars(theme, previewMode);
    applyTheme(name, vars);
  }, [useLiveRender, theme, previewMode, applyTheme]);

  useEffect(() => {
    if (!useLiveRender) return;
    return () => registerSlot(null);
  }, [useLiveRender, registerSlot]);

  if (useLiveRender) {
    return (
      <div className="relative w-full h-full overflow-hidden">
        <div ref={registerSlot} data-testid="live-render-slot" className="w-full h-full" />
      </div>
    );
  }

  if (!timedOut) {
    return <LiveRenderBooting theme={theme} />;
  }

  return <LiveRenderFailed theme={theme} onRetry={retry} />;
};
