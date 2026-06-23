import './ReceiptPreview.css';

export default function ReceiptPreview({ html, title = 'Fiş önizleme' }) {
  if (!html) {
    return (
      <div className="receipt-preview card">
        <h3 className="card-title">{title}</h3>
        <p className="empty-state">Önizleme yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="receipt-preview card">
      <h3 className="card-title">{title}</h3>
      <div className="receipt-preview-frame-wrap">
        <iframe
          className="receipt-preview-frame"
          srcDoc={html}
          title={title}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
