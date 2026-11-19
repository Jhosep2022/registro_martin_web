import type { FieldErrors, Filters, Nota, NotaInput, RegistroState } from './types';

export function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDate(value: string): string {
  return value.slice(0, 10).split('-').reverse().join('/');
}

export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    && value >= '2020-01-01' && value <= '2100-12-31';
}

export function validateNota(input: Partial<NotaInput> | null | undefined): FieldErrors {
  const errors: FieldErrors = {};
  if (!validDate(input?.fecha)) errors.fecha = 'Seleccione una fecha válida entre 2020 y 2100.';
  for (const field of ['remitente', 'referencia', 'destino'] as const) {
    if (typeof input?.[field] !== 'string' || !input[field].trim()) errors[field] = 'Campo obligatorio';
    else if (input[field].trim().length > 10000) errors[field] = 'Máximo 10.000 caracteres.';
  }
  return errors;
}

export function filterNotas(notas: Nota[], { q = '', desde = '', hasta = '' }: Partial<Filters> = {}): Nota[] {
  const query = q.trim().toLowerCase();
  return notas.filter((nota) => {
    const text = `${nota.numeroHojaRuta} ${nota.remitente} ${nota.referencia} ${nota.destino}`.toLowerCase();
    const date = nota.fecha.slice(0, 10);
    return text.includes(query) && (!desde || date >= desde) && (!hasta || date <= hasta);
  });
}

export function nextNumber(notas: Nota[]): string {
  return String(notas.reduce((max, nota) => Math.max(max, Number(nota.numeroHojaRuta) || 0), 0) + 1).padStart(3, '0');
}

export function sortNotas(notas: Nota[]): Nota[] {
  return [...notas].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
}

export function cleanNota(input: NotaInput): NotaInput {
  if (Object.keys(validateNota(input)).length) throw new Error('Revise los campos del formulario.');
  return { fecha: input.fecha, remitente: input.remitente.trim(), referencia: input.referencia.trim(), destino: input.destino.trim() };
}

// Pure updater: Firebase may invoke it repeatedly when another computer writes.
export function createInState(current: RegistroState | null, input: NotaInput): RegistroState {
  const notas = current?.notas ?? {};
  const id = current?.nextId ?? 1;
  const nota: Nota = { ...cleanNota(input), id, numeroHojaRuta: nextNumber(Object.values(notas)) };
  return { nextId: id + 1, notas: { ...notas, [String(id)]: nota } };
}
