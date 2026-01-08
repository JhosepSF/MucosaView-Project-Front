// src/libs/maintenance.ts
import * as FS from 'expo-file-system/legacy';
import { db } from './db';
import { initDb } from './db';

// ——— Limpia SOLO la cola (no borra registros ni fotos)
export function purgeQueueAll() {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM pending_ops');
  });
}

// ——— Elimina todo lo PENDIENTE de un DNI específico (cola + tablas)
export function purgeUnsyncedByDni(dni: string) {
  const rows = db.getAllSync(
    'SELECT client_uuid FROM records WHERE dni=? AND sync_status!="synced"',
    [dni]
  ) as { client_uuid: string }[];

  db.withTransactionSync(() => {
    for (const r of rows) {
      db.runSync('DELETE FROM pending_ops WHERE client_uuid=?', [r.client_uuid]);
      db.runSync('DELETE FROM files WHERE client_uuid=?', [r.client_uuid]);
      db.runSync('DELETE FROM records WHERE client_uuid=?', [r.client_uuid]);
    }
  });
}

// ——— Reset de esquema (DROP + crear de nuevo)
//     Útil si quieres dejar la DB vacía pero manteniendo el archivo
export function resetDatabase() {
  db.withTransactionSync(() => {
    db.runSync('DROP TABLE IF EXISTS pending_ops');
    db.runSync('DROP TABLE IF EXISTS files');
    db.runSync('DROP TABLE IF EXISTS records');
  });
  initDb(); // vuelve a crear tablas
}

// ——— Borrado fuerte de datos LOCALES (cola + tablas + fotos en FileSystem)
export async function nukeAllStorage() {
  // borra filas
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM pending_ops');
    db.runSync('DELETE FROM files');
    db.runSync('DELETE FROM records');
  });

  // borra directorio de fotos (/mucosa/…)
  try {
    await FS.deleteAsync(`${FS.documentDirectory}mucosa`, { idempotent: true });
  } catch {}

  // opcional: compactar/ignorar
}

// ——— (Opcional) Borrar el archivo SQLite físico
//      solo si de verdad quieres arrancar 100% desde cero.
//      Luego debes reiniciar la app y se volverán a crear las tablas con initDb().
export async function deleteSQLiteFile() {
  try {
    await FS.deleteAsync(`${FS.documentDirectory}SQLite/mucosaview.db`, { idempotent: true });
  } catch {}
}
