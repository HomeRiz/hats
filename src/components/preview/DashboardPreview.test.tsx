// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DashboardPreview } from './DashboardPreview';
import { LiveRenderPreviewProvider, LiveRenderPreviewContextValue } from '../../contexts/LiveRenderPreviewContext';
import type { ThemeConfig } from '../../types/theme';

afterEach(cleanup);

const minimalTheme = {
  id: 't1', name: 'Test', category: 'Minimal', author: 'x', description: '',
  background: { type: 'solid', solidColor: '#000', darken: 0, blur: 0, saturation: 1, vignette: 0, headerTintAuto: true },
  engine: {},
  palette: { primary: '#3366ff', accent: '#ff6633' },
  dark: { primaryBackground: '#111', secondaryBackground: '#222', cardBackground: '#181818', textPrimary: '#fff', textSecondary: '#ccc' },
  light: { primaryBackground: '#fff', secondaryBackground: '#eee', cardBackground: '#fafafa', textPrimary: '#000', textSecondary: '#333' },
} as unknown as ThemeConfig;

function renderWithLiveRenderContext(
  ui: React.ReactElement,
  overrides: Partial<LiveRenderPreviewContextValue>,
) {
  const value: LiveRenderPreviewContextValue = {
    ready: false,
    timedOut: false,
    registerSlot: vi.fn(),
    applyTheme: vi.fn(() => true),
    ...overrides,
  };
  return { ...render(<LiveRenderPreviewProvider value={value}>{ui}</LiveRenderPreviewProvider>), value };
}

describe('DashboardPreview fallback', () => {
  it('renders the fake-tile fallback when the live-render preview never becomes ready before the timeout', () => {
    renderWithLiveRenderContext(<DashboardPreview theme={minimalTheme} />, { ready: false, timedOut: true });
    expect(screen.queryByTestId('live-render-slot')).toBeNull();
  });

  it('renders the live-render slot (not the fake-tile fallback) when ready', () => {
    renderWithLiveRenderContext(<DashboardPreview theme={minimalTheme} />, { ready: true, timedOut: false });
    expect(screen.getByTestId('live-render-slot')).not.toBeNull();
  });

  it('registers its slot element with the context when it becomes the live-render consumer', () => {
    const { value } = renderWithLiveRenderContext(<DashboardPreview theme={minimalTheme} />, { ready: true, timedOut: false });
    expect(value.registerSlot).toHaveBeenCalled();
    const calls = (value.registerSlot as ReturnType<typeof vi.fn>).mock.calls;
    const lastCallArg = calls[calls.length - 1]?.[0];
    expect(lastCallArg).not.toBeNull();
  });

  it('still renders the fake-tile fallback (not the slot) while not yet ready and not yet timed out', () => {
    renderWithLiveRenderContext(<DashboardPreview theme={minimalTheme} />, { ready: false, timedOut: false });
    expect(screen.queryByTestId('live-render-slot')).toBeNull();
  });
});
