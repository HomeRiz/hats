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
    retry: vi.fn(),
    ...overrides,
  };
  return { ...render(<LiveRenderPreviewProvider value={value}>{ui}</LiveRenderPreviewProvider>), value };
}

describe('DashboardPreview fallback', () => {
  it('shows the retry failed-state (not the slot) when the boot genuinely times out with no ready signal', () => {
    renderWithLiveRenderContext(<DashboardPreview theme={minimalTheme} />, { ready: false, timedOut: true });
    expect(screen.queryByTestId('live-render-slot')).toBeNull();
    expect(screen.getByText(/didn.t load in time/i)).not.toBeNull();
  });

  it('renders the live-render slot (not the failed state) when ready', () => {
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

  it('shows the booting spinner (not the slot, not the failed state) while not yet ready and not yet timed out', () => {
    renderWithLiveRenderContext(<DashboardPreview theme={minimalTheme} />, { ready: false, timedOut: false });
    expect(screen.queryByTestId('live-render-slot')).toBeNull();
    expect(screen.queryByText(/didn.t load in time/i)).toBeNull();
  });

  it('is sticky: a ready signal that arrives after the give-up timeout still shows the slot, not the failed state', () => {
    renderWithLiveRenderContext(<DashboardPreview theme={minimalTheme} />, { ready: true, timedOut: true });
    expect(screen.getByTestId('live-render-slot')).not.toBeNull();
    expect(screen.queryByText(/didn.t load in time/i)).toBeNull();
  });
});
