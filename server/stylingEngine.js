export const UIX_REPO = 'Lint-Free-Technology/uix';

export function hasUixConfigEntry(rawConfigEntries) {
  try {
    const entries = JSON.parse(rawConfigEntries)?.data?.entries;
    return Array.isArray(entries) && entries.some((e) => e && e.domain === 'uix');
  } catch {
    return false;
  }
}

export function detectStylingEngine({ cardModActive, uixOnDisk, uixConfigured }) {
  const uixActive = Boolean(uixConfigured);
  let engine = 'none';
  if (uixActive && cardModActive) engine = 'both';
  else if (uixActive) engine = 'uix';
  else if (cardModActive) engine = 'card-mod';
  return {
    engine,
    uixActive,
    uixNeedsSetup: Boolean(uixOnDisk) && !uixActive,
    conflict: engine === 'both',
    hasStylingEngine: engine !== 'none',
  };
}

export function removeCardModFromConfig(content) {
  const kept = content.split('\n').filter((line) => !/^\s*-\s*\S*card-mod\.js\S*\s*$/.test(line));
  const out = [];
  for (let i = 0; i < kept.length; i++) {
    if (/^\s*extra_module_url\s*:\s*$/.test(kept[i])) {
      const indent = kept[i].match(/^\s*/)[0].length;
      let j = i + 1;
      while (j < kept.length && kept[j].trim() === '') j++;
      const next = kept[j];
      const hasItem = next !== undefined && /^\s*-/.test(next) && next.match(/^\s*/)[0].length >= indent;
      if (!hasItem) continue;
    }
    out.push(kept[i]);
  }
  return out.join('\n');
}
