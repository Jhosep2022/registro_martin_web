import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Landmark, X, CircleCheck, AlertCircle } from 'lucide-react';
import { filterNotas, nextNumber, today, validateNota } from '../shared/notas';
import type { FieldErrors, Filters, Nota, NotaInput, RegistroRepository } from '../shared/types';
import RegistroForm from './components/RegistroForm';
import RegistroTable from './components/RegistroTable';
import DeleteDialog from './components/DeleteDialog';

const blankForm = (): NotaInput => ({ fecha: today(), remitente: '', referencia: '', destino: '' });
interface Props { repository: RegistroRepository; connected: boolean }

export default function App({ repository, connected }: Props) {
  const [items, setItems] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filters, setFilters] = useState<Filters>({ q: '', desde: '', hasta: '' });
  const [form, setForm] = useState<NotaInput>(blankForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [editing, setEditing] = useState<Nota | null>(null);
  const [deleting, setDeleting] = useState<Nota | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const formRef = useRef<HTMLElement>(null);
  const mutating = useRef(false);

  useEffect(() => {
    setLoading(true);
    return repository.subscribe((notas) => {
      setItems(notas); setLoaded(true); setLoading(false); setError('');
    }, (err) => { setError(err.message); setLoading(false); });
  }, [repository, revision]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  function clear(): void { setForm(blankForm()); setEditing(null); setErrors({}); }
  function edit(nota: Nota): void {
    setEditing(nota);
    setForm({ fecha: nota.fecha.slice(0, 10), remitente: nota.remitente, referencia: nota.referencia, destino: nota.destino });
    setErrors({});
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    formRef.current?.querySelector<HTMLInputElement>('#remitente')?.focus({ preventScroll: true });
  }
  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (mutating.current || !connected) return;
    const validation = validateNota(form);
    setErrors(validation);
    if (Object.keys(validation).length) { document.getElementById(Object.keys(validation)[0])?.focus(); return; }
    mutating.current = true; setBusy(true); setError('');
    try {
      if (editing) await repository.update(editing.id, form);
      else await repository.create(form);
      clear(); setNotice('Registro guardado correctamente');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar el registro.'); }
    finally { setBusy(false); mutating.current = false; }
  }
  async function remove(): Promise<void> {
    if (mutating.current || !deleting || !connected) return;
    mutating.current = true; setBusy(true); setDeleteError('');
    try {
      await repository.remove(deleting.id);
      if (editing?.id === deleting.id) clear();
      setDeleting(null); setNotice('Registro eliminado correctamente');
    } catch (err) { setDeleteError(err instanceof Error ? err.message : 'No se pudo eliminar el registro.'); }
    finally { setBusy(false); mutating.current = false; }
  }
  const notas = filterNotas(items, filters);
  async function exportNotes(): Promise<void> {
    if (!notas.length) { setNotice('No hay datos para exportar'); return; }
    setExporting(true);
    try {
      const { downloadExcel } = await import('./services/excel');
      await downloadExcel(notas);
      setNotice('Excel descargado correctamente');
    } catch { setError('No se pudo exportar el Excel. Intente nuevamente.'); }
    finally { setExporting(false); }
  }
  return <>
    <header className="app-header"><div className="brand-icon"><Landmark size={27} strokeWidth={1.7} /></div><div className="brand-text"><h1>G.A.M. CAQUIAVIRI</h1><p>Registro de notas externas · Gestión 2026</p></div><span className="total-badge">{items.length} registros</span></header>
    {!connected && <div className="connection-banner" role="status">Sin conexión. Reconectando… Los cambios se pueden guardar cuando vuelva la conexión.</div>}
    {error && <div className="error-banner" role="alert"><AlertCircle size={20} /><span>{error}</span><button className="button outline" onClick={() => setRevision((value) => value + 1)} disabled={loading}>Reintentar</button></div>}
    <main>
      <RegistroTable notas={notas} total={items.length} filters={filters} setFilters={setFilters} loading={loading} refreshing={loading} busy={busy || !connected} exporting={exporting} onRefresh={() => setRevision((value) => value + 1)} onExport={exportNotes} onEdit={edit} onDelete={(nota) => { setDeleteError(''); setDeleting(nota); }} />
      <RegistroForm form={form} setForm={setForm} number={editing?.numeroHojaRuta ?? nextNumber(items)} editing={!!editing} errors={errors} busy={busy} unavailable={!loaded || !connected} onSave={save} onClear={clear} formRef={formRef} />
    </main>
    {notice && <div className="toast" role="status"><CircleCheck size={20} /><span>{notice}</span><button aria-label="Cerrar notificación" onClick={() => setNotice('')}><X size={18} /></button></div>}
    {deleting && <DeleteDialog nota={deleting} busy={busy} unavailable={!connected} error={deleteError || (!connected ? 'Sin conexión. Espere antes de eliminar.' : '')} onCancel={() => setDeleting(null)} onConfirm={remove} />}
  </>;
}
