import ReceiptPreview from './ReceiptPreview';
import './ReceiptPreview.css';

export default function ReceiptPreviewModal({ html, title, onPrint, onClose, printing }) {
  return (
    <div className="receipt-preview-modal-backdrop" onClick={onClose}>
      <div className="receipt-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-preview-modal-header">
          <h3>{title}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="receipt-preview-modal-body">
          <ReceiptPreview html={html} title="" />
        </div>
        <div className="receipt-preview-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={printing}>
            Kapat
          </button>
          <button type="button" className="btn btn-primary" onClick={onPrint} disabled={printing}>
            {printing ? 'Yazdırılıyor...' : 'Yazdır'}
          </button>
        </div>
      </div>
    </div>
  );
}
