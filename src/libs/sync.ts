// src/lib/sync.ts
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import { db } from './db';

const DEBUG_SYNC = true;
const D = (...a: any[]) => DEBUG_SYNC && console.log(...a);

const BASE_URL = 'http://192.168.18.25:8000'; // <-- tu LAN IP
const TOKEN: string | null = null;
const MAX_RETRIES = 8;

type PendingOp = {
  id: number;
  client_uuid: string;
  endpoint: string;
  method: string;
  body: string | null;
  form_field: string | null;
  file_id: number | null;
  retries?: number;
};

type FileRow = {
  local_uri: string;
  filename: string;
  tipo: 'Conjuntiva' | 'Labio';
  visita: number;
};

type RecordRow = {
  client_uuid: string;
  payload: string;
};

// --- util: ping host ---
async function hostCheck() {
  try {
    const res = await fetch(BASE_URL, { method: 'GET' });
    const txt = await res.clone().text();
    D('[NET][RES]', { status: res.status, url: BASE_URL, ok: res.ok, bodyPreview: txt.slice(0, 120) });
    D('[SYNC] Host OK:', BASE_URL);
  } catch (e: any) {
    D('[SYNC][HOST][ERR]', e?.message || e);
  }
}

// --- completa dirección antes de empujar ---
async function preEnrichPendingRecords() {
  const net = await NetInfo.fetch();
  D('[NETINFO][preEnrich]', net);
  if (!net.isConnected || net.isInternetReachable === false) return;

  const recs = db.getAllSync(
    `SELECT client_uuid, payload FROM records WHERE sync_status='pending'`
  ) as RecordRow[];

  for (const r of recs) {
    try {
      const data = JSON.parse(r.payload) as any;
      const dp = data?.datos_personales ?? {};
      const hasLatLng = typeof dp.lat === 'number' && typeof dp.lng === 'number';
      const missingAddr = !dp?.direccion || !dp?.region || !dp?.provincia || !dp?.distrito;
      const missingMaps = !dp?.mapsUrl;
      if (!hasLatLng || (!missingAddr && !missingMaps)) continue;

      const [addr] = await Location.reverseGeocodeAsync({ latitude: dp.lat, longitude: dp.lng });
      const newDp = {
        ...dp,
        region: dp.region || addr?.region || '',
        provincia: dp.provincia || addr?.city || addr?.subregion || '',
        distrito: dp.distrito || addr?.district || '',
        direccion:
          dp.direccion || [addr?.street, addr?.name, addr?.postalCode].filter(Boolean).join(' '),
        mapsUrl: dp.mapsUrl || `https://www.google.com/maps?q=${dp.lat},${dp.lng}`,
      };

      D('[SYNC] Enrich record (reverse geocode)', { client_uuid: r.client_uuid, before: dp, after: newDp });

      const newPayloadObj = { ...data, datos_personales: newDp };
      const newPayload = JSON.stringify(newPayloadObj);
      const now = new Date().toISOString();

      db.withTransactionSync(() => {
        db.runSync(
          `UPDATE records SET payload=?, updated_at=? WHERE client_uuid=?`,
          [newPayload, now, r.client_uuid]
        );
        db.runSync(
          `UPDATE pending_ops
             SET body=?
           WHERE client_uuid=? AND endpoint='/api/mucosa/registro' AND method='POST'`,
          [JSON.stringify({ client_uuid: r.client_uuid, ...newPayloadObj, updated_at: now }), r.client_uuid]
        );
      });
    } catch {
      // ignore
    }
  }
}

// --- mapeo tipo humano -> código backend ---
function mapTipoToCode(tipo: string): 'CONJ' | 'LAB' {
  return (tipo || '').toUpperCase().startsWith('CONJ') ? 'CONJ' : 'LAB';
}

