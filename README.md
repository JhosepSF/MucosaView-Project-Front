# MucosaView - Frontend (Aplicación Móvil)

**Versión:** 1.4.2

## 📱 Descripción
Aplicación móvil desarrollada en React Native con Expo para la recolección de datos clínicos y fotografías de pacientes gestantes en zonas rurales. Permite captura offline con sincronización manual controlada, sistema de backup automático y verificación de integridad de datos. Exportación funcional de base de datos a carpeta Downloads usando MediaLibrary.

## 🚀 Repositorios del Proyecto
- **Frontend (App Móvil)**: https://github.com/JhosepSF/MucosaView-Project-Front
- **Backend (API Django)**: https://github.com/JhosepSF/MucosaView-Project-Back

## 📋 Requisitos Previos

### Software Necesario
- Node.js 18.x o superior
- npm 9.x o superior
- Expo CLI (`npm install -g expo-cli`)
- Android Studio / Xcode (para emuladores)
- Expo Go (app móvil para pruebas)

### Dispositivos Compatibles
- **Android**: 7.0 (API 24) o superior
- **iOS**: 13.0 o superior
- **Permisos necesarios**: 
  - Cámara
  - Ubicación GPS
  - Almacenamiento externo (lectura/escritura)
  - Acceso a imágenes y videos (Android 13+)

## 🔧 Instalación

### 1. Clonar el Repositorio
```bash
git clone https://github.com/JhosepSF/MucosaView-Project-Front.git
cd MucosaView-Project-Front
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Edita la URL del backend en:
```typescript
// src/services/api.ts
const api = axios.create({
  baseURL: 'http://TU_IP_BACKEND:8000/api',
});

// src/libs/sync.ts
const BASE_URL = 'http://TU_IP_BACKEND:8000';
```

## ▶️ Ejecución

### Modo Desarrollo
```bash
# Iniciar Expo
npm start

# Escanea el QR con Expo Go (Android/iOS)
# O presiona 'a' para Android, 'i' para iOS
```

### Compilar APK (Android)
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login en Expo
eas login

# Compilar APK
eas build --platform android --profile preview
```

### Ejecutar en Emulador
```bash
# Android
npm run android

# iOS (solo Mac)
npm run ios
```

## 📁 Estructura del Proyecto
```
Front/
├── App.tsx                 # Componente raíz
├── index.ts               # Entry point
├── app.json               # Configuración Expo
├── package.json           # Dependencias
├── assets/                # Imágenes y recursos
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── CustomHeader.tsx
│   │   └── Footer.tsx
│   ├── navigation/        # Navegación
│   │   └── AppNavigator.tsx
│   ├── screens/          # Pantallas principales
│   │   ├── WelcomeScreen.tsx           # Pantalla de bienvenida
│   │   ├── MenuRegistroScreen.tsx      # Menú principal
│   │   ├── RegistroNuevoScreen.tsx     # Nueva paciente
│   │   ├── AgregarFotoScreen.tsx       # Visita 2+
│   │   └── SyncQueueScreen.tsx         # Cola de sincronización + Backup
│   ├── libs/             # Lógica de negocio
│   │   ├── db.ts         # SQLite local
│   │   ├── outbox.ts     # Patrón Outbox + Backup automático
│   │   ├── sync.ts       # Sincronización + Verificación de integridad
│   │   ├── backup.ts     # Sistema de backup y exportación
│   │   ├── fs.ts         # Sistema de archivos
│   │   ├── maintenance.ts # Mantenimiento
│   │   └── log.ts        # Logging
│   ├── data/             # Datos estáticos
│   │   └── ubigeo.ts     # Catálogo UBIGEO San Martín
│   └── styles/           # Estilos globales
│       ├── colors.ts
│       ├── commonStyles.ts
│       └── index.ts
```

## 🎯 Funcionalidades Principales

### 🏠 Pantalla de Bienvenida
- **Explicación del propósito**: Presenta la app al usuario
- **Navegación directa**: Acceso rápido a registro y sincronización
- **Botón futuro**: "Diagnóstico Inteligente" (IA - próximamente)
- **Prevención de retroceso**: Confirmación para salir de la app

### 📋 Registro de Pacientes (Visita 1)
- **Datos Personales**: DNI, nombre, apellido, edad
- **Ubicación UBIGEO**: Región, provincia, distrito (San Martín)
- **GPS**: Captura automática de coordenadas con reverse geocoding
- **Datos Obstétricos**: Pulsaciones, hemoglobina, SpO2, FUR
- **Fotos Clínicas**: 6 fotos PNG sin compresión
  - 2 fotos de Conjuntiva
  - 2 fotos de Labio
  - 2 fotos de Índice

