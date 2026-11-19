# Registro Martín · React + TypeScript + Firebase

Versión web de `../registro_martin` para G.A.M. Caquiaviri. Todo el código de la aplicación, configuración y pruebas está escrito en TypeScript. Firebase Hosting sirve la web y Firebase Realtime Database comparte los registros entre computadoras. No necesita un servidor Node.js en funcionamiento ni una base SQLite local.

## Flujo conservado

1. Complete fecha, remitente, referencia y destino. El número de hoja de ruta es automático.
2. Pulse **Guardar registro**; la nota aparece en la tabla de todos los equipos conectados.
3. **Editar** carga la nota en el mismo formulario; **Actualizar registro** conserva su número. **Cancelar edición** vuelve a un registro nuevo.
4. **Eliminar** pide confirmación. **Limpiar formulario** restaura la fecha de hoy.
5. Busque por número, remitente, referencia o destino y filtre por fechas inclusivas.
6. **Descargar Excel** exporta los resultados visibles a un `.xlsx`, con el formato del original.

Se mantienen el diseño verde y naranja, cabecera municipal, contador, orden por fecha e ID descendentes y diseño adaptable. Como en Flutter, el próximo número es el máximo existente más uno, con al menos tres dígitos; eliminar el último permite reutilizar su número. Una transacción de Realtime Database asigna el ID y número junto con la nota, evitando duplicados por guardados simultáneos. La sincronización usa `onValue`, sin sondeo periódico.

## Proyecto conectado

Proyecto Firebase: `registro-martin-caquiaviri`. Aplicación web: `Registro Martin Web`. Realtime Database: `registro-martin-caquiaviri-default-rtdb`, región `us-central1`. La configuración local está en `.env.local`, excluida del repositorio.

## Configurar Firebase

Instale Node.js 24 o posterior para desarrollar o desplegar; las computadoras de los usuarios solo necesitan un navegador.

```sh
npm install
```

1. Cree o seleccione un proyecto en Firebase y registre una aplicación **web**.
2. Cree **Realtime Database** y obtenga su URL exacta (varía según la región).
3. Copie `.env.example` a `.env.local` y complete los cinco valores de `firebaseConfig`: `apiKey`, `authDomain`, `databaseURL`, `projectId` y `appId`.
4. Habilite el proveedor **Anónimo** en Firebase Authentication.

Los valores de configuración web identifican el proyecto y se incluyen en la compilación del navegador. No coloque claves privadas, contraseñas ni credenciales de cuentas de servicio en variables `VITE_`.

### Acceso directo al registro

Cualquier visitante puede consultar, crear, editar y eliminar notas. La aplicación inicia una sesión anónima de Firebase automáticamente desde el navegador y abre el formulario y la tabla sin pedir correo, contraseña ni código.

Las reglas de `database.rules.json` requieren una sesión de Firebase para leer y escribir en `/registro` y validan los datos guardados.

## Desarrollo y despliegue

```sh
npm run dev
```

Abra http://localhost:5173. Sin configuración Firebase se muestra una pantalla de configuración pendiente; no se guardan datos en una base simulada.

```sh
npx firebase login
npm run deploy
```

`deploy` comprueba la configuración, valida TypeScript, compila y publica **Hosting y las reglas de Realtime Database** en el proyecto indicado por `VITE_FIREBASE_PROJECT_ID`. No crea proyectos, bases ni operadores. Rechaza la configuración de emuladores. En un proyecto con reglas o un sitio existentes, revise cómo integrarlos antes de desplegar: el comando publica los archivos de esta carpeta.

Firebase muestra la URL HTTPS del sitio al terminar. Compártala con las otras computadoras. Node.js ya no necesita quedar encendido.

## Pruebas con Firebase local

Las pruebas de reglas y navegador usan un proyecto `demo-registro-martin` sin tocar la base real. Requieren Java 21 y Chromium de Playwright.

```sh
npm test
npm run build
npx playwright install chromium
npm run test:firebase
```

Se verifica validación, numeración, Excel, operaciones concurrentes, reglas de acceso, acceso directo desde dos navegadores sincronizados, vista móvil y reconexión. `CHROMIUM_PATH` permite usar un Chromium instalado. `npm run test:firebase` inicia y detiene los emuladores automáticamente.

Para probar manualmente, ejecute `npm run emulators` en una terminal y, en otra, configure temporalmente `VITE_USE_FIREBASE_EMULATORS=true` y ejecute `npm run dev`. No despliegue con esa opción activa.

## Estructura y datos

- `src/components/`: formulario, tabla y confirmación de eliminación.
- `src/App.tsx`: flujo de registro y filtros.
- `src/FirebaseApp.tsx`: acceso y conexión.
- `src/data/firebaseRepository.ts`: suscripción y transacciones de Realtime Database.
- `src/services/excel.ts`: exportación en el navegador, cargada al descargar.
- `shared/`: tipos y reglas del flujo.
- `database.rules.json`: permisos y validación de datos.
- `firebase.json`: Hosting y emuladores.

La base usa `/registro/nextId` y `/registro/notas/ID`. Las transacciones operan sobre `/registro` para conservar la numeración del original; descargan ese conjunto de datos y son apropiadas para este registro municipal, no para volúmenes ilimitados.

Los registros existentes de Flutter no se han migrado ni modificado. Para trasladarlos a Firebase hace falta una conversión de SQLite al esquema indicado y una importación controlada. Cerrar el navegador sin conexión no garantiza conservar escrituras pendientes; la interfaz confirma el guardado cuando Firebase lo acepta y deshabilita nuevas escrituras mientras está desconectada.

Referencias oficiales: [React con Vite](https://react.dev/learn/build-a-react-app-from-scratch), [lecturas, listeners y transacciones](https://firebase.google.com/docs/database/web/read-and-write), [Firebase Hosting](https://firebase.google.com/docs/hosting/quickstart).
