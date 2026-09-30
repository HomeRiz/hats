import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_INDEX = path.join(__dirname, '..', 'vendor', 'mock-frontend', 'hass_frontend', 'index.html');
const TEMPLATE = path.join(__dirname, '..', 'src', 'mockHass', 'bootstrap.template.html');
const OUT = path.join(__dirname, '..', 'vendor', 'mock-frontend-bootstrap', 'index.html');

const real = fs.readFileSync(REAL_INDEX, 'utf8');
const coreMatch = real.match(/\/frontend_latest\/core\.[a-f0-9]+\.js/);
const appMatch = real.match(/\/frontend_latest\/app\.[a-f0-9]+\.js/);
if (!coreMatch || !appMatch) {
  console.error('compose-mock-frontend-index: could not find core.js/app.js paths in the real index.html - has the home-assistant-frontend layout changed?');
  process.exit(1);
}

let out = fs.readFileSync(TEMPLATE, 'utf8');
out = out.replace('__CORE_JS__', `../mock-frontend${coreMatch[0]}`).replace('__APP_JS__', `../mock-frontend${appMatch[0]}`);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log(`compose-mock-frontend-index: wrote ${OUT} (core=${coreMatch[0]}, app=${appMatch[0]})`);
