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
  Zap,
  Sparkles
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { MockTileCard } from './MockTileCard';
import { MockCard } from './MockCard';

interface SmartHomeDashboardProps {
  theme: ThemeConfig;
}

export const SmartHomeDashboard: React.FC<SmartHomeDashboardProps> = ({ theme }) => {
  const { palette } = theme;

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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-8 select-none">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MockTileCard
          theme={theme}
          title="Living Room"
          state={livingRoomOn ? 'On' : 'Off'}
          isActive={livingRoomOn}
          icon={<Lightbulb className="w-5 h-5" />}
          activeColor={activeAccentColor}
          onClick={() => setLivingRoomOn(!livingRoomOn)}
        />

        <MockTileCard
          theme={theme}
          title="Kitchen"
          state={kitchenOn ? 'On' : 'Off'}
          isActive={kitchenOn}
          icon={<Lightbulb className="w-5 h-5" />}
          activeColor={activeAccentColor}
          onClick={() => setKitchenOn(!kitchenOn)}
        />

        <MockTileCard
          theme={theme}
          title="Bedroom"
          state={bedroomOn ? 'On' : 'Off'}
          isActive={bedroomOn}
          icon={<Bed className="w-5 h-5" />}
          activeColor={activeAccentColor}
          onClick={() => setBedroomOn(!bedroomOn)}
        />

        <MockTileCard
          theme={theme}
          title="Garden"
          state={gardenOn ? 'On' : 'Off'}
          isActive={gardenOn}
          icon={<Flower2 className="w-5 h-5" />}
          activeColor={palette.orange || '#f59e0b'}
          onClick={() => setGardenOn(!gardenOn)}
        />

        <MockTileCard
          theme={theme}
          title="Thermostat"
          state={thermostatOn ? 'On' : 'Off'}
          isActive={thermostatOn}
          icon={<Thermometer className="w-5 h-5" />}
          activeColor={palette.orange || '#f59e0b'}
          onClick={() => setThermostatOn(!thermostatOn)}
        />

        <MockTileCard
          theme={theme}
          title="TV"
          state={tvOn ? 'On' : 'Off'}
          isActive={tvOn}
          icon={<Tv className="w-5 h-5" />}
          activeColor={palette.cyan || activeAccentColor}
          onClick={() => setTvOn(!tvOn)}
        />

        <MockTileCard
          theme={theme}
          title="Vacuum"
          state={vacuumOn ? 'On' : 'Off'}
          isActive={vacuumOn}
          icon={<Bot className="w-5 h-5" />}
          activeColor={palette.cyan || activeAccentColor}
          onClick={() => setVacuumOn(!vacuumOn)}
        />

        <MockTileCard
          theme={theme}
          title="Alarm"
          state={alarmArmed ? 'armed_home' : 'disarmed'}
          isActive={alarmArmed}
          icon={<ShieldCheck className="w-5 h-5" />}
          activeColor={palette.green || '#10b981'}
          onClick={() => setAlarmArmed(!alarmArmed)}
        />

        <MockTileCard
          theme={theme}
          title="Scene"
          state={sceneState}
          isActive={sceneState !== 'Away'}
          icon={<Palette className="w-5 h-5" />}
          activeColor={palette.purple || activeAccentColor}
          onClick={() => setSceneState(sceneState === 'Home' ? 'Night' : (sceneState === 'Night' ? 'Away' : 'Home'))}
        />
      </div>

      <MockCard theme={theme}>
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center">
              <CloudSun className="w-10 h-10 text-amber-300 drop-shadow-md" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                Partly cloudy
              </h3>
              <p className="text-xs text-slate-400 font-medium">Weather</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              11.4 °C
            </div>
            <div className="flex items-center justify-end gap-1 text-xs text-slate-300 font-semibold mt-0.5">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              <span>92%</span>
            </div>
          </div>
        </div>
      </MockCard>

      <MockCard theme={theme}>
        <div className="p-2 space-y-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Welcome Home
            </h2>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Your smart home is ready!
            </p>
          </div>

          <div className="space-y-1.5 text-xs text-slate-200 font-normal leading-relaxed pt-1 border-t border-white/10">
            <p>
              <strong className="text-white font-semibold">• Lights:</strong> Toggle from the tiles above
            </p>
            <p>
              <strong className="text-white font-semibold">• Climate:</strong> Set your preferred temperature
            </p>
            <p>
              <strong className="text-white font-semibold">• Scenes:</strong> Choose from Home, Away, Sleep, Movie, or Party
            </p>
            <p>
              <strong className="text-white font-semibold">• Security:</strong> Arm/disarm the alarm system
            </p>
          </div>
        </div>
      </MockCard>
    </div>
  );
};
