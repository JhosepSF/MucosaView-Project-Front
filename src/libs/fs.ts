import * as FileSystem from 'expo-file-system/legacy';

function dirname(p: string) {
  const i = p.lastIndexOf('/');
  return i === -1 ? p : p.slice(0, i);
}

export async function ensureDir(dir: string) {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export async function moveIntoAppDir(srcUri: string, dstPath: string) {
  await ensureDir(dirname(dstPath));
  await FileSystem.moveAsync({ from: srcUri, to: dstPath });
  return dstPath;
}

export function buildPhotoName(
  dni: string,
  tipo: 'Conjuntiva' | 'Labio',
  visita: number,
  idx: number
) {
  return `${dni}_${tipo}_${visita}_${idx + 1}.jpg`;
}

export function buildPhotoDst(dni: string, visita: number, filename: string) {
  // file:///.../ + mucosa/<dni>/visita-<n>/<filename>
  const base = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
  return `${base}mucosa/${dni}/visita-${visita}/${filename}`;
}
