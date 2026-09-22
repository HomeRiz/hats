import React, { useState } from 'react';
import { 
  Lightbulb, 
  Thermometer, 
  Music, 
  ShieldCheck, 
  CloudSun, 
  Zap, 
  Sparkles, 
  Volume2, 
  Play, 
  Pause, 
  SkipForward,
  Tv,
  Gamepad2,
  Baby,
  Smile
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { MockHeader } from './MockHeader';
import { MockSidebar } from './MockSidebar';
import { MockCard } from './MockCard';
import { MockMushroomCard } from './MockMushroomCard';

interface DashboardPreviewProps {
  theme: ThemeConfig;
  previewMode: 'dark' | 'light';
  activeView: 'home' | 'climate' | 'media' | 'security';
  setActiveView: (view: 'home' | 'climate' | 'media' | 'security') => void;
}

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({
  theme,
  previewMode,
  activeView,
  setActiveView,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [temperature, setTemperature] = useState(21.5);
  const [lightBrightness, setLightBrightness] = useState(85);

  const { background, palette, engine } = theme;

  let bgStyle: React.CSSProperties = {};
  if (background.type === 'image' && background.imageUrl) {
    bgStyle = {
      backgroundImage: `url(${background.imageUrl})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      filter: `brightness(${1 - background.darken}) blur(${background.blur}px) saturate(${background.saturation})`,
    };
  } else if (background.type === 'gradient' && background.gradientString) {
    bgStyle = {
      backgroundImage: background.gradientString,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    };
  } else if (background.type === 'solid' && background.solidColor) {
    bgStyle = {
      backgroundColor: background.solidColor,
    };
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none">
      <div 
        className="absolute inset-0 z-0 transition-all duration-300"
        style={bgStyle}
      />

      {theme.customSvgOverlay && (
        <div 
          className="absolute inset-0 z-[1] pointer-events-none opacity-40 mix-blend-screen overflow-hidden"
          dangerouslySetInnerHTML={{ __html: theme.customSvgOverlay }}
        />
      )}

      <div 
        className="absolute inset-0 z-[2] pointer-events-none transition-colors"
        style={{ background: engine.backgroundScrim }}
      />

      {engine.scanlines && (
        <div className="absolute inset-0 z-[3] scanlines-overlay opacity-80 pointer-events-none" />
      )}

      <MockHeader theme={theme} activeView={activeView} setActiveView={setActiveView} />

      <div className="flex-1 flex overflow-hidden relative z-10">
        <MockSidebar theme={theme} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <div 
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white/90 shadow-sm border border-white/10 backdrop-blur-md"
              style={{
                borderRadius: `${engine.badgeRadius}px`,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
              }}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Solar: 3.4 kW</span>
            </div>

            <div 
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white/90 shadow-sm border border-white/10 backdrop-blur-md"
              style={{
                borderRadius: `${engine.badgeRadius}px`,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Armed Home</span>
            </div>

            {theme.category === 'Kids' && (
              <div 
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md animate-pulse"
                style={{
                  borderRadius: `${engine.badgeRadius}px`,
                  backgroundColor: `${palette.accent}90`,
                  boxShadow: `0 0 12px ${palette.accent}60`,
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                <span>Play Mode Active</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            
            <MockCard theme={theme}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">Quick Actions</span>
                <span className="text-[11px] text-white/50">4 Active</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <MockMushroomCard 
                  theme={theme}
                  icon={<Lightbulb className="w-5 h-5" />}
                  title="Ceiling Lights"
                  subtitle="85% Warm White"
                  activeColor={palette.primary}
                  defaultActive={true}
                />

                <MockMushroomCard 
                  theme={theme}
                  icon={theme.category === 'Kids' ? <Gamepad2 className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
                  title={theme.category === 'Kids' ? "Playroom Console" : "Living Room TV"}
                  subtitle="Apple TV 4K"
                  activeColor={palette.accent}
                  defaultActive={true}
                />

                <MockMushroomCard 
                  theme={theme}
                  icon={<Baby className="w-5 h-5" />}
                  title="Night Light"
                  subtitle="Gentle Glow"
                  activeColor={palette.pink}
                  defaultActive={true}
                />

                <MockMushroomCard 
                  theme={theme}
                  icon={<Zap className="w-5 h-5" />}
                  title="Robot Vacuum"
                  subtitle="Docked & Ready"
                  activeColor={palette.cyan}
                  defaultActive={false}
                />
              </div>
            </MockCard>

            <MockCard theme={theme}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white/95">Bucharest, RO</h3>
                  <p className="text-xs text-white/60">Partly Cloudy • Humidity 48%</p>
                </div>
                <CloudSun className="w-8 h-8 text-amber-300 drop-shadow-md" />
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white tracking-tight">23°</span>
                <span className="text-xs font-medium text-emerald-400">Feels like 24°</span>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-center text-xs text-white/80">
                <div>
                  <div className="text-[10px] text-white/50">Morning</div>
                  <div className="font-semibold mt-0.5">18°</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/50">Afternoon</div>
                  <div className="font-semibold mt-0.5">25°</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/50">Evening</div>
                  <div className="font-semibold mt-0.5">21°</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/50">Night</div>
                  <div className="font-semibold mt-0.5">17°</div>
                </div>
              </div>
            </MockCard>

            <MockCard theme={theme}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="p-2 rounded-xl text-white shadow-sm"
                    style={{ backgroundColor: `${palette.accent}40`, color: palette.accent }}
                  >
                    <Thermometer className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white/95">Master Climate</h3>
                    <p className="text-[11px] text-emerald-400">Heating • Eco Mode</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-white">{temperature.toFixed(1)}°C</span>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[11px] text-white/60 font-medium">
                  <span>Target Temp</span>
                  <span>{temperature.toFixed(1)}°C</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="28"
                  step="0.5"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  style={{ accentColor: palette.accent }}
                />
              </div>

              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => setTemperature(21.0)}
                  className="flex-1 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                >
                  Comfort (21°)
                </button>
                <button 
                  onClick={() => setTemperature(23.5)}
                  className="flex-1 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
                >
                  Warm (23.5°)
                </button>
              </div>
            </MockCard>

            <MockCard theme={theme} className="md:col-span-2 xl:col-span-3">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div 
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden"
                  style={{
                    backgroundColor: palette.purple,
                    boxShadow: `0 8px 24px -6px ${palette.purple}80`,
                  }}
                >
                  <Music className="w-10 h-10 text-white/90" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-white/95">Midnight Ambient Synthesis</h4>
                      <p className="text-xs text-white/60">Home Audio • Master Zone</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/70">
                      <Volume2 className="w-4 h-4" />
                      <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-2/3" style={{ backgroundColor: palette.accent }} />
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden cursor-pointer">
                    <div className="h-full w-1/2 rounded-full" style={{ backgroundColor: palette.primary }} />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-white/50">01:45</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md transition-all hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: palette.primary,
                          boxShadow: `0 0 16px -2px ${palette.primary}`,
                        }}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                      </button>
                      <button className="p-2 text-white/70 hover:text-white transition-colors">
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[10px] text-white/50">03:30</span>
                  </div>
                </div>
              </div>
            </MockCard>

          </div>
        </main>
      </div>
    </div>
  );
};
