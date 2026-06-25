import { BrowserWindow } from 'electron';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function getElectronPrinters(window) {
  const printers = await window.webContents.getPrintersAsync();
  return printers.map((p) => ({
    name: p.name,
    isDefault: Boolean(p.isDefault),
    status: p.status,
    source: 'electron',
  }));
}

async function getWindowsPrintersFromPowerShell() {
  if (process.platform !== 'win32') {
    return [];
  }

  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        'Get-Printer | Select-Object -ExpandProperty Name',
      ],
      { timeout: 15000, windowsHide: true }
    );

    return stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        isDefault: false,
        status: 0,
        source: 'powershell',
      }));
  } catch {
    return [];
  }
}

function mergePrinterLists(...lists) {
  const byName = new Map();

  for (const list of lists) {
    for (const printer of list) {
      const existing = byName.get(printer.name);
      if (!existing) {
        byName.set(printer.name, { ...printer });
      } else if (printer.isDefault) {
        existing.isDefault = true;
      }
    }
  }

  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })
  );
}

export async function getAvailablePrinters(mainWindow) {
  let tempWindow = null;
  let window = mainWindow;

  if (!window || window.isDestroyed()) {
    tempWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    window = tempWindow;
  }

  try {
    const electronPrinters = await getElectronPrinters(window);
    const windowsPrinters = await getWindowsPrintersFromPowerShell();
    return mergePrinterLists(electronPrinters, windowsPrinters);
  } finally {
    if (tempWindow && !tempWindow.isDestroyed()) {
      tempWindow.close();
    }
  }
}
