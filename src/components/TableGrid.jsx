import { useEffect, useState } from 'react';
import { formatPrice } from '../utils/format';
import { getTaorder } from '../utils/taorder';
import { useSettings } from '../contexts/SettingsContext';
import { VIEWS } from '../constants/views';
import './TableGrid.css';

export default function TableGrid({ selectedTableId, onSelectTable }) {
  const { getNavLabel } = useSettings();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTables();
  }, []);

  async function loadTables() {
    setLoading(true);
    const data = await getTaorder().tables.getSummaries();
    setTables(data);
    setLoading(false);
  }

  if (loading) {
    return <div className="empty-state">Masalar yükleniyor...</div>;
  }

  if (tables.length === 0) {
    return (
      <div className="table-grid card">
        <h2 className="card-title">{getNavLabel(VIEWS.tables)}</h2>
        <p className="empty-state">Henüz masa yok. Masalar sekmesinden masa ekleyin.</p>
      </div>
    );
  }

  return (
    <div className="table-grid card">
      <h2 className="card-title">{getNavLabel(VIEWS.tables)}</h2>
      <div className="table-grid-inner">
        {tables.map((table) => (
          <button
            key={table.id}
            className={`table-card ${selectedTableId === table.id ? 'selected' : ''} ${table.hasOpenOrder ? 'occupied' : ''}`}
            onClick={() => onSelectTable(table)}
          >
            <span className="table-number">{table.number}</span>
            <span className="table-label">{table.label}</span>
            {table.hasOpenOrder ? (
              <>
                <span className="table-total">{formatPrice(table.total)}</span>
                <span className="table-items">{table.itemCount} ürün</span>
              </>
            ) : (
              <span className="table-empty">Boş</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
