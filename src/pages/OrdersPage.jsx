import { useState } from 'react';
import TableGrid from '../components/TableGrid';
import OrderPanel from '../components/OrderPanel';
import { useSettings } from '../contexts/SettingsContext';
import { VIEWS } from '../constants/views';
import './OrdersPage.css';

export default function OrdersPage({ refreshKey, onRefresh, onShowToast }) {
  const { getNavLabel } = useSettings();
  const [selectedTable, setSelectedTable] = useState(null);

  return (
    <div className="content-page orders-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">{getNavLabel(VIEWS.orders)}</h2>
          <p className="page-desc">
            Masaya tıklayarak sipariş oluşturun, fişi yazdırıp masaya götürün.
          </p>
        </div>
      </header>

      <div className="orders-layout">
        <TableGrid
          key={refreshKey}
          selectedTableId={selectedTable?.id}
          onSelectTable={setSelectedTable}
        />
        {selectedTable ? (
          <OrderPanel
            table={selectedTable}
            onOrderChange={onRefresh}
            onClose={() => setSelectedTable(null)}
            onShowToast={onShowToast}
          />
        ) : (
          <aside className="card orders-placeholder">
            <p className="empty-state">Sipariş atamak için bir masa seçin</p>
          </aside>
        )}
      </div>
    </div>
  );
}
