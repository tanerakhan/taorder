import { useEffect, useState } from 'react';
import { formatPrice } from '../utils/format';
import { getCategoryBadgeStyle, getCategoryTabActiveStyle } from '../constants/categoryColors';
import { getTaorder } from '../utils/taorder';
import { useSettings } from '../contexts/SettingsContext';
import { VIEWS } from '../constants/views';
import './MenuPages.css';

export default function MenuListPage({ onEdit, onShowToast }) {
  const { getNavLabel } = useSettings();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const api = getTaorder();
      const [menuData, categoryData] = await Promise.all([
        api.menu.getAll(),
        api.categories.getAll(),
      ]);
      setItems(menuData);
      setCategories(categoryData);
    } catch (err) {
      onShowToast(err.message || 'Menü yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(id, name) {
    if (!confirm(`"${name}" menüden silinsin mi?`)) return;
    try {
      await getTaorder().menu.remove(id);
      onShowToast('Menü öğesi silindi');
      await loadData();
    } catch (err) {
      onShowToast(err.message || 'Silme başarısız', 'error');
    }
  }

  const filtered =
    filter === 'all' ? items : items.filter((i) => i.category_id === filter);

  const categorySummary = categories
    .map((cat) => `${cat.name}: ${items.filter((i) => i.category_id === cat.id).length}`)
    .join(' · ');

  return (
    <div className="content-page menu-list-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">{getNavLabel(VIEWS.menuList)}</h2>
          <p className="page-desc">
            {categorySummary ? `${categorySummary} · ` : ''}Toplam {items.length} öğe
          </p>
        </div>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tümü
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`filter-tab ${filter === cat.id ? 'active' : ''}`}
              style={filter === cat.id ? getCategoryTabActiveStyle(cat.color) : undefined}
              onClick={() => setFilter(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="empty-state">Menü yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="card empty-card">
          <p className="empty-state">Henüz menü öğesi yok.</p>
          <p className="page-desc">
            {getNavLabel(VIEWS.menuAdd)} sekmesinden yeni içerik ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="content-grid">
          {filtered.map((item) => (
            <article key={item.id} className="content-card">
              <div className="content-card-body">
                <span
                  className="content-badge"
                  style={getCategoryBadgeStyle(item.category_color)}
                >
                  {item.category_name}
                </span>
                <h3 className="content-name">{item.name}</h3>
                <p className="content-price">{formatPrice(item.price)}</p>
              </div>
              <div className="content-card-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(item)}>
                  Düzenle
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemove(item.id, item.name)}
                >
                  Sil
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
