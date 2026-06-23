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

export const SEED_CATEGORY_COLORS = {
  Yemek: '#ff9f0a',
  İçecek: '#4f8cff',
};

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
