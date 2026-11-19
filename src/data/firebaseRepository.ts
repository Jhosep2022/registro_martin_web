import { get, onValue, ref, runTransaction, type Database } from 'firebase/database';
import { cleanNota, createInState, sortNotas } from '../../shared/notas';
import type { Nota, NotaInput, RegistroRepository, RegistroState } from '../../shared/types';

export function friendlyError(error: unknown): Error {
  const code = String((error as { code?: string })?.code ?? '');
  if (/permission.denied|PERMISSION_DENIED/i.test(code) || /permission_denied/i.test(String(error))) return new Error('No tiene permiso para acceder a los registros. Contacte al administrador.');
  if (/network|disconnected|unavailable/i.test(code)) return new Error('No se pudo conectar con Firebase. Compruebe su conexión.');
  return error instanceof Error ? error : new Error('No se pudo completar la operación.');
}

export function createFirebaseRepository(database: Database): RegistroRepository {
  const location = ref(database, 'registro');
  async function transact(updater: (current: RegistroState | null) => RegistroState | null | undefined): Promise<void> {
    try {
      const result = await runTransaction(location, updater, { applyLocally: false });
      if (!result.committed) throw new Error('El registro ya no existe. La lista se actualizó.');
    } catch (error) { throw friendlyError(error); }
  }
  return {
    subscribe(onData, onError) {
      return onValue(location, (snapshot) => {
        const state = snapshot.val() as RegistroState | null;
        onData(sortNotas(Object.values(state?.notas ?? {}) as Nota[]));
      }, (error) => onError(friendlyError(error)));
    },
    async create(input: NotaInput) {
      const nota = cleanNota(input);
      await transact((current) => createInState(current, nota));
    },
    async update(id: number, input: NotaInput) {
      const nota = cleanNota(input);
      if (!(await get(ref(database, `registro/notas/${id}`))).exists()) throw new Error('El registro ya no existe. La lista se actualizó.');
      await transact((current) => {
        // A transaction can initially see null before Firebase fills its cache.
        if (!current) return current;
        const original = current.notas?.[String(id)];
        if (!original) return undefined;
        return { ...current, notas: { ...current.notas, [String(id)]: { ...original, ...nota } } };
      });
    },
    async remove(id: number) {
      if (!(await get(ref(database, `registro/notas/${id}`))).exists()) throw new Error('El registro ya no existe. La lista se actualizó.');
      await transact((current) => {
        if (!current) return current;
        if (!current.notas?.[String(id)]) return undefined;
        const notas = { ...current.notas };
        delete notas[String(id)];
        return { ...current, notas };
      });
    },
  };
}
