import { test, expect, type Page } from '@playwright/test';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';

async function openRegistro(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Notas registradas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar registro' })).toBeEnabled();
}

test.beforeEach(async () => {
  const env = await initializeTestEnvironment({ projectId: 'demo-registro-martin', database: { host: '127.0.0.1', port: 9000, rules: readFileSync('database.rules.json', 'utf8') } });
  try { await env.clearDatabase(); }
  finally { await env.cleanup(); }
});

test('acceso directo, operaciones y sincronización entre dos navegadores nuevos', async ({ page, browser }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openRegistro(page);
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  await expect(page.getByText('Campo obligatorio')).toHaveCount(3);
  await page.getByLabel('Fecha', { exact: true }).fill('2026-09-10');
  await page.getByLabel('Remitente', { exact: true }).fill('Comunidad de prueba');
  await page.getByLabel('Referencia', { exact: true }).fill('Solicitud de audiencia');
  await page.getByLabel('Destino', { exact: true }).fill('Alcaldía');
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  await expect(page.getByRole('cell', { name: 'Comunidad de prueba' })).toBeVisible();
  await expect(page.getByLabel('Nro. hoja de ruta')).toHaveValue('002');
  await page.reload();
  await expect(page.getByRole('cell', { name: 'Comunidad de prueba' })).toBeVisible();
  const other = await browser.newContext();
  const second = await other.newPage();
  await openRegistro(second);
  await expect(second.getByRole('cell', { name: 'Comunidad de prueba' })).toBeVisible();
  await page.getByRole('button', { name: 'Editar hoja 001' }).click();
  await page.getByLabel('Destino', { exact: true }).fill('Secretaría municipal');
  await page.getByRole('button', { name: 'Actualizar registro' }).click();
  await expect(second.getByRole('cell', { name: 'Secretaría municipal' })).toBeVisible();
  await other.close();
  await page.getByLabel('Buscar registro').fill('sin coincidencias');
  await expect(page.getByText('No hay registros', { exact: true })).toBeVisible();
  await page.getByLabel('Buscar registro').fill('secretaría');
  await page.getByLabel('Desde', { exact: true }).fill('2026-09-11');
  await expect(page.getByText('No hay registros', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar fechas' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar Excel' }).click();
  expect((await download).suggestedFilename()).toMatch(/\.xlsx$/);
  await page.screenshot({ path: 'test-results/registro-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: 'test-results/registro-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Eliminar hoja 001' }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Secretaría municipal' })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar hoja 001' }).click();
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(page.getByText('No hay registros', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Nro. hoja de ruta')).toHaveValue('001');
  expect(errors).toEqual([]);
});

test('sin conexión conserva el formulario y vuelve a habilitar guardado al reconectar', async ({ page, context }) => {
  await openRegistro(page);
  await page.getByLabel('Remitente', { exact: true }).fill('No perder este texto');
  await context.setOffline(true);
  await expect(page.getByText(/Sin conexión. Reconectando/)).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('button', { name: 'Guardar registro' })).toBeDisabled();
  await context.setOffline(false);
  await expect(page.getByRole('button', { name: 'Guardar registro' })).toBeEnabled({ timeout: 20000 });
  await expect(page.getByLabel('Remitente', { exact: true })).toHaveValue('No perder este texto');
});
