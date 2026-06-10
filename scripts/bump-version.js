const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const version = String(packageJson.version || '').trim();
const parts = version.split('.').map((item) => Number(item));

if (parts.length !== 3 || parts.some((item) => !Number.isInteger(item) || item < 0)) {
  throw new Error(`Unsupported version format: ${version}`);
}

parts[2] += 1;
packageJson.version = parts.join('.');

fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(`Version bumped to ${packageJson.version}`);
