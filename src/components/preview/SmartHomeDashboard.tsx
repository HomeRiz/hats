import React, { useState } from 'react';
import {
  Lightbulb,
  Bed,
  Flower2,
  Thermometer,
  Tv,
  Bot,
  ShieldCheck,
  Palette,
  CloudSun,
  Droplets,
  Lock,
  Blinds,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { MockTileCard } from './MockTileCard';
import { MockCard } from './MockCard';
import type { LiveTile, DomainIconKey } from '../../services/liveDashboardMapper';

interface SmartHomeDashboardProps {
  theme: ThemeConfig;
  previewMode?: 'dark' | 'light';
  liveTiles?: LiveTile[];
}

const DOMAIN_ICONS: Record<DomainIconKey, React.ReactNode> = {
  light: <Lightbulb className="w-5 h-5" />,
  switch: <Bot className="w-5 h-5" />,
  climate: <Thermometer className="w-5 h-5" />,
  media_player: <Tv className="w-5 h-5" />,
  lock: <Lock className="w-5 h-5" />,
  cover: <Blinds className="w-5 h-5" />,
  alarm_control_panel: <ShieldCheck className="w-5 h-5" />,
  vacuum: <Bot className="w-5 h-5" />,
  sensor: <Activity className="w-5 h-5" />,
  binary_sensor: <Activity className="w-5 h-5" />,
  scene: <Palette className="w-5 h-5" />,
  fan: <Droplets className="w-5 h-5" />,
  default: <HelpCircle className="w-5 h-5" />,
};

export const SmartHomeDashboard: React.FC<SmartHomeDashboardProps> = ({
  theme,
  previewMode = 'dark',
  liveTiles,
}) => {
  const { palette } = theme;
  const isLight = previewMode === 'light';

  const [livingRoomOn, setLivingRoomOn] = useState(false);
  const [kitchenOn, setKitchenOn] = useState(false);
  const [bedroomOn, setBedroomOn] = useState(false);
  const [gardenOn, setGardenOn] = useState(true);
  const [thermostatOn, setThermostatOn] = useState(true);
  const [tvOn, setTvOn] = useState(false);
  const [vacuumOn, setVacuumOn] = useState(false);
  const [alarmArmed, setAlarmArmed] = useState(false);
  const [sceneState, setSceneState] = useState<'Home' | 'Away' | 'Night'>('Home');

  const activeAccentColor = palette.accent || palette.primary || '#f59e0b';
  const headingColor = isLight ? (theme.light?.textPrimary || '#0f172a') : (theme.dark?.textPrimary || '#FFFFFF');
  const subtextColor = isLight ? (theme.light?.textSecondary || '#475569') : (theme.dark?.textSecondary || '#cbd5e1');
  const dividerColor = isLight ? 'border-black/10' : 'border-white/10';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-8 select-none">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {liveTiles ? (
          liveTiles.length > 0 ? (
            liveTiles.map((tile) => (
              <MockTileCard
                key={tile.id}
                theme={theme}
                previewMode={previewMode}
                title={tile.title}
                state={tile.stateText}
                isActive={tile.isActive}
                icon={DOMAIN_ICONS[tile.iconKey]}
                activeColor={activeAccentColor}
              />
            ))
          ) : (
            <p className="col-span-full text-xs text-center py-6" style={{ color: subtextColor }}>
              No entities found in your Home Assistant areas yet.
            </p>
          )
        ) : (
          <>
            <MockTileCard
              theme={theme}
              previewMode={previewMode}
              title="Living Room"
              state={livingRoomOn ? 'On' : 'Off'}
              isActive={livingRoomOn}
              icon={<Lightbulb className="w-5 h-5" />}
              activeColor={activeAccentColor}
              onClick={() => setLivingRoomOn(!livingRoomOn)}
            />

            <MockTileCard
              theme={theme}
              previewMode={previewMode}
              title="Kitchen"
              state={kitchenOn ? 'On' : 'Off'}
              isActive={kitchenOn}
              icon={<Lightbulb className="w-5 h-5" />}
              activeColor={activeAccentColor}
              onClick={() => setKitchenOn(!kitchenOn)}
            />

            <MockTileCard
              theme={theme}
              previewMode={previewMode}
              title="Bedroom"
              state={bedroomOn ? 'On' : 'Off'}
              isActive={bedroomOn}
              icon={<Bed className="w-5 h-5" />}
              activeColor={activeAccentColor}
              onClick={() => setBedroomOn(!bedroomOn)}
            />

            <MockTileCard
              theme={theme}
              previewMode={previewMode}
              title="Garden"
              state={gardenOn ? 'On' : 'Off'}
              isActive={gardenOn}
              icon={<Flower2 className="w-5 h-5" />}
              activeColor={palette.orange || '#f59e0b'}
              onClick={() => setGardenOn(!gardenOn)}
            />

            <MockTileCard
              theme={theme}
              previewMode={previewMode}
              title="Thermostat"
              state={thermostatOn ? 'On' : 'Off'}
              isActive={thermostatOn}
              icon={<Thermometer className="w-5 h-5" />}
              activeColor={palette.orange || '#f59e0b'}
              onClick={() => setThermostatOn(!thermostatOn)}
            />

            <MockTileCard
              theme={theme}
              previewMode={previewMode}
              title="TV"
              state={tvOn ? 'On' : 'Off'}
              isActive={tvOn}
              icon={<Tv className="w-5 h-5" />}
              activeColor={palette.cyan || activeAccentColor}
              onClick={() => setTvOn(!tvOn)}
            />

            <MockTileCard
              theme={theme}
              previewMode={previewMode}
              title="Vacuum"
              state={vacuumOn ? 'On' : 'Off'}
              isActive={vacuumOn}
              icon={<Bot className="w-5 h-5" />}
              activeColor={palette.cyan || activeAccentColor}
              onClick={() => setVacuumOn(!vacuumOn)}
            />

            <MockTileCard
              theme={theme}
              previewMode={previewMode}
              title="Alarm"
              state={alarmArmed ? 'armed_home' : 'disarmed'}
              isActive={alarmArmed}
              icon={<ShieldCheck className="w-5 h-5" />}
              activeColor={palette.green || '#10b981'}
              onClick={() => setAlarmArmed(!alarmArmed)}
            />

            <MockTileCard
              theme={theme}
              previewMode={previewMode}
              title="Scene"
              state={sceneState}
              isActive={sceneState !== 'Away'}
              icon={<Palette className="w-5 h-5" />}
              activeColor={palette.purple || activeAccentColor}
              onClick={() => setSceneState(sceneState === 'Home' ? 'Night' : (sceneState === 'Night' ? 'Away' : 'Home'))}
            />
          </>
        )}
      </div>

      <MockCard theme={theme} previewMode={previewMode}>
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center">
              <CloudSun className="w-10 h-10 text-amber-300 drop-shadow-md" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold leading-tight" style={{ color: headingColor }}>
                Partly cloudy
              </h3>
              <p className="text-xs font-medium" style={{ color: subtextColor }}>Weather</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: headingColor }}>
              11.4 °C
            </div>
            <div className="flex items-center justify-end gap-1 text-xs font-semibold mt-0.5" style={{ color: subtextColor }}>
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              <span>92%</span>
            </div>
          </div>
        </div>
      </MockCard>

      <MockCard theme={theme} previewMode={previewMode}>
        <div className="p-2 space-y-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: headingColor }}>
              Welcome Home
            </h2>
            <p className="text-xs mt-1 font-medium" style={{ color: subtextColor }}>
              Your smart home is ready!
            </p>
          </div>

          <div className={`space-y-1.5 text-xs font-normal leading-relaxed pt-1 border-t ${dividerColor}`} style={{ color: subtextColor }}>
            <p>
              <strong className="font-semibold" style={{ color: headingColor }}>• Lights:</strong> Toggle from the tiles above
            </p>
            <p>
              <strong className="font-semibold" style={{ color: headingColor }}>• Climate:</strong> Set your preferred temperature
            </p>
            <p>
              <strong className="font-semibold" style={{ color: headingColor }}>• Scenes:</strong> Choose from Home, Away, Sleep, Movie, or Party
            </p>
            <p>
              <strong className="font-semibold" style={{ color: headingColor }}>• Security:</strong> Arm/disarm the alarm system
            </p>
          </div>
        </div>
      </MockCard>
    </div>
  );
};
