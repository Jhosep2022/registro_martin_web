import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectDatabaseEmulator, getDatabase, get, ref, set, update, onValue, goOffline } from 'firebase/database';
import { createFirebaseRepository } from '../src/data/firebaseRepository';
import type { Nota, NotaInput } from '../shared/types';

const projectId = 'demo-registro-martin';
const sample: NotaInput = { fecha: '2026-09-10', remitente: 'Comunidad', referencia: 'Audiencia', destino: 'Alcaldía' };

test('Firebase: permisos, dos clientes en tiempo real, CRUD y numeración simultánea', { timeout: 60000 }, async (t) => {
  const env = await initializeTestEnvironment({ projectId, database: { host: '127.0.0.1', port: 9000, rules: readFileSync('database.rules.json', 'utf8') } });
  await env.clearDatabase();
  function client(uid?: string) {
    const app = initializeApp({ projectId, databaseURL: `https://${projectId}.firebaseio.com` }, `test-${uid ?? 'guest'}`);
    const db = getDatabase(app);
    connectDatabaseEmulator(db, '127.0.0.1', 9000, uid ? { mockUserToken: { sub: uid } } : undefined);
    t.after(async () => { goOffline(db); await deleteApp(app); });
    return db;
  }
  t.after(() => env.cleanup());
  const firstDb = client('operador1');
  const secondDb = client('operador2');
  const guestDb = client();
  await assertFails(get(ref(guestDb, 'registro')));
  await assertFails(set(ref(guestDb, 'registro/nextId'), 1));
  await assertFails(set(ref(firstDb, 'usuarios/operador1'), true));
  const first = createFirebaseRepository(firstDb);
  const second = createFirebaseRepository(secondDb);
  await Promise.all(Array.from({ length: 8 }, (_, i) => (i % 2 ? first : second).create(sample)));
  const state = (await get(ref(firstDb, 'registro'))).val();
  const notas = Object.values(state.notas) as Nota[];
  assert.equal(notas.length, 8);
  assert.equal(new Set(notas.map((n) => n.numeroHojaRuta)).size, 8);
  assert.equal(state.nextId, 9);
  const streamed = new Promise<Nota[]>((resolve, reject) => {
    let unsubscribe = () => {};
    unsubscribe = second.subscribe((items) => {
      if (items.some((n) => n.destino === 'Secretaría')) { unsubscribe(); resolve(items); }
    }, reject);
  });
  await first.update(1, { ...sample, destino: 'Secretaría' });
  assert.equal((await streamed).find((n) => n.id === 1)?.numeroHojaRuta, '001');
  await first.remove(1);
  assert.equal((await get(ref(secondDb, 'registro/notas/1'))).exists(), false);
  await assert.rejects(second.update(1, sample), /ya no existe/);
  await assert.rejects(second.remove(1), /ya no existe/);
  await assertFails(update(ref(firstDb, 'registro/notas/2'), { numeroHojaRuta: '999' }));
  await assertFails(update(ref(firstDb, 'registro/notas/2'), { remitente: ' ' }));
  await assertFails(update(ref(firstDb, 'registro/notas/2'), { extra: 'no permitido' }));
  await assertFails(set(ref(firstDb, 'registro'), null));
  await first.remove(8);
  await first.create(sample);
  const last = (await get(ref(secondDb, 'registro/notas/9'))).val();
  assert.equal(last.numeroHojaRuta, '008');
});
