// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { ExportModal } from './ExportModal';
import { defaultGlassTheme } from '../../presets/defaultThemes';

const standalone = vi.hoisted(() => ({ value: false }));
const download = vi.hoisted(() => vi.fn());

vi.mock('../../state/useStandalone', () => ({ useStandalone: () => standalone.value, detectStandalone: async () => standalone.value }));
vi.mock('../../utils/download', () => ({ downloadFile: download }));
vi.mock('../../services/haService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/haService')>()),
  embedBundledBackground: async (theme: unknown) => theme,
}));

beforeEach(() => {
  standalone.value = false;
  download.mockClear();
});
afterEach(cleanup);

const renderModal = () => render(<ExportModal isOpen onClose={() => {}} theme={defaultGlassTheme} />);

describe('ExportModal in the Home Assistant app', () => {
  it('keeps the direct install button and hint', () => {
    renderModal();
    expect(screen.getByText('Install Directly to Home Assistant')).toBeTruthy();
    expect(screen.getByText(/Click "Install Directly"/)).toBeTruthy();
  });
});

describe('ExportModal in the standalone app', () => {
  beforeEach(() => {
    standalone.value = true;
  });

  it('has no install button and no install hint', () => {
    renderModal();
    expect(screen.queryByText(/Install Directly/)).toBeNull();
    expect(screen.queryByText(/Save to Themes Folder/)).toBeNull();
    expect(screen.getByText(/download a zip/)).toBeTruthy();
    expect(screen.getByText(/^Export:/).textContent).not.toContain('Install');
  });
});

describe('ExportModal downloads', () => {
  it('downloads a zip on both tabs', async () => {
    renderModal();
    fireEvent.click(screen.getByText('Download .zip'));
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    expect(download.mock.calls[0][0]).toBe(`${defaultGlassTheme.id}.zip`);
    expect(download.mock.calls[0][2]).toBe('application/zip');

    fireEvent.click(screen.getByText(/Per-View card_mod Snippet/));
    fireEvent.click(screen.getByText('Download .zip'));
    await waitFor(() => expect(download).toHaveBeenCalledTimes(2));
  });
});

describe('ExportModal per-view tab', () => {
  it('explains what the snippet does and where to paste it', () => {
    renderModal();
    fireEvent.click(screen.getByText(/Per-View card_mod Snippet/));
    expect(screen.getByText(/What it does\./)).toBeTruthy();
    expect(screen.getByText('Raw configuration editor')).toBeTruthy();
    expect(screen.getByText(/UIX or card-mod/)).toBeTruthy();
  });
});
