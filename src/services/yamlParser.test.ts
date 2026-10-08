import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseHomeAssistantThemeYaml } from './yamlParser';

describe('parseHomeAssistantThemeYaml', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns empty array for non-object YAML', () => {
    const result = parseHomeAssistantThemeYaml('not a theme');
    expect(result).toEqual([]);
  });

  it('returns empty array for null YAML', () => {
    const result = parseHomeAssistantThemeYaml('null');
    expect(result).toEqual([]);
  });

  it('extracts HTTP background URLs', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  background-image: 'url(http://example.com/bg.jpg)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toBe('http://example.com/bg.jpg');
  });

  it('extracts HTTPS background URLs', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  background-image: 'url(https://example.com/bg.png)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toBe('https://example.com/bg.png');
  });

  it('extracts /local/ background paths', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  lovelace-background: 'url(/local/images/bg.jpg)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toBe('/local/images/bg.jpg');
  });

  it('extracts /hacsfiles/ background paths', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  primary-background-color: 'url(/hacsfiles/images/bg.webp)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toBe('/hacsfiles/images/bg.webp');
  });

  it('extracts unquoted URLs', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  background-image: url(http://example.com/bg.jpg)
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toBe('http://example.com/bg.jpg');
  });

  it('extracts data:image/jpeg URLs', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  background-image: 'url(data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toContain('data:image/jpeg');
  });

  it('extracts data:image/png URLs', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  background-image: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toContain('data:image/png');
  });

  it('extracts data:image/webp URLs', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  primary-background-color: 'url(data:image/webp;base64,UklGRiYAAABXRUJQVlA4IBIAAAAwAQCdASoBAAEAAUAcJaACdLoA/gAA)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toContain('data:image/webp');
  });

  it('extracts data:image/gif URLs', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  background-image: 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toContain('data:image/gif');
  });

  it('extracts data:image/svg URLs', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  background-image: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IGZpbGw9IiNmZmYiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48L3N2Zz4=)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toContain('data:image/svg');
  });

  it('extracts data:image/jpg URLs', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  lovelace-background: 'url(data:image/jpg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toContain('data:image/jpg');
  });

  it('checks lovelace-background key', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  lovelace-background: 'url(http://example.com/lovelace.jpg)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toBe('http://example.com/lovelace.jpg');
  });

  it('checks background-image key', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  background-image: 'url(http://example.com/img.jpg)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toBe('http://example.com/img.jpg');
  });

  it('checks primary-background-color key', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  primary-background-color: 'url(http://example.com/primary.jpg)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toBe('http://example.com/primary.jpg');
  });

  it('checks dark mode for background images', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  modes:
    dark:
      background-image: 'url(http://example.com/dark.jpg)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toBe('http://example.com/dark.jpg');
  });

  it('checks light mode for background images', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  modes:
    light:
      lovelace-background: 'url(http://example.com/light.jpg)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toBe('http://example.com/light.jpg');
  });

  it('prioritizes base theme background over modes', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  background-image: 'url(http://example.com/base.jpg)'
  modes:
    dark:
      background-image: 'url(http://example.com/dark.jpg)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toBe('http://example.com/base.jpg');
  });

  it('handles 600KB data URL without catastrophic backtracking', () => {
    const baseData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const largeBase64 = baseData.repeat(Math.ceil(600000 / baseData.length)).slice(0, 600000);
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  background-image: 'url(data:image/png;base64,${largeBase64})'
`;
    const startTime = performance.now();
    const result = parseHomeAssistantThemeYaml(yaml);
    const endTime = performance.now();

    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toContain('data:image/png');
    expect(endTime - startTime).toBeLessThan(1000);
  });

  it('ignores app-header-background-color', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  app-header-background-color: 'url(http://example.com/header.jpg)'
  background-image: 'url(http://example.com/bg.jpg)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toBe('http://example.com/bg.jpg');
  });

  it('handles gradient backgrounds', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  background: 'linear-gradient(140deg, #1b1030 0%, #0b0d14 55%, #12202e 100%)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.gradientString).toContain('linear-gradient');
  });

  it('ignores invalid URLs', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  background-image: 'not-a-url'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toBeUndefined();
  });

  it('handles multiple themes', () => {
    const yaml = `
theme1:
  primary-color: '#0A84FF'
  background-image: 'url(http://example.com/bg1.jpg)'
theme2:
  primary-color: '#FF0000'
  background-image: 'url(http://example.com/bg2.jpg)'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(2);
  });

  it('handles SVG base64 data URL in custom overlay', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  hats-background: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IGZpbGw9IiNmZmYiLz48L3N2Zz4=")'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
  });

  it('extracts URL from complex url() syntax with spaces', () => {
    const yaml = `
test_theme:
  primary-color: '#0A84FF'
  background-image: 'url( http://example.com/bg.jpg )'
`;
    const result = parseHomeAssistantThemeYaml(yaml);
    expect(result).toHaveLength(1);
    expect(result[0].background.imageUrl).toBe('http://example.com/bg.jpg');
  });
});
