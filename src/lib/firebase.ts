import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';

const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
const options: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (useEmulators) {
  Object.assign(options, { apiKey: 'demo-api-key', authDomain: 'demo-registro-martin.firebaseapp.com', databaseURL: 'https://demo-registro-martin.firebaseio.com', projectId: 'demo-registro-martin', appId: 'demo-app' });
}
export const firebaseConfigured = Object.values(options).every(Boolean);
const app = firebaseConfigured ? initializeApp(options) : null;
export const auth = app ? getAuth(app) : null;
export const database = app ? getDatabase(app) : null;
if (app && auth && database && useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectDatabaseEmulator(database, '127.0.0.1', 9000);
}
