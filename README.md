# MucosaView - Frontend (Aplicación Móvil)

## 📱 Descripción
Aplicación móvil desarrollada en React Native con Expo para la recolección de datos clínicos y fotografías de pacientes gestantes en zonas rurales. Permite captura offline con sincronización automática al backend.

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
- **Permisos necesarios**: Cámara, Ubicación GPS, Almacenamiento

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
│   │   ├── MenuRegistroScreen.tsx      # Menú principal
│   │   ├── RegistroNuevoScreen.tsx     # Nueva paciente
│   │   ├── AgregarFotoScreen.tsx       # Visita 2+
│   │   └── SyncQueueScreen.tsx         # Cola de sincronización
│   ├── libs/             # Lógica de negocio
│   │   ├── db.ts         # SQLite local
│   │   ├── outbox.ts     # Patrón Outbox
│   │   ├── sync.ts       # Sincronización y Clientes API
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

### 🔄 Sincronización Offline
- **Patrón Outbox**: Cola de operaciones pendientes
- **Auto-retry**: Reintentos automáticos con backoff exponencial
- **Orden garantizado**: JSON primero, fotos después
- **Idempotencia**: Prevención de duplicados con UUID
- **Detección de red**: Sincronización automática al conectarse

### 🗄️ Almacenamiento Local
- **SQLite**: Base de datos local con expo-sqlite
- **Tablas**: `records`, `files`, `pending_ops`
- **Fotos**: FileSystem persistente en directorio de la app

### 🛠️ Herramientas de Depuración
- Ver cola de sincronización en tiempo real
- Forzar sincronización manual
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
- **expo-file-system**: Sistema de archivos (19.0.16)
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
```

### 2. Sincronización (Online)
```
Detección de red
    ↓
Geocoding de coordenadas (opcional)
    ↓
POST JSON /api/mucosa/registro
    ↓
POST Fotos /api/mucosa/registro/{dni}/fotos
    ↓
Actualización de estados (synced)
    ↓
Limpieza de cola
```

### 3. Reintentos
```
Error en request
    ↓
Incrementar contador de reintentos
    ↓
¿Reintentos < 8?
    ↓ Sí          ↓ No
Reintentar    Eliminar operación
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
// src/libs/sync.ts (línea 12)
const BASE_URL = 'http://192.168.100.151:8000';

// src/services/api.ts (línea 4)
baseURL: 'http://192.168.100.151:8000/api',
```

### Ajustar Reintentos
```typescript
// src/libs/sync.ts (línea 14)
const MAX_RETRIES = 8; // Máximo de reintentos
```

### Timeout de Red
```typescript
// src/services/api.ts
api.defaults.timeout = 60000; // 60 segundos
```

## 🐛 Solución de Problemas

### Error: "Couldn't connect to server"
1. Verifica que el backend esté corriendo
2. Comprueba la IP en `sync.ts` y `api.ts`
3. Asegúrate de estar en la misma red

### Fotos no se sincronizan
1. Verifica permisos de cámara y almacenamiento
2. Revisa la cola: Menú → "Ver cola de Sync"
3. Fuerza sincronización manual
4. Verifica logs del backend

### Base de datos corrupta
1. Usa "Reiniciar DB" en herramientas de depuración
2. O "Borrar TODO local" para reset completo

### GPS no funciona
1. Activa ubicación en el dispositivo
2. Concede permisos a la app
3. Prueba en exterior (mejor señal)

## 📊 Catálogo UBIGEO

La app incluye el catálogo completo de **San Martín**:
- **10 Provincias**
- **77 Distritos**

Fuente: INEI - Instituto Nacional de Estadística e Informática

## 📱 Permisos Requeridos

### Android
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

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
- ✅ Comunicación HTTPS (producción)
- ✅ Validación de entrada en cliente y servidor
- ✅ UUIDs para prevenir duplicados

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
- **Manual de Usuario**: Ver documentación en `/docs`
- **Manual Técnico**: Consultar [Backend README](https://github.com/JhosepSF/MucosaView-Project-Back)
- **Issues**: Reportar en GitHub Issues

## 🔄 Versiones
- **v1.0.0** - Versión inicial con funcionalidad completa offline-first
