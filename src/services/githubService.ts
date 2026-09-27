import { ThemeConfig } from '../types/theme';

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
}

export function validateThemeForSubmission(theme: ThemeConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!theme.name || theme.name.trim().length < 3) {
    issues.push({ type: 'error', message: 'Theme name must be at least 3 characters long.' });
  }

  if (!theme.author || theme.author.trim().length < 2) {
    issues.push({ type: 'warning', message: 'Author name is recommended for proper attribution in NOTICE.md.' });
  }

  if (!theme.description || theme.description.trim().length < 10) {
    issues.push({ type: 'warning', message: 'Please provide a clear description of the theme visual system and intended mood.' });
  }

  if (!theme.palette.primary.match(/^#[0-9A-Fa-f]{6}$/)) {
    issues.push({ type: 'error', message: 'Primary color must be a valid 6-digit hex code (#RRGGBB).' });
  }

  if (theme.engine.blurAmount < 0 || theme.engine.blurAmount > 40) {
    issues.push({ type: 'warning', message: 'Blur amounts higher than 30px may impact GPU performance on low-power dashboards.' });
  }

  if (theme.background.type === 'image' && !theme.background.imageUrl) {
    issues.push({ type: 'error', message: 'An artwork image or gradient must be specified for background.' });
  }

  return issues;
}