### 📷 Visitas Adicionales
- Agregar fotos a registros existentes (Visita 2, 3, ...)
- Actualización de datos obstétricos por visita
- Numeración automática de visitas

### 🔄 Sincronización Offline-First (Manual)
- **Control Total**: Sincronización 100% manual desde SyncQueueScreen
- **Patrón Outbox**: Cola de operaciones pendientes con reintentos
- **Prioridad Garantizada**: JSON (paciente/visita) ANTES que fotos
- **Continuar en error**: Si falla una operación, continúa con las siguientes
- **Verificación de integridad**: Confirma que datos llegaron al servidor
- **Estadísticas detalladas**: Muestra total/éxitos/errores después de sync
- **Vista expandible**: Ver JSON completo de cada operación (tap para expandir)
- **Idempotencia**: Prevención de duplicados con UUID

### 💾 Sistema de Backup y Protección de Datos
- **Backup automático JSON**: Al guardar cada registro se crea backup local
- **Export completo DB**: Exporta base de datos SQLite completa (.db)
- **Export datos JSON**: Exporta todas las tablas en formato JSON legible
- **Compartir backups**: Share API para enviar vía WhatsApp/email
- **Limpieza automática**: Mantiene solo los últimos 10 backups
- **Ubicación**: `FileSystem.documentDirectory/backups/`
- **6 Niveles de protección**: SQLite + JSON + Cola + FileSystem + Export + Verificación

Ver [BACKUP_SYSTEM.md](BACKUP_SYSTEM.md) para documentación completa del sistema de backup.

### 🗄️ Almacenamiento Local
- **SQLite**: Base de datos local con expo-sqlite
- **Tablas**: `records`, `files`, `pending_ops`
- **Fotos**: FileSystem persistente en directorio de la app

### 🛠️ Herramientas de Depuración
- Ver cola de sincronización en tiempo real con detalles completos
- Vista expandible de JSON para cada operación (tap en tarjeta)
- Forzar sincronización manual con estadísticas detalladas
- **Export Database**: Botón para exportar base de datos completa
- **Export JSON**: Botón para exportar todos los datos en JSON
- Compartir backups vía Share API (WhatsApp, email, etc.)
- Vaciar cola de operaciones
- Borrar registros pendientes por DNI
- Reiniciar base de datos
- Eliminar todo almacenamiento local

## 🤖 Tecnologías Utilizadas

### Framework y UI
- **React Native**: 0.81.5
- **Expo SDK**: ~54.0.31
- **React Navigation**: Navegación entre pantallas
- **@react-native-picker/picker**: Selectores dropdown
- **@expo/vector-icons (Ionicons)**: Iconografía

### Almacenamiento y Datos
- **expo-sqlite**: Base de datos local (16.0.10)
- **expo-file-system**: Sistema de archivos (19.0.21)
- **expo-media-library**: Exportación a Downloads (17.0.5)
- **@tanstack/react-query**: Cache y gestión de estado

### Captura y Ubicación
- **expo-camera**: Acceso a cámara (17.0.10)
- **expo-image-picker**: Selector de imágenes (17.0.10)
- **expo-image-manipulator**: Conversión PNG (14.0.8)
- **expo-location**: GPS y geocoding (19.0.8)

### Conectividad
- **axios**: Cliente HTTP (1.10.0)
- **@react-native-community/netinfo**: Detección de red (11.4.1)

### Utilidades
- **react-native-uuid**: Generación de UUIDs
- **@react-native-community/datetimepicker**: Selector de fechas

## 📊 Flujo de Trabajo Offline-First

### 1. Captura (Offline)
```
Usuario → Formulario → SQLite local
                    ↓
           Fotos → FileSystem
                    ↓
           Operaciones → pending_ops
                    ↓
           Backup automático → JSON local
```

### 2. Sincronización Manual (Online)
```
Usuario presiona "Sincronizar"
    ↓
Detección de red
    ↓
Geocoding de coordenadas (opcional)
    ↓
POST JSON /api/mucosa/registro (PRIORIDAD 0)
    ↓
Verificación de integridad (GET para confirmar)
    ↓
POST Fotos /api/mucosa/registro/{dni}/fotos (PRIORIDAD 1)
    ↓
Actualización de estados (synced) solo si verificado
    ↓
Mostrar estadísticas (total/éxitos/errores)
    ↓
Limpieza de cola
```

