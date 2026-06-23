import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('food', 'drink')),
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
  { name: 'Izgara Köfte', category: 'food', price: 280 },
  { name: 'Tavuk Şiş', category: 'food', price: 240 },
  { name: 'Mercimek Çorbası', category: 'food', price: 90 },
  { name: 'Pide', category: 'food', price: 150 },
  { name: 'Salata', category: 'food', price: 80 },
  { name: 'Ayran', category: 'drink', price: 40 },
  { name: 'Kola', category: 'drink', price: 50 },
  { name: 'Su', category: 'drink', price: 20 },
  { name: 'Çay', category: 'drink', price: 25 },
  { name: 'Türk Kahvesi', category: 'drink', price: 60 },
];

function getDbPath() {
  const userData = app.getPath('userData');
  if (!fs.existsSync(userData)) {
    fs.mkdirSync(userData, { recursive: true });
  }
  return path.join(userData, 'taorder.db');
}

function seedIfEmpty(database) {
  const menuCount = database.prepare('SELECT COUNT(*) as count FROM menu_items').get();
  if (menuCount.count === 0) {
    const insertMenu = database.prepare(
      'INSERT INTO menu_items (name, category, price) VALUES (@name, @category, @price)'
    );
    for (const item of SEED_MENU) {
      insertMenu.run(item);
    }
  }

  const tableCount = database.prepare('SELECT COUNT(*) as count FROM tables').get();
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
