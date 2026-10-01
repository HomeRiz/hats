import { createContext, useContext } from 'react';

export interface LiveRenderPreviewContextValue {
  ready: boolean;
  timedOut: boolean;
  registerSlot: (el: HTMLDivElement | null) => void;
  applyTheme: (themeName: string, themeVars: Record<string, string>) => boolean;
}

const noop = () => {};

const defaultValue: LiveRenderPreviewContextValue = {
  ready: false,
  timedOut: true,
  registerSlot: noop,
  applyTheme: () => false,
};

export const LiveRenderPreviewContext = createContext<LiveRenderPreviewContextValue>(defaultValue);

export const LiveRenderPreviewProvider = LiveRenderPreviewContext.Provider;

export function useLiveRenderPreview(): LiveRenderPreviewContextValue {
  return useContext(LiveRenderPreviewContext);
}
