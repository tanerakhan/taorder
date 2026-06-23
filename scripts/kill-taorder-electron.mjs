import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

try {
  execSync(`pkill -f "${projectDir}.*electron" 2>/dev/null || true`, {
    shell: '/bin/bash',
    stdio: 'ignore',
  });
} catch {
  // already stopped
}
