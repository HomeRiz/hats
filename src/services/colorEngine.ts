import { hexToRgb, rgbToHex } from '../../server/paletteExtract.js';

export { hexToRgb, rgbToHex, normalizeHex, parseColor, extractPalette } from '../../server/paletteExtract.js';
export type { PaletteColors } from '../../server/paletteExtract.js';

export function hexToRgbString(hex: string): string {
  try {
    const [r, g, b] = hexToRgb(hex);
    return `${r}, ${g}, ${b}`;
  } catch {
    return '255, 255, 255';
  }
}

export function mixHex(hexA: string, hexB: string, weight: number): string {
  const [rA, gA, bA] = hexToRgb(hexA);
  const [rB, gB, bB] = hexToRgb(hexB);
  const r = rA + (rB - rA) * weight;
  const g = gA + (gB - gA) * weight;
  const b = bA + (bB - bA) * weight;
  return rgbToHex(r, g, b);
}

export function generatePrimaryRamp(accentHex: string): Array<{ step: string; hex: string }> {
  const ramp: Array<{ step: string; hex: string }> = [];
  
  for (const i of [5, 10, 20, 30]) {
    const step = i < 10 ? `0${i}` : `${i}`;
    ramp.push({ step, hex: mixHex('#000000', accentHex, i / 40.0) });
  }

  ramp.push({ step: '40', hex: accentHex });

  for (const i of [50, 60, 70, 80, 90, 95]) {
    ramp.push({ step: `${i}`, hex: mixHex(accentHex, '#ffffff', (i - 40) / 60.0) });
  }

  return ramp;
}

export function calculateLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const val = v / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = calculateLuminance(hex1);
  const l2 = calculateLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function darkenColor(hex: string, amount: number = 0.35): string {
  return mixHex(hex, '#000000', amount);
}

export function lightenColor(hex: string, amount: number = 0.35): string {
  return mixHex(hex, '#ffffff', amount);
}

export function readableTextOn(bgHex: string): string {
  try {
    const dark = '#0B0D14';
    const light = '#FFFFFF';
    return getContrastRatio(bgHex, dark) >= getContrastRatio(bgHex, light) ? dark : light;
  } catch {
    return '#FFFFFF';
  }
}

