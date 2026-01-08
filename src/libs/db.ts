import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('mucosaview.db');

export function initDb() {
  db.withTransactionSync(() => {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS records (
        client_uuid TEXT PRIMARY KEY,
        dni TEXT NOT NULL,
        nro_visita INTEGER NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT NOT NULL
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_uuid TEXT NOT NULL,
        tipo TEXT NOT NULL,
        visita INTEGER NOT NULL,
        filename TEXT NOT NULL,
        local_uri TEXT NOT NULL,
        remote_url TEXT,
        sync_status TEXT NOT NULL
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS pending_ops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_uuid TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        body TEXT,
        form_field TEXT,
        file_id INTEGER,
        retries INTEGER NOT NULL DEFAULT 0
      );
    `);
  });
}
