import { getDb } from './db.js';
import { DEFAULT_SETTINGS } from './settingsDefaults.js';

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

        if (key === 'print_device_name') {
          if (trimmed) {
            upsert.run(key, trimmed);
          } else {
            db.prepare('DELETE FROM settings WHERE key = ?').run(key);
          }
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
