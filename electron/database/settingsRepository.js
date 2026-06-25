import { getDb } from './db.js';
import { DEFAULT_SETTINGS } from './settingsDefaults.js';

const CLEARABLE_KEYS = new Set(['print_device_name', 'print_escpos_host']);

export const settingsRepository = {
  getAll() {
    const rows = getDb().prepare('SELECT key, value FROM settings').all();
    const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...DEFAULT_SETTINGS, ...stored };
  },

  setMany(updates) {
    const db = getDb();
    const upsert = db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );

    const tx = db.transaction((entries) => {
      for (const [key, value] of entries) {
        if (!(key in DEFAULT_SETTINGS)) continue;
        const trimmed = String(value ?? '').trim();

        if (CLEARABLE_KEYS.has(key)) {
          if (trimmed) {
            upsert.run(key, trimmed);
          } else {
            db.prepare('DELETE FROM settings WHERE key = ?').run(key);
          }
          continue;
        }

        if (key === 'print_mode') {
          upsert.run(key, trimmed === 'escpos' ? 'escpos' : 'system');
          continue;
        }

        if (key === 'print_escpos_port') {
          upsert.run(key, trimmed || '9100');
          continue;
        }

        if (!trimmed) continue;
        upsert.run(key, trimmed);
      }
    });

    tx(Object.entries(updates));
    return this.getAll();
  },

  reset() {
    getDb().prepare('DELETE FROM settings').run();
    return this.getAll();
  },
};
