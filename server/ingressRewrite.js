export function normalizeIngressPath(headerValue) {
  const value = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return value || '';
}

const REWRITE_TARGETS = ['/static/', '/frontend_latest/', '/frontend_es5/', '/sw-modern.js"', '/sw-legacy.js"'];

export function rewriteRootRelativePaths(content, ingressPath, mountPrefix) {
  const prefix = `${ingressPath}${mountPrefix}`;
  let out = content;
  for (const target of REWRITE_TARGETS) {
    out = out.split(`"${target}`).join(`"${prefix}${target}`);
  }
  return out;
}
