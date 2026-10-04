export type EngineType = 'glass' | 'velvet' | 'neon' | 'kids' | 'flat' | 'custom';

export interface PaletteColors {
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
}

export interface EngineSettings {
  engineType: EngineType;
  blurAmount: number;
  saturateAmount: number;
  brightnessAmount: number;
  cardRadius: number;
  badgeRadius: number;
  mushRadius: number;
  borderWidth: number;
  borderColor: string;
  glassTint: string;
  sheenOpacity: number;
  sheenAngle: number;
  sheenBlend: 'normal' | 'screen' | 'overlay' | 'soft-light';
  insetShadow: string;
  hoverGlow: boolean;
  glowColor: string;
  hoverGlowIntensity: number;
  backgroundScrim: string;
  fallbackCardBg: string;
  scanlines: boolean;
  scanlineIntensity: number;
  sidebarStyle?: 'translucent' | 'opaque' | 'transparent' | 'frosted';
  sidebarOpacity?: number;
  sidebarBlur?: number;
}

export interface BackgroundSettings {
  type: 'image' | 'gradient' | 'svg' | 'solid';
  imageUrl?: string;
  imageFileName?: string;
  gradientString?: string;
  svgCode?: string;
  solidColor?: string;
  darken: number;
  blur: number;
  saturation: number;
  vignette: number;
  headerTintAuto: boolean;
  headerTintColor?: string;
  avgColor?: string;
}

export type CustomComponentId = 'card-mod' | 'mushroom' | 'bubble-card' | 'layout-card' | 'button-card' | 'stack-in-card';

export interface RecommendedCard {
  name: string;
  slug: string;
  hacsRepositoryId?: string;
  hacsUrl?: string;
  description: string;
  installUrl?: string;
}

export interface RequiredIntegration {
  name: string;
  domain: string;
  repoFullName?: string;
}

export interface ThemeRequirements {
  requiresCardMod: boolean;
  requiresThemesDirective?: boolean;
  recommendedCards?: RecommendedCard[];
  requiredIntegrations?: RequiredIntegration[];
  note?: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  category: 'Glass' | 'Velvet' | 'Neon' | 'Kids' | 'Retro' | 'Nature' | 'SciFi' | 'Minimal' | 'Community';
  author: string;
  authorGithub?: string;
  sourceUrl?: string;
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  isCustom?: boolean;
  isInstalled?: boolean;
  installedFilePath?: string;
  requirements?: ThemeRequirements;
  components?: Partial<Record<CustomComponentId, boolean>>;
  palette: PaletteColors;
  engine: EngineSettings;
  background: BackgroundSettings;
  customCss?: string;
  customSvgOverlay?: string;
  viewSnippet?: string;
  rawTheme?: { source: string; data: Record<string, unknown> };
  dark: {
    primaryBackground: string;
    secondaryBackground: string;
    cardBackground: string;
    textPrimary: string;
    textSecondary: string;
  };
  light: {
    primaryBackground: string;
    secondaryBackground: string;
    cardBackground: string;
    textPrimary: string;
    textSecondary: string;
  };
}

export interface CommunityThemeSubmission {
  id: string;
  theme: ThemeConfig;
  status: 'pending' | 'approved' | 'in_review' | 'pruned';
  upvotes: number;
  downvotes: number;
  userVoted?: 'up' | 'down';
  prUrl?: string;
  commentsCount: number;
}
