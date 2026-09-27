import fs from 'fs';
for (const entry of ['assets', 'index.html', 'icon.svg', 'logo.svg']) {
  fs.rmSync(`dist/${entry}`, { recursive: true, force: true });
}
