import { getDb } from '../database/db.js';
import { menuRepository } from './menuRepository.js';

export const orderRepository = {
  getOpenOrder(tableId) {
    return getDb()
      .prepare("SELECT * FROM orders WHERE table_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1")
      .get(tableId);
  },

  getOrCreateOpenOrder(tableId) {
    let order = this.getOpenOrder(tableId);
    if (!order) {
      const result = getDb()
        .prepare("INSERT INTO orders (table_id, status) VALUES (?, 'open')")
        .run(tableId);
      order = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    }
    return order;
  },

  getOrderItems(orderId) {
    return getDb()
      .prepare(
        `SELECT oi.*, mi.name, mi.category_id, c.name AS category_name
         FROM order_items oi
         JOIN menu_items mi ON mi.id = oi.menu_item_id
         JOIN categories c ON c.id = mi.category_id
         WHERE oi.order_id = ?
         ORDER BY oi.added_at`
      )
      .all(orderId);
  },

  getBill(tableId) {
    const order = this.getOpenOrder(tableId);
    if (!order) {
      return { order: null, items: [], total: 0 };
    }

    const items = this.getOrderItems(order.id);
    const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    return { order, items, total };
  },

  addItem(tableId, menuItemId, quantity = 1) {
    const menuItem = menuRepository.getById(menuItemId);
    if (!menuItem || !menuItem.active) {
      throw new Error('Menü öğesi bulunamadı');
    }

    const order = this.getOrCreateOpenOrder(tableId);
    const result = getDb()
      .prepare(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
      )
      .run(order.id, menuItemId, quantity, menuItem.price);

    return getDb()
      .prepare(
        `SELECT oi.*, mi.name, mi.category_id, c.name AS category_name
         FROM order_items oi
         JOIN menu_items mi ON mi.id = oi.menu_item_id
         JOIN categories c ON c.id = mi.category_id
         WHERE oi.id = ?`
      )
      .get(result.lastInsertRowid);
  },

  removeItem(orderItemId) {
    getDb().prepare('DELETE FROM order_items WHERE id = ?').run(orderItemId);
    return { success: true };
  },

  updateItemQuantity(orderItemId, quantity) {
    if (quantity <= 0) {
      return this.removeItem(orderItemId);
    }
    getDb().prepare('UPDATE order_items SET quantity = ? WHERE id = ?').run(quantity, orderItemId);
    return getDb()
      .prepare(
        `SELECT oi.*, mi.name, mi.category_id, c.name AS category_name
         FROM order_items oi
         JOIN menu_items mi ON mi.id = oi.menu_item_id
         JOIN categories c ON c.id = mi.category_id
         WHERE oi.id = ?`
      )
      .get(orderItemId);
  },

  closeOrder(tableId) {
    const order = this.getOpenOrder(tableId);
    if (!order) {
      return { success: false, message: 'Açık adisyon yok' };
    }

    getDb()
      .prepare("UPDATE orders SET status = 'closed', closed_at = datetime('now') WHERE id = ?")
      .run(order.id);

    return { success: true, orderId: order.id };
  },

  getTableSummaries() {
    const tables = getDb()
      .prepare('SELECT * FROM tables WHERE active = 1 ORDER BY number')
      .all();

    return tables.map((table) => {
      const bill = this.getBill(table.id);
      return {
        ...table,
        itemCount: bill.items.reduce((sum, i) => sum + i.quantity, 0),
        total: bill.total,
        hasOpenOrder: bill.order !== null && bill.items.length > 0,
      };
    });
  },
};
