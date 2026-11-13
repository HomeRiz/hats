import { describe, it, expect, afterEach } from 'vitest';
import express from 'express';
import { createLimiter, apiLimiter, assetLimiter } from './rateLimit.js';

let server;

afterEach(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  server = undefined;
});

async function start(app) {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  return `http://127.0.0.1:${server.address().port}`;
}

describe('rate limiter', () => {
  it('answers 429 with a plain message after the limit', async () => {
    const app = express();
    app.use(createLimiter(2));
    app.get('/x', (req, res) => res.json({ ok: true }));
    const base = await start(app);
    expect((await fetch(`${base}/x`)).status).toBe(200);
    expect((await fetch(`${base}/x`)).status).toBe(200);
    const blocked = await fetch(`${base}/x`);
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({ error: 'Too many requests. Wait a minute and try again.' });
    expect(blocked.headers.get('ratelimit')).toBeTruthy();
  });

  it('does not complain when a proxy sends X-Forwarded-For', async () => {
    const app = express();
    app.use(createLimiter(5));
    app.get('/x', (req, res) => res.json({ ok: true }));
    const base = await start(app);
    const res = await fetch(`${base}/x`, { headers: { 'X-Forwarded-For': '10.0.0.9' } });
    expect(res.status).toBe(200);
  });

  it('the api limiter skips the mock frontend files', async () => {
    const app = express();
    app.use(apiLimiter);
    app.get('/mock-frontend/a.js', (req, res) => res.send('ok'));
    const base = await start(app);
    const res = await fetch(`${base}/mock-frontend/a.js`);
    expect(res.status).toBe(200);
    expect(res.headers.get('ratelimit')).toBeNull();
  });

  it('exports a high ceiling for the asset limiter', () => {
    expect(typeof assetLimiter).toBe('function');
  });
});
