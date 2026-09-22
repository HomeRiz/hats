import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Wand2, Sun, Droplets, Contrast } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { processBackgroundImage } from '../../services/imageProcessor';

interface BackgroundStudioProps {
  theme: ThemeConfig;
  onChange: (updates: Partial<ThemeConfig>) => void;
}

export const BackgroundStudio: React.FC<BackgroundStudioProps> = ({ theme, onChange }) => {
  const { background, palette, engine } = theme;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      name: 'Whimsical Kids Space',
      type: 'gradient' as const,
      gradient: 'linear-gradient(135deg, #1C0A35 0%, #0F1E4A 50%, #0B3C49 100%)',
      avg: '#151538',
      accent: '#FFB800',
    },
    {
      name: 'Pastel Storybook Dreams',
      type: 'gradient' as const,
      gradient: 'linear-gradient(140deg, #381D47 0%, #2A1838 50%, #1A2840 100%)',
      avg: '#281a3b',
      accent: '#FF70A6',
    },
    {
      name: 'Ultimate Dark Violet',
      type: 'gradient' as const,
      gradient: 'linear-gradient(140deg, #1b1030 0%, #0b0d14 55%, #12202e 100%)',
      avg: '#120f21',
      accent: '#BF5AF2',
    },
    {
      name: 'Blade Runner Neon',
      type: 'gradient' as const,
      gradient: 'linear-gradient(140deg, #12002b 0%, #04050a 55%, #001a2b 100%)',
      avg: '#080812',
      accent: '#00F0FF',
    },
    {
      name: 'Velvet Catppuccin',
      type: 'gradient' as const,
      gradient: 'linear-gradient(140deg, #313244 0%, #1e1e2e 55%, #181825 100%)',
      avg: '#202030',
      accent: '#FAB387',
    },
  ];

  return (
    <div className="space-y-6 text-slate-200 text-xs">
      <div className="space-y-2">
        <label className="font-semibold text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>Upload Wallpaper / Artwork</span>
        </label>

        <div
          onClick={() => fileInputRef.current?.click()}
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
        <label className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-pink-400" />
          <span>Preset Atmosphere Gradients</span>
        </label>

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
              className="p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 flex items-center gap-3 transition-colors text-left"
            >
              <div 
                className="w-10 h-8 rounded-lg shadow-sm shrink-0 border border-white/10"
                style={{ background: preset.gradient }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-white truncate">{preset.name}</div>
                <div className="text-[10px] text-slate-400 truncate">Accent: {preset.accent}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Post-Processing for Glass Readability</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Darken Factor (Ensures Card Legibility)</span>
            <span className="font-mono text-slate-200">{Math.round(background.darken * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.6"
            step="0.02"
            value={background.darken}
            onChange={(e) => updateBg({ darken: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Ambient Background Blur</span>
            <span className="font-mono text-slate-200">{background.blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={background.blur}
            onChange={(e) => updateBg({ blur: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Color Saturation</span>
            <span className="font-mono text-slate-200">{background.saturation}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={background.saturation}
            onChange={(e) => updateBg({ saturation: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
