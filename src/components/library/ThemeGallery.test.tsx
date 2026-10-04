// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { ThemeGallery } from './ThemeGallery';
import { defaultGlassTheme, defaultKidsTheme, defaultNeonTheme } from '../../presets/defaultThemes';
import { ThemeConfig } from '../../types/theme';

const download = vi.hoisted(() => vi.fn());
vi.mock('../../utils/download', () => ({ downloadFile: download }));
vi.mock('../../services/haService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/haService')>()),
  embedBundledBackground: async (theme: unknown) => theme,
}));

beforeEach(() => download.mockClear());
afterEach(cleanup);

const themes: ThemeConfig[] = [
  { ...defaultGlassTheme, isInstalled: true },
  { ...defaultKidsTheme, category: 'Kids', isInstalled: true },
  { ...defaultNeonTheme, category: 'Kids' },
];

function renderGallery(standalone: boolean, handlers: { onActivateTheme?: (id: string) => void } = {}) {
  return render(
    <ThemeGallery
      themes={themes}
      activeThemeId={themes[0].id}
      onSelectTheme={() => {}}
      onActivateTheme={handlers.onActivateTheme ?? (() => {})}
      onNewTheme={() => {}}
      onDuplicateTheme={() => {}}
      onDeleteTheme={() => {}}
      onImportThemes={() => {}}
      onSwitchToEditor={() => {}}
      onSyncHaThemes={standalone ? undefined : () => {}}
      standalone={standalone}
    />
  );
}

describe('ThemeGallery in the Home Assistant app', () => {
  it('keeps Available, Installed, the installed/total Kids count and Sync HA', () => {
    renderGallery(false);
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Installed/ })).toBeTruthy();
    expect(screen.getByText('Sync HA')).toBeTruthy();
    expect(screen.getByText('1/2')).toBeTruthy();
    expect(screen.getByText('Select')).toBeTruthy();
  });

  it('keeps the Install button in the theme dialog', () => {
    renderGallery(false);
    fireEvent.doubleClick(screen.getAllByText(themes[2].name)[0]);
    expect(screen.getByText('Install')).toBeTruthy();
    expect(screen.queryByText('Download')).toBeNull();
  });
});

describe('ThemeGallery in the standalone app', () => {
  it('lists all themes with plain counts and no install concepts', () => {
    renderGallery(true);
    expect(screen.getByText('All themes')).toBeTruthy();
    expect(screen.queryByText('Available')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Installed/ })).toBeNull();
    expect(screen.queryByText('Installed')).toBeNull();
    expect(screen.queryByText('Sync HA')).toBeNull();
    expect(screen.getByText('Select')).toBeTruthy();
    expect(screen.queryByText('Import YAML')).toBeNull();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.queryByText('1/2')).toBeNull();
  });

  it('replaces Install with Download in the theme dialog and downloads that theme', async () => {
    renderGallery(true);
    fireEvent.doubleClick(screen.getAllByText(themes[2].name)[0]);
    expect(screen.queryByText('Install')).toBeNull();
    expect(screen.queryByText('Installed in HA')).toBeNull();
    fireEvent.click(screen.getByText('Download'));
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    expect(download.mock.calls[0][0]).toBe(`${themes[2].id}.zip`);
  });
});

describe.each([
  ['the Home Assistant app', false],
  ['the standalone app', true],
])('ThemeGallery selection in %s', (_label, standalone) => {
  it('selects only the clicked theme and does not open the preview', () => {
    const onActivateTheme = vi.fn();
    renderGallery(standalone, { onActivateTheme });
    fireEvent.click(screen.getAllByText(themes[1].name)[0]);
    fireEvent.click(screen.getAllByText(themes[2].name)[0]);
    expect(onActivateTheme.mock.calls.map((c) => c[0])).toEqual([themes[1].id, themes[2].id]);
    expect(screen.queryByText(/Edit in Designer/)).toBeNull();
  });

  it('opens the preview on double click and with the eye icon', () => {
    renderGallery(standalone);
    fireEvent.doubleClick(screen.getAllByText(themes[2].name)[0]);
    expect(screen.getByText(/Edit in Designer/)).toBeTruthy();
    cleanup();
    renderGallery(standalone);
    fireEvent.click(screen.getAllByTitle('Live preview (double-click)')[0]);
    expect(screen.getByText(/Edit in Designer/)).toBeTruthy();
  });

  it('exports every selected theme in one zip', async () => {
    renderGallery(standalone);
    fireEvent.click(screen.getByText('Select'));
    fireEvent.click(screen.getAllByText(themes[1].name)[0]);
    fireEvent.click(screen.getAllByText(themes[2].name)[0]);
    fireEvent.click(screen.getByText('Export Selected'));
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    expect(download.mock.calls[0][0]).toBe('hats-themes.zip');
    expect(download.mock.calls[0][2]).toBe('application/zip');
  });

  it('keeps Export Selected disabled until something is selected', () => {
    renderGallery(standalone);
    fireEvent.click(screen.getByText('Select'));
    expect((screen.getByText('Export Selected').closest('button') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('ThemeGallery install action', () => {
  it('offers Install Selected only inside Home Assistant', () => {
    renderGallery(false);
    fireEvent.click(screen.getByText('Select'));
    expect(screen.getByText('Install Selected to HA')).toBeTruthy();
    cleanup();
    renderGallery(true);
    fireEvent.click(screen.getByText('Select'));
    expect(screen.queryByText('Install Selected to HA')).toBeNull();
  });
});

