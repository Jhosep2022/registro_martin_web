import type { Nota } from '../../shared/types';
interface Props { nota: Nota; busy: boolean; unavailable?: boolean; error: string; onCancel: () => void; onConfirm: () => void }
import { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';

export default function DeleteDialog({ nota, busy, unavailable = false, error, onCancel, onConfirm }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} className="delete-dialog" aria-labelledby="delete-title" aria-describedby="delete-description" onCancel={(e) => { e.preventDefault(); if (!busy) onCancel(); }}>
    <Trash2 className="danger" size={28} />
    <h2 id="delete-title">Eliminar registro</h2>
    <p id="delete-description">¿Eliminar la hoja de ruta <strong>{nota.numeroHojaRuta}</strong>?</p>
    {error && <p className="field-error" role="alert">{error}</p>}
    <div className="dialog-actions"><button className="button outline" autoFocus disabled={busy} onClick={onCancel}>Cancelar</button><button className="button destructive" disabled={busy || unavailable} onClick={onConfirm}>{busy ? 'Eliminando…' : 'Eliminar'}</button></div>
  </dialog>;
}
