import {
  CustomPalettePreset,
  CustomSvgPreset,
  CustomArtworkPreset,
  CustomCssPreset,
} from '../types/customPresets';

const STORAGE_KEYS = {
  PALETTES: 'hats_custom_palettes',
  SVGS: 'hats_custom_svgs',
  ARTWORKS: 'hats_custom_artworks',
  CSS: 'hats_custom_css',
};

export const loadCustomPalettes = (): CustomPalettePreset[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PALETTES);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load custom palettes from localStorage:', err);
    return [];
  }
};

export const saveCustomPalettes = (palettes: CustomPalettePreset[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PALETTES, JSON.stringify(palettes));
  } catch (err) {
    console.error('Failed to save custom palettes to localStorage:', err);
  }
};

export const loadCustomSvgs = (): CustomSvgPreset[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SVGS);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load custom svgs from localStorage:', err);
    return [];
  }
};

export const saveCustomSvgs = (svgs: CustomSvgPreset[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SVGS, JSON.stringify(svgs));
  } catch (err) {
    console.error('Failed to save custom svgs to localStorage:', err);
  }
};

export const loadCustomArtworks = (): CustomArtworkPreset[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ARTWORKS);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load custom artworks from localStorage:', err);
    return [];
  }
};

export const saveCustomArtworks = (artworks: CustomArtworkPreset[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ARTWORKS, JSON.stringify(artworks));
  } catch (err) {
    console.error('Failed to save custom artworks to localStorage:', err);
  }
};

export const loadCustomCss = (): CustomCssPreset[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CSS);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load custom CSS snippets from localStorage:', err);
    return [];
  }
};

export const saveCustomCss = (cssList: CustomCssPreset[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CSS, JSON.stringify(cssList));
  } catch (err) {
    console.error('Failed to save custom CSS snippets to localStorage:', err);
  }
};
