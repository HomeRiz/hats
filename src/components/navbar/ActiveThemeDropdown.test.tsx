// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ActiveThemeDropdown } from './ActiveThemeDropdown';
import { defaultGlassTheme, defaultKidsTheme } from '../../presets/defaultThemes';

afterEach(cleanup);

describe('ActiveThemeDropdown', () => {
  it('renders the list on the page body so the preview layer cannot cover it', () => {
    const { container } = render(
      <header>
        <ActiveThemeDropdown activeTheme={defaultGlassTheme} allThemes={[defaultGlassTheme, defaultKidsTheme]} onSelectTheme={() => {}} />
      </header>
    );
    fireEvent.click(screen.getByTitle('Select Active Theme'));
    const search = screen.getByPlaceholderText(/Search/);
    expect(container.contains(search)).toBe(false);
    expect(document.body.contains(search)).toBe(true);
    const list = search.closest('[class*="z-[55]"]') as HTMLElement;
    expect(list).not.toBeNull();
    expect(list.style.position).toBe('fixed');
  });

  it('selects a theme and closes the list', () => {
    const onSelect = vi.fn();
    render(<ActiveThemeDropdown activeTheme={defaultGlassTheme} allThemes={[defaultGlassTheme, defaultKidsTheme]} onSelectTheme={onSelect} />);
    fireEvent.click(screen.getByTitle('Select Active Theme'));
    fireEvent.click(screen.getByText(defaultKidsTheme.name));
    expect(onSelect).toHaveBeenCalledWith(defaultKidsTheme.id);
    expect(screen.queryByPlaceholderText(/Search/)).toBeNull();
  });

  it('closes when clicking elsewhere on the page', () => {
    render(<ActiveThemeDropdown activeTheme={defaultGlassTheme} allThemes={[defaultGlassTheme]} onSelectTheme={() => {}} />);
    fireEvent.click(screen.getByTitle('Select Active Theme'));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByPlaceholderText(/Search/)).toBeNull();
  });
});
