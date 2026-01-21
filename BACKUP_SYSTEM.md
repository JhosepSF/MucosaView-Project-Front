# Sistema de Backup y Protección de Datos - MucosaView

## 🎯 Mejoras Implementadas

### 1. ✅ Backup Automático en JSON
Cada vez que guardas un registro de paciente o agregas fotos, se crea automáticamente un backup JSON en el dispositivo.

**Ubicación:** `FileSystem.documentDirectory/backups/`

**Archivos generados:**
- `registro_{DNI}_visita{N}_{timestamp}.json` - Registro completo de paciente
- `agregar_fotos_{DNI}_visita{N}_{timestamp}.json` - Fotos agregadas a visita existente

**Contenido del backup:**
```json
{
  "client_uuid": "...",
  "timestamp": "2026-01-20T10:30:45.123-05:00",
  "datos_personales": { /* ... */ },
  "datos_obstetricos": { /* ... */ },
  "nro_visita": 1,
  "fotos_count": {
    "conjuntiva": 2,
    "labio": 2,
    "indice": 2
  }
}
```

### 2. ✅ Exportación Completa de Base de Datos
Puedes exportar toda la base de datos SQLite a un archivo `.db` para respaldo completo.

**Cómo usarlo:**
1. Ve a la pantalla "Cola de sincronización"
2. Presiona el botón **"Export DB"**
3. Se crea una copia completa de `mucosaview.db`
4. Opción de compartir el archivo vía WhatsApp, email, etc.

**Archivo generado:**
```
mucosaview_backup_{timestamp}.db
```

### 3. ✅ Exportación de Datos en JSON
Exporta TODOS los datos (registros, archivos, cola de sincronización) en formato JSON legible.

**Cómo usarlo:**
1. Ve a "Cola de sincronización"
2. Presiona **"Export JSON"**
3. Se crea un archivo JSON con todo el contenido de las tablas
4. Opción de compartir el archivo

**Contenido:**
```json
{
  "exported_at": "2026-01-20T10:30:00.000Z",
  "version": "1.0",
  "records": [ /* todos los registros */ ],
  "files": [ /* todas las fotos */ ],
  "pending_operations": [ /* cola de sync */ ],
  "stats": {
    "total_records": 10,
    "total_files": 60,
    "pending_operations": 5
  }
}
```

### 4. ✅ Verificación de Integridad Post-Sincronización
Después de sincronizar un registro con el servidor, la app VERIFICA que realmente esté guardado.

**Cómo funciona:**
1. Se envía el registro al servidor
2. Servidor responde "200 OK"
3. La app hace una petición GET para confirmar que existe
4. Solo marca como "sincronizado" si se confirma la existencia
5. Si no se encuentra, reintenta la sincronización

**Ventajas:**
- Evita perder datos por falsos positivos (servidor dice OK pero no guardó)
- Detecta problemas de red intermitente
- Mayor seguridad en ambientes con conexión inestable

### 5. ✅ Limpieza Automática de Backups Antiguos
Mantiene solo los últimos 10 backups para no llenar el almacenamiento.

**Ejecuta automáticamente al exportar JSON**

## 📂 Estructura de Archivos Creada

```
FileSystem.documentDirectory/
├── backups/
│   ├── registro_12345678_visita1_2026-01-20T10-30-00.json
│   ├── registro_87654321_visita1_2026-01-20T11-15-00.json
│   ├── agregar_fotos_12345678_visita2_2026-01-20T14-00-00.json
│   └── full_export_2026-01-20T16-00-00.json
├── mucosaview_backup_2026-01-20T16-30-00.db
└── SQLite/
    └── mucosaview.db (base de datos principal)
```

## 🛡️ Protección de Datos - Niveles de Seguridad

| Nivel | Mecanismo | Persistencia | Ubicación |
|-------|-----------|--------------|-----------|
| **Nivel 1** | SQLite local | ✅ Permanente | `/SQLite/mucosaview.db` |
| **Nivel 2** | Backup JSON automático | ✅ Permanente | `/backups/*.json` |
| **Nivel 3** | Cola de sincronización | ✅ Permanente | Tabla `pending_ops` |
| **Nivel 4** | Fotos en FileSystem | ✅ Permanente | `/photos/{dni}/{visita}/` |
| **Nivel 5** | Export manual DB | ✅ Compartible | Archivo `.db` exportado |
| **Nivel 6** | Verificación de integridad | ✅ Automática | Valida en servidor |

