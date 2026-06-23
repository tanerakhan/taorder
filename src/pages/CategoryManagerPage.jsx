import { useEffect, useState } from 'react';
import CategoryColorPicker from '../components/CategoryColorPicker';
import { DEFAULT_CATEGORY_COLOR, getCategoryBadgeStyle, pickCategoryColor } from '../constants/categoryColors';
import { getTaorder } from '../utils/taorder';
import { useSettings } from '../contexts/SettingsContext';
import { VIEWS } from '../constants/views';
import './MenuPages.css';

export default function CategoryManagerPage({ onShowToast }) {
  const { getNavLabel } = useSettings();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_CATEGORY_COLOR);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(DEFAULT_CATEGORY_COLOR);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await getTaorder().categories.getAll();
      setCategories(data);
      setNewColor(pickCategoryColor(data.length));
    } catch (err) {
      onShowToast(err.message || 'Kategoriler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    try {
      await getTaorder().categories.create({ name, color: newColor });
      onShowToast(`"${name}" kategorisi eklendi`);
      setNewName('');
      setNewColor(pickCategoryColor(categories.length + 1));
      await loadCategories();
    } catch (err) {
      onShowToast(err.message || 'Kategori eklenemedi', 'error');
    }
  }

  function startEdit(category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color || DEFAULT_CATEGORY_COLOR);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    const name = editName.trim();
    if (!name || !editingId) return;

    try {
      await getTaorder().categories.update(editingId, { name, color: editColor });
      onShowToast('Kategori güncellendi');
      setEditingId(null);
      setEditName('');
      await loadCategories();
    } catch (err) {
      onShowToast(err.message || 'Güncelleme başarısız', 'error');
    }
  }

  async function handleRemove(category) {
    if (!confirm(`"${category.name}" kategorisi silinsin mi?`)) return;

    try {
      await getTaorder().categories.remove(category.id);
      onShowToast('Kategori silindi');
      await loadCategories();
    } catch (err) {
      onShowToast(err.message || 'Silme başarısız', 'error');
    }
  }

  return (
    <div className="content-page category-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">{getNavLabel(VIEWS.categories)}</h2>
          <p className="page-desc">
            Kategori adı ve etiket rengini belirleyin. Renkler menü listesinde ve sipariş sekmelerinde görünür.
          </p>
        </div>
      </header>

      <div className="card form-card category-add-card">
        <h3 className="card-title">Yeni kategori</h3>
        <form className="category-form" onSubmit={handleAdd}>
          <label className="field-label">
            Kategori adı
            <input
              type="text"
              placeholder="Örn. Tatlı, Kahvaltı, Nargile"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </label>
          <label className="field-label">
            Etiket rengi
            <CategoryColorPicker value={newColor} onChange={setNewColor} />
          </label>
          <div className="category-preview-row">
            <span className="content-badge" style={getCategoryBadgeStyle(newColor)}>
              {newName.trim() || 'Önizleme'}
            </span>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Ekle
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="empty-state">Kategoriler yükleniyor...</div>
      ) : categories.length === 0 ? (
        <div className="card empty-card">
          <p className="empty-state">Henüz kategori yok. Yukarıdan ekleyin.</p>
        </div>
      ) : (
        <ul className="category-list">
          {categories.map((category) => (
            <li key={category.id} className="category-list-item card">
              {editingId === category.id ? (
                <form className="category-form category-form-edit" onSubmit={handleUpdate}>
                  <label className="field-label">
                    Kategori adı
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      autoFocus
                    />
                  </label>
                  <label className="field-label">
                    Etiket rengi
                    <CategoryColorPicker value={editColor} onChange={setEditColor} />
                  </label>
                  <div className="category-preview-row">
                    <span className="content-badge" style={getCategoryBadgeStyle(editColor)}>
                      {editName.trim() || category.name}
                    </span>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary btn-sm">
                      Kaydet
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditingId(null)}
                    >
                      İptal
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="category-list-info">
                    <span className="content-badge" style={getCategoryBadgeStyle(category.color)}>
                      {category.name}
                    </span>
                    <span className="category-item-count">{category.item_count} ürün</span>
                  </div>
                  <div className="category-list-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(category)}>
                      Düzenle
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemove(category)}
                      disabled={category.item_count > 0}
                      title={
                        category.item_count > 0
                          ? 'Önce bu kategorideki ürünleri taşıyın veya silin'
                          : undefined
                      }
                    >
                      Sil
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
