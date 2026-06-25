import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, SETTINGS_LABELS } from '../constants/settingsDefaults';
import { useSettings } from '../contexts/SettingsContext';
import { VIEWS } from '../constants/views';
import { getTaorder } from '../utils/taorder';
import ReceiptPreview from '../components/ReceiptPreview';
import './SettingsPage.css';

const NAV_KEYS = [
  'app_title',
  'nav_menuList',
  'nav_menuAdd',
  'nav_tables',
  'nav_orders',
  'nav_settings',
];

const RECEIPT_KEYS = ['receipt_business_name', 'receipt_footer'];

const PRINT_MODES = [
  {
    value: 'escpos',
    label: 'ESC/POS termal (Xprinter XP-Q80A — onerilen)',
  },
  {
    value: 'system',
    label: 'Windows yazicisi (HTML / surucu uzerinden)',
  },
];

export default function SettingsPage({ onShowToast }) {
  const { settings, saveSettings, resetSettings, getNavLabel, error, loadSettings } = useSettings();
  const [form, setForm] = useState({ ...DEFAULT_SETTINGS });
  const [dbPath, setDbPath] = useState('');
  const [printers, setPrinters] = useState([]);
  const [previewHtml, setPreviewHtml] = useState('');
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [testingPrint, setTestingPrint] = useState(false);

  const isEscPos = form.print_mode === 'escpos';

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  useEffect(() => {
    getTaorder()
      .app.getDbPath()
      .then(setDbPath)
      .catch(() => {});

    loadPrinters();
  }, []);

  useEffect(() => {
    let active = true;
    getTaorder()
      .print.getReceiptHtml({
        settingsOverride: {
          app_title: form.app_title,
          receipt_business_name: form.receipt_business_name,
          receipt_footer: form.receipt_footer,
        },
      })
      .then((html) => {
        if (active) setPreviewHtml(html);
      })
      .catch(() => {
        if (active) setPreviewHtml('');
      });
    return () => {
      active = false;
    };
  }, [form.app_title, form.receipt_business_name, form.receipt_footer]);

  async function loadPrinters() {
    setLoadingPrinters(true);
    try {
      const list = await getTaorder().print.getPrinters();
      setPrinters(list);
    } catch {
      setPrinters([]);
    } finally {
      setLoadingPrinters(false);
    }
  }

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await saveSettings(form);
      onShowToast('Ayarlar kaydedildi');
    } catch (err) {
      onShowToast(err.message || 'Ayarlar kaydedilemedi', 'error');
    }
  }

  async function handleReset() {
    if (!confirm('Tum ayarlar varsayilana donsun mu?')) return;
    try {
      const data = await resetSettings();
      setForm({ ...data });
      onShowToast('Varsayilan ayarlar yuklendi');
    } catch (err) {
      onShowToast(err.message || 'Sifirlama basarisiz', 'error');
    }
  }

  async function handleTestPrint() {
    setTestingPrint(true);
    try {
      await saveSettings(form);
      const result = await getTaorder().print.test({ settingsOverride: form });
      if (result.canceled) {
        onShowToast('Yazdirma iptal edildi');
      } else {
        onShowToast('Test baskisi gonderildi');
      }
    } catch (err) {
      onShowToast(err.message || 'Test baskisi basarisiz', 'error');
    } finally {
      setTestingPrint(false);
    }
  }

  function renderField(key, { required = true, maxLength = 40 } = {}) {
    return (
      <label key={key} className="field-label">
        {SETTINGS_LABELS[key]}
        <input
          type="text"
          value={form[key] || ''}
          onChange={(e) => handleChange(key, e.target.value)}
          required={required}
          maxLength={maxLength}
        />
      </label>
    );
  }

  return (
    <div className="content-page settings-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">{getNavLabel(VIEWS.settings)}</h2>
          <p className="page-desc">
            Sekme isimleri, fis icerigi ve yazici ayarlarini duzenleyin.
          </p>
        </div>
      </header>

      {error && (
        <div className="settings-api-error">
          {error}
          <button type="button" className="btn btn-ghost btn-sm" onClick={loadSettings}>
            Yeniden dene
          </button>
        </div>
      )}

      <div className="settings-layout">
        <form onSubmit={handleSubmit} className="card settings-form">
          <h3 className="card-title">Gorunum Isimleri</h3>
          {NAV_KEYS.map((key) => renderField(key))}

          <h3 className="card-title settings-section-title">Fis / Yazici</h3>
          {RECEIPT_KEYS.map((key) => renderField(key, { maxLength: 60 }))}

          <label className="field-label">
            {SETTINGS_LABELS.print_mode}
            <select
              value={form.print_mode || 'system'}
              onChange={(e) => handleChange('print_mode', e.target.value)}
            >
              {PRINT_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>

          {isEscPos ? (
            <>
              <div className="settings-printer-help">
                <strong>Xprinter XP-Q80A</strong> cogu kurulumda Windows listesinde gorunmez; Xprinter
                uygulamasi dogrudan ESC/POS kullanir. Asagidaki yontemlerden birini secin:
              </div>

              <label className="field-label">
                {SETTINGS_LABELS.print_escpos_host}
                <input
                  type="text"
                  value={form.print_escpos_host || ''}
                  onChange={(e) => handleChange('print_escpos_host', e.target.value)}
                  placeholder="Ornek: 192.168.1.100"
                  maxLength={64}
                />
              </label>
              <p className="hint">
                Ethernet kullaniyorsaniz yazicinin IP adresini girin (port genelde 9100). En guvenilir
                yontem budur.
              </p>

              <label className="field-label">
                {SETTINGS_LABELS.print_escpos_port}
                <input
                  type="text"
                  value={form.print_escpos_port || '9100'}
                  onChange={(e) => handleChange('print_escpos_port', e.target.value)}
                  placeholder="9100"
                  maxLength={8}
                />
              </label>

              <label className="field-label">
                USB — Windows yazici adi veya paylasim yolu
                <div className="settings-printer-row">
                  <select
                    value={form.print_device_name || ''}
                    onChange={(e) => handleChange('print_device_name', e.target.value)}
                  >
                    <option value="">Listeden sec veya asagiya yaz</option>
                    {printers.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                        {p.isDefault ? ' (varsayilan)' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={loadPrinters}
                    disabled={loadingPrinters}
                  >
                    {loadingPrinters ? '...' : 'Yenile'}
                  </button>
                </div>
                <input
                  type="text"
                  value={form.print_device_name || ''}
                  onChange={(e) => handleChange('print_device_name', e.target.value)}
                  placeholder="Ornek: XP-80C veya //localhost/XP80"
                  maxLength={120}
                />
              </label>
              <p className="hint">
                IP bos birakilirsa USB kullanilir. Yazici Windows&apos;ta paylasildiysa{' '}
                <code>//localhost/PaylasimAdi</code> yazin. Tam ad icin: Ayarlar → Bluetooth ve
                cihazlar → Yazicilar.
              </p>
            </>
          ) : (
            <>
              <label className="field-label">
                {SETTINGS_LABELS.print_device_name}
                <div className="settings-printer-row">
                  <select
                    value={form.print_device_name || ''}
                    onChange={(e) => handleChange('print_device_name', e.target.value)}
                  >
                    <option value="">Sistem varsayilani</option>
                    {printers.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                        {p.isDefault ? ' (varsayilan)' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={loadPrinters}
                    disabled={loadingPrinters}
                  >
                    {loadingPrinters ? '...' : 'Yenile'}
                  </button>
                </div>
                <input
                  type="text"
                  value={form.print_device_name || ''}
                  onChange={(e) => handleChange('print_device_name', e.target.value)}
                  placeholder="Listede yoksa Windows yazici adini elle yazin"
                  maxLength={120}
                />
              </label>
              <p className="hint">80mm termal fis formatina uygundur. Xprinter icin ESC/POS modunu deneyin.</p>
            </>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Kaydet
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleTestPrint}
              disabled={testingPrint}
            >
              {testingPrint ? 'Gonderiliyor...' : 'Test Baskisi'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleReset}>
              Varsayilana Don
            </button>
          </div>
        </form>

        <ReceiptPreview html={previewHtml} title="Fis Onizleme (ornek)" />
      </div>

      {dbPath && (
        <p className="settings-db-hint">
          Veritabani konumu: <code>{dbPath}</code>
        </p>
      )}
    </div>
  );
}
