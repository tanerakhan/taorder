import { ipcMain } from 'electron';
import { categoryRepository } from '../database/categoryRepository.js';
import { menuRepository } from '../database/menuRepository.js';
import { tableRepository } from '../database/tableRepository.js';
import { orderRepository } from '../database/orderRepository.js';
import { getDatabasePath } from '../database/db.js';
import { settingsRepository } from '../database/settingsRepository.js';
import { getMainWindow } from '../appState.js';
import { printReceipt, getAvailablePrinters, getReceiptHtml } from '../print/printReceipt.js';

export function registerIpcHandlers() {
  // Sistem
  ipcMain.handle('app:getDbPath', () => getDatabasePath());

  // Ayarlar
  ipcMain.handle('settings:getAll', () => settingsRepository.getAll());
  ipcMain.handle('settings:setMany', (_, updates) => settingsRepository.setMany(updates));
  ipcMain.handle('settings:reset', () => settingsRepository.reset());

  // Yazdırma
  ipcMain.handle('print:receipt', (_, receiptData) => printReceipt(receiptData));
  ipcMain.handle('print:getReceiptHtml', (_, { receiptData, settingsOverride } = {}) =>
    getReceiptHtml(receiptData, settingsOverride)
  );
  ipcMain.handle('print:getPrinters', () => getAvailablePrinters(getMainWindow()));

  // Menü
  ipcMain.handle('menu:getAll', () => menuRepository.getAll());
  ipcMain.handle('menu:getByCategoryId', (_, categoryId) =>
    menuRepository.getByCategoryId(categoryId)
  );
  ipcMain.handle('menu:create', (_, item) => menuRepository.create(item));
  ipcMain.handle('menu:update', (_, id, item) => menuRepository.update(id, item));
  ipcMain.handle('menu:remove', (_, id) => menuRepository.remove(id));

  // Kategoriler
  ipcMain.handle('categories:getAll', () => categoryRepository.getAll());
  ipcMain.handle('categories:create', (_, data) => categoryRepository.create(data));
  ipcMain.handle('categories:update', (_, id, data) => categoryRepository.update(id, data));
  ipcMain.handle('categories:remove', (_, id) => categoryRepository.remove(id));

  // Masalar (içerik yönetimi)
  ipcMain.handle('tables:getAll', () => tableRepository.getAll());
  ipcMain.handle('tables:getCount', () => tableRepository.getCount());
  ipcMain.handle('tables:setCount', (_, count) => tableRepository.setCount(count));
  ipcMain.handle('tables:create', (_, table) => tableRepository.create(table));
  ipcMain.handle('tables:update', (_, id, table) => tableRepository.update(id, table));
  ipcMain.handle('tables:remove', (_, id) => tableRepository.remove(id));
  ipcMain.handle('tables:getSummaries', () => orderRepository.getTableSummaries());

  // Sipariş / Adisyon
  ipcMain.handle('orders:getOpenByTable', (_, tableId) => orderRepository.getBill(tableId));
  ipcMain.handle('orders:getBill', (_, tableId) => orderRepository.getBill(tableId));
  ipcMain.handle('orders:addItem', (_, tableId, menuItemId, quantity) =>
    orderRepository.addItem(tableId, menuItemId, quantity)
  );
  ipcMain.handle('orders:removeItem', (_, orderItemId) => orderRepository.removeItem(orderItemId));
  ipcMain.handle('orders:updateItemQuantity', (_, orderItemId, quantity) =>
    orderRepository.updateItemQuantity(orderItemId, quantity)
  );
  ipcMain.handle('orders:close', (_, tableId) => orderRepository.closeOrder(tableId));
}
