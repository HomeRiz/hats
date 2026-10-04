// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Navbar } from './Navbar';
import { defaultGlassTheme } from '../../presets/defaultThemes';

afterEach(cleanup);

function renderNavbar(needsSetup: boolean, onOpenDoctor = vi.fn(), standalone = false, activeTab: 'editor' | 'library' | 'community' | 'code' = 'editor') {
  render(
    <Navbar
      activeTheme={defaultGlassTheme}
      activeTab={activeTab}
      setActiveTab={() => {}}
      previewMode="dark"
      setPreviewMode={() => {}}
      onOpenExport={() => {}}
      onOpenImport={() => {}}
      onOpenSubmitPr={() => {}}
      onNewTheme={() => {}}
      onOpenDoctor={onOpenDoctor}
      needsSetup={needsSetup}
      standalone={standalone}
    />
  );
  return onOpenDoctor;
}

describe('Navbar setup button', () => {
  it('is hidden while Home Assistant is set up correctly', () => {
    renderNavbar(false);
    expect(screen.queryByText('Setup Needed')).toBeNull();
    expect(screen.queryByText('HA Setup')).toBeNull();
  });

  it('shows up and opens the doctor when something is missing', () => {
    const onOpenDoctor = renderNavbar(true);
    fireEvent.click(screen.getByText('Setup Needed'));
    expect(onOpenDoctor).toHaveBeenCalledTimes(1);
  });
});

describe('Navbar pop-out button', () => {
  it('opens HATS in a new tab inside Home Assistant', () => {
    renderNavbar(false);
    expect(screen.getByTitle('Open HATS in a Full New Browser Tab')).toBeTruthy();
  });

  it('is not shown in the standalone app', () => {
    renderNavbar(false, vi.fn(), true);
    expect(screen.queryByTitle('Open HATS in a Full New Browser Tab')).toBeNull();
  });
});

describe('Navbar export button', () => {
  it('is shown on the Designer tab', () => {
    renderNavbar(false);
    expect(screen.getByText('Export')).toBeTruthy();
  });

  it('is hidden on the other tabs', () => {
    for (const tab of ['library', 'community', 'code'] as const) {
      cleanup();
      renderNavbar(false, vi.fn(), false, tab);
      expect(screen.queryByText('Export')).toBeNull();
    }
  });
});
