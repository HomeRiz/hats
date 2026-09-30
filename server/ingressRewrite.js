export function normalizeIngressPath(headerValue) {
  const value = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return value || '';
}

const PREFIX_TARGETS = ['/static/', '/frontend_latest/', '/frontend_es5/'];
const EXACT_TARGETS = ['/sw-modern.js', '/sw-legacy.js'];
const QUOTE_CHARS = ['"', '`', "'"];

export function rewriteRootRelativePaths(content, ingressPath, mountPrefix) {
  const prefix = `${ingressPath}${mountPrefix}`;
  let out = content;
  for (const q of QUOTE_CHARS) {
    for (const target of PREFIX_TARGETS) {
      out = out.split(`${q}${target}`).join(`${q}${prefix}${target}`);
    }
    for (const target of EXACT_TARGETS) {
      out = out.split(`${q}${target}${q}`).join(`${q}${prefix}${target}${q}`);
    }
  }
  return out;
}
