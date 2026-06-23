import { getDb } from '../database/db.js';

export const menuRepository = {
  getAll() {
    return getDb()
      .prepare('SELECT * FROM menu_items WHERE active = 1 ORDER BY category, name')
      .all();
  },

  getByCategory(category) {
    return getDb()
      .prepare('SELECT * FROM menu_items WHERE active = 1 AND category = ? ORDER BY name')
      .all(category);
  },

  getById(id) {
    return getDb().prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  },

  create({ name, category, price }) {
    const result = getDb()
      .prepare('INSERT INTO menu_items (name, category, price) VALUES (?, ?, ?)')
      .run(name, category, price);
    return this.getById(result.lastInsertRowid);
  },

  update(id, { name, category, price }) {
    getDb()
      .prepare('UPDATE menu_items SET name = ?, category = ?, price = ? WHERE id = ?')
      .run(name, category, price, id);
    return this.getById(id);
  },

  remove(id) {
    getDb().prepare('UPDATE menu_items SET active = 0 WHERE id = ?').run(id);
    return { success: true };
  },
};
