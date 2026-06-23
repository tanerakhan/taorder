import { useEffect, useState } from 'react';
import { getTaorder } from '../utils/taorder';
import { useSettings } from '../contexts/SettingsContext';
import { VIEWS } from '../constants/views';
import './TableManagerPage.css';

export default function TableManagerPage({ onShowToast }) {
  const { getNavLabel } = useSettings();
  const [tables, setTables] = useState([]);
  const [tableCount, setTableCount] = useState('');
  const [dbPath, setDbPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ number: '', label: '' });
  const [addForm, setAddForm] = useState({ number: '', label: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const api = getTaorder();
      const [tableData, count, path] = await Promise.all([
        api.tables.getAll(),
        api.tables.getCount(),
        api.app.getDbPath(),
      ]);
      setTables(tableData);
      setTableCount(String(count));
      setDbPath(path);
    } catch (err) {
      onShowToast(err.message || 'Masalar yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetCount(e) {
    e.preventDefault();
    const count = parseInt(tableCount, 10);
    if (isNaN(count) || count < 1) return;

    try {
      const updated = await getTaorder().tables.setCount(count);
      setTables(updated);
      onShowToast(`${count} masa ayarlandı`);
    } catch (err) {
      onShowToast(err.message || 'Masa sayısı güncellenemedi', 'error');
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    const number = parseInt(addForm.number, 10);
    if (isNaN(number) || number < 1) return;

    try {
      await getTaorder().tables.create({
        number,
        label: addForm.label.trim() || `Masa ${number}`,
      });
      onShowToast(`Masa ${number} eklendi`);
      setAddForm({ number: '', label: '' });
      await loadData();
    } catch (err) {
      onShowToast(err.message || 'Bu masa numarası zaten kullanılıyor', 'error');
    }
  }

  function startEdit(table) {
    setEditingId(table.id);
    setEditForm({ number: String(table.number), label: table.label || '' });
  }

  async function handleUpdate(e) {
    e.preventDefault();
    const number = parseInt(editForm.number, 10);
    if (isNaN(number) || number < 1) return;

    try {
      await getTaorder().tables.update(editingId, {
        number,
        label: editForm.label.trim() || `Masa ${number}`,
      });
      onShowToast('Masa güncellendi');
      setEditingId(null);
      await loadData();
    } catch (err) {
      onShowToast(err.message || 'Güncelleme başarısız', 'error');
    }
  }

  async function handleRemove(id, label) {
    if (!confirm(`"${label}" silinsin mi?`)) return;
    try {
      await getTaorder().tables.remove(id);
      onShowToast('Masa silindi');
      await loadData();
    } catch (err) {
      onShowToast(err.message || 'Silme başarısız', 'error');
    }
  }

  return (
    <div className="content-page table-manager-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">{getNavLabel(VIEWS.tables)}</h2>
          <p className="page-desc">
            Masa sayısını toplu ayarlayın veya tek tek ekleyin. Sipariş atamaları{' '}
            {getNavLabel(VIEWS.orders)} sekmesinden yapılır.
          </p>
        </div>
      </header>

      <div className="table-manager-grid">
        <div className="card">
          <h3 className="card-title">Toplu Masa Sayısı</h3>
          <form onSubmit={handleSetCount} className="inline-form">
            <input
              type="number"
              min="1"
              max="99"
              value={tableCount}
              onChange={(e) => setTableCount(e.target.value)}
              placeholder="Masa sayısı"
            />
            <button type="submit" className="btn btn-primary">
              Uygula
            </button>
          </form>
          <p className="hint">1–99 arası. Eksik masalar oluşturulur, fazlalar kaldırılır.</p>
        </div>

        <div className="card">
          <h3 className="card-title">Tek Masa Ekle</h3>
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <input
                type="number"
                min="1"
                placeholder="Masa no"
                value={addForm.number}
                onChange={(e) => setAddForm({ ...addForm, number: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Etiket (opsiyonel)"
                value={addForm.label}
                onChange={(e) => setAddForm({ ...addForm, label: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Ekle
            </button>
          </form>
        </div>
      </div>

      <div className="card table-list-card">
        <h3 className="card-title">Kayıtlı Masalar ({tables.length})</h3>
        {loading ? (
          <div className="empty-state">Yükleniyor...</div>
        ) : tables.length === 0 ? (
          <div className="empty-state">Henüz masa tanımlı değil</div>
        ) : (
          <ul className="table-list">
            {tables.map((table) =>
              editingId === table.id ? (
                <li key={table.id} className="table-list-item editing">
                  <form onSubmit={handleUpdate} className="edit-form">
                    <input
                      type="number"
                      min="1"
                      value={editForm.number}
                      onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      value={editForm.label}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                      placeholder="Etiket"
                    />
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
                  </form>
                </li>
              ) : (
                <li key={table.id} className="table-list-item">
                  <div className="table-info">
                    <span className="table-num">{table.number}</span>
                    <span className="table-label">{table.label}</span>
                  </div>
                  <div className="table-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(table)}>
                      Düzenle
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemove(table.id, table.label)}
                    >
                      Sil
                    </button>
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </div>

      {dbPath && (
        <p className="db-path-hint">
          Veriler bu bilgisayarda saklanır: <code>{dbPath}</code>
        </p>
      )}
    </div>
  );
}
