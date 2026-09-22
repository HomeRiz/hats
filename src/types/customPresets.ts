import { PaletteColors } from './theme';

export interface CustomPalettePreset {
  id: string;
  name: string;
  palette: PaletteColors;
  createdAt: number;
}

export interface CustomSvgPreset {
  id: string;
  name: string;
  desc: string;
  code: string;
  createdAt: number;
}

export interface CustomArtworkPreset {
  id: string;
  name: string;
  type: 'image' | 'gradient' | 'svg' | 'solid';
  imageUrl?: string;
  imageFileName?: string;
  gradientString?: string;
  solidColor?: string;
  avgColor?: string;
  accent?: string;
  createdAt: number;
}

export interface CustomCssPreset {
  id: string;
  name: string;
  description: string;
  css: string;
  createdAt: number;
}
