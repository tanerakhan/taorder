import { useEffect, useState } from 'react';
import { formatPrice, CATEGORY_LABELS } from '../utils/format';
import { getTaorder } from '../utils/taorder';
import ReceiptPreviewModal from './ReceiptPreviewModal';
import './OrderPanel.css';

export default function OrderPanel({ table, onOrderChange, onClose, onShowToast }) {
  const tableId = table.id;
  const [bill, setBill] = useState({ items: [], total: 0 });
  const [menu, setMenu] = useState([]);
  const [activeCategory, setActiveCategory] = useState('food');
  const [loading, setLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    loadData();
  }, [tableId]);

  async function loadData() {
    setLoading(true);
    const api = getTaorder();
    const [billData, menuData] = await Promise.all([
      api.orders.getBill(tableId),
      api.menu.getAll(),
    ]);
    setBill(billData);
    setMenu(menuData);
    setLoading(false);
  }

  async function handleAddItem(menuItemId) {
    await getTaorder().orders.addItem(tableId, menuItemId, 1);
    await loadData();
    onOrderChange();
  }

  async function handleQuantityChange(orderItemId, delta) {
    const item = bill.items.find((i) => i.id === orderItemId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      await getTaorder().orders.removeItem(orderItemId);
    } else {
      await getTaorder().orders.updateItemQuantity(orderItemId, newQty);
    }
    await loadData();
    onOrderChange();
  }

  function buildReceiptPayload() {
    return {
      tableLabel: table.label || `Masa ${table.number}`,
      tableNumber: table.number,
      orderId: bill.order?.id,
      total: bill.total,
      items: bill.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        lineTotal: item.unit_price * item.quantity,
      })),
    };
  }

  async function handleOpenPreview() {
    if (bill.items.length === 0) return;
    try {
      const html = await getTaorder().print.getReceiptHtml({
        receiptData: buildReceiptPayload(),
      });
      setPreviewHtml(html);
      setShowPreview(true);
    } catch (err) {
      onShowToast?.(err.message || 'Önizleme oluşturulamadı', 'error');
    }
  }

  async function handleConfirmPrint() {
    setPrinting(true);
    try {
      const result = await getTaorder().print.receipt(buildReceiptPayload());
      if (result.canceled) {
        onShowToast?.('Yazdırma iptal edildi');
        return;
      }
      onShowToast?.('Fiş yazdırıldı');
      setShowPreview(false);
    } catch (err) {
      onShowToast?.(err.message || 'Fiş yazdırılamadı', 'error');
    } finally {
      setPrinting(false);
    }
  }

  async function handleCloseBill() {
    if (bill.items.length === 0) return;
    const confirmed = confirm(
      'Adisyon kapatılacak. Ödeme POS/kredi kartı terminalinden alınacaktır.\n\nDevam?'
    );
    if (!confirmed) return;
    await getTaorder().orders.close(tableId);
    onOrderChange();
    onClose();
  }

  const filteredMenu = menu.filter((m) => m.category === activeCategory);

  if (loading) {
    return (
      <aside className="order-panel card">
        <div className="empty-state">Yükleniyor...</div>
      </aside>
    );
  }

  return (
    <aside className="order-panel card">
      <div className="order-panel-header">
        <h2 className="card-title">Adisyon — {table.label || `Masa ${table.number}`}</h2>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="menu-picker">
        <div className="category-tabs">
          {['food', 'drink'].map((cat) => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <div className="menu-items">
          {filteredMenu.map((item) => (
            <button key={item.id} className="menu-item-btn" onClick={() => handleAddItem(item.id)}>
              <span className="menu-item-name">{item.name}</span>
              <span className="menu-item-price">{formatPrice(item.price)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bill-section">
        <h3 className="bill-title">Hesap</h3>
        {bill.items.length === 0 ? (
          <p className="empty-state">Henüz sipariş yok</p>
        ) : (
          <ul className="bill-items">
            {bill.items.map((item) => (
              <li key={item.id} className="bill-item">
                <div className="bill-item-info">
                  <span className="bill-item-name">{item.name}</span>
                  <span className="bill-item-unit">{formatPrice(item.unit_price)}</span>
                </div>
                <div className="bill-item-actions">
                  <button
                    className="qty-btn"
                    onClick={() => handleQuantityChange(item.id, -1)}
                  >
                    −
                  </button>
                  <span className="qty">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => handleQuantityChange(item.id, 1)}
                  >
                    +
                  </button>
                  <span className="bill-item-total">
                    {formatPrice(item.unit_price * item.quantity)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="bill-footer">
          <div className="bill-total">
            <span>Toplam</span>
            <strong>{formatPrice(bill.total)}</strong>
          </div>
          <p className="payment-note">
            Fişi yazdırıp masaya götürebilirsiniz. Ödeme uygulama dışında alınır.
          </p>
          <button
            className="btn btn-ghost print-receipt-btn"
            disabled={bill.items.length === 0}
            onClick={handleOpenPreview}
          >
            Fiş Yazdır
          </button>
          <button
            className="btn btn-primary close-bill-btn"
            disabled={bill.items.length === 0}
            onClick={handleCloseBill}
          >
            Adisyonu Kapat
          </button>
        </div>
      </div>

      {showPreview && (
        <ReceiptPreviewModal
          html={previewHtml}
          title={`Fiş — ${table.label || `Masa ${table.number}`}`}
          onPrint={handleConfirmPrint}
          onClose={() => setShowPreview(false)}
          printing={printing}
        />
      )}
    </aside>
  );
}
