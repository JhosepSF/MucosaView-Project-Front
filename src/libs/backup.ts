import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { db } from './db';

/**
 * Guarda un backup JSON de los datos en el almacenamiento del dispositivo
 */
export async function backupToJSON(data: any, filename: string): Promise<string> {
  try {
    const backupDir = `${FileSystem.documentDirectory}backups/`;
    
    // Crear carpeta si no existe
    const dirInfo = await FileSystem.getInfoAsync(backupDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
    }
    
    // Guardar JSON con timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const filepath = `${backupDir}${filename}_${timestamp}.json`;
    
    await FileSystem.writeAsStringAsync(
      filepath,
      JSON.stringify(data, null, 2)
    );
    
    console.log(`✅ Backup guardado: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error('Error al guardar backup JSON:', error);
    throw error;
  }
}

/**
 * Exporta la base de datos completa y permite compartirla
 */
export async function exportDatabase(): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const filename = `mucosaview_backup_${timestamp}.db`;
    
    // SQLite path en Expo
    const dbPath = `${FileSystem.documentDirectory}SQLite/mucosaview.db`;
    
    // Verificar que existe la base de datos
    const dbInfo = await FileSystem.getInfoAsync(dbPath);
    if (!dbInfo.exists) {
      throw new Error('Base de datos no encontrada');
    }
    
    // Copiar a un lugar compartible
    const sharePath = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.copyAsync({
      from: dbPath,
      to: sharePath
    });
    
    console.log(`✅ Base de datos exportada: ${sharePath}`);
    return sharePath;
  } catch (error) {
    console.error('Error al exportar base de datos:', error);
    throw error;
  }
}

/**
 * Comparte un archivo usando el diálogo nativo de compartir
 */
export async function shareFile(filepath: string, dialogTitle: string = 'Compartir archivo'): Promise<void> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Compartir no está disponible en este dispositivo');
    }
    
    await Sharing.shareAsync(filepath, {
      dialogTitle: dialogTitle,
      mimeType: 'application/octet-stream',
      UTI: 'public.database'
    });
    
    console.log('✅ Archivo compartido');
  } catch (error) {
    console.error('Error al compartir archivo:', error);
    throw error;
  }
}

/**
 * Exporta todos los datos como JSON (registros, archivos, cola de sync)
 */
export async function exportAllDataAsJSON(): Promise<string> {
  try {
    // Obtener todos los datos de las tablas
    const records = db.getAllSync('SELECT * FROM records');
    const files = db.getAllSync('SELECT * FROM files');
    const pendingOps = db.getAllSync('SELECT * FROM pending_ops');
    
    const exportData = {
      exported_at: new Date().toISOString(),
      version: '1.0',
      records: records,
      files: files,
      pending_operations: pendingOps,
      stats: {
        total_records: records.length,
        total_files: files.length,
        pending_operations: pendingOps.length
      }
    };
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const filepath = await backupToJSON(exportData, `full_export_${timestamp}`);
    
    return filepath;
  } catch (error) {
    console.error('Error al exportar datos:', error);
    throw error;
  }
}

/**
 * Lista todos los backups guardados
 */
export async function listBackups(): Promise<string[]> {
  try {
    const backupDir = `${FileSystem.documentDirectory}backups/`;
    const dirInfo = await FileSystem.getInfoAsync(backupDir);
    
    if (!dirInfo.exists) {
      return [];
    }
    
    const files = await FileSystem.readDirectoryAsync(backupDir);
    return files.filter(f => f.endsWith('.json') || f.endsWith('.db'));
  } catch (error) {
    console.error('Error al listar backups:', error);
    return [];
  }
}

/**
 * Elimina backups antiguos (mantiene solo los últimos N)
 */
export async function cleanOldBackups(keepLast: number = 10): Promise<number> {
  try {
    const backups = await listBackups();
    
    if (backups.length <= keepLast) {
      return 0;
    }
    
    const backupDir = `${FileSystem.documentDirectory}backups/`;
    const sortedBackups = backups.sort().reverse(); // Más recientes primero
    const toDelete = sortedBackups.slice(keepLast);
    
    let deleted = 0;
    for (const backup of toDelete) {
      await FileSystem.deleteAsync(`${backupDir}${backup}`, { idempotent: true });
      deleted++;
    }
    
    console.log(`🗑️ Eliminados ${deleted} backups antiguos`);
    return deleted;
  } catch (error) {
    console.error('Error al limpiar backups:', error);
    return 0;
  }
}