### 3. Reintentos (Resiliente)
```
Error en request
    ↓
Incrementar contador de reintentos
    ↓
Continuar con siguiente operación (NO detener cola)
    ↓
¿Reintentos < 15?
    ↓ Sí          ↓ No
Reintentar    Eliminar operación
```

### 4. Backup y Recuperación
```
Guardar registro
    ↓
Crear backup JSON automático
    ↓
Guardar en /backups/registro_{DNI}_visita{N}_{timestamp}.json
    ↓
Limpiar backups antiguos (mantener 10)
    ↓
Usuario puede exportar DB completa o JSON completo
    ↓
Compartir vía WhatsApp/email si es necesario
```

## 🎨 Formato de Imágenes

### PNG sin Compresión
```typescript
await ImageManipulator.manipulateAsync(
  asset.uri,
  [], // Sin transformaciones
  { 
    compress: 0,                        // Sin compresión
    format: ImageManipulator.SaveFormat.PNG,
    quality: 1.0                        // Calidad máxima
  }
);
```

**Ventajas**:
- ✅ Cero pérdida de calidad
- ✅ Ideal para diagnóstico médico
- ✅ Tamaño: ~1.5 MB por foto
- ✅ Compatible universalmente

Ver [FORMATO_IMAGENES.md](FORMATO_IMAGENES.md) para más detalles.

## 📡 Endpoints API Consumidos

### Registro Completo
```http
POST /api/mucosa/registro
Content-Type: application/json

{
  "client_uuid": "uuid-v4",
  "datos_personales": { ... },
  "datos_obstetricos": { ... },
  "nro_visita": 1
}
```

### Subida de Fotos
```http
POST /api/mucosa/registro/{dni}/fotos
Content-Type: multipart/form-data

- file: imagen PNG
- type: CONJ | LAB | IND
- index: 1 | 2
- nro_visita: número de visita
```

### Visita Adicional
```http
POST /api/mucosa/registro/{dni}/visita

{
  "nro_visita": 2,
  "datos_obstetricos": { ... }
}
```

## ⚙️ Configuración Avanzada

### Cambiar URL del Backend
```typescript
// src/libs/sync.ts (línea 10)
export const BASE_URL = 'http://192.168.100.151:8000';

// Para desarrollo local:
export const BASE_URL = 'http://localhost:8000';  // Solo en emulador Android
export const BASE_URL = 'http://10.0.2.2:8000';  // Alternativa Android
export const BASE_URL = 'http://192.168.1.100:8000';  // Dispositivo físico (usa tu IP)
```

### Ajustar Reintentos
```typescript
// src/libs/sync.ts (línea 12)
const MAX_RETRIES = 15; // Máximo de reintentos (aumentado para mayor resiliencia)
```

### Configurar Cantidad de Backups
```typescript
// src/screens/SyncQueueScreen.tsx (función onExportJSON)
await cleanOldBackups(10); // Mantener últimos 10 backups (ajustable)
```

### Habilitar/Deshabilitar Backup Automático
```typescript
// src/libs/outbox.ts (comentar/descomentar estas líneas)
// await backupToJSON(...); // Comentar para deshabilitar backup automático
```

## 🐛 Solución de Problemas

### Error: "Couldn't connect to server"
1. Verifica que el backend esté corriendo (`python manage.py runserver`)
2. Comprueba la IP en `sync.ts` (línea 10)
3. Asegúrate de estar en la misma red WiFi
4. Para dispositivo físico: usa la IP local de tu PC (no localhost)
5. Obtén tu IP: `ipconfig` (Windows) o `ifconfig` (Mac/Linux)

### Fotos no se sincronizan
1. Verifica permisos de cámara y almacenamiento en el dispositivo
2. Revisa la cola: Pantalla "Cola de sincronización"
3. Toca cada item para ver el JSON y verificar datos
4. Presiona "Sincronizar" manualmente
5. Verifica estadísticas: debe mostrar éxitos y errores
6. Si hay errores, revisa logs del backend

### Datos perdidos después de sincronización
✅ **Ya no debería pasar** - Sistema mejorado:
1. Los datos SIEMPRE se guardan en SQLite local (persistente)
2. Backup automático JSON se crea al guardar
3. Verificación de integridad confirma que llegó al servidor
4. Si falla verificación, reintenta automáticamente
5. Puedes exportar DB o JSON completo en cualquier momento
6. Los backups están en `/backups/` del dispositivo

