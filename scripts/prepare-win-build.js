const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(__dirname, '../release');
const isWindows = process.platform === 'win32';
const maxAttempts = isWindows ? 6 : 2;
const retryDelayMs = isWindows ? 1500 : 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeOutputDir() {
  if (!fs.existsSync(outputDir)) {
    console.log(`Build output is clean: ${outputDir}`);
    return;
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      fs.rmSync(outputDir, { recursive: true, force: true });
      console.log(`Removed previous build output: ${outputDir}`);
      return;
    } catch (error) {
      const errorCode = error && typeof error === 'object' ? error.code : 'UNKNOWN';
      const isLastAttempt = attempt === maxAttempts;

      console.warn(
        `Failed to remove build output (attempt ${attempt}/${maxAttempts}, code=${errorCode}).`
      );

      if (isLastAttempt) {
        const guidance = [
          `Unable to clean build output: ${outputDir}`,
          'A process is likely holding a file lock.',
          'Try these steps on Windows:',
          '1. Close File Explorer windows that show the release directory.',
          '2. Pause OneDrive sync if the project is under Desktop/Documents.',
          '3. Exclude the project or release directory from antivirus scanning.',
          '4. Delete the release directory manually, then rerun the build.',
        ].join('\n');

        throw new Error(`${guidance}\nOriginal error: ${error.message}`);
      }

      await sleep(retryDelayMs);
    }
  }
}

removeOutputDir().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
