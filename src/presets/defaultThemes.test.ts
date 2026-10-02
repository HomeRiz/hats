import { describe, it, expect } from 'vitest';
import { defaultThemes } from './defaultThemes';

describe('defaultThemes', () => {
  it('has unique ids and names', () => {
    expect(new Set(defaultThemes.map((t) => t.id)).size).toBe(defaultThemes.length);
    expect(new Set(defaultThemes.map((t) => t.name)).size).toBe(defaultThemes.length);
  });

  it('makes the Alpine Storm Lake photo theme the default', () => {
    expect(defaultThemes[0].name).toBe('HATS Signature Nature - Alpine Storm Lake');
    expect(defaultThemes[0].background.type).toBe('image');
  });

  it('offers several themes for kids', () => {
    const kids = defaultThemes.filter((t) => t.category === 'Kids');
    expect(kids.length).toBeGreaterThanOrEqual(4);
  });

  it('gives each photo kids theme its own image, kids engine and readable light text', () => {
    const photoKids = defaultThemes.filter((t) => t.category === 'Kids' && t.background.type === 'image');
    expect(photoKids.map((t) => t.id).sort()).toEqual([
      'hats-kids-forest-friends',
      'hats-kids-space-adventure',
      'hats-kids-storybook-village',
    ]);
    expect(new Set(photoKids.map((t) => t.background.imageUrl)).size).toBe(3);
    for (const theme of photoKids) {
      expect(theme.background.imageUrl).toBeTruthy();
      expect(theme.engine.engineType).toBe('kids');
      expect(theme.dark.textPrimary).toBe('#FFFFFF');
    }
  });
});
