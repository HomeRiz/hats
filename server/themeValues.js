import * as yaml from 'js-yaml';

const THEME_SCHEMA = yaml.CORE_SCHEMA.withTags(yaml.mergeTag);
const VAR_REF = /var\(\s*--([\w-]+)\s*(?:,\s*([^)]+))?\)/g;
const MAX_VAR_DEPTH = 8;

export function loadThemeYaml(text) {
  return yaml.load(text, { schema: THEME_SCHEMA });
}

function resolveValue(value, lookup) {
  if (typeof value === 'number') return String(value);
  if (typeof value !== 'string') return undefined;
  let out = value;
  for (let i = 0; i < MAX_VAR_DEPTH && /var\(/.test(out); i++) {
    out = out.replace(VAR_REF, (match, name, fallback) => {
      const found = lookup(name);
      if (typeof found === 'string' || typeof found === 'number') return String(found);
      return fallback ? fallback.trim() : match;
    });
  }
  return /var\(/.test(out) ? undefined : out.trim();
}

function modeReader(themeData, mode) {
  const modeData = themeData.modes?.[mode] ?? {};
  const lookup = (name) => modeData[name] ?? themeData[name] ?? modeData[`--${name}`] ?? themeData[`--${name}`];
  return (key) => resolveValue(lookup(key), lookup);
}

function firstOf(read, keys) {
  for (const key of keys) {
    const value = read(key);
    if (value) return value;
  }
  return undefined;
}

function modeColors(read) {
  return {
    primaryBackground: firstOf(read, ['primary-background-color', 'token-bg']),
    secondaryBackground: firstOf(read, ['secondary-background-color', 'token-bg-secondary', 'primary-background-color', 'token-bg']),
    cardBackground: firstOf(read, ['ha-card-background', 'card-background-color', 'token-card']),
    textPrimary: firstOf(read, ['primary-text-color', 'token-text']),
    textSecondary: firstOf(read, ['secondary-text-color', 'token-text-secondary']),
  };
}

export function readThemeColors(themeData) {
  const readDark = modeReader(themeData, 'dark');
  const readLight = modeReader(themeData, 'light');
  return {
    primary: firstOf(readDark, ['primary-color', 'accent-color', 'token-accent']),
    accent: firstOf(readDark, ['accent-color', 'token-accent', 'primary-color']),
    background: firstOf(readDark, ['hats-background', 'ultimate-background', 'background-image', 'lovelace-background']) ?? '',
    dark: modeColors(readDark),
    light: modeColors(readLight),
  };
}

export function fallbackGradient(colors) {
  const from = colors.dark.primaryBackground;
  if (!from) return undefined;
  return `linear-gradient(140deg, ${from} 0%, ${colors.dark.secondaryBackground || from} 100%)`;
}