// --- subida de archivo: incluye type + nro_visita ---
async function uploadFile(
  endpoint: string,
  field: string,
  fileUri: string,
  filename: string,
  client_uuid: string,
  tipoCode: 'CONJ' | 'LAB',
  visita: number
) {
  D('[SYNC] POST multipart', {
    url: BASE_URL + endpoint,
    field,
    filename,
    client_uuid,
    tipo: tipoCode,
    visita,
  });

  const form = new FormData();
  form.append(field, { uri: fileUri, name: filename, type: 'image/jpeg' } as any);
  form.append('type', tipoCode);                 // requerido por tu backend
  form.append('nro_visita', String(visita));     // requerido por tu backend

  const res = await fetch(BASE_URL + endpoint, {
    method: 'POST',
    headers: {
      'Idempotency-Key': client_uuid,
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: form,
  });

  const preview = await res.clone().text();
  D('[NET][RES]', {
    status: res.status,
    url: BASE_URL + endpoint,
    ok: res.ok,
    bodyPreview: preview.substring(0, 300),
  });

  if (!res.ok) throw new Error(`upload failed status=${res.status}`);
}

// --- helpers de retries ---
function bumpRetryOrDrop(opId: number, retries?: number) {
  const r = retries ?? 0;
  if (r + 1 >= MAX_RETRIES) {
    D('[SYNC][RETRY] Max reached, dropping op', opId);
    db.runSync(`DELETE FROM pending_ops WHERE id=?`, [opId]);
  } else {
    db.runSync(`UPDATE pending_ops SET retries=COALESCE(retries,0)+1 WHERE id=?`, [opId]);
  }
}

export async function trySync() {
  await hostCheck();

  const net = await NetInfo.fetch();
  D('[NETINFO][trySync]', net);
  if (!net.isConnected || net.isInternetReachable === false) return;

  await preEnrichPendingRecords();

  // Lote: JSON primero, FILEs después
  const all = db.getAllSync(
    `SELECT id,client_uuid,endpoint,method,body,form_field,file_id,retries
     FROM pending_ops
     ORDER BY id ASC
     LIMIT 50`
  ) as PendingOp[];

  const jsonOps = all.filter(o => !o.file_id);
  const fileOps = all.filter(o => !!o.file_id);

  D('[SYNC] Batch pending_ops =', all.length);

  // ========== 1) JSON ==========
  for (const op of jsonOps) {
    try {
      let bodyObj: any = null;
      try { bodyObj = op.body ? JSON.parse(op.body) : null; } catch {}

      // Clasifica el tipo de JSON: create o visita
      const isCreate = op.endpoint === '/api/mucosa/registro';
      const isVisita = /\/api\/mucosa\/registro\/[^/]+\/visita$/.test(op.endpoint);

      D('[SYNC] POST JSON (about to send)', {
        url: BASE_URL + op.endpoint,
        method: op.method,
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': op.client_uuid },
        body: bodyObj,
      });

      const res = await fetch(BASE_URL + op.endpoint, {
        method: op.method,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': op.client_uuid,
          ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
        },
        body: op.body ?? undefined,
      });

      const preview = await res.clone().text();
      let json: any = null;
      try { json = JSON.parse(preview); } catch {}

      D('[NET][RES]', {
        status: res.status,
        ok: res.ok,
        url: BASE_URL + op.endpoint,
        bodyPreview: json ?? preview.substring(0, 300),
      });

      // Reglas especiales
      const alreadyExists =
        isCreate &&
        res.status === 400 &&
        json &&
        (json.dni?.[0]?.toString()?.toLowerCase()?.includes('already exists') ||
         json.detail?.toString()?.toLowerCase()?.includes('already exists'));

      // Para /visita, si 404 “No Patient …”, lo dejamos para retry (no lo borramos).
      if (res.ok || alreadyExists) {
        db.withTransactionSync(() => {
          db.runSync(`DELETE FROM pending_ops WHERE id=?`, [op.id]);
          if (isCreate) {
            db.runSync(`UPDATE records SET sync_status='synced' WHERE client_uuid=?`, [op.client_uuid]);
          }
        });
      } else {
        db.withTransactionSync(() => bumpRetryOrDrop(op.id, op.retries));
      }
    } catch (e: any) {
      D('[SYNC][JSON][ERR]', e?.message || e);
      db.withTransactionSync(() => bumpRetryOrDrop(op.id, op.retries));
    }
  }

  // ========== 2) FILES ==========
  for (const op of fileOps) {
    try {
      const row = db.getFirstSync(
        `SELECT local_uri, filename, tipo, visita FROM files WHERE id=?`,
        [op.file_id]
      ) as FileRow | null;

      if (!row) {
        db.withTransactionSync(() => {
          db.runSync(`DELETE FROM pending_ops WHERE id=?`, [op.id]);
        });
        continue;
      }

      D('[SYNC] Next file', {
        endpoint: op.endpoint,
        field: op.form_field || 'file',
        filename: row.filename,
        client_uuid: op.client_uuid,
      });

      try {
        await uploadFile(
          op.endpoint,
          op.form_field || 'file',
          row.local_uri,
          row.filename,
          op.client_uuid,
          mapTipoToCode(row.tipo),
          row.visita
        );

        db.withTransactionSync(() => {
          db.runSync(`DELETE FROM pending_ops WHERE id=?`, [op.id]);
          db.runSync(`UPDATE files SET sync_status='synced' WHERE id=?`, [op.file_id]);
        });
      } catch (e: any) {
        D('[SYNC][FILE][ERR]', e?.message || e);
        db.withTransactionSync(() => bumpRetryOrDrop(op.id, op.retries));
      }
    } catch (e: any) {
      D('[SYNC][LOOP][ERR]', e?.message || e);
      db.withTransactionSync(() => bumpRetryOrDrop(op.id, op.retries));
    }
  }
}

export function startAutoSync() {
  const unsub = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) trySync();
  });
  return unsub;
}

// Para depurar desde UI (lo puedes mostrar en tu ColaScreen)
export function debugDumpQueue(limit = 100) {
  const ops = db.getAllSync(
    `SELECT p.id, p.client_uuid, p.endpoint, p.method, p.body, p.file_id, p.retries,
            f.filename, f.tipo, f.visita
     FROM pending_ops p
     LEFT JOIN files f ON f.id = p.file_id
     ORDER BY p.id ASC
     LIMIT ?`,
    [limit]
  ) as any[];

  const normalized = ops.map(op => ({
    id: op.id,
    method: op.method,
    endpoint: op.endpoint,
    client_uuid: op.client_uuid,
    retries: op.retries ?? 0,
    kind: op.file_id ? `FILE(${op.tipo || ''} v${op.visita || ''})` : 'JSON',
    filename: op.filename || null,
    body: (() => { try { return op.body ? JSON.parse(op.body) : null; } catch { return op.body; } })(),
  }));

  D('[DEBUG QUEUE] pending_ops', normalized);
  return normalized;
}
