import path from 'path';

export function cleanThemeId(value) {
  const dashed = String(value ?? '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  let start = 0;
  let end = dashed.length;
  while (start < end && dashed[start] === '-') start += 1;
  while (end > start && dashed[end - 1] === '-') end -= 1;
  return dashed.slice(start, end) || 'theme';
}

export function resolveInside(base, ...parts) {
  const root = path.resolve(base);
  const target = path.resolve(root, ...parts);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error('Path escapes its folder');
  }
  return target;
}
