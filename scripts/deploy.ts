import { spawnSync } from 'node:child_process';
import { loadEnv } from 'vite';

const config = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env };
const required = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_DATABASE_URL', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID'];
const missing = required.filter((key) => !config[key]);
if (missing.length) throw new Error(`Complete .env.local antes de desplegar. Faltan: ${missing.join(', ')}`);
if (config.VITE_USE_FIREBASE_EMULATORS === 'true' || config.VITE_FIREBASE_PROJECT_ID?.startsWith('demo-')) throw new Error('No se puede desplegar la configuración de emuladores.');
for (const args of [
  ['node_modules/typescript/bin/tsc', '--noEmit'],
  ['node_modules/vite/bin/vite.js', 'build'],
  ['node_modules/firebase-tools/lib/bin/firebase.js', 'deploy', '--project', config.VITE_FIREBASE_PROJECT_ID!, '--only', 'hosting,database'],
]) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
