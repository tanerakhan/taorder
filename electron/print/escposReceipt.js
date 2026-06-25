import { createRequire } from 'node:module';
import { sendRawToWindowsPrinter } from './winRawPrint.js';
import { SAMPLE_RECEIPT } from './sampleReceipt.js';
import { settingsRepository } from '../database/settingsRepository.js';

const require = createRequire(import.meta.url);
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');

function formatMoney(amount) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function resolveEscPosTarget(settings) {
  const host = String(settings.print_escpos_host || '').trim();
  const port = String(settings.print_escpos_port || '9100').trim() || '9100';
  const deviceName = String(settings.print_device_name || '').trim();

  if (host) {
    return { method: 'tcp', interface: `tcp://${host}:${port}` };
  }

  if (deviceName && /^\\\\|^\/\//.test(deviceName)) {
    return { method: 'file', interface: deviceName.replace(/\\/g, '/') };
  }

  if (deviceName && process.platform === 'win32') {
    return {
      method: 'windows-raw',
      interface: 'tcp://127.0.0.1:1',
      printerName: deviceName,
    };
  }

  if (deviceName) {
    throw new Error(
      'Mac/Linux icin ESC/POS ag baglantisi (IP:9100) kullanin veya paylasim yolu girin (//localhost/PaylasimAdi)'
    );
  }

  throw new Error(
    'ESC/POS yazici yapilandirilmadi. Ethernet icin yazici IP adresini (9100) veya USB icin Windows yazici adini girin.'
  );
}

function createPrinter(settings) {
  const target = resolveEscPosTarget(settings);

  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: target.interface,
    width: 48,
    characterSet: CharacterSet.PC857_TURKISH,
    removeSpecialCharacters: false,
    options: { timeout: 8000 },
  });

  return { printer, target };
}

function fillReceipt(printer, receiptData, settings) {
  const businessName = settings.receipt_business_name || settings.app_title || 'TaOrder';
  const footer = settings.receipt_footer || 'Afiyet olsun';
  const data = receiptData || SAMPLE_RECEIPT;
  const now = formatDateTime(new Date());

  printer.alignCenter();
  printer.bold(true);
  printer.setTextDoubleHeight();
  printer.println(businessName);
  printer.setTextNormal();
  printer.bold(false);

  printer.println(data.tableLabel || `Masa ${data.tableNumber}`);
  printer.println(`${now}${data.orderId ? ` · #${data.orderId}` : ''}`);
  printer.drawLine();

  printer.alignLeft();
  for (const item of data.items || []) {
    const line = `${item.quantity}x ${item.name}`;
    printer.leftRight(line, formatMoney(item.lineTotal));
  }

  printer.drawLine();
  printer.bold(true);
  printer.leftRight('TOPLAM', formatMoney(data.total));
  printer.bold(false);
  printer.drawLine();

  printer.alignCenter();
  printer.println(footer);
  printer.newLine();
  printer.cut();
}

export async function printEscPosReceipt(receiptData, settings = settingsRepository.getAll()) {
  const { printer, target } = createPrinter(settings);
  fillReceipt(printer, receiptData, settings);

  if (target.method === 'windows-raw') {
    await sendRawToWindowsPrinter(target.printerName, printer.getBuffer());
    return { success: true, mode: 'escpos', method: target.method };
  }

  await printer.execute();
  return { success: true, mode: 'escpos', method: target.method };
}

export async function testEscPosConnection(settings = settingsRepository.getAll()) {
  const testReceipt = {
    tableLabel: 'Test Masa',
    tableNumber: 0,
    orderId: null,
    total: 0,
    items: [{ name: 'TaOrder test baskisi', quantity: 1, lineTotal: 0 }],
  };

  return printEscPosReceipt(testReceipt, settings);
}
