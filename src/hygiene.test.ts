import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOTS = ['src', 'server', 'electron', 'scripts'];
const EXTENSIONS = /\.(ts|tsx|js|mjs|cjs)$/;
const ALLOWED = [/^\/\/ @vitest-environment /, /^\/\/\/ <reference /, /^\/\* @vite-ignore \*\//];

function sourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : sourceFiles(full);
    return EXTENSIONS.test(entry.name) ? [full] : [];
  });
}

function isComment(line: string): boolean {
  const text = line.trim();
  if (ALLOWED.some((pattern) => pattern.test(text))) return false;
  return /^(\/\/|\/\*|\*\/?$|\* )/.test(text) || (text.startsWith('#') && !text.startsWith('#!'));
}

describe('source hygiene', () => {
  it('has no comment lines in the code', () => {
    const offenders = ROOTS.flatMap((root) => sourceFiles(path.join(process.cwd(), root))).flatMap((file) =>
      fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, index) => (isComment(line) ? [`${path.relative(process.cwd(), file)}:${index + 1}: ${line.trim().slice(0, 60)}`] : []))
    );
    expect(offenders).toEqual([]);
  });
});
