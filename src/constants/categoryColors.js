export const CATEGORY_COLOR_PRESETS = [
  '#4f8cff',
  '#ff9f0a',
  '#30d158',
  '#bf5af2',
  '#ff453a',
  '#64d2ff',
  '#ffd60a',
  '#ac8e68',
];

export const DEFAULT_CATEGORY_COLOR = '#4f8cff';

export function normalizeCategoryColor(color) {
  if (!color || typeof color !== 'string') return null;
  const trimmed = color.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return null;
}

export function pickCategoryColor(index) {
  return CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length];
}

function hexToRgb(hex) {
  const normalized = normalizeCategoryColor(hex) || DEFAULT_CATEGORY_COLOR;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

export function getCategoryBadgeStyle(color) {
  const { r, g, b } = hexToRgb(color);
  const normalized = normalizeCategoryColor(color) || DEFAULT_CATEGORY_COLOR;
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
    color: normalized,
  };
}

export function getCategoryTabActiveStyle(color) {
  const normalized = normalizeCategoryColor(color) || DEFAULT_CATEGORY_COLOR;
  return {
    backgroundColor: normalized,
    borderColor: normalized,
    color: '#fff',
  };
}
