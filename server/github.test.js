import { describe, expect, it } from 'vitest';
import { submitThemeIssue } from './github.js';

const TOKEN = 'ghp_abcdefghijklmnopqrstuvwxyz0123';

describe('submitThemeIssue', () => {
  it('posts the issue and returns its url', async () => {
    let call;
    const fetchImpl = async (url, init) => {
      call = { url, body: JSON.parse(init.body) };
      return { ok: true, json: async () => ({ html_url: 'https://github.com/HomeRiz/hats/issues/7', number: 7 }) };
    };
    const res = await submitThemeIssue(
      { token: TOKEN, kind: 'removal', themeName: 'Neon', title: 'Remove Neon', body: 'Repeats Cyber' },
      { fetchImpl }
    );
    expect(res).toEqual({ success: true, issueUrl: 'https://github.com/HomeRiz/hats/issues/7', issueNumber: 7 });
    expect(call.url).toBe('https://api.github.com/repos/HomeRiz/hats/issues');
    expect(call.body.body).toContain('Removal request');
    expect(call.body.body).toContain('Neon');
  });

  it('rejects a missing title or token without calling GitHub', async () => {
    const fetchImpl = async () => {
      throw new Error('should not be called');
    };
    expect((await submitThemeIssue({ token: TOKEN, title: '  ' }, { fetchImpl })).success).toBe(false);
    expect((await submitThemeIssue({ token: '', title: 'x' }, { fetchImpl })).success).toBe(false);
  });

  it('redacts the token from errors', async () => {
    const fetchImpl = async () => {
      throw new Error(`boom ${TOKEN}`);
    };
    const res = await submitThemeIssue({ token: TOKEN, title: 'x' }, { fetchImpl });
    expect(res.success).toBe(false);
    expect(res.error).not.toContain(TOKEN);
  });
});
