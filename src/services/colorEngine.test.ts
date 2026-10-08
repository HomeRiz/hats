import { describe, it, expect } from 'vitest';
import { hexToRgb, rgbToHex, hexToRgbString, mixHex, generatePrimaryRamp, calculateLuminance, getContrastRatio, darkenColor, lightenColor, readableTextOn, normalizeHex, parseColor, extractPalette, PaletteColors } from './colorEngine';

const defaultPalette: PaletteColors = {
  primary: '#0A84FF',
  accent: '#FF9F0A',
  red: '#FF453A',
  pink: '#FF375F',
  purple: '#BF5AF2',
  indigo: '#5E5CE6',
  blue: '#0A84FF',
  lightBlue: '#66D4CF',
  cyan: '#5AC8F5',
  teal: '#6AC4DC',
  green: '#32D74B',
  yellow: '#FFD60A',
  orange: '#FF9F0A',
  brown: '#AC8E68',
  grey: '#8E8E93',
};

describe('normalizeHex regression', () => {
  it('still returns uppercase hex', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC');
    expect(normalizeHex('#abcdef')).toBe('#ABCDEF');
  });

  it('still returns null for non-strings', () => {
    expect(normalizeHex(123)).toBeNull();
    expect(normalizeHex(null)).toBeNull();
    expect(normalizeHex(undefined)).toBeNull();
  });

  it('still normalizes rgb', () => {
    expect(normalizeHex('rgb(0, 0, 0)')).toBe('#000000');
    expect(normalizeHex('rgba(255, 255, 255, 0.5)')).toBe('#FFFFFF');
  });
});

describe('parseColor', () => {
  it('accepts hex 3, 4, 6, 8 digit', () => {
    expect(parseColor('#abc')).toBe('#AABBCC');
    expect(parseColor('#abcd')).toBe('#AABBCC');
    expect(parseColor('#abcdef')).toBe('#ABCDEF');
    expect(parseColor('#abcdef00')).toBe('#ABCDEF');
  });

  it('accepts rgb and rgba with spaces and commas', () => {
    expect(parseColor('rgb(10, 20, 30)')).toBe('#0A141E');
    expect(parseColor('rgba(10, 20, 30, 0.5)')).toBe('#0A141E');
    expect(parseColor('rgb(10 20 30)')).toBe('#0A141E');
    expect(parseColor('rgb(10 20 30 / 0.5)')).toBe('#0A141E');
  });

  it('accepts hsl and hsla', () => {
    expect(parseColor('hsl(0 100% 50%)')).toBe('#FF0000');
    expect(parseColor('hsla(0 100% 50%)')).toBe('#FF0000');
    expect(parseColor('hsl(120deg 100% 50%)')).toBe('#00FF00');
    expect(parseColor('hsl(240 100% 50% / 0.5)')).toBe('#0000FF');
  });

  it('accepts bare rgb triplets', () => {
    expect(parseColor('255, 0, 0')).toBe('#FF0000');
    expect(parseColor('0, 255, 0')).toBe('#00FF00');
  });

  it('accepts named colors', () => {
    expect(parseColor('red')).toBe('#FF0000');
    expect(parseColor('blue')).toBe('#0000FF');
    expect(parseColor('cyan')).toBe('#00FFFF');
    expect(parseColor('coral')).toBe('#FF7F50');
  });

  it('rejects transparent, none, gradients, urls', () => {
    expect(parseColor('transparent')).toBeNull();
    expect(parseColor('none')).toBeNull();
    expect(parseColor('linear-gradient(red, blue)')).toBeNull();
    expect(parseColor('url(/image.jpg)')).toBeNull();
  });

  it('rejects px values and bare numbers', () => {
    expect(parseColor('16px')).toBeNull();
    expect(parseColor('123')).toBeNull();
  });
});

describe('extractPalette kebab keys', () => {
  it('finds primary and accent from -color suffix', () => {
    const theme = {
      'primary-color': '#FF0000',
      'accent-color': '#00FF00',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.primary).toBe('#FF0000');
    expect(p.accent).toBe('#00FF00');
  });

  it('finds role-specific colors', () => {
    const theme = {
      'primary-color': '#0A84FF',
      'accent-color': '#FF9F0A',
      'red-color': '#FF453A',
      'blue-color': '#0000FF',
      'green-color': '#00FF00',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.red).toBe('#FF453A');
    expect(p.blue).toBe('#0000FF');
    expect(p.green).toBe('#00FF00');
  });

  it('handles light-blue before blue', () => {
    const theme = {
      'primary-color': '#0A84FF',
      'accent-color': '#FF9F0A',
      'light-blue-color': '#00FFFF',
      'blue-color': '#0000FF',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.lightBlue).toBe('#00FFFF');
  });
});

describe('extractPalette -- prefix and camelCase', () => {
  it('strips leading -- and normalizes to kebab', () => {
    const theme = {
      '--primary-color': '#FF0000',
      '--accentColor': '#00FF00',
      '--red_color': '#FF0000',
      'lightBlue': '#00FFFF',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.primary).toBe('#FF0000');
    expect(p.accent).toBe('#00FF00');
    expect(p.red).toBe('#FF0000');
    expect(p.lightBlue).toBe('#00FFFF');
  });
});

