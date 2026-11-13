// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { HacsThemeBrowser } from './HacsThemeBrowser';

const INDEX = {
  version: 1,
  generatedAt: '2026-11-13T00:00:00Z',
  themes: [
    { full_name: 'owner/theme-one', default_branch: 'main', license: 'MIT', stars: 5, pushed_at: null, files: [{ path: 'themes/a.yaml', themes: ['A', 'B'] }] },
  ],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function stubIndex() {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(INDEX) })));
}

describe('HacsThemeBrowser', () => {
  it('lists the catalog and says to install from HACS or the Marketplace on the hosted site', async () => {
    stubIndex();
    render(<HacsThemeBrowser hosted />);
    await waitFor(() => expect(screen.getByText('owner/theme-one')).toBeTruthy());
    expect(screen.getByText(/Preview one here, then install it from HACS or the Marketplace/)).toBeTruthy();
    expect(screen.getByText('Browse HACS and Marketplace themes')).toBeTruthy();
  });

  it('points at your own HATS in the apps', async () => {
    stubIndex();
    render(<HacsThemeBrowser />);
    await waitFor(() => expect(screen.getByText('owner/theme-one')).toBeTruthy());
    expect(screen.getByText(/Preview one in your own HATS/)).toBeTruthy();
  });
});
