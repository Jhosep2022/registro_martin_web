import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { createInState, filterNotas, nextNumber, sortNotas, validateNota } from '../shared/notas';
import { exportExcel } from '../src/services/excel';
import type { Nota, NotaInput } from '../shared/types';

const input: NotaInput = { fecha: '2026-09-10', remitente: ' Comunidad ', referencia: 'Solicitud de reunión', destino: 'Alcaldía' };
const notas: Nota[] = [
  { ...input, id: 1, numeroHojaRuta: '001', fecha: '2026-09-01' },
  { ...input, id: 2, numeroHojaRuta: '002', fecha: '2026-09-10' },
  { ...input, id: 3, numeroHojaRuta: '003', fecha: '2026-09-10' },
];

test('conserva búsqueda, límites de fechas inclusivos y orden del original', () => {
  assert.equal(filterNotas(notas, { desde: '2026-09-01', hasta: '2026-09-10', q: ' ALCALDÍA ' }).length, 3);
  assert.equal(filterNotas(notas, { q: '003' })[0].id, 3);
  assert.equal(filterNotas(notas, { q: 'inexistente' }).length, 0);
  assert.deepEqual(sortNotas(notas).map((n) => n.id), [3, 2, 1]);
});

test('numeración automática y creación pura para reintentos de Firebase', () => {
  assert.equal(nextNumber([]), '001');
  assert.equal(nextNumber(notas), '004');
  assert.equal(nextNumber(notas.slice(0, 2)), '003');
  const first = createInState(null, input);
  const second = createInState(first, input);
  assert.equal(first.nextId, 2);
  assert.equal(Object.keys(first.notas).length, 1);
  assert.equal(second.notas['2'].numeroHojaRuta, '002');
  assert.equal(first.notas['1'].remitente, 'Comunidad');
});

test('validación rechaza blancos y fechas imposibles', () => {
  assert.equal(validateNota({ ...input, remitente: ' ' }).remitente, 'Campo obligatorio');
  assert.ok(validateNota({ ...input, fecha: '2026-02-30' }).fecha);
  assert.ok(validateNota({ ...input, fecha: '2019-12-31' }).fecha);
  assert.deepEqual(validateNota({ ...input, fecha: '2028-02-29' }), {});
});

test('Excel real conserva ceros, fechas, estilos y trata referencias como texto', async () => {
  const bytes = await exportExcel([{ ...notas[0], referencia: '=SUM(1,2)' }]);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const sheet = workbook.getWorksheet('Notas externas')!;
  assert.equal(sheet.rowCount, 2);
  assert.equal(sheet.getCell('A2').value, '001');
  assert.equal(sheet.getCell('B2').value, '01/09/2026');
  assert.equal(sheet.getCell('D2').value, '=SUM(1,2)');
  assert.equal(sheet.getCell('D2').type, ExcelJS.ValueType.String);
  assert.equal(sheet.getCell('A1').font.bold, true);
});
