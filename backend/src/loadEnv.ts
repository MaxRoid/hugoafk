import path from 'node:path';
import fs from 'node:fs';

try {
  const rootEnv = path.resolve(process.cwd(), '../.env');
  if (fs.existsSync(rootEnv)) {
    process.loadEnvFile(rootEnv);
  } else if (fs.existsSync('.env')) {
    process.loadEnvFile('.env');
  }
} catch (e) {
  // ignore
}
