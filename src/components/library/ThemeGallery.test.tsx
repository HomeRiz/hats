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

function renderGallery(standalone: boolean) {
  return render(
    <ThemeGallery
      themes={themes}
      activeThemeId={themes[0].id}
      onSelectTheme={() => {}}
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
    fireEvent.click(screen.getAllByText(themes[2].name)[0]);
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
    expect(screen.queryByText('Select')).toBeNull();
    expect(screen.queryByText('Import YAML')).toBeNull();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.queryByText('1/2')).toBeNull();
  });

  it('replaces Install with Download in the theme dialog and downloads that theme', async () => {
    renderGallery(true);
    fireEvent.click(screen.getAllByText(themes[2].name)[0]);
    expect(screen.queryByText('Install')).toBeNull();
    expect(screen.queryByText('Installed in HA')).toBeNull();
    fireEvent.click(screen.getByText('Download'));
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    expect(download.mock.calls[0][0]).toBe(`${themes[2].id}.zip`);
  });
});
