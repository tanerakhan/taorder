import { useState } from 'react';
import { CATEGORY_LABELS } from '../utils/format';
import { getTaorder } from '../utils/taorder';
import { useSettings } from '../contexts/SettingsContext';
import { VIEWS } from '../constants/views';
import './MenuPages.css';

const EMPTY_FORM = { name: '', category: 'food', price: '' };

export default function MenuAddPage({ editItem, onShowToast, onEditDone }) {
  const { getNavLabel } = useSettings();
  const [form, setForm] = useState(
    editItem
      ? { name: editItem.name, category: editItem.category, price: String(editItem.price) }
      : EMPTY_FORM
  );

  const isEditing = Boolean(editItem);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price),
    };
    if (!payload.name || isNaN(payload.price) || payload.price < 0) return;

    try {
      const api = getTaorder();
      if (isEditing) {
        await api.menu.update(editItem.id, payload);
        onShowToast('Menü öğesi güncellendi');
        onEditDone?.();
      } else {
        await api.menu.create(payload);
        onShowToast(`${payload.name} menüye eklendi`);
        setForm(EMPTY_FORM);
      }
    } catch (err) {
      onShowToast(err.message || 'Menü kaydedilemedi', 'error');
    }
  }

  function handleCancelEdit() {
    onEditDone?.();
    setForm(EMPTY_FORM);
  }

  return (
    <div className="content-page menu-add-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">
            {isEditing ? `${getNavLabel(VIEWS.menuAdd)} — Düzenle` : getNavLabel(VIEWS.menuAdd)}
          </h2>
          <p className="page-desc">
            {isEditing
              ? 'Seçili öğenin bilgilerini güncelleyin.'
              : 'Yeni yemek veya içecek ekleyin. Kayıt sonrası menü listesinde görünür.'}
          </p>
        </div>
      </header>

      <div className="card form-card">
        <form onSubmit={handleSubmit}>
          <label className="field-label">
            Ürün adı
            <input
              type="text"
              placeholder="Örn. Izgara Köfte"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
          </label>

          <label className="field-label">
            Kategori
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="food">{CATEGORY_LABELS.food}</option>
              <option value="drink">{CATEGORY_LABELS.drink}</option>
            </select>
          </label>

          <label className="field-label">
            Fiyat (₺)
            <input
              type="number"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              min="0"
              step="0.01"
              required
            />
          </label>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Güncelle' : 'Menüye Ekle'}
            </button>
            {isEditing && (
              <button type="button" className="btn btn-ghost" onClick={handleCancelEdit}>
                İptal
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
