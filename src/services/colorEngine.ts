export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace(/^#/, '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return [r, g, b];
  }
  const num = parseInt(cleanHex.substring(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

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
