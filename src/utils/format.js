export function formatPrice(amount) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
}

export const CATEGORY_LABELS = {
  food: 'Yemek',
  drink: 'İçecek',
};
