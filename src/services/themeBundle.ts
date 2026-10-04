import { ThemeConfig } from '../types/theme';
import { generateHomeAssistantThemeYaml, generatePerViewSnippet } from './yamlGenerator';
import { embedBundledBackground } from './haService';
import { createZip, ZipEntry } from '../utils/zip';

export interface ThemeBundle {
  fileName: string;
  bytes: Uint8Array;
}

export interface BundleDeps {
  embedBackground?: (theme: ThemeConfig) => Promise<ThemeConfig>;
  now?: () => Date;
}

const FENCE = '```';
const THEMES_DIRECTIVE = 'frontend:\n  themes: !include_dir_merge_named themes';
const heading = (level: number, text: string) => `${'#'.repeat(level)} ${text}`;
const fence = (body: string, language = '') => `${FENCE}${language}\n${body}\n${FENCE}`;
const document = (blocks: string[]) => `${blocks.join('\n\n')}\n`;

export function toThemeFileId(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-+|-+$/g, '') || 'theme';
}

export function dataUrlToBytes(dataUrl: string | undefined): Uint8Array | null {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:image\/[\w+.-]+;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  const binary = atob(match[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.length > 0 ? bytes : null;
}

function externalImageUrl(theme: ThemeConfig): string | null {
  const url = theme.background.imageUrl;
  return theme.background.type === 'image' && url && /^https:\/\//.test(url) ? url : null;
}

export function buildThemeReadme(theme: ThemeConfig, hasBackgroundFile: boolean): string {
  const id = theme.id;
  const external = externalImageUrl(theme);
  const backgroundPath = `config/www/hats/backgrounds/${id}/default.webp`;
  const hasImageTheme = theme.background.type === 'image';

  const tree = [
    'config/',
    '  themes/',
    `    ${id}.yaml`,
    ...(hasBackgroundFile ? ['  www/', '    hats/', '      backgrounds/', `        ${id}/`, '          default.webp'] : []),
    'per-view-snippet.yaml',
    'README.md',
  ].join('\n');

  const steps = [
    `Copy \`config/themes/${id}.yaml\` to \`/config/themes/${id}.yaml\`.`,
    ...(hasBackgroundFile
      ? [
          `Copy the \`${backgroundPath.replace('/default.webp', '')}\` folder to \`/config/www/hats/backgrounds/${id}\`. Home Assistant serves it at \`/local/hats/backgrounds/${id}/default.webp\`, which is the address the theme uses. If \`/config/www\` did not exist before, restart Home Assistant once so it is served.`,
        ]
      : []),
    'Make sure `configuration.yaml` loads the themes folder (see below).',
    'Reload the themes: Developer tools, YAML, Reload themes. A restart works too.',
    `Select the theme: click your name at the bottom of the sidebar, open Profile, and pick **${theme.name}** under Theme.`,
  ]
    .map((step, index) => `${index + 1}. ${step}`)
    .join('\n');

  let backgroundNote = 'This theme does not use a background image, so there is no image file to install.';
  if (hasBackgroundFile) {
    backgroundNote = 'The background image is included and installed in step 2.';
  } else if (external) {
    backgroundNote = `The background image is loaded from ${external}, so there is no image file to install.`;
  } else if (hasImageTheme) {
    backgroundNote = `The background image is not included. Put your image at \`/config/www/hats/backgrounds/${id}/default.webp\`.`;
  }

  const snippetImageNote = hasBackgroundFile
    ? 'The snippet uses the background image from this archive.'
    : external
    ? `The snippet uses the same background image as the theme: ${external}`
    : `The snippet points to \`/local/hats/backgrounds/${id}/default.webp\`. Put an image there, or replace the \`url(...)\` value with your own image.`;

  return document([
    heading(1, theme.name),
    'A Home Assistant theme exported from HATS.',
    heading(2, 'What is in this archive'),
    fence(tree),
    'The `config` folder mirrors your Home Assistant configuration folder (the one that contains `configuration.yaml`). Every file goes to the same place under `/config`.',
    heading(2, 'Install'),
    steps,
    backgroundNote,
    heading(2, 'configuration.yaml'),
    'Home Assistant only loads theme files if `configuration.yaml` has this. Add it if it is missing, and keep a single `frontend:` block:',
    fence(THEMES_DIRECTIVE, 'yaml'),
    heading(2, 'UIX or card-mod'),
    'The glass blur, sidebar and header styling in this theme use `card-mod-*` keys. Install either UIX or card-mod from HACS. Both read the same keys. Without one of them, Home Assistant applies the colors only.',
    heading(2, 'Optional: a different background for one dashboard view'),
    'The theme sets one background for the whole dashboard. To give a single view its own background:',
    [
      '1. Open the dashboard and click the pencil icon (Edit dashboard).',
      '2. Open the three dots menu and choose Raw configuration editor.',
      '3. Under `views:`, paste the content of `per-view-snippet.yaml` as a new view, or copy only its `card_mod:` block into a view you already have. Keep the indentation so `card_mod:` sits at the same level as `title:` and `path:`.',
      '4. Change `title` and `path` if the view already exists or you want other names, then save.',
    ].join('\n'),
    snippetImageNote,
    'This needs UIX or card-mod, like the rest of the theme.',
  ]);
}

export async function buildThemeBundle(sourceTheme: ThemeConfig, deps: BundleDeps = {}): Promise<ThemeBundle> {
  const embed = deps.embedBackground ?? embedBundledBackground;
  const embedded = await embed(sourceTheme);
  const theme = { ...embedded, id: toThemeFileId(embedded.id) };
  const imageBytes = theme.background.type === 'image' ? dataUrlToBytes(theme.background.imageUrl) : null;

  const entries: ZipEntry[] = [
    { path: 'README.md', data: buildThemeReadme(theme, Boolean(imageBytes)) },
    { path: `config/themes/${theme.id}.yaml`, data: generateHomeAssistantThemeYaml(theme, 'local') },
    { path: 'per-view-snippet.yaml', data: generatePerViewSnippet(theme) },
  ];
  if (imageBytes) {
    entries.push({ path: `config/www/hats/backgrounds/${theme.id}/default.webp`, data: imageBytes });
  }

  return { fileName: `${theme.id}.zip`, bytes: createZip(entries, deps.now?.()) };
}

interface PreparedTheme {
  theme: ThemeConfig;
  imageBytes: Uint8Array | null;
}

function uniqueIds(themes: ThemeConfig[]): ThemeConfig[] {
  const seen = new Map<string, number>();
  return themes.map((theme) => {
    const base = toThemeFileId(theme.id);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return { ...theme, id: count === 1 ? base : `${base}-${count}` };
  });
}

function backgroundNote(item: PreparedTheme): string {
  if (item.imageBytes) return 'background included';
  if (externalImageUrl(item.theme)) return `background loaded from ${externalImageUrl(item.theme)}`;
  if (item.theme.background.type === 'image') return `no image included, put yours at /config/www/hats/backgrounds/${item.theme.id}/default.webp`;
  return 'no background image';
}

export function buildThemesReadme(items: PreparedTheme[]): string {
  const withImages = items.filter((item) => item.imageBytes);
  const list = items.map((item) => `- **${item.theme.name}**: \`${item.theme.id}.yaml\`, ${backgroundNote(item)}`).join('\n');
  const steps = [
    'Copy every file in `config/themes` to `/config/themes` in Home Assistant.',
    ...(withImages.length > 0
      ? [
          'Copy the folders in `config/www/hats/backgrounds` to `/config/www/hats/backgrounds`. Home Assistant serves them at `/local/hats/backgrounds/<theme>/default.webp`, which is the address the themes use. If `/config/www` did not exist before, restart Home Assistant once so it is served.',
        ]
      : []),
    'Make sure `configuration.yaml` loads the themes folder (see below).',
    'Reload the themes: Developer tools, YAML, Reload themes. A restart works too.',
    'Select a theme: click your name at the bottom of the sidebar, open Profile, and pick it under Theme.',
  ]
    .map((step, index) => `${index + 1}. ${step}`)
    .join('\n');

  const multiTree = [
    'config/',
    '  themes/            one YAML file per theme',
    '  www/hats/backgrounds/<theme>/default.webp   only for themes with an uploaded image',
    'per-view-snippets/   one optional snippet per theme',
    'README.md',
  ].join('\n');

  return document([
    heading(1, 'HATS themes'),
    `${items.length} Home Assistant themes exported from HATS.`,
    heading(2, 'What is in this archive'),
    fence(multiTree),
    'The `config` folder mirrors your Home Assistant configuration folder (the one that contains `configuration.yaml`). Every file goes to the same place under `/config`.',
    heading(2, 'Themes'),
    list,
    heading(2, 'Install'),
    steps,
    heading(2, 'configuration.yaml'),
    'Home Assistant only loads theme files if `configuration.yaml` has this. Add it if it is missing, and keep a single `frontend:` block:',
    fence(THEMES_DIRECTIVE, 'yaml'),
    heading(2, 'UIX or card-mod'),
    'The glass blur, sidebar and header styling in these themes use `card-mod-*` keys. Install either UIX or card-mod from HACS. Both read the same keys. Without one of them, Home Assistant applies the colors only.',
    heading(2, 'Optional: a different background for one dashboard view'),
    'Each file in `per-view-snippets` gives one dashboard view the background of its theme:',
    [
      '1. Open the dashboard and click the pencil icon (Edit dashboard).',
      '2. Open the three dots menu and choose Raw configuration editor.',
      '3. Under `views:`, paste the snippet as a new view, or copy only its `card_mod:` block into a view you already have. Keep the indentation so `card_mod:` sits at the same level as `title:` and `path:`.',
      '4. Change `title` and `path` if needed, then save.',
    ].join('\n'),
    'This needs UIX or card-mod, like the rest of the theme.',
  ]);
}

export async function buildThemesBundle(sourceThemes: ThemeConfig[], deps: BundleDeps = {}): Promise<ThemeBundle> {
  if (sourceThemes.length === 1) return buildThemeBundle(sourceThemes[0], deps);
  const embed = deps.embedBackground ?? embedBundledBackground;
  const embedded = await Promise.all(sourceThemes.map((theme) => embed(theme)));
  const items: PreparedTheme[] = uniqueIds(embedded).map((theme) => ({
    theme,
    imageBytes: theme.background.type === 'image' ? dataUrlToBytes(theme.background.imageUrl) : null,
  }));

  const entries: ZipEntry[] = [{ path: 'README.md', data: buildThemesReadme(items) }];
  for (const { theme, imageBytes } of items) {
    entries.push({ path: `config/themes/${theme.id}.yaml`, data: generateHomeAssistantThemeYaml(theme, 'local') });
    entries.push({ path: `per-view-snippets/${theme.id}.yaml`, data: generatePerViewSnippet(theme) });
    if (imageBytes) entries.push({ path: `config/www/hats/backgrounds/${theme.id}/default.webp`, data: imageBytes });
  }
  return { fileName: 'hats-themes.zip', bytes: createZip(entries, deps.now?.()) };
}
