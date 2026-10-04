export interface ModeColors {
  primaryBackground?: string;
  secondaryBackground?: string;
  cardBackground?: string;
  textPrimary?: string;
  textSecondary?: string;
}

export interface ThemeColors {
  primary?: string;
  accent?: string;
  background: string;
  dark: ModeColors;
  light: ModeColors;
}

export function loadThemeYaml(text: string): unknown;
export function looksLikeTheme(data: unknown): boolean;
export function hasThemeSettings(data: unknown): boolean;
export function readThemeColors(themeData: Record<string, any>): ThemeColors;
export function fallbackGradient(colors: ThemeColors): string | undefined;
