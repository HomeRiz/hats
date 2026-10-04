import { describe, expect, it } from 'vitest';
import { createZip, crc32 } from './zip';

function readZip(bytes: Uint8Array): Record<string, { text: string; crc: number }> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.length - 22;
  expect(view.getUint32(end, true)).toBe(0x06054b50);
  const count = view.getUint16(end + 10, true);
  let cursor = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  const files: Record<string, { text: string; crc: number }> = {};
  for (let i = 0; i < count; i++) {
    expect(view.getUint32(cursor, true)).toBe(0x02014b50);
    const crc = view.getUint32(cursor + 16, true);
    const size = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const local = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    const localNameLength = view.getUint16(local + 26, true);
    const start = local + 30 + localNameLength;
    files[name] = { text: decoder.decode(bytes.subarray(start, start + size)), crc };
    cursor += 46 + nameLength;
  }
  return files;
}

describe('crc32', () => {
  it('matches the standard check value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
});

describe('createZip', () => {
  it('stores every entry under its path with a matching checksum', () => {
    const zip = createZip([
      { path: 'README.md', data: 'hello' },
      { path: 'config/themes/night.yaml', data: 'Night:\n  primary-color: "#000"\n' },
      { path: 'config/www/hats/backgrounds/night/default.webp', data: new Uint8Array([1, 2, 3, 255]) },
    ]);
    const files = readZip(zip);
    expect(Object.keys(files)).toEqual([
      'README.md',
      'config/themes/night.yaml',
      'config/www/hats/backgrounds/night/default.webp',
    ]);
    expect(files['README.md'].text).toBe('hello');
    expect(files['README.md'].crc).toBe(crc32(new TextEncoder().encode('hello')));
    expect(files['config/themes/night.yaml'].text).toContain('primary-color');
  });

  it('keeps non-ASCII names and text intact', () => {
    const files = readZip(createZip([{ path: 'themes/Cafe-ă.yaml', data: 'ț' }]));
    expect(files['themes/Cafe-ă.yaml'].text).toBe('ț');
  });

  it('rejects paths that could escape the extraction folder', () => {
    for (const path of ['../evil.yaml', '/abs.yaml', 'a//b.yaml', 'a\\b.yaml', '', 'a/./b.yaml']) {
      expect(() => createZip([{ path, data: 'x' }])).toThrow('Invalid zip path');
    }
  });
});
