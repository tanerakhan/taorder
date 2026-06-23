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

export default function SettingsPage({ onShowToast }) {
  const { settings, saveSettings, resetSettings, getNavLabel, error, loadSettings } = useSettings();
  const [form, setForm] = useState({ ...DEFAULT_SETTINGS });
  const [dbPath, setDbPath] = useState('');
  const [printers, setPrinters] = useState([]);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  useEffect(() => {
    getTaorder()
      .app.getDbPath()
      .then(setDbPath)
      .catch(() => {});

    getTaorder()
      .print.getPrinters()
      .then(setPrinters)
      .catch(() => {});
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
    if (!confirm('Tüm ayarlar varsayılana dönsün mü?')) return;
    try {
      const data = await resetSettings();
      setForm({ ...data });
      onShowToast('Varsayılan ayarlar yüklendi');
    } catch (err) {
      onShowToast(err.message || 'Sıfırlama başarısız', 'error');
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
            Sekme isimleri, fiş içeriği ve yazıcı ayarlarını düzenleyin.
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
          <h3 className="card-title">Görünüm İsimleri</h3>
          {NAV_KEYS.map((key) => renderField(key))}

          <h3 className="card-title settings-section-title">Fiş / Yazıcı</h3>
          {RECEIPT_KEYS.map((key) => renderField(key, { maxLength: 60 }))}

          <label className="field-label">
            {SETTINGS_LABELS.print_device_name}
            <select
              value={form.print_device_name || ''}
              onChange={(e) => handleChange('print_device_name', e.target.value)}
            >
              <option value="">Sistem varsayılanı</option>
              {printers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                  {p.isDefault ? ' (varsayılan)' : ''}
                </option>
              ))}
            </select>
          </label>
          <p className="hint">Termal veya normal yazıcı seçin. 80mm fiş formatına uygundur.</p>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Kaydet
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleReset}>
              Varsayılana Dön
            </button>
          </div>
        </form>

        <ReceiptPreview html={previewHtml} title="Fiş Önizleme (örnek)" />
      </div>

      {dbPath && (
        <p className="settings-db-hint">
          Veritabanı konumu: <code>{dbPath}</code>
        </p>
      )}
    </div>
  );
}
