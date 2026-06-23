import { getDb } from '../database/db.js';

export const tableRepository = {
  getAll() {
    return getDb()
      .prepare('SELECT * FROM tables WHERE active = 1 ORDER BY number')
      .all();
  },

  getById(id) {
    return getDb().prepare('SELECT * FROM tables WHERE id = ?').get(id);
  },

  getCount() {
    return getDb().prepare('SELECT COUNT(*) as count FROM tables WHERE active = 1').get().count;
  },

  create({ number, label }) {
    const result = getDb()
      .prepare('INSERT INTO tables (number, label) VALUES (?, ?)')
      .run(number, label || `Masa ${number}`);
    return this.getById(result.lastInsertRowid);
  },

  update(id, { number, label }) {
    getDb()
      .prepare('UPDATE tables SET number = ?, label = ? WHERE id = ?')
      .run(number, label, id);
    return this.getById(id);
  },

  remove(id) {
    getDb().prepare('UPDATE tables SET active = 0 WHERE id = ?').run(id);
    return { success: true };
  },

  setCount(targetCount) {
    if (targetCount < 1 || targetCount > 99) {
      throw new Error('Masa sayısı 1 ile 99 arasında olmalıdır');
    }

    const db = getDb();
    const all = db.prepare('SELECT * FROM tables ORDER BY number').all();

    for (let n = 1; n <= targetCount; n++) {
      const existing = all.find((t) => t.number === n);
      if (!existing) {
        db.prepare('INSERT INTO tables (number, label) VALUES (?, ?)').run(n, `Masa ${n}`);
      } else if (!existing.active) {
        db.prepare('UPDATE tables SET active = 1, label = ? WHERE id = ?').run(`Masa ${n}`, existing.id);
      }
    }

    for (const table of all) {
      if (table.number > targetCount && table.active) {
        db.prepare('UPDATE tables SET active = 0 WHERE id = ?').run(table.id);
      }
    }

    return this.getAll();
  },
};
