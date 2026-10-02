// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Navbar } from './Navbar';
import { defaultGlassTheme } from '../../presets/defaultThemes';

afterEach(cleanup);

function renderNavbar(needsSetup: boolean, onOpenDoctor = vi.fn()) {
  render(
    <Navbar
      activeTheme={defaultGlassTheme}
      activeTab="editor"
      setActiveTab={() => {}}
      previewMode="dark"
      setPreviewMode={() => {}}
      onOpenExport={() => {}}
      onOpenSubmitPr={() => {}}
      onNewTheme={() => {}}
      onOpenDoctor={onOpenDoctor}
      needsSetup={needsSetup}
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