describe('extractPalette modes and var resolution', () => {
  it('prefers dark mode over top level', () => {
    const theme = {
      'primary-color': '#AAAAAA',
      modes: {
        dark: {
          'primary-color': '#FF0000',
        },
      },
    };
    const p = extractPalette(theme, defaultPalette, 'dark');
    expect(p.primary).toBe('#FF0000');
  });

  it('falls back to top level if dark mode missing', () => {
    const theme = {
      'primary-color': '#FF0000',
      modes: {
        dark: {},
      },
    };
    const p = extractPalette(theme, defaultPalette, 'dark');
    expect(p.primary).toBe('#FF0000');
  });

  it('resolves var() references', () => {
    const theme = {
      'primary-color': 'var(--base)',
      'base': '#FF0000',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.primary).toBe('#FF0000');
  });

  it('resolves var() with fallback', () => {
    const theme = {
      'primary-color': 'var(--missing, #00FF00)',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.primary).toBe('#00FF00');
  });

  it('terminates var() cycles at depth 8', () => {
    const theme = {
      'primary-color': 'var(--a)',
      'a': 'var(--b)',
      'b': 'var(--a)',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.primary).toBe(defaultPalette.primary);
  });

  it('resolves var() references in modes', () => {
    const theme = {
      'base': '#AAAAAA',
      modes: {
        dark: {
          'primary-color': 'var(--base)',
        },
      },
    };
    const p = extractPalette(theme, defaultPalette, 'dark');
    expect(p.primary).toBe('#AAAAAA');
  });
});

describe('extractPalette rgb-*-color format', () => {
  it('finds rgb-primary-color triplet', () => {
    const theme = {
      'rgb-primary-color': '255, 0, 0',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.primary).toBe('#FF0000');
  });

  it('prioritizes -color over rgb-*-color', () => {
    const theme = {
      'primary-color': '#00FF00',
      'rgb-primary-color': '255, 0, 0',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.primary).toBe('#00FF00');
  });
});

describe('extractPalette color formats', () => {
  it('handles hsl values', () => {
    const theme = {
      'primary-color': 'hsl(0 100% 50%)',
      'accent-color': 'hsl(120 100% 50%)',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.primary).toBe('#FF0000');
    expect(p.accent).toBe('#00FF00');
  });

  it('handles rgba values', () => {
    const theme = {
      'primary-color': 'rgba(255, 0, 0, 0.8)',
      'accent-color': 'rgba(0, 255, 0, 0.5)',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.primary).toBe('#FF0000');
    expect(p.accent).toBe('#00FF00');
  });

  it('handles named colors', () => {
    const theme = {
      'primary-color': 'red',
      'accent-color': 'lime',
      'blue-color': 'blue',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.primary).toBe('#FF0000');
    expect(p.accent).toBe('#00FF00');
    expect(p.blue).toBe('#0000FF');
  });
});

describe('extractPalette component-vars-only themes (ios-dark-mode style)', () => {
  it('fills roles from component vars by hue', () => {
    const theme = {
      'danger-color': '#FF0000',
      'success-color': '#00FF00',
      'warning-color': '#FF6600',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.red).toBe('#FF0000');
    expect(p.green).toBe('#00FF00');
    expect(p.orange).toBe('#FF6600');
  });

  it('skips low saturation greys and backgrounds', () => {
    const theme = {
      'primary-background-color': '#333333',
      'card-background-color': '#222222',
      'paper-slider-active-color': '#FF0000',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.red).toBe('#FF0000');
    expect(p.primary).toBe(defaultPalette.primary);
  });
});

describe('extractPalette exclusions', () => {
  it('ignores background vars', () => {
    const theme = {
      'primary-color': '#0A84FF',
      'primary-background-color': '#FF0000',
      'ha-card-background': '#00FF00',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.primary).toBe('#0A84FF');
    expect(p.red).toBe(defaultPalette.red);
  });

  it('ignores text and font vars', () => {
    const theme = {
      'primary-color': '#0A84FF',
      'primary-text-color': '#FF0000',
      'secondary-text-color': '#00FF00',
      'text-color': '#FFFFFF',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.primary).toBe('#0A84FF');
    expect(p.red).toBe(defaultPalette.red);
  });

  it('ignores border and shadow vars', () => {
    const theme = {
      'accent-color': '#FF9F0A',
      'border-color': '#FF0000',
      'shadow-color': '#00FF00',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.accent).toBe('#FF9F0A');
    expect(p.red).toBe(defaultPalette.red);
  });

  it('ignores mdc- and token- prefixed vars', () => {
    const theme = {
      'accent-color': '#FF9F0A',
      'mdc-theme-primary': '#FF0000',
      'token-accent': '#00FF00',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.accent).toBe('#FF9F0A');
    expect(p.red).toBe(defaultPalette.red);
  });
});

