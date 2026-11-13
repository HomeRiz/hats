// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Navbar } from './Navbar';
import { defaultGlassTheme } from '../../presets/defaultThemes';

afterEach(cleanup);

function renderNavbar(previewOnly: boolean, setActiveTab = vi.fn()) {
  render(
    <Navbar
      activeTheme={defaultGlassTheme}
      activeTab="library"
      setActiveTab={setActiveTab}
      previewMode="dark"
      setPreviewMode={() => {}}
      onOpenExport={() => {}}
      onOpenImport={() => {}}
      onOpenSubmitPr={() => {}}
      onNewTheme={() => {}}
      onOpenDoctor={() => {}}
      needsSetup={false}
      previewOnly={previewOnly}
    />
  );
  return setActiveTab;
}

describe('Navbar community tab', () => {
  it('is called Browse themes on the hosted preview site and opens the community tab', () => {
    const setActiveTab = renderNavbar(true);
    expect(screen.queryByText('Community & PR')).toBeNull();
    fireEvent.click(screen.getByText('Browse themes'));
    expect(setActiveTab).toHaveBeenCalledWith('community');
  });

  it('keeps the name Community & PR in the apps', () => {
    renderNavbar(false);
    expect(screen.getByText('Community & PR')).toBeTruthy();
    expect(screen.queryByText('Browse themes')).toBeNull();
  });
});
