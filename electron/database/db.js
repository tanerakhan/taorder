import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import {
  DEFAULT_CATEGORY_COLOR,
  pickCategoryColor,
  SEED_CATEGORY_COLORS,
} from './categoryColors.js';

let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#4f8cff',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  price REAL NOT NULL CHECK(price >= 0),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number INTEGER NOT NULL UNIQUE,
  label TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id INTEGER NOT NULL REFERENCES tables(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed')),
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
  unit_price REAL NOT NULL,
  added_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_table_status ON orders(table_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

const SEED_MENU = [
  { name: 'Izgara Köfte', categoryKey: 'food', price: 280 },
  { name: 'Tavuk Şiş', categoryKey: 'food', price: 240 },
  { name: 'Mercimek Çorbası', categoryKey: 'food', price: 90 },
  { name: 'Pide', categoryKey: 'food', price: 150 },
  { name: 'Salata', categoryKey: 'food', price: 80 },
  { name: 'Ayran', categoryKey: 'drink', price: 40 },
  { name: 'Kola', categoryKey: 'drink', price: 50 },
  { name: 'Su', categoryKey: 'drink', price: 20 },
  { name: 'Çay', categoryKey: 'drink', price: 25 },
  { name: 'Türk Kahvesi', categoryKey: 'drink', price: 60 },
];

function getDbPath() {
  const userData = app.getPath('userData');
  if (!fs.existsSync(userData)) {
    fs.mkdirSync(userData, { recursive: true });
  }
  return path.join(userData, 'taorder.db');
}

function tableExists(database, name) {
  return Boolean(
    database.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name)
  );
}

function getColumnNames(database, table) {
  return database.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
}

function ensureDefaultCategories(database) {
  const count = database.prepare('SELECT COUNT(*) AS count FROM categories').get();
  if (count.count > 0) return;

  database.prepare('INSERT INTO categories (name, sort_order, color) VALUES (?, ?, ?)').run(
    'Yemek',
    0,
    SEED_CATEGORY_COLORS.Yemek
  );
  database.prepare('INSERT INTO categories (name, sort_order, color) VALUES (?, ?, ?)').run(
    'İçecek',
    1,
    SEED_CATEGORY_COLORS.İçecek
  );
}

function ensureCategoryColorColumn(database) {
  const cols = getColumnNames(database, 'categories');
  if (!cols.includes('color')) {
    database.exec(
      `ALTER TABLE categories ADD COLUMN color TEXT NOT NULL DEFAULT '${DEFAULT_CATEGORY_COLOR}'`
    );
    database
      .prepare("UPDATE categories SET color = ? WHERE name = 'Yemek'")
      .run(SEED_CATEGORY_COLORS.Yemek);
    database
      .prepare("UPDATE categories SET color = ? WHERE name = 'İçecek'")
      .run(SEED_CATEGORY_COLORS.İçecek);
    const others = database
      .prepare("SELECT id FROM categories WHERE name NOT IN ('Yemek', 'İçecek') ORDER BY sort_order, id")
      .all();
    others.forEach((row, index) => {
      database
        .prepare('UPDATE categories SET color = ? WHERE id = ?')
        .run(pickCategoryColor(index + 2), row.id);
    });
  }
}

function getDefaultCategoryIds(database) {
  ensureDefaultCategories(database);
  const foodCat = database.prepare("SELECT id FROM categories WHERE name = 'Yemek'").get();
  const drinkCat = database.prepare("SELECT id FROM categories WHERE name = 'İçecek'").get();
  if (!foodCat || !drinkCat) {
    throw new Error('Varsayılan kategoriler oluşturulamadı');
  }
  return { foodId: foodCat.id, drinkId: drinkCat.id };
}

function assignLegacyCategoryIds(database) {
  const { foodId, drinkId } = getDefaultCategoryIds(database);
  database
    .prepare("UPDATE menu_items SET category_id = ? WHERE category = 'food'")
    .run(foodId);
  database
    .prepare("UPDATE menu_items SET category_id = ? WHERE category = 'drink'")
    .run(drinkId);
  database
    .prepare('UPDATE menu_items SET category_id = ? WHERE category_id IS NULL')
    .run(foodId);
}

function rebuildMenuItemsWithoutLegacyColumn(database) {
  database.pragma('foreign_keys = OFF');
  try {
    database.exec('DROP TABLE IF EXISTS menu_items_new');
    database.exec(`
      CREATE TABLE menu_items_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        price REAL NOT NULL CHECK(price >= 0),
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO menu_items_new (id, name, category_id, price, active, created_at)
        SELECT id, name, category_id, price, active, created_at FROM menu_items;
      DROP TABLE menu_items;
      ALTER TABLE menu_items_new RENAME TO menu_items;
    `);
  } finally {
    database.pragma('foreign_keys = ON');
  }
}

function runMigrations(database) {
  if (!tableExists(database, 'categories')) {
    database.exec(`
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL DEFAULT '#4f8cff',
        sort_order INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    ensureDefaultCategories(database);
  }

  // Önceki başarısız migrate artığı
  if (tableExists(database, 'menu_items_new')) {
    database.exec('DROP TABLE IF EXISTS menu_items_new');
  }

  const menuColumns = getColumnNames(database, 'menu_items');
  const hasLegacyCategory = menuColumns.includes('category');
  const hasCategoryId = menuColumns.includes('category_id');

  if (hasLegacyCategory && !hasCategoryId) {
    database.exec('ALTER TABLE menu_items ADD COLUMN category_id INTEGER REFERENCES categories(id)');
    assignLegacyCategoryIds(database);
    rebuildMenuItemsWithoutLegacyColumn(database);
  } else if (hasLegacyCategory && hasCategoryId) {
    assignLegacyCategoryIds(database);
    rebuildMenuItemsWithoutLegacyColumn(database);
  }

  ensureCategoryColorColumn(database);
}

function ensureMenuCategoryIndex(database) {
  const menuColumns = getColumnNames(database, 'menu_items');
  if (menuColumns.includes('category_id')) {
    database.exec(
      'CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id)'
    );
  }
}

function seedIfEmpty(database) {
  ensureDefaultCategories(database);

  const menuCount = database.prepare('SELECT COUNT(*) AS count FROM menu_items').get();
  if (menuCount.count === 0) {
    const foodCat = database.prepare("SELECT id FROM categories WHERE name = 'Yemek'").get();
    const drinkCat = database.prepare("SELECT id FROM categories WHERE name = 'İçecek'").get();
    const insertMenu = database.prepare(
      'INSERT INTO menu_items (name, category_id, price) VALUES (@name, @category_id, @price)'
    );
    for (const item of SEED_MENU) {
      insertMenu.run({
        name: item.name,
        category_id: item.categoryKey === 'food' ? foodCat.id : drinkCat.id,
        price: item.price,
      });
    }
  }

  const tableCount = database.prepare('SELECT COUNT(*) AS count FROM tables').get();
  if (tableCount.count === 0) {
    const insertTable = database.prepare('INSERT INTO tables (number, label) VALUES (?, ?)');
    for (let i = 1; i <= 8; i++) {
      insertTable.run(i, `Masa ${i}`);
    }
  }
}

export function initDatabase() {
  const dbPath = getDbPath();
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  runMigrations(db);
  ensureMenuCategoryIndex(db);
  seedIfEmpty(db);
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Veritabanı henüz başlatılmadı');
  }
  return db;
}

export function getDatabasePath() {
  return getDbPath();
}