describe('extractPalette role symmetry', () => {
  it('defaults accent to primary if accent missing', () => {
    const theme = {
      'primary-color': '#FF0000',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.primary).toBe('#FF0000');
    expect(p.accent).toBe('#FF0000');
  });

  it('defaults primary to accent if primary missing but accent found', () => {
    const theme = {
      'accent-color': '#FF0000',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.accent).toBe('#FF0000');
    expect(p.primary).toBe('#FF0000');
  });
});

describe('extractPalette untouched roles', () => {
  it('keeps fallback for roles without colors', () => {
    const theme = {
      'primary-color': '#0A84FF',
      'accent-color': '#FF9F0A',
    };
    const p = extractPalette(theme, defaultPalette);
    expect(p.purple).toBe(defaultPalette.purple);
    expect(p.indigo).toBe(defaultPalette.indigo);
    expect(p.green).toBe(defaultPalette.green);
  });
});

describe('hexToRgb', () => {
  it('converts hex to rgb', () => {
    expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('#abc')).toEqual([170, 187, 204]);
  });
});

describe('rgbToHex', () => {
  it('converts rgb to hex', () => {
    const r1 = rgbToHex(255, 0, 0);
    const r2 = rgbToHex(170, 187, 204);
    expect(r1.toUpperCase()).toBe('#FF0000');
    expect(r2.toUpperCase()).toBe('#AABBCC');
  });

  it('clamps out of range values', () => {
    const result = rgbToHex(300, -10, 128);
    expect(result.toUpperCase()).toBe('#FF0080');
  });
});

describe('hexToRgbString', () => {
  it('converts hex to comma-separated rgb string', () => {
    expect(hexToRgbString('#FF0000')).toBe('255, 0, 0');
    expect(hexToRgbString('#abc')).toBe('170, 187, 204');
  });

  it('falls back to 0,0,0 for invalid input', () => {
    const result = hexToRgbString('invalid');
    expect(result).toBe('0, 0, 0');
  });
});

describe('mixHex', () => {
  it('blends two hex colors', () => {
    const result = mixHex('#000000', '#FFFFFF', 0.5);
    expect(result.toUpperCase()).toBe('#808080');
  });

  it('handles weight 0 and 1', () => {
    expect(mixHex('#000000', '#FFFFFF', 0).toUpperCase()).toBe('#000000');
    expect(mixHex('#000000', '#FFFFFF', 1).toUpperCase()).toBe('#FFFFFF');
  });
});

describe('generatePrimaryRamp', () => {
  it('generates a ramp with multiple shades', () => {
    const ramp = generatePrimaryRamp('#0A84FF');
    expect(ramp.length).toBeGreaterThan(8);
  });

  it('has the primary color at step 40', () => {
    const ramp = generatePrimaryRamp('#0A84FF');
    const step40 = ramp.find(s => s.step === '40');
    expect(step40?.hex).toBe('#0A84FF');
  });

  it('includes lighter and darker shades', () => {
    const ramp = generatePrimaryRamp('#0A84FF');
    const dark = ramp.find(s => s.step === '05');
    const light = ramp.find(s => s.step === '95');
    expect(dark).toBeDefined();
    expect(light).toBeDefined();
  });
});

describe('calculateLuminance', () => {
  it('calculates luminance', () => {
    const white = calculateLuminance('#FFFFFF');
    const black = calculateLuminance('#000000');
    expect(white).toBeGreaterThan(black);
  });

  it('returns reasonable values', () => {
    const lum = calculateLuminance('#808080');
    expect(lum).toBeGreaterThan(0);
    expect(lum).toBeLessThan(1);
  });
});

describe('getContrastRatio', () => {
  it('calculates contrast between two colors', () => {
    const ratio = getContrastRatio('#FFFFFF', '#000000');
    expect(ratio).toBeGreaterThan(1);
    expect(ratio).toBe(21);
  });

  it('same color has contrast of 1', () => {
    expect(getContrastRatio('#808080', '#808080')).toBe(1);
  });
});

describe('darkenColor', () => {
  it('darkens a color', () => {
    const darkened = darkenColor('#FFFFFF', 0.5);
    expect(darkened).not.toBe('#FFFFFF');
  });

  it('uses default amount', () => {
    const darkened = darkenColor('#FFFFFF');
    expect(darkened).toBeDefined();
  });
});

describe('lightenColor', () => {
  it('lightens a color', () => {
    const lightened = lightenColor('#000000', 0.5);
    expect(lightened).not.toBe('#000000');
  });

  it('uses default amount', () => {
    const lightened = lightenColor('#000000');
    expect(lightened).toBeDefined();
  });
});

describe('readableTextOn', () => {
  it('returns dark text for light background', () => {
    const text = readableTextOn('#FFFFFF');
    expect(text).toBe('#0B0D14');
  });

  it('returns light text for dark background', () => {
    const text = readableTextOn('#000000');
    expect(text).toBe('#FFFFFF');
  });

  it('returns white for invalid input', () => {
    const text = readableTextOn('invalid');
    expect(text).toBe('#FFFFFF');
  });
});
