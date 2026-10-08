import fs from 'node:fs';
import path from 'node:path';
import { buildHacsIndex, HACS_THEME_DATA_URL } from '../server/hacsIndex.js';

const outFile = path.resolve(process.argv[2] || 'hacs-themes.json');
const limit = Number(process.env.HACS_INDEX_LIMIT) || Infinity;

const res = await fetch(HACS_THEME_DATA_URL);
if (!res.ok) throw new Error(`HACS catalog HTTP ${res.status}`);
const full = await res.json();
const catalog = Object.fromEntries(Object.entries(full).slice(0, limit));

const token = process.env.GH_TOKEN;
if (!token) console.warn('No GH_TOKEN set: GitHub allows only 60 API requests per hour, so large runs will skip repos.');

const index = await buildHacsIndex({ catalog, token });
if (index.themes.length === 0) throw new Error('Refusing to write an empty index');

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(index, null, 2)}\n`);
console.log(`Wrote ${outFile}: ${index.themes.length} repos, ${index.themes.reduce((n, t) => n + t.files.reduce((m, f) => m + f.themes.length, 0), 0)} themes, ${index.skipped.length} skipped`);
for (const s of index.skipped) console.log(`  skipped ${s.repo}: ${s.reason}`);
