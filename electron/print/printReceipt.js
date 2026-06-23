import { BrowserWindow } from 'electron';
import { buildReceiptHtml } from './receiptHtml.js';
import { SAMPLE_RECEIPT } from './sampleReceipt.js';
import { settingsRepository } from '../database/settingsRepository.js';

function mergeSettings(overrides = {}) {
  return { ...settingsRepository.getAll(), ...overrides };
}

export function getReceiptHtml(receiptData, settingsOverride = {}) {
  const settings = mergeSettings(settingsOverride);
  const data = receiptData || SAMPLE_RECEIPT;
  return buildReceiptHtml(data, settings);
}

function isPrintCanceled(failureReason) {
  if (!failureReason) return true;
  return /cancel/i.test(failureReason);
}

export async function printReceipt(receiptData) {
  const html = getReceiptHtml(receiptData);
  const settings = mergeSettings();

  const printWin = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  try {
    await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const printOptions = {
      silent: false,
      printBackground: false,
      margins: { marginType: 'none' },
    };

    if (settings.print_device_name) {
      printOptions.deviceName = settings.print_device_name;
    }

    const result = await new Promise((resolve) => {
      printWin.webContents.print(printOptions, (printed, failureReason) => {
        resolve({
          success: printed,
          canceled: !printed && isPrintCanceled(failureReason),
          failureReason: failureReason || null,
        });
      });
    });

    if (!result.success && !result.canceled) {
      throw new Error(result.failureReason || 'Yazdırma başarısız');
    }

    return result;
  } finally {
    if (!printWin.isDestroyed()) {
      printWin.close();
    }
  }
}

export async function getAvailablePrinters(mainWindow) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return [];
  }
  const printers = await mainWindow.webContents.getPrintersAsync();
  return printers.map((p) => ({
    name: p.name,
    isDefault: p.isDefault,
    status: p.status,
  }));
}
