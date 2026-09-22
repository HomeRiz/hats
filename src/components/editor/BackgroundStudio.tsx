import React, { useRef, useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Wand2, Sun, Plus, Trash2, Edit2, X, Save } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { processBackgroundImage } from '../../services/imageProcessor';
import { CustomArtworkPreset } from '../../types/customPresets';
import { loadCustomArtworks, saveCustomArtworks } from '../../utils/customPresetsStorage';

interface BackgroundStudioProps {
  theme: ThemeConfig;
  onChange: (updates: Partial<ThemeConfig>) => void;
}

export const BackgroundStudio: React.FC<BackgroundStudioProps> = ({ theme, onChange }) => {
  const { background, palette, engine } = theme;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [customArtworks, setCustomArtworks] = useState<CustomArtworkPreset[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<CustomArtworkPreset | null>(null);
  const [artworkNameInput, setArtworkNameInput] = useState('');
  const [gradientStringInput, setGradientStringInput] = useState('');

  useEffect(() => {
    setCustomArtworks(loadCustomArtworks());
  }, []);

  const updateBg = (updates: Partial<typeof background>) => {
    onChange({
      background: {
        ...background,
        ...updates,
      }
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      const result = await processBackgroundImage(file, 1920, 1080, background.darken);
      
      onChange({
        background: {
          ...background,
          type: 'image',
          imageUrl: result.dataUrl,
          imageFileName: file.name,
          avgColor: result.avgColor,
        },
        palette: {
          ...palette,
          accent: result.dominantAccent,
        },
        engine: {
          ...engine,
          glowColor: result.dominantAccent,
        }
      });
    } catch (err) {
      console.error('Failed to process image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const backgroundPresets = [
    {
      name: 'Liquid Glass Dark Violet',
      type: 'gradient' as const,
      gradient: 'linear-gradient(140deg, #1b1030 0%, #0b0d14 55%, #12202e 100%)',
      avg: '#120f21',
      accent: '#BF5AF2',
      tooltip: 'Liquid Glass Dark Violet: Deep cosmic obsidian with violet highlights, perfect for translucent glass cards',
    },
    {
      name: 'Pastel Storybook Dreams',
      type: 'gradient' as const,
      gradient: 'linear-gradient(140deg, #381D47 0%, #2A1838 50%, #1A2840 100%)',
      avg: '#281a3b',
      accent: '#FF70A6',
      tooltip: 'Pastel Storybook Dreams: Warm whimsical twilight gradient with soft magenta accent glows',
    },
    {
      name: 'Whimsical Kids Space Nebula',
      type: 'gradient' as const,
      gradient: 'linear-gradient(135deg, #1C0A35 0%, #0F1E4A 50%, #0B3C49 100%)',
      avg: '#151538',
      accent: '#FFB800',
      tooltip: 'Whimsical Kids Space Nebula: Vibrant stellar deep purple to teal space nebula with amber star accents',
    },
    {
      name: 'Blade Runner Cyber Neon',
      type: 'gradient' as const,
      gradient: 'linear-gradient(140deg, #12002b 0%, #04050a 55%, #001a2b 100%)',
      avg: '#080812',
      accent: '#00F0FF',
      tooltip: 'Blade Runner Cyber Neon: Moody dark cyberpunk backdrop with vibrant high-voltage electric cyan accents',
    },
    {
      name: 'Velvet Catppuccin Mocha',
      type: 'gradient' as const,
      gradient: 'linear-gradient(140deg, #313244 0%, #1e1e2e 55%, #181825 100%)',
      avg: '#202030',
      accent: '#FAB387',
      tooltip: 'Velvet Catppuccin Mocha: Smooth dark matte aesthetic with warm peach accent lighting',
    },
    {
      name: 'Nordic Emerald Aurora',
      type: 'gradient' as const,
      gradient: 'linear-gradient(140deg, #062b24 0%, #08141e 50%, #120a2a 100%)',
      avg: '#0a1e1b',
      accent: '#00FFB2',
      tooltip: 'Nordic Emerald Aurora: Deep Scandinavian night sky with bright mint aurora borealis hues',
    },
    {
      name: 'Sunset Crimson Horizon',
      type: 'gradient' as const,
      gradient: 'linear-gradient(140deg, #3a0d24 0%, #1a081e 50%, #080e22 100%)',
      avg: '#1f091a',
      accent: '#FF375F',
      tooltip: 'Sunset Crimson Horizon: Dramatic twilight crimson sky bleeding into midnight navy',
    },
    {
      name: 'Deep Abyssal Ocean',
      type: 'gradient' as const,
      gradient: 'linear-gradient(140deg, #081d38 0%, #050e20 50%, #02060f 100%)',
      avg: '#061324',
      accent: '#0A84FF',
      tooltip: 'Deep Abyssal Ocean: Midnight blue oceanic gradient with clean azure accents',
    },
  ];

  const handleOpenSaveModal = () => {
    setEditingArtwork(null);
    if (background.type === 'image') {
      setArtworkNameInput(background.imageFileName || `${theme.name} Wallpaper`);
      setGradientStringInput('');
    } else {
      setArtworkNameInput(`${theme.name} Atmospheric Gradient`);
      setGradientStringInput(background.gradientString || '');
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (artwork: CustomArtworkPreset) => {
    setEditingArtwork(artwork);
    setArtworkNameInput(artwork.name);
    setGradientStringInput(artwork.gradientString || '');
    setIsModalOpen(true);
  };

  const handleSaveArtwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artworkNameInput.trim()) return;

    if (editingArtwork) {
      const updated = customArtworks.map((a) =>
        a.id === editingArtwork.id
          ? {
              ...a,
              name: artworkNameInput.trim(),
              gradientString: a.type === 'gradient' ? gradientStringInput.trim() : a.gradientString,
            }
          : a
      );
      setCustomArtworks(updated);
      saveCustomArtworks(updated);
    } else {
      const newPreset: CustomArtworkPreset = {
        id: `artwork_${Date.now()}`,
        name: artworkNameInput.trim(),
        type: background.type,
        imageUrl: background.imageUrl,
        imageFileName: background.imageFileName,
        gradientString: background.gradientString,
        avgColor: background.avgColor,
        accent: palette.accent,
        createdAt: Date.now(),
      };
      const updated = [newPreset, ...customArtworks];
      setCustomArtworks(updated);
      saveCustomArtworks(updated);
    }

    setIsModalOpen(false);
    setEditingArtwork(null);
    setArtworkNameInput('');
    setGradientStringInput('');
  };

  const handleDeleteArtwork = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from custom artworks?`)) {
      const updated = customArtworks.filter((a) => a.id !== id);
      setCustomArtworks(updated);
      saveCustomArtworks(updated);
    }
  };

  const handleApplyArtwork = (a: CustomArtworkPreset) => {
    if (a.type === 'image' && a.imageUrl) {
      onChange({
        background: {
          ...background,
          type: 'image',
          imageUrl: a.imageUrl,
          imageFileName: a.imageFileName,
          avgColor: a.avgColor,
        },
        palette: a.accent ? { ...palette, accent: a.accent } : palette,
        engine: a.accent ? { ...engine, glowColor: a.accent } : engine,
      });
    } else if (a.type === 'gradient' && a.gradientString) {
      onChange({
        background: {
          ...background,
          type: 'gradient',
          gradientString: a.gradientString,
          avgColor: a.avgColor,
        },
        palette: a.accent ? { ...palette, accent: a.accent } : palette,
        engine: a.accent ? { ...engine, glowColor: a.accent } : engine,
      });
    }
  };

  return (
    <div className="space-y-6 text-slate-200 text-xs">
      <div className="space-y-2">
        <label 
          className="font-semibold text-slate-300 flex items-center gap-1.5"
          title="Upload a 16:9 wallpaper image. HATS will auto-extract dominant colors and average header tint."
        >
          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>Upload Wallpaper / Artwork</span>
        </label>

        <div
          onClick={() => fileInputRef.current?.click()}
          title="Click to browse and upload image files (PNG, JPG, WebP)"
          className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 bg-slate-900/40 hover:bg-slate-900/80 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all group text-center"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            accept="image/*"
            className="hidden"
          />

          <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-blue-600/20 group-hover:text-blue-400 text-slate-400 flex items-center justify-center mb-2 transition-colors">
            <Upload className="w-5 h-5" />
          </div>

          <span className="font-semibold text-xs text-slate-200">
            {isProcessing ? 'Processing & Extracting Colors...' : 'Click to Upload Artwork (PNG, JPG, WebP)'}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">
            Auto crops to 16:9, extracts dominant accent & average header color
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label 
            className="font-semibold text-slate-300 flex items-center gap-1.5"
            title="Curated multi-stop atmospheric gradient backdrops designed for liquid glass cards"
          >
            <Wand2 className="w-3.5 h-3.5 text-pink-400" />
            <span>Preset Atmosphere Gradients</span>
          </label>

          <button
            type="button"
            onClick={handleOpenSaveModal}
            title="Save current wallpaper / gradient to your custom library"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[11px] font-medium transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Save to Library</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {backgroundPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChange({
                  background: {
                    ...background,
                    type: preset.type,
                    gradientString: preset.gradient,
                    avgColor: preset.avg,
                  },
                  palette: {
                    ...palette,
                    accent: preset.accent,
                  },
                  engine: {
                    ...engine,
                    glowColor: preset.accent,
                  }
                });
              }}
              title={preset.tooltip}
              className="p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 flex items-center gap-3 transition-colors text-left group"
            >
              <div 
                className="w-10 h-8 rounded-lg shadow-sm shrink-0 border border-white/10"
                style={{ background: preset.gradient }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-white group-hover:text-pink-300 transition-colors truncate">
                  {preset.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">Accent: {preset.accent}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {customArtworks.length > 0 && (
        <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
          <label 
            className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs"
            title="Your personal saved wallpapers and custom atmosphere gradients"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Custom Saved Artworks & Gradients</span>
          </label>

          <div className="grid grid-cols-1 gap-1.5">
            {customArtworks.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2"
              >
                <div 
                  onClick={() => handleApplyArtwork(item)}
                  title={`Click to apply ${item.name}`}
                  className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group"
                >
                  {item.type === 'image' && item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-10 h-8 rounded-lg object-cover border border-slate-700 shrink-0" 
                    />
                  ) : (
                    <div 
                      className="w-10 h-8 rounded-lg shrink-0 border border-white/10" 
                      style={{ background: item.gradientString || '#1e1e2e' }}
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-slate-200 group-hover:text-indigo-300 truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {item.type} {item.accent ? `• ${item.accent}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleApplyArtwork(item)}
                    title={`Apply ${item.name} to active theme`}
                    className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-semibold transition-colors"
                  >
                    Apply
                  </button>
                  {item.type === 'gradient' && (
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      title={`Edit ${item.name}`}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteArtwork(item.id, item.name)}
                    title={`Delete ${item.name}`}
                    className="p-1 rounded hover:bg-red-950/50 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80">
        <div 
          className="font-semibold text-slate-300 flex items-center gap-1.5"
          title="Adjust background image post-filters to ensure optimal contrast and readability over frosted glass cards"
        >
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Post-Processing for Glass Readability</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span title="Dims bright wallpaper areas so card text and sensor graphs stand out clearly">
              Darken Factor (Ensures Card Legibility)
            </span>
            <span className="font-mono text-slate-200">{Math.round(background.darken * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.6"
            step="0.02"
            value={background.darken}
            onChange={(e) => updateBg({ darken: parseFloat(e.target.value) })}
            title={`Darken factor: ${Math.round(background.darken * 100)}%. Higher darken guarantees card readability over light wallpapers.`}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span title="Applies ambient blur to the raw wallpaper to soften visual noise behind dashboard cards">
              Ambient Background Blur
            </span>
            <span className="font-mono text-slate-200">{background.blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={background.blur}
            onChange={(e) => updateBg({ blur: parseInt(e.target.value) })}
            title={`Ambient wallpaper blur: ${background.blur}px. Softens sharp background textures.`}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span title="Controls color richness and vibrancy of the background artwork">
              Color Saturation
            </span>
            <span className="font-mono text-slate-200">{background.saturation}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={background.saturation}
            onChange={(e) => updateBg({ saturation: parseFloat(e.target.value) })}
            title={`Background saturation: ${background.saturation}x. 1.0x is standard, >1.0x boosts vibrant colors.`}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm text-white">
                  {editingArtwork ? 'Edit Atmosphere Gradient' : 'Save Artwork to Library'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveArtwork} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-300 text-xs font-semibold">Artwork / Gradient Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={artworkNameInput}
                  onChange={(e) => setArtworkNameInput(e.target.value)}
                  placeholder="e.g. Neon Horizon, Dreamscape..."
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {((editingArtwork && editingArtwork.type === 'gradient') || (!editingArtwork && background.type === 'gradient')) && (
                <div className="space-y-1">
                  <label className="text-slate-300 text-xs font-semibold">CSS Gradient String</label>
                  <textarea
                    required
                    value={gradientStringInput}
                    onChange={(e) => setGradientStringInput(e.target.value)}
                    rows={3}
                    placeholder="linear-gradient(...)"
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl font-mono text-[10px] text-slate-300 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingArtwork ? 'Update Artwork' : 'Save to Library'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
