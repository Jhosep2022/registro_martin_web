import ExcelJS from 'exceljs';
import { formatDate } from '../../shared/notas';
import type { Nota, Filters } from '../../shared/types';

export async function exportExcel(notas: Nota[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Notas externas');
  sheet.columns = [
    { header: 'Nro. hoja de ruta', key: 'numeroHojaRuta', width: 19 },
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Remitente', key: 'remitente', width: 32 },
    { header: 'Referencia', key: 'referencia', width: 45 },
    { header: 'Destino', key: 'destino', width: 30 },
  ];
  for (const nota of notas) sheet.addRow({ ...nota, fecha: formatDate(nota.fecha) });
  sheet.eachRow((row, index) => {
    row.height = index === 1 ? 30 : 32;
    row.eachCell((cell, column) => {
      cell.alignment = { vertical: 'middle', wrapText: true, horizontal: index === 1 || column === 1 ? 'center' : 'left' };
      const border: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFB7C5BE' } };
      cell.border = { top: border, bottom: border, left: border, right: border };
      if (index === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF194D3B' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      } else if (column === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0EB' } };
        cell.font = { bold: true, color: { argb: 'FF194D3B' } };
      }
    });
  });
  return workbook.xlsx.writeBuffer();
}

export async function downloadExcel(notas: Nota[], _filters?: Filters): Promise<void> {
  const bytes = await exportExcel(notas);
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `notas_externas_${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}.xlsx`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
