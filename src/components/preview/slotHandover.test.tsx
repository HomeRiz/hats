// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { LiveRenderPreviewProvider, LiveRenderPreviewContextValue } from '../../contexts/LiveRenderPreviewContext';
import { ThemeOverviewModal } from '../library/ThemeOverviewModal';
import { DashboardPreview } from './DashboardPreview';
import { defaultGlassTheme } from '../../presets/defaultThemes';

afterEach(cleanup);

function setup() {
  const state: { slot: HTMLDivElement | null } = { slot: null };
  const value: LiveRenderPreviewContextValue = {
    ready: true,
    timedOut: false,
    registerSlot: (el) => {
      state.slot = el;
    },
    applyTheme: vi.fn(() => true),
    retry: () => {},
  };
  const Host: React.FC<{ tab: 'library' | 'editor' }> = ({ tab }) => (
    <LiveRenderPreviewProvider value={value}>
      {tab === 'library' ? (
        <ThemeOverviewModal
          isOpen
          onClose={() => {}}
          theme={defaultGlassTheme}
          allThemes={[defaultGlassTheme]}
          onSelectTheme={() => {}}
          onEditTheme={() => {}}
          onApplyTheme={() => {}}
          onDuplicateTheme={() => {}}
        />
      ) : (
        <DashboardPreview theme={defaultGlassTheme} />
      )}
    </LiveRenderPreviewProvider>
  );
  return { state, Host };
}

describe('live preview slot', () => {
  it('belongs to the designer after the overview dialog is left for it', () => {
    const { state, Host } = setup();
    const view = render(<Host tab="library" />);
    expect(state.slot).not.toBeNull();

    view.rerender(<Host tab="editor" />);
    expect(state.slot).not.toBeNull();
    expect(state.slot?.isConnected).toBe(true);
  });

  it('belongs to the overview dialog after the designer is left for it', () => {
    const { state, Host } = setup();
    const view = render(<Host tab="editor" />);
    expect(state.slot).not.toBeNull();

    view.rerender(<Host tab="library" />);
    expect(state.slot?.isConnected).toBe(true);
  });
});
