import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ensureLibrary, safeFileStem, saveImportedTheme } from './standaloneLibrary.js';

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hats-lib-'));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const PNG = 'data:image/png;base64,' + Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]).toString('base64');

describe('safeFileStem', () => {
  it('keeps names readable and strips path characters', () => {
    expect(safeFileStem('Google - Light')).toBe('Google---Light');
    expect(safeFileStem('../../etc/passwd')).toBe('etcpasswd');
    expect(safeFileStem('..')).toBe('theme');
    expect(safeFileStem('')).toBe('theme');
  });
});

describe('ensureLibrary', () => {
  it('creates the Imported and Exports folders', () => {
    const lib = path.join(dir, 'HATS');
    const folders = ensureLibrary(lib);
    expect(fs.statSync(folders.importedDir).isDirectory()).toBe(true);
    expect(fs.statSync(folders.exportsDir).isDirectory()).toBe(true);
  });
});

describe('saveImportedTheme', () => {
  const yamlText = 'My Theme:\n  primary-color: "#ff0000"\n';

  it('writes the theme under Imported, named after the theme', () => {
    const out = saveImportedTheme({ libraryDir: path.join(dir, 'HATS'), yamlText });
    expect(out.yamlPath).toBe(path.join(dir, 'HATS', 'Imported', 'My-Theme.yaml'));
    expect(fs.readFileSync(out.yamlPath, 'utf8')).toContain('primary-color');
  });

  it('overwrites the same theme instead of piling up copies', () => {
    const lib = path.join(dir, 'HATS');
    saveImportedTheme({ libraryDir: lib, yamlText });
    saveImportedTheme({ libraryDir: lib, yamlText: 'My Theme:\n  primary-color: "#00ff00"\n' });
    expect(fs.readdirSync(path.join(lib, 'Imported'))).toEqual(['My-Theme.yaml']);
    expect(fs.readFileSync(path.join(lib, 'Imported', 'My-Theme.yaml'), 'utf8')).toContain('#00ff00');
  });

  it('saves a valid background image next to the theme', () => {
    const out = saveImportedTheme({ libraryDir: path.join(dir, 'HATS'), yamlText, imageDataUrl: PNG });
    expect(out.imagePath).toBe(path.join(dir, 'HATS', 'Imported', 'My-Theme.png'));
    expect(fs.existsSync(out.imagePath)).toBe(true);
  });

  it('rejects something that is not an image', () => {
    const bad = 'data:image/png;base64,' + Buffer.from('<html>').toString('base64');
    expect(() => saveImportedTheme({ libraryDir: path.join(dir, 'HATS'), yamlText, imageDataUrl: bad })).toThrow('not a JPEG');
  });

  it('rejects empty and non theme input', () => {
    expect(() => saveImportedTheme({ libraryDir: dir, yamlText: '  ' })).toThrow('empty');
    expect(() => saveImportedTheme({ libraryDir: dir, yamlText: '- a\n- b\n' })).toThrow('not a theme');
  });
});
