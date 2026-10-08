export type PaletteColors = {
  primary: string;
  accent: string;
  red: string;
  pink: string;
  purple: string;
  indigo: string;
  blue: string;
  lightBlue: string;
  cyan: string;
  teal: string;
  green: string;
  yellow: string;
  orange: string;
  brown: string;
  grey: string;
};

export function hexToRgb(hex: string): [number, number, number];
export function rgbToHex(r: number, g: number, b: number): string;
export function normalizeHex(value: unknown): string | null;
export function parseColor(value: unknown): string | null;
export function extractPalette(data: Record<string, unknown>, fallback: PaletteColors, mode?: 'dark' | 'light'): PaletteColors;
