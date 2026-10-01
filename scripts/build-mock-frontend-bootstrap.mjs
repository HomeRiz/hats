import { build } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await build({
  configFile: false,
  build: {
    outDir: path.join(__dirname, '..', 'vendor', 'mock-frontend-bootstrap'),
    emptyOutDir: true,
    lib: {
      entry: path.join(__dirname, '..', 'src', 'mockHass', 'bootstrapEntry.ts'),
      formats: ['iife'],
      name: 'HatsMockFrontendBoot',
      fileName: () => 'boot.js',
    },
  },
});
console.log('build-mock-frontend-bootstrap: wrote vendor/mock-frontend-bootstrap/boot.js');