### ⚠️ Error: "No se pueden exportar archivos" o archivos con 0KB
✅ **Solucionado en v1.4.2**:
1. Asegúrate de tener la versión 1.4.2 instalada
2. Al presionar "Export DB", MediaLibrary pedirá permisos automáticamente
3. Concede el permiso cuando aparezca el diálogo
4. El archivo .db se guardará directamente en Downloads
5. Abre el explorador de archivos → Downloads para verificar

**¿Siguen sin aparecer los archivos?**
1. Verifica que tienes v1.4.2 (ve a Ajustes → Apps → MucosaView)
2. Revisa Downloads con el explorador de archivos del teléfono
3. Busca archivos que empiecen con `mucosaview_backup_`
4. Si no aparecen, verifica permisos: Ajustes → Apps → MucosaView → Permisos → Fotos y videos (debe estar permitido)

### Sincronización falló pero no sé qué datos se perdieron
1. Ve a "Cola de sincronización"
2. Presiona "Export JSON" para guardar todos los datos
3. Comparte el archivo JSON vía WhatsApp/email
4. Toca cada operación pendiente para ver el JSON completo
5. Toma screenshots de los datos importantes
6. Los datos están seguros en SQLite local

### Base de datos corrupta
1. Primero: **Export DB** para guardar backup
2. Usa "Reiniciar DB" en herramientas de depuración
3. O "Borrar TODO local" para reset completo
4. Reinstala la app si el problema persiste

### GPS no funciona
1. Activa ubicación en el dispositivo
2. Concede permisos a la app
3. Prueba en exterior (mejor señal GPS)
4. El GPS NO es obligatorio (puedes continuar sin él)

### Quiero recuperar datos de un backup
1. Los backups JSON están en: `FileSystem.documentDirectory/backups/`
2. Usa "Export JSON" para obtener archivo completo
3. Compártelo vía WhatsApp/email
4. Abre el JSON en cualquier editor de texto
5. Todos los datos están ahí en formato legible

### Stack de navegación confuso (pantallas duplicadas)
✅ **Ya solucionado** - Implementado `navigation.reset()`:
- Después de guardar un registro, el stack se resetea correctamente
- Al presionar "atrás" desde MenuRegistro, vuelve a WelcomeScreen
- No se acumulan pantallas en el historial

## 📊 Catálogo UBIGEO

La app incluye el catálogo completo de **San Martín**:
- **10 Provincias**
- **77 Distritos**

Fuente: INEI - Instituto Nacional de Estadística e Informática

## 📱 Permisos Requeridos

### Android (app.json - v1.4.1)
```json
"permissions": [
  "android.permission.INTERNET",
  "android.permission.CAMERA",
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.RECORD_AUDIO",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.READ_MEDIA_VIDEO"
]
```

**Nuevos en v1.4.1:**
- `READ_EXTERNAL_STORAGE`: Leer archivos de almacenamiento externo
- `WRITE_EXTERNAL_STORAGE`: Escribir backups en Downloads
- `READ_MEDIA_IMAGES`: Acceso a imágenes (Android 13+)
- `READ_MEDIA_VIDEO`: Acceso a videos (Android 13+)

**Función:** Permiten exportar base de datos y backups JSON a la carpeta Downloads del dispositivo para compartir vía WhatsApp/email.

### iOS
```xml
NSCameraUsageDescription
NSLocationWhenInUseUsageDescription
```

## 🧪 Testing
```bash
# Ejecutar tests (si se implementan)
npm test
```

## 📈 Rendimiento
- **Tamaño APK**: ~100 MB
- **Uso de RAM**: ~150-200 MB
- **Almacenamiento**: ~62 MB por paciente (6 fotos)
- **Tiempo de captura**: < 2 minutos por registro
- **Sincronización**: ~20 segundos por registro completo

## 🔐 Seguridad
- ✅ Almacenamiento local encriptado (SQLite)
- ✅ Backup automático JSON para recuperación
- ✅ Verificación de integridad post-sincronización
- ✅ Comunicación HTTPS (producción)
- ✅ Validación de entrada en cliente y servidor
- ✅ UUIDs para prevenir duplicados
- ✅ 6 niveles de protección de datos
- ✅ Export de datos para respaldo externo

## 🚀 Despliegue

### Generar APK
```bash
eas build --platform android --profile preview
```

### Publicar en Expo
```bash
eas update --branch production
```

### Crear APK firmado
```bash
eas build --platform android --profile production
```

## 👥 Autor
JhosepSF

## 📄 Licencia
Este proyecto es parte de un trabajo académico.

