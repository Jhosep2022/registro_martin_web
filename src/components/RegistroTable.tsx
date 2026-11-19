import type { Dispatch, SetStateAction } from 'react';
import type { Nota, Filters } from '../../shared/types';

interface Props {
  notas: Nota[]; total: number; filters: Filters; setFilters: Dispatch<SetStateAction<Filters>>;
  loading: boolean; refreshing: boolean; busy: boolean; exporting: boolean;
  onRefresh: () => void; onExport: () => void; onEdit: (nota: Nota) => void; onDelete: (nota: Nota) => void;
}
import { Search, Download, Pencil, Trash2, FilterX, Inbox, RefreshCw } from 'lucide-react';
import { formatDate } from '../../shared/notas';

export default function RegistroTable({ notas, total, filters, setFilters, loading, refreshing, busy, exporting, onRefresh, onExport, onEdit, onDelete }: Props) {
  const invalidRange = filters.desde && filters.hasta && filters.desde > filters.hasta;
  return <section className="panel table-panel" aria-labelledby="table-title">
    <div className="table-toolbar">
      <div><h2 id="table-title">Notas registradas</h2><p className="subtitle">Correspondencia externa recibida</p></div>
      <label className="search"><Search size={20} /><input type="search" aria-label="Buscar registro" placeholder="Buscar registro..." value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} /></label>
    </div>
    <div className="filters">
      {(['desde', 'hasta'] as const).map((key) => <label className="date-filter" key={key}><span>{key === 'desde' ? 'Desde' : 'Hasta'}</span><input type="date" aria-label={key === 'desde' ? 'Desde' : 'Hasta'} min="2020-01-01" max="2100-12-31" value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })} /></label>)}
      {(filters.desde || filters.hasta) && <button className="icon-button" aria-label="Limpiar fechas" title="Limpiar fechas" onClick={() => setFilters({ ...filters, desde: '', hasta: '' })}><FilterX size={19} /></button>}
      <button className="button tonal" onClick={onExport} disabled={exporting || loading || !!invalidRange}><Download size={18} />{exporting ? 'Exportando…' : 'Descargar Excel'}</button>
      <button className="icon-button refresh" aria-label="Actualizar lista" title="Actualizar lista" onClick={onRefresh} disabled={refreshing || loading}><RefreshCw size={18} className={refreshing ? 'spin' : ''} /></button>
    </div>
    {invalidRange && <p className="field-error" role="alert">La fecha «Desde» no puede ser posterior a «Hasta».</p>}
    <div className="table-scroll" tabIndex={0} aria-label="Tabla de notas externas" aria-busy={loading}>
      <table>
        <thead><tr>{['NRO. HOJA DE RUTA', 'FECHA', 'REMITENTE', 'REFERENCIA', 'DESTINO', 'ACCIONES'].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{notas.map((nota) => <tr key={nota.id}>
          <td><span className="route-number">{nota.numeroHojaRuta}</span></td>
          <td className="date-cell">{formatDate(nota.fecha)}</td>
          <td className="sender-cell">{nota.remitente}</td><td className="reference-cell">{nota.referencia}</td><td className="destination-cell">{nota.destino}</td>
          <td><div className="row-actions"><button className="icon-button" disabled={busy} aria-label={`Editar hoja ${nota.numeroHojaRuta}`} title="Editar" onClick={() => onEdit(nota)}><Pencil size={18} /></button><button className="icon-button danger" disabled={busy} aria-label={`Eliminar hoja ${nota.numeroHojaRuta}`} title="Eliminar" onClick={() => onDelete(nota)}><Trash2 size={19} /></button></div></td>
        </tr>)}</tbody>
      </table>
      {!notas.length && <div className="empty-state" role="status">{loading ? <RefreshCw className="spin" size={30} /> : <Inbox size={36} strokeWidth={1.4} />}<p>{loading ? 'Cargando registros…' : 'No hay registros'}</p>{!loading && <small>{total ? 'Pruebe con otra búsqueda o cambie las fechas.' : 'Complete el formulario para registrar la primera nota.'}</small>}</div>}
    </div>
    <div className="table-footer">{notas.length} de {total} registros</div>
  </section>;
}
