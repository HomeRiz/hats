import fs from 'fs';
import path from 'path';
import { loadThemeYaml } from './themeValues.js';

export const MAX_LIBRARY_YAML_BYTES = 4 * 1024 * 1024;
export const MAX_LIBRARY_IMAGE_BYTES = 15 * 1024 * 1024;

const IMAGE_SIGNATURES = [
  (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  (b) => b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  (b) => b.length > 6 && /^GIF8[79]a/.test(b.subarray(0, 6).toString('latin1')),
];

const IMAGE_EXTENSIONS = [
  [(b) => b[0] === 0xff, 'jpg'],
  [(b) => b[0] === 0x89, 'png'],
  [(b) => b[0] === 0x52, 'webp'],
  [(b) => b[0] === 0x47, 'gif'],
];

export function libraryFolders(libraryDir) {
  return {
    libraryDir,
    importedDir: path.join(libraryDir, 'Imported'),
    exportsDir: path.join(libraryDir, 'Exports'),
  };
}

export function ensureLibrary(libraryDir) {
  const folders = libraryFolders(libraryDir);
  fs.mkdirSync(folders.importedDir, { recursive: true });
  fs.mkdirSync(folders.exportsDir, { recursive: true });
  return folders;
}

export function safeFileStem(name, fallback = 'theme') {
  const stem = String(name ?? '')
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/\.+/g, '.')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 80);
  return stem || fallback;
}

export function saveImportedTheme({ libraryDir, yamlText, imageDataUrl }) {
  if (typeof yamlText !== 'string' || !yamlText.trim()) throw new Error('The theme YAML is empty.');
  if (yamlText.length > MAX_LIBRARY_YAML_BYTES) throw new Error('The theme YAML is too large.');

  const parsed = loadThemeYaml(yamlText);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('The theme YAML is not a theme file.');
  const stem = safeFileStem(Object.keys(parsed)[0]);

  const { importedDir } = ensureLibrary(libraryDir);
  const yamlPath = path.join(importedDir, `${stem}.yaml`);
  fs.writeFileSync(yamlPath, yamlText.endsWith('\n') ? yamlText : `${yamlText}\n`, 'utf8');

  let imagePath;
  if (typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image')) {
    const buffer = Buffer.from(imageDataUrl.replace(/^data:image\/[\w+.-]+;base64,/, ''), 'base64');
    if (buffer.length > MAX_LIBRARY_IMAGE_BYTES) throw new Error('The background image is too large.');
    if (!IMAGE_SIGNATURES.some((check) => check(buffer))) throw new Error('The background is not a JPEG, PNG, WebP or GIF image.');
    const extension = IMAGE_EXTENSIONS.find(([check]) => check(buffer))?.[1] ?? 'img';
    imagePath = path.join(importedDir, `${stem}.${extension}`);
    fs.writeFileSync(imagePath, buffer);
  }

  return { yamlPath, imagePath, importedDir };
}
