import { useEffect, useState } from 'react';
import { getTaorder } from '../utils/taorder';
import { useSettings } from '../contexts/SettingsContext';
import { VIEWS } from '../constants/views';
import './MenuPages.css';

function buildEmptyForm(categories) {
  return {
    name: '',
    categoryId: categories[0]?.id ?? '',
    price: '',
  };
}

export default function MenuAddPage({ editItem, onShowToast, onEditDone }) {
  const { getNavLabel } = useSettings();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [form, setForm] = useState({ name: '', categoryId: '', price: '' });

  const isEditing = Boolean(editItem);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (loadingCategories) return;
    if (editItem) {
      setForm({
        name: editItem.name,
        categoryId: editItem.category_id,
        price: String(editItem.price),
      });
    } else {
      setForm(buildEmptyForm(categories));
    }
  }, [editItem, categories, loadingCategories]);

  async function loadCategories() {
    setLoadingCategories(true);
    try {
      const data = await getTaorder().categories.getAll();
      setCategories(data);
      if (!editItem) {
        setForm(buildEmptyForm(data));
      }
    } catch (err) {
      onShowToast(err.message || 'Kategoriler yüklenemedi', 'error');
    } finally {
      setLoadingCategories(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      price: parseFloat(form.price),
    };
    if (!payload.name || !payload.categoryId || isNaN(payload.price) || payload.price < 0) return;

    try {
      const api = getTaorder();
      if (isEditing) {
        await api.menu.update(editItem.id, payload);
        onShowToast('Menü öğesi güncellendi');
        onEditDone?.();
      } else {
        await api.menu.create(payload);
        onShowToast(`${payload.name} menüye eklendi`);
        setForm(buildEmptyForm(categories));
      }
    } catch (err) {
      onShowToast(err.message || 'Menü kaydedilemedi', 'error');
    }
  }

  function handleCancelEdit() {
    onEditDone?.();
    setForm(buildEmptyForm(categories));
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
              : 'Yeni ürün ekleyin. Kategorileri Kategoriler sekmesinden yönetebilirsiniz.'}
          </p>
        </div>
      </header>

      <div className="card form-card">
        {loadingCategories ? (
          <div className="empty-state">Kategoriler yükleniyor...</div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            Önce {getNavLabel(VIEWS.categories)} sekmesinden en az bir kategori ekleyin.
          </div>
        ) : (
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
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: Number(e.target.value) })
                }
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
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
        )}
      </div>
    </div>
  );
}