## 🚀 Cómo Recuperar Datos en Caso de Emergencia

### Escenario 1: Pérdida de datos en SQLite
**Solución:** Usar backups JSON

1. Localiza los archivos en `/backups/`
2. Lee los archivos JSON (tienen todos los datos)
3. Los datos se pueden reinsertar manualmente o vía script

### Escenario 2: App desinstalada accidentalmente
**Solución:** Export DB previo

1. Si hiciste export de base de datos antes
2. Reinstala la app
3. Reemplaza la nueva DB con el backup
4. Todos los datos se restauran

### Escenario 3: Sincronización falló pero servidor dice OK
**Solución:** Verificación automática

La app detecta automáticamente y reintenta. No necesitas hacer nada.

### Escenario 4: Necesitas enviar datos por WhatsApp
**Solución:** Export JSON + compartir

1. Presiona "Export JSON"
2. Presiona "Compartir"
3. Envía por WhatsApp/email
4. El receptor puede leer el JSON en cualquier editor de texto

## 📱 Interfaz de Usuario

### Botones agregados en SyncQueueScreen:

```
┌─────────────────────────────────────┐
│  Cola de sincronización             │
│  X operaciones pendientes           │
│                                     │
│  ℹ️  La sincronización es MANUAL   │
│                                     │
│  [Sincronizar (X)] [🔄]            │
│  [Export JSON]  [Export DB]        │
│                                     │
│  Lista de operaciones...            │
└─────────────────────────────────────┘
```

## 🔍 Logs y Debugging

### Ver backups generados:
Los backups se guardan automáticamente y puedes listarlos con:

```typescript
import { listBackups } from './libs/backup';

const backups = await listBackups();
console.log('Backups disponibles:', backups);
```

### Ver logs de verificación:
En la consola busca:
```
[SYNC][VERIFY] Verificando integridad del registro en servidor...
[SYNC][VERIFY] ✅ Registro verificado correctamente en servidor
```

O en caso de error:
```
[SYNC][VERIFY] ⚠️ ADVERTENCIA: servidor respondió OK pero registro no verificado
```

## ⚙️ Configuración

### Cambiar cantidad de backups a mantener:
En `SyncQueueScreen.tsx` línea ~92:
```typescript
await cleanOldBackups(10); // Cambiar el número
```

### Deshabilitar backups automáticos:
En `outbox.ts` comenta las líneas de backup:
```typescript
// await backupToJSON(...)
```

## 🎓 Archivos Modificados/Creados

### Nuevos archivos:
- ✅ `src/libs/backup.ts` - Sistema completo de backup

### Archivos modificados:
- ✅ `src/libs/outbox.ts` - Backup automático después de guardar
- ✅ `src/libs/sync.ts` - Verificación de integridad
- ✅ `src/screens/SyncQueueScreen.tsx` - Botones de exportación

## 🔒 Seguridad y Privacidad

- ✅ Los backups se almacenan SOLO en el dispositivo local
- ✅ No se envían automáticamente a ningún servidor
- ✅ Solo se comparten si el usuario presiona "Compartir"
- ✅ Los archivos JSON contienen datos médicos sensibles - manejar con cuidado

## 📊 Estadísticas

Cada export JSON incluye estadísticas:
```json
{
  "stats": {
    "total_records": 10,      // Total de registros
    "total_files": 60,         // Total de fotos
    "pending_operations": 5    // Operaciones sin sincronizar
  }
}
```

## ✅ Checklist de Seguridad de Datos

- [x] SQLite persistente en dispositivo
- [x] Backup JSON automático al guardar
- [x] Export manual de base de datos completa
- [x] Export manual de datos en JSON
- [x] Verificación de integridad post-sync
- [x] Cola de reintentos automáticos
- [x] Priorización JSON antes que archivos
- [x] Sincronización manual (control total)
- [x] Vista de datos antes de sincronizar
- [x] Limpieza automática de backups antiguos
- [x] Compartir backups vía apps externas

---

**Fecha de implementación:** 20 de enero de 2026
**Versión:** 1.4.0
