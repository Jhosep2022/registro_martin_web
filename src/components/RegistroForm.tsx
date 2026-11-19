import type { Dispatch, SetStateAction, FormEvent, RefObject } from 'react';
import type { NotaInput, FieldErrors } from '../../shared/types';

interface Props {
  form: NotaInput; setForm: Dispatch<SetStateAction<NotaInput>>; number: string; editing: boolean;
  errors: FieldErrors; busy: boolean; unavailable: boolean; onSave: (event: FormEvent<HTMLFormElement>) => void;
  onClear: () => void; formRef: RefObject<HTMLElement | null>;
}
import { FilePlus2, Hash, Save, RotateCcw, Pencil } from 'lucide-react';

export default function RegistroForm({ form, setForm, number, editing, errors, busy, unavailable, onSave, onClear, formRef }: Props) {
  return <section className="panel form-panel" ref={formRef} aria-labelledby="form-title">
    <div className="section-heading"><FilePlus2 className="orange" /><h2 id="form-title">{editing ? 'Editar registro' : 'Nuevo registro'}</h2></div>
    <p className="subtitle">{editing ? 'Modifique los datos seleccionados.' : 'Complete los datos de la nota recibida.'}</p>
    <form onSubmit={onSave} noValidate>
      <fieldset disabled={busy || unavailable}>
        <label className="field"><span>Nro. hoja de ruta</span>
          <div className="number-input"><Hash size={19} /><input aria-label="Nro. hoja de ruta" value={number} readOnly /></div>
          <small>Asignado automáticamente</small>
        </label>
        {([
          ['fecha', 'Fecha', '', 'date'],
          ['remitente', 'Remitente', 'Institución o persona', 'text'],
          ['referencia', 'Referencia', 'Asunto de la nota', 'textarea'],
          ['destino', 'Destino', 'Unidad o responsable', 'text'],
        ] as const).map(([name, label, placeholder, type]) => {
          const props = {
            id: name, name, 'aria-label': label, value: form[name], placeholder, required: true,
            'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `${name}-error` : undefined,
            onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((current) => ({ ...current, [name]: event.target.value })),
          };
          return <label className="field" key={name} htmlFor={name}><span>{label}</span>
            {type === 'textarea' ? <textarea {...props} rows={3} maxLength={10000} /> : <input {...props} type={type} min={type === 'date' ? '2020-01-01' : undefined} max={type === 'date' ? '2100-12-31' : undefined} maxLength={type === 'text' ? 10000 : undefined} />}
            {errors[name] && <small className="field-error" id={`${name}-error`}>{errors[name]}</small>}
          </label>;
        })}
        <button className="button primary full" type="submit">{editing ? <Pencil size={18} /> : <Save size={18} />}{busy ? 'Guardando…' : editing ? 'Actualizar registro' : 'Guardar registro'}</button>
        <button className="button outline full" type="button" onClick={onClear}><RotateCcw size={18} />{editing ? 'Cancelar edición' : 'Limpiar formulario'}</button>
      </fieldset>
    </form>
  </section>;
}
