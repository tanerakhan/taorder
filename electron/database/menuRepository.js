import { getDb } from '../database/db.js';

const MENU_SELECT = `
  SELECT mi.id, mi.name, mi.category_id, mi.price, mi.active, mi.created_at,
         c.name AS category_name, c.color AS category_color
  FROM menu_items mi
  INNER JOIN categories c ON c.id = mi.category_id
  WHERE mi.active = 1 AND c.active = 1
`;

export const menuRepository = {
  getAll() {
    return getDb()
      .prepare(`${MENU_SELECT} ORDER BY c.sort_order, c.name, mi.name`)
      .all();
  },

  getByCategoryId(categoryId) {
    return getDb()
      .prepare(`${MENU_SELECT} AND mi.category_id = ? ORDER BY mi.name`)
      .all(categoryId);
  },

  getById(id) {
    return getDb()
      .prepare(`${MENU_SELECT} AND mi.id = ?`)
      .get(id);
  },

  create({ name, categoryId, price }) {
    const result = getDb()
      .prepare('INSERT INTO menu_items (name, category_id, price) VALUES (?, ?, ?)')
      .run(name, categoryId, price);
    return this.getById(result.lastInsertRowid);
  },

  update(id, { name, categoryId, price }) {
    getDb()
      .prepare('UPDATE menu_items SET name = ?, category_id = ?, price = ? WHERE id = ?')
      .run(name, categoryId, price, id);
    return this.getById(id);
  },

  remove(id) {
    getDb().prepare('UPDATE menu_items SET active = 0 WHERE id = ?').run(id);
    return { success: true };
  },
};
