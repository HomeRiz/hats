import { describe, it, expect } from 'vitest';
import { sanitizeThemeYamlContent } from './themeYamlSanitizer.js';

const MARKER = '/* Custom User Injected CSS */';
const TAG = /<\s*\/?\s*(?:script|style|iframe|object|embed)/i;

function custom(css) {
  return sanitizeThemeYamlContent(`head: 1\ncard-mod-card: |\n  ${MARKER}\n${css}\n`);
}

describe('sanitizeThemeYamlContent tag handling', () => {
  it('neutralizes script and style tags', () => {
    const out = custom('<script>alert(1)</script><style>a{}</style>');
    expect(TAG.test(out)).toBe(false);
    expect(out).toContain('&lt;script');
  });

  it('cannot rebuild a tag from the leftovers of a nested one', () => {
    for (const evil of ['<scr<script>ipt>alert(1)</script>', '<<script>script>x', '<scr<iframe>ipt src=x>', '< / SCRIPT >', '<\nscript>']) {
      expect(TAG.test(custom(evil)), evil).toBe(false);
    }
  });

  it('stays safe when a later removal could join the pieces of a tag', () => {
    for (const evil of ['<{{script>alert(1)</{%style>', '<{#script>x</{{style>', '<sc{{ript>x</sty{%le>']) {
      expect(TAG.test(custom(evil)), evil).toBe(false);
    }
  });

  it('stays safe however deep javascript: is nested inside a tag name', () => {
    for (let depth = 1; depth <= 12; depth += 1) {
      let inner = 'javascript:';
      for (let i = 0; i < depth; i += 1) inner = `javascri${inner}pt:`;
      expect(TAG.test(custom(`<sc${inner}ript>alert(1)</sc${inner}ript>`)), `depth ${depth}`).toBe(false);
    }
  });

  it('cannot rebuild an import, a remote url or a javascript url by stripping template openers', () => {
    const out = custom('@im{{port url(x.css);\na { b: u{{rl(//evil.example/a.png) }\nc { d: java{{script:alert(1) }');
    expect(out).not.toContain('@import');
    expect(out).not.toMatch(/url\(\s*['"]?\s*\/\//i);
    expect(out).not.toMatch(/javascript\s*:/i);
  });

  it('fails closed when the input never settles', () => {
    let inner = 'javascript:';
    for (let i = 0; i < 200; i += 1) inner = `javascri${inner}pt:`;
    const out = custom(`a { x: <sc${inner}ript>alert(1)</sc${inner}ript> }`);
    expect(TAG.test(out)).toBe(false);
    expect(out).not.toMatch(/javascript\s*:/i);
  });

  it('keeps ordinary CSS with angle brackets', () => {
    const out = custom('a > b { color: red }\n@media (width < 600px) { a { top: 0 } }');
    expect(out).toContain('a > b { color: red }');
    expect(out).toContain('@media (width < 600px)');
  });

  it('still removes javascript urls and imports', () => {
    const out = custom('a { background: url(javascript:alert(1)) }\n@import url(x.css);');
    expect(out).not.toMatch(/javascript\s*:/i);
    expect(out).not.toContain('@import');
  });

  it('returns non-strings unchanged', () => {
    expect(sanitizeThemeYamlContent('')).toBe('');
    expect(sanitizeThemeYamlContent(undefined)).toBeUndefined();
  });
});
