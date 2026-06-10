const { spawnSync } = require('child_process');
const path = require('path');

if (process.platform !== 'darwin') {
  console.log('Skipping icon sync on non-macOS platform');
  process.exit(0);
}

const scriptPath = path.resolve(__dirname, 'sync-icons.py');
const result = spawnSync('python3', [scriptPath], { stdio: 'inherit' });

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 0);
