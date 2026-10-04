import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { rewriteRootRelativePaths } from '../server/ingressRewrite.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'hosted-dist');
const FRONTEND = path.join(root, 'vendor', 'mock-frontend', 'hass_frontend');
const BOOTSTRAP = path.join(root, 'vendor', 'mock-frontend-bootstrap');
const MODS = path.join(root, 'vendor', 'mock-mods');
const MOUNT = '/mock-frontend';

const basePath = (process.env.HATS_BASE_PATH || '').replace(/\/+$/, '');
if (!/^(\/[A-Za-z0-9._-]+)*$/.test(basePath)) {
  console.error(`build-hosted: HATS_BASE_PATH must look like "" or "/hats", got "${basePath}"`);
  process.exit(1);
}

for (const [label, dir] of [['hass_frontend', FRONTEND], ['mock-frontend-bootstrap', BOOTSTRAP], ['mock-mods', MODS]]) {
  if (!fs.existsSync(dir)) {
    console.error(`build-hosted: vendor ${label} is missing (${dir}). Run npm install and npm run build:mock-frontend-bootstrap first.`);
    process.exit(1);
  }
}

const build = spawnSync('npx', ['vite', 'build', '--outDir', 'hosted-dist', '--emptyOutDir'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, VITE_HATS_HOSTED: 'true' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

const REWRITE_EXT = new Set(['.js', '.json']);
let files = 0;
let bytes = 0;

function copyTree(src, dest, { skipDir = () => false, skipFile = () => false, rewrite = false } = {}) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith('._')) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (!skipDir(entry.name)) copyTree(from, to, { skipDir, skipFile, rewrite });
      continue;
    }
    if (skipFile(entry.name)) continue;
    if (rewrite && REWRITE_EXT.has(path.extname(entry.name).toLowerCase())) {
      fs.writeFileSync(to, rewriteRootRelativePaths(fs.readFileSync(from, 'utf8'), basePath, MOUNT));
    } else {
      fs.copyFileSync(from, to);
    }
    files += 1;
    bytes += fs.statSync(to).size;
  }
}

copyTree(BOOTSTRAP, path.join(OUT, 'mock-frontend-bootstrap'));
copyTree(MODS, path.join(OUT, 'mock-mods'));
copyTree(FRONTEND, path.join(OUT, 'mock-frontend'), {
  skipDir: (name) => name === 'frontend_es5',
  skipFile: (name) => name.endsWith('.map') || name.endsWith('.html'),
  rewrite: true,
});
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

console.log(`build-hosted: wrote hosted-dist (${files} copied files, ${(bytes / 1024 / 1024).toFixed(0)} MB of preview assets, base path "${basePath || '/'}")`);
