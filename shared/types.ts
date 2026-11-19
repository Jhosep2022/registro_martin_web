export interface NotaInput {
  fecha: string;
  remitente: string;
  referencia: string;
  destino: string;
}

export interface Nota extends NotaInput {
  id: number;
  numeroHojaRuta: string;
}

export interface Filters { q: string; desde: string; hasta: string }
export type FieldErrors = Partial<Record<keyof NotaInput, string>>;
export interface RegistroState { nextId: number; notas: Record<string, Nota> }

export interface RegistroRepository {
  subscribe(onData: (notas: Nota[]) => void, onError: (error: Error) => void): () => void;
  create(nota: NotaInput): Promise<void>;
  update(id: number, nota: NotaInput): Promise<void>;
  remove(id: number): Promise<void>;
}