## 📞 Soporte
Para más información:
- **Backend README**: [API Django](https://github.com/JhosepSF/MucosaView-Project-Back)
- **Formato de Imágenes**: Ver [FORMATO_IMAGENES.md](FORMATO_IMAGENES.md)
- **Sistema de Backup**: Ver [BACKUP_SYSTEM.md](BACKUP_SYSTEM.md)
- **Issues**: Reportar en GitHub Issues

## 🔄 Versiones

### v1.4.2 (Actual) - 21 de enero 2026
**Exportación Funcional a Downloads:**
- ✅ Implementado MediaLibrary para guardar archivos en Downloads
- ✅ Solicitud automática de permisos al exportar
- ✅ Archivos .db ahora aparecen en carpeta Downloads del dispositivo
- ✅ Compatible con Android 7+ hasta Android 14+
- ✅ Exportación de DB y JSON 100% funcional
- ✅ Los archivos exportados son inmediatamente accesibles

**Solución definitiva:**
- Ya no se guardan en directorio privado de la app
- MediaLibrary maneja permisos automáticamente
- Los archivos son visibles en el explorador de archivos
- Se puede compartir directamente desde Downloads

### v1.4.1 - 21 de enero 2026
**Mejoras de Permisos:**
- Agregados permisos de almacenamiento externo
- Soporte para Android 13+ (READ_MEDIA_IMAGES/VIDEO)
- Preparación para exportación funcional

### v1.4.0 - 20 de enero 2026
- Pantalla de bienvenida
- Sistema de backup automático JSON
- Verificación de integridad post-sincronización
- Export DB/JSON con Share API
- Sincronización 100% manual
- Navegación mejorada con stack limpio

### v1.3.0
- Control total de sincronización manual

### v1.2.0
- Verificación de integridad

### v1.1.0
- Sistema de backup automático

### v1.0.0
- Versión inicial offline-first

---

## 🎯 Características Destacadas v1.4.2

### 🆕 Novedades v1.4.2
1. **MediaLibrary Integration**: Guardar archivos directamente en Downloads
2. **Exportación 100% Funcional**: Los archivos .db aparecen en Downloads
3. **Permisos Automáticos**: MediaLibrary solicita permisos sin configuración manual
4. **Acceso Inmediato**: Archivos visibles en explorador de archivos
5. **Compatibilidad Total**: Android 7+ hasta Android 14+

### ✨ Funcionalidades Principales (v1.4.0 a v1.4.2)
1. **Pantalla de Bienvenida**: Explica el propósito de la app con navegación intuitiva
2. **Sincronización 100% Manual**: Control total sobre cuándo sincronizar
3. **Backup Automático**: Crea JSON de cada registro guardado
4. **Export DB/JSON**: Botones para exportar base de datos completa
5. **Verificación de Integridad**: Confirma que datos llegaron al servidor
6. **Vista Expandible**: Tap en operación para ver JSON completo
7. **Estadísticas Detalladas**: Muestra total/éxitos/errores después de sync
8. **Navegación Mejorada**: Stack limpio con `navigation.reset()`
9. **Compartir Backups**: Share API para enviar vía WhatsApp/email
10. **6 Niveles de Protección**: SQLite + JSON + Cola + FileSystem + Export + Verificación

### 🛡️ Protección de Datos Mejorada
```
Nivel 1: SQLite local (persistente)
Nivel 2: Backup JSON automático (/backups/)
Nivel 3: Cola de sincronización (pending_ops)
Nivel 4: Fotos en FileSystem (permanente)
Nivel 5: Export manual DB/JSON (compartible)
Nivel 6: Verificación de integridad (server check)
```

### 📱 Flujo de Usuario Optimizado
```
WelcomeScreen
    ↓
MenuRegistroScreen
    ↓ Primera Visita           ↓ Visita Adicional
RegistroNuevoScreen        AgregarFotosScreen
    ↓                              ↓
Guardar + Backup JSON       Guardar + Backup JSON
    ↓                              ↓
MenuRegistroScreen (stack limpio)
    ↓
SyncQueueScreen
    ↓
Ver datos → Export → Compartir → Sincronizar
```

### 🎨 Mejoras de UI/UX
- Botones más compactos (paddingVertical reducido)
- Iconos descriptivos (cloud-upload, document-text, save)
- Badges visuales: JSON (azul), FILE (naranja), Export (naranja)
- Modal de "Sincronizando..." con indicador de progreso
- Alertas informativas con emojis (✅, ⚠️, ❌)
- Hint para tomar screenshots: "💡 Toma screenshot de estos datos"

---
