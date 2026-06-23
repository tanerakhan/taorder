function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoney(amount) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function buildReceiptHtml({ tableLabel, tableNumber, items, total, orderId }, settings) {
  const businessName = settings.receipt_business_name || settings.app_title || 'TaOrder';
  const footer = settings.receipt_footer || 'Afiyet olsun';
  const now = formatDateTime(new Date());

  const rows = items
    .map((item) => {
      const line = `${item.quantity}x ${item.name}`;
      const price = formatMoney(item.lineTotal);
      return `
        <tr>
          <td class="item-name">${escapeHtml(line)}</td>
          <td class="item-price">${escapeHtml(price)}</td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>Adisyon</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      width: 72mm;
      padding: 4mm;
    }
    .center { text-align: center; }
    .business { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
    .table { font-size: 14px; font-weight: bold; margin: 8px 0; }
    .meta { font-size: 11px; margin-bottom: 8px; }
    .divider {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    table { width: 100%; border-collapse: collapse; }
    .item-name { padding: 3px 0; vertical-align: top; }
    .item-price { text-align: right; white-space: nowrap; vertical-align: top; padding-left: 8px; }
    .total-row td {
      font-weight: bold;
      font-size: 14px;
      padding-top: 8px;
    }
    .footer { margin-top: 12px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="center business">${escapeHtml(businessName)}</div>
  <div class="center table">${escapeHtml(tableLabel || `Masa ${tableNumber}`)}</div>
  <div class="center meta">${escapeHtml(now)}${orderId ? ` · #${orderId}` : ''}</div>
  <div class="divider"></div>
  <table>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td>TOPLAM</td>
        <td class="item-price">${escapeHtml(formatMoney(total))}</td>
      </tr>
    </tfoot>
  </table>
  <div class="divider"></div>
  <div class="center footer">${escapeHtml(footer)}</div>
</body>
</html>`;
}
