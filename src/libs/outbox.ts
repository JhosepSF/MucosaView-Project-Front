import uuid from 'react-native-uuid';
import { db } from './db';
import { moveIntoAppDir, buildPhotoName, buildPhotoDst } from './fs';

type FotoIn = { uri: string };

type DatosPersonales = {
  dni: string;
  nombre: string;
  apellido: string;
  edad: string;
  region: string;
  provincia: string;
  distrito: string;
  direccion: string;
  mapsUrl: string;
};

type DatosObstetricos = {
  pulsaciones: string;
  hemoglobina: string;
  oxigeno: string;
  fechaUltimoPeriodo: string;
  semanasEmbarazo: number;
};

export async function saveRegistroNuevoOffline(
  dp: DatosPersonales,
  do_: DatosObstetricos,
  nroVisita: number,
  fotosConj: FotoIn[],
  fotosLab: FotoIn[]
) {
  const client_uuid = uuid.v4() as string;
  const now = new Date().toISOString();
  const payload = { datos_personales: dp, datos_obstetricos: do_, nro_visita: nroVisita };

  // 1) Inserta el record y encola el POST (todo sincrónico en una transacción)
  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO records(client_uuid,dni,nro_visita,payload,created_at,updated_at,sync_status)
       VALUES(?,?,?,?,?,?,?)`,
      [client_uuid, dp.dni, nroVisita, JSON.stringify(payload), now, now, 'pending']
    );

    db.runSync(
      `INSERT INTO pending_ops(client_uuid,endpoint,method,body)
       VALUES(?,?,?,?)`,
      [client_uuid, '/api/mucosa/registro', 'POST',
       JSON.stringify({ client_uuid, ...payload, updated_at: now })]
    );
  });

  // 2) Mueve cada foto al FileSystem y encola su subida (una transacción por foto)
  let idx = 0;
  const pushFotos = async (arr: FotoIn[], tipo: 'Conjuntiva' | 'Labio') => {
    for (const f of arr) {
      const filename = buildPhotoName(dp.dni, tipo, nroVisita, idx++);
      const dstPath = buildPhotoDst(dp.dni, nroVisita, filename);
      const dstUri = await moveIntoAppDir(f.uri, dstPath);

      db.withTransactionSync(() => {
        const res = db.runSync(
          `INSERT INTO files(client_uuid,tipo,visita,filename,local_uri,remote_url,sync_status)
           VALUES(?,?,?,?,?,?,?)`,
          [client_uuid, tipo, nroVisita, filename, dstUri, null, 'pending']
        );
        const fileId = Number(res.lastInsertRowId ?? 0);

        db.runSync(
          `INSERT INTO pending_ops(client_uuid,endpoint,method,body,form_field,file_id)
           VALUES(?,?,?,?,?,?)`,
          [
            client_uuid,
            `/api/mucosa/registro/${encodeURIComponent(dp.dni)}/fotos`,
            'POST',
            null,               
            'file',
            fileId
          ]
        );
      });
    }
  };

  await pushFotos(fotosConj, 'Conjuntiva');
  await pushFotos(fotosLab, 'Labio');

  return client_uuid;
}

export async function enqueueAgregarFotosOffline(
  dni: string,
  nroVisita: number,
  fotosConj: FotoIn[],
  fotosLab: FotoIn[],
  obstetricos?: DatosObstetricos  
) {
  const client_uuid = String(uuid.v4());
  const now = new Date().toISOString();

  // (A) Encolar JSON con obstétricos para esta visita (si se proporcionó)
  if (obstetricos) {
    const now = new Date().toISOString();
    db.withTransactionSync(() => {
      db.runSync(
        `INSERT INTO pending_ops (client_uuid, endpoint, method, body)
        VALUES (?, ?, ?, ?)`,
        [
          client_uuid,
          `/api/mucosa/registro/${encodeURIComponent(dni)}/visita`,
          'POST',
          JSON.stringify({
            client_uuid,
            dni,
            nro_visita: nroVisita,
            datos_obstetricos: obstetricos,
            updated_at: now,
          }),
        ]
      );
    });
  }

  // (B) Encolar fotos como antes
  let idx = 0;
  const pushFotos = async (arr: FotoIn[], tipo: 'Conjuntiva'|'Labio') => {
    for (const f of arr) {
      const filename = buildPhotoName(dni, tipo, nroVisita, idx++);
      const dst = buildPhotoDst(dni, nroVisita, filename);
      const dstUri = await moveIntoAppDir(f.uri, dst);

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO files (client_uuid, tipo, visita, filename, local_uri, remote_url, sync_status)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [client_uuid, tipo, nroVisita, filename, dstUri, null, 'pending']
        );

        const row = await db.getFirstAsync<{ id: number }>(
          `SELECT last_insert_rowid() AS id`
        );
        const fileId = row?.id ?? null;

        await db.runAsync(
          `INSERT INTO pending_ops (client_uuid, endpoint, method, body, form_field, file_id)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            client_uuid,
            `/api/mucosa/registro/${encodeURIComponent(dni)}/fotos`,
            'POST',
            null,
            'file',
            fileId,
          ]
        );
      });
    }
  };

  await pushFotos(fotosConj, 'Conjuntiva');
  await pushFotos(fotosLab, 'Labio');

  return client_uuid;
}
