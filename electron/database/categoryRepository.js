import { getDb } from './db.js';
import {
  DEFAULT_CATEGORY_COLOR,
  normalizeCategoryColor,
  pickCategoryColor,
} from './categoryColors.js';

function resolveColor(database, color) {
  const normalized = normalizeCategoryColor(color);
  if (normalized) return normalized;
  const count = database.prepare('SELECT COUNT(*) AS count FROM categories').get().count;
  return pickCategoryColor(count);
}

export const categoryRepository = {
  getAll() {
    return getDb()
      .prepare(
        `SELECT c.*,
          (SELECT COUNT(*) FROM menu_items mi WHERE mi.category_id = c.id AND mi.active = 1) AS item_count
         FROM categories c
         WHERE c.active = 1
         ORDER BY c.sort_order, c.name`
      )
      .all();
  },

  getById(id) {
    return getDb().prepare('SELECT * FROM categories WHERE id = ?').get(id);
  },

  create({ name, color }) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Kategori adı boş olamaz');
    }
    const db = getDb();
    const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM categories').get();
    const resolvedColor = resolveColor(db, color);
    try {
      const result = db
        .prepare('INSERT INTO categories (name, sort_order, color) VALUES (?, ?, ?)')
        .run(trimmed, maxOrder.max_order + 1, resolvedColor);
      return this.getById(result.lastInsertRowid);
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Bu isimde bir kategori zaten var');
      }
      throw err;
    }
  },

  update(id, { name, color }) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Kategori adı boş olamaz');
    }
    const resolvedColor = normalizeCategoryColor(color) || DEFAULT_CATEGORY_COLOR;
    try {
      getDb()
        .prepare('UPDATE categories SET name = ?, color = ? WHERE id = ? AND active = 1')
        .run(trimmed, resolvedColor, id);
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Bu isimde bir kategori zaten var');
      }
      throw err;
    }
    return this.getById(id);
  },

  remove(id) {
    const itemCount = getDb()
      .prepare('SELECT COUNT(*) AS count FROM menu_items WHERE category_id = ? AND active = 1')
      .get(id);
    if (itemCount.count > 0) {
      throw new Error('Bu kategoride menü öğesi var. Önce öğeleri silin veya başka kategoriye taşıyın.');
    }
    getDb().prepare('UPDATE categories SET active = 0 WHERE id = ?').run(id);
    return { success: true };
  },
};
