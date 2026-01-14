import uuid from 'react-native-uuid';
import { db } from './db';
import { moveIntoAppDir, buildPhotoName, buildPhotoDst } from './fs';

// Función para obtener hora local de Perú (UTC-5)
function getPeruTime(): string {
  const now = new Date();
  // Obtener UTC en milisegundos
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  // Ajustar a Perú (UTC-5): restar 5 horas desde UTC
  const peruTime = new Date(utcTime - (5 * 60 * 60 * 1000));
  // Formatear como ISO con offset -05:00
  const year = peruTime.getUTCFullYear();
  const month = String(peruTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(peruTime.getUTCDate()).padStart(2, '0');
  const hours = String(peruTime.getUTCHours()).padStart(2, '0');
  const minutes = String(peruTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(peruTime.getUTCSeconds()).padStart(2, '0');
  const ms = String(peruTime.getUTCMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}-05:00`;
}

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
  fotosLab: FotoIn[],
  fotosInd: FotoIn[]
) {
  const client_uuid = uuid.v4() as string;
  const now = getPeruTime();
  
  // Normalizar fechaUltimoPeriodo: cadena vacía -> null
  const obstetricosNorm = {
    ...do_,
    fechaUltimoPeriodo: do_.fechaUltimoPeriodo || null,
  };
  
  const payload = { datos_personales: dp, datos_obstetricos: obstetricosNorm, nro_visita: nroVisita };

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
  const pushFotos = async (arr: FotoIn[], tipo: 'Conjuntiva' | 'Labio' | 'Indice') => {
    let idx = 0;
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
  await pushFotos(fotosInd, 'Indice');

  return client_uuid;
}

export async function enqueueAgregarFotosOffline(
  dni: string,
  nroVisita: number,
  fotosConj: FotoIn[],
  fotosLab: FotoIn[],
  fotosInd: FotoIn[],
  obstetricos?: DatosObstetricos  
) {
  const client_uuid = String(uuid.v4());
  const now = getPeruTime();

  // (A) Encolar JSON con obstétricos para esta visita (si se proporcionó)
  if (obstetricos) {
    const now = getPeruTime();
    
    // Normalizar fechaUltimoPeriodo: cadena vacía -> null
    const obstetricosNorm = {
      ...obstetricos,
      fechaUltimoPeriodo: obstetricos.fechaUltimoPeriodo || null,
    };
    
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
            datos_obstetricos: obstetricosNorm,
            updated_at: now,
          }),
        ]
      );
    });
  }

  // (B) Encolar fotos como antes
  const pushFotos = async (arr: FotoIn[], tipo: 'Conjuntiva' | 'Labio' | 'Indice') => {
    let idx = 0;
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
  await pushFotos(fotosInd, 'Indice');

  return client_uuid;
}
