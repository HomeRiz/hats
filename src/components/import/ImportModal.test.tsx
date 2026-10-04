// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { ImportModal } from './ImportModal';

afterEach(cleanup);

const YAML = 'Night:\n  primary-color: "#336699"\n';

describe('ImportModal', () => {
  it('says what can be loaded and keeps Import disabled until there is a theme', () => {
    render(<ImportModal isOpen onClose={() => {}} onImport={() => {}} />);
    expect(screen.getByText('Theme YAML')).toBeTruthy();
    expect(screen.getByText('Background image')).toBeTruthy();
    expect(screen.getByText('Per-view snippet')).toBeTruthy();
    expect((screen.getByText('Import').closest('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('imports pasted YAML and closes', async () => {
    const onImport = vi.fn();
    const onClose = vi.fn();
    render(<ImportModal isOpen onClose={onClose} onImport={onImport} />);
    fireEvent.change(screen.getByLabelText('Theme YAML'), { target: { value: YAML } });
    fireEvent.click(screen.getByText('Import'));
    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(onImport.mock.calls[0][0][0].name).toBe('Night');
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the dialog open and explains a broken file', async () => {
    const onImport = vi.fn();
    render(<ImportModal isOpen onClose={() => {}} onImport={onImport} />);
    fireEvent.change(screen.getByLabelText('Theme YAML'), { target: { value: 'just text' } });
    fireEvent.click(screen.getByText('Import'));
    expect((await screen.findByRole('alert')).textContent).toContain('No Home Assistant theme');
    expect(onImport).not.toHaveBeenCalled();
  });

  it('passes the per-view snippet along with the theme', async () => {
    const onImport = vi.fn();
    render(<ImportModal isOpen onClose={() => {}} onImport={onImport} />);
    fireEvent.change(screen.getByLabelText('Theme YAML'), { target: { value: YAML } });
    fireEvent.change(screen.getByLabelText('Per-view snippet'), { target: { value: '- title: Home\n  path: home\n' } });
    fireEvent.click(screen.getByText('Import'));
    await waitFor(() => expect(onImport).toHaveBeenCalled());
    expect(onImport.mock.calls[0][0][0].viewSnippet).toBe('- title: Home\n  path: home');
  });

  it('renders nothing when closed', () => {
    const { container } = render(<ImportModal isOpen={false} onClose={() => {}} onImport={() => {}} />);
    expect(container.innerHTML).toBe('');
  });
});
