import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(__dirname, 'scripts', 'send-raw.ps1');

export async function sendRawToWindowsPrinter(printerName, buffer) {
  if (process.platform !== 'win32') {
    throw new Error('Ham yazdirma yalnizca Windows uzerinde desteklenir');
  }

  const trimmedName = String(printerName || '').trim();
  if (!trimmedName) {
    throw new Error('Windows yazici adi bos');
  }

  const dataFile = path.join(
    process.env.TEMP || process.env.TMP || '.',
    `taorder-raw-${randomBytes(8).toString('hex')}.bin`
  );

  try {
    await writeFile(dataFile, buffer);
    await execFileAsync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        SCRIPT_PATH,
        '-PrinterName',
        trimmedName,
        '-DataFile',
        dataFile,
      ],
      { timeout: 30000, windowsHide: true }
    );
  } finally {
    await unlink(dataFile).catch(() => {});
  }
}
