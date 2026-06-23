const { contextBridge, ipcRenderer } = require('electron');

const API_VERSION = '0.5.0';

contextBridge.exposeInMainWorld('taorder', {
  version: API_VERSION,
  app: {
    getDbPath: () => ipcRenderer.invoke('app:getDbPath'),
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    setMany: (updates) => ipcRenderer.invoke('settings:setMany', updates),
    reset: () => ipcRenderer.invoke('settings:reset'),
  },
  menu: {
    getAll: () => ipcRenderer.invoke('menu:getAll'),
    getByCategoryId: (categoryId) => ipcRenderer.invoke('menu:getByCategoryId', categoryId),
    create: (item) => ipcRenderer.invoke('menu:create', item),
    update: (id, item) => ipcRenderer.invoke('menu:update', id, item),
    remove: (id) => ipcRenderer.invoke('menu:remove', id),
  },
  categories: {
    getAll: () => ipcRenderer.invoke('categories:getAll'),
    create: (data) => ipcRenderer.invoke('categories:create', data),
    update: (id, data) => ipcRenderer.invoke('categories:update', id, data),
    remove: (id) => ipcRenderer.invoke('categories:remove', id),
  },
  tables: {
    getAll: () => ipcRenderer.invoke('tables:getAll'),
    getSummaries: () => ipcRenderer.invoke('tables:getSummaries'),
    getCount: () => ipcRenderer.invoke('tables:getCount'),
    setCount: (count) => ipcRenderer.invoke('tables:setCount', count),
    create: (table) => ipcRenderer.invoke('tables:create', table),
    update: (id, table) => ipcRenderer.invoke('tables:update', id, table),
    remove: (id) => ipcRenderer.invoke('tables:remove', id),
  },
  orders: {
    getOpenByTable: (tableId) => ipcRenderer.invoke('orders:getOpenByTable', tableId),
    getBill: (tableId) => ipcRenderer.invoke('orders:getBill', tableId),
    addItem: (tableId, menuItemId, quantity) =>
      ipcRenderer.invoke('orders:addItem', tableId, menuItemId, quantity),
    removeItem: (orderItemId) => ipcRenderer.invoke('orders:removeItem', orderItemId),
    updateItemQuantity: (orderItemId, quantity) =>
      ipcRenderer.invoke('orders:updateItemQuantity', orderItemId, quantity),
    close: (tableId) => ipcRenderer.invoke('orders:close', tableId),
  },
  print: {
    receipt: (data) => ipcRenderer.invoke('print:receipt', data),
    getReceiptHtml: (options) => ipcRenderer.invoke('print:getReceiptHtml', options),
    getPrinters: () => ipcRenderer.invoke('print:getPrinters'),
  },
});
