import { useEffect, useState } from 'react';
import { formatPrice, CATEGORY_LABELS } from '../utils/format';
import { getTaorder } from '../utils/taorder';
import { useSettings } from '../contexts/SettingsContext';
import { VIEWS } from '../constants/views';
import './MenuPages.css';

export default function MenuListPage({ onEdit, onShowToast }) {
  const { getNavLabel } = useSettings();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    setLoading(true);
    try {
      const data = await getTaorder().menu.getAll();
      setItems(data);
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
      await loadMenu();
    } catch (err) {
      onShowToast(err.message || 'Silme başarısız', 'error');
    }
  }

  const filtered =
    filter === 'all' ? items : items.filter((i) => i.category === filter);

  const foodCount = items.filter((i) => i.category === 'food').length;
  const drinkCount = items.filter((i) => i.category === 'drink').length;

  return (
    <div className="content-page menu-list-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">{getNavLabel(VIEWS.menuList)}</h2>
          <p className="page-desc">
            {foodCount} yemek · {drinkCount} içecek · Toplam {items.length} öğe
          </p>
        </div>
        <div className="filter-tabs">
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'food', label: 'Yemekler' },
            { key: 'drink', label: 'İçecekler' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`filter-tab ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
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
                <span className={`content-badge content-badge-${item.category}`}>
                  {CATEGORY_LABELS[item.category]}
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
