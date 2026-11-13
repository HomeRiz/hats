const MAX_PASSES = 64;
const TAG_OPEN = /<(?=\s*\/?\s*(?:script|style|iframe|object|embed))/gi;

export function sanitizeThemeYamlContent(rawYaml) {
  if (!rawYaml || typeof rawYaml !== 'string') return rawYaml;
  let content = rawYaml;

  content = content.replace(/url\(["']?data:image\/svg\+xml;utf8,([^"')]{1,200000})["']?\)/g, (match, rawSvg) => {
    try {
      const decoded = decodeURIComponent(rawSvg);
      const b64 = Buffer.from(decoded, 'utf-8').toString('base64');
      return `url('data:image/svg+xml;base64,${b64}')`;
    } catch {
      return match;
    }
  });

  content = content.replace(/:\s*"([^"\n]*?)url\("([^"\n]*?)"\)([^"\n]*?)"/g, ': "$1url(\'$2\')$3"');

  content = content.replace(/card-mod-sidebar:\s*\|\s*\n\s*:host::before\s*\{[\s\S]*?\}\s*(?=\n\s*(?:card-mod|modes|ha-|\.|\w+:))/g, 'card-mod-sidebar: |\n    :host {\n      background: none !important;\n    }\n    ');
  content = content.replace(/:host::(?:before|after)\s*\{[^}]*?position\s*:\s*fixed[^}]*?\}/g, (match) => {
    if (!/pointer-events\s*:\s*none/i.test(match)) {
      return match.replace(/\}$/, '  pointer-events: none !important;\n}');
    }
    return match;
  });

  const cssMarker = '/* Custom User Injected CSS */';
  const markerIdx = content.indexOf(cssMarker);
  if (markerIdx !== -1) {
    const head = content.slice(0, markerIdx + cssMarker.length);
    let tail = content.slice(markerIdx + cssMarker.length);
    let settled = false;
    for (let pass = 0; pass < MAX_PASSES; pass++) {
      const before = tail;
      tail = tail.replace(TAG_OPEN, '&lt;');
      tail = tail.replace(/javascript\s*:/gi, '');
      tail = tail.replace(/expression\s*\([^)]*\)/gi, '');
      tail = tail.replace(/behavior\s*:[^;}]*/gi, '');
      tail = tail.replace(/-moz-binding\s*:[^;}]*/gi, '');
      tail = tail.replace(/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\}/g, '');
      tail = tail.replace(/\{\{|\{%|\{#/g, '');
      tail = tail.replace(/@import[^;]*;?/gi, '');
      tail = tail.replace(/url\(\s*['"]?\s*(?:https?:)?\/\/[^)]*\)/gi, 'none');
      if (tail === before) {
        settled = true;
        break;
      }
    }
    if (!settled) tail = '';
    tail = tail.replace(TAG_OPEN, '&lt;');
    content = head + tail;
  }

  return content;
}
