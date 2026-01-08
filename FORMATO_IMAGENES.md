# Formato de Imágenes en MucosaView: PNG sin compresión

## ¿Por qué PNG en lugar de JPG o RAW?

### Resumen Ejecutivo
MucosaView guarda las fotos clínicas en **PNG sin compresión** (`compress: 0`) para obtener la **máxima calidad posible en aplicaciones móviles estándar** sin necesidad de APIs nativas complejas.

---

## Comparación de Formatos

### 1. JPG (Anterior - ❌ No recomendado)

**Flujo de captura:**
```
Sensor de cámara
    ↓
Procesamiento automático del celular
(balance de blancos, ISO, exposición, contraste, nitidez)
    ↓
Compresión destructiva JPG (quality: 0.8)
    ↓
Archivo JPG (pequeño, ~200-500 KB)
```

**Problemas:**
- ❌ **Pérdida de información** por compresión destructiva
- ❌ **Artefactos visuales** (bloques, bandas, bordes difusos)
- ❌ **Colores degradados** especialmente en áreas uniformes
- ❌ **No reversible** - la información perdida no se recupera

**Ventajas:**
- ✅ Archivos pequeños (~80% más livianos que PNG)
- ✅ Compatible universalmente

---

### 2. PNG sin compresión (Actual - ✅ Implementado)

**Flujo de captura:**
```
Sensor de cámara
    ↓
Procesamiento automático del celular
(balance de blancos, ISO, exposición, contraste, nitidez)
    ↓
Guarda píxeles exactos SIN compresión destructiva
    ↓
Archivo PNG (grande, ~1-3 MB)
```

**Implementación:**
```typescript
await ImageManipulator.manipulateAsync(
  asset.uri,
  [], // Sin transformaciones
  { 
    compress: 0,                        // Sin compresión
    format: ImageManipulator.SaveFormat.PNG,
    quality: 1.0                        // Máxima calidad
  }
);
```

**Ventajas:**
- ✅ **Cero pérdida de calidad** después del procesamiento
- ✅ **Colores exactos** píxel por píxel
- ✅ **Sin artefactos** de compresión
- ✅ **Formato estándar** - funciona en cualquier celular
- ✅ **Implementación simple** - sin módulos nativos
- ✅ **Reversible** - los píxeles guardados son exactos

**Desventajas:**
- ⚠️ Archivos 5x más grandes que JPG
- ⚠️ No elimina el procesamiento automático de la cámara

---

### 3. RAW verdadero (❌ No implementado - Requiere APIs nativas)

**Flujo de captura:**
```
Sensor de cámara
    ↓
SIN procesamiento automático
    ↓
Datos crudos del sensor (Bayer array)
    ↓
Archivo DNG/RAW (muy grande, ~10-25 MB)
```

**Qué requeriría:**
- **Android**: Camera2 API en Java/Kotlin
- **iOS**: AVFoundation en Swift
- **Módulos nativos** para Expo/React Native
- **Procesamiento posterior** (revelado RAW)
- **Almacenamiento masivo** (10-25 MB por foto)

**Ventajas teóricas:**
- ✅ Control total sobre procesamiento de imagen
- ✅ Ajuste manual de ISO, balance de blancos, exposición
- ✅ Máximo rango dinámico

**Desventajas prácticas:**
- ❌ **Complejidad extrema** de implementación
- ❌ **No funciona en todos los celulares** (solo gama alta)
- ❌ Requiere **revelado posterior** (no se puede visualizar directamente)
- ❌ Archivos **enormes** (10-25 MB cada uno)
- ❌ Necesita módulos nativos (Java, Kotlin, Swift)

---

## ¿Qué NO podemos evitar con PNG?

### Procesamiento automático de la cámara

**Todos los celulares aplican automáticamente:**
1. **Balance de blancos** - Ajusta tonos según iluminación
2. **Exposición automática** - Controla brillo general
3. **ISO automático** - Sensibilidad del sensor
4. **Reducción de ruido** - Suaviza granulado
5. **Enfoque automático** - Ajusta nitidez
6. **HDR (si está activado)** - Combina múltiples exposiciones
7. **Corrección de lente** - Compensa distorsión óptica

**Esto significa:**
- ⚠️ La imagen capturada **ya está procesada** cuando llega a la app
- ⚠️ Diferentes celulares procesarán **diferente** (algoritmos del fabricante)
- ⚠️ Mismo objeto en diferentes celulares = **colores ligeramente diferentes**

### Lo que SÍ evitamos con PNG

- ✅ **Compresión destructiva final** - No se pierde información DESPUÉS del procesamiento
- ✅ **Artefactos de compresión** - Sin bloques o bandas
- ✅ **Degradación progresiva** - Guardar/abrir no degrada más la imagen

---

## Portabilidad: ¿Funciona en cualquier celular?

### ✅ SÍ - PNG es universal

**Compatibilidad:**
- ✅ Android (todas las versiones)
- ✅ iOS (todas las versiones)
- ✅ Expo SDK 54+
- ✅ React Native 0.70+
- ✅ Cualquier navegador moderno

**Por qué funciona:**
1. PNG es un **formato estándar ISO/IEC 15948**
2. `expo-image-manipulator` es **multiplataforma**
3. El procesamiento de cámara es **universal** (todas las cámaras lo hacen)
4. Solo cambiamos el **formato de salida final**, no la captura

**Diferencias entre dispositivos:**
- ⚠️ **Calidad de sensor** - Mejores sensores capturan más detalles
- ⚠️ **Algoritmos de procesamiento** - Samsung vs iPhone procesan diferente
- ⚠️ **Condiciones de captura** - Iluminación, encuadre afectan resultado

---

## Comparación Técnica

| Característica | JPG (quality: 0.8) | PNG sin compresión | RAW (DNG) |
|---|---|---|---|
| **Tamaño archivo** | ~300 KB | ~1.5 MB | ~15 MB |
| **Compresión** | Destructiva | Sin pérdida | Sin compresión |
| **Calidad visual** | Buena | Excelente | Máxima |
| **Procesamiento cámara** | ✅ Incluido | ✅ Incluido | ❌ No procesado |
| **Portabilidad** | ✅ Universal | ✅ Universal | ⚠️ Requiere revelado |
| **Implementación** | Simple | Simple | Compleja (nativo) |
| **Compatibilidad** | 100% | 100% | ~30% (gama alta) |
| **Ideal para** | Redes sociales | Medicina, archivo | Fotografía profesional |

---

## Decisión para MucosaView

### ✅ PNG sin compresión es la elección correcta

**Razones:**
1. **Aplicación médica** - Requiere máxima calidad visual
2. **Diagnóstico clínico** - Los detalles importan (palidez, color, textura)
3. **Archivo a largo plazo** - Sin degradación por compresión
4. **Simplicidad técnica** - Funciona en cualquier dispositivo sin código nativo
5. **Portabilidad garantizada** - PNG es estándar universal

**Alternativas descartadas:**
- ❌ **JPG** - Pierde detalles críticos para diagnóstico
- ❌ **RAW** - Complejidad innecesaria, no funciona en todos los celulares

---

## Configuración Actual en MucosaView

### Frontend (React Native)

**Archivo:** `Front/src/screens/RegistroNuevoScreen.tsx`
```typescript
const manipResult = await ImageManipulator.manipulateAsync(
  asset.uri,
  [], // Sin transformaciones (no recorta, no rota, no escala)
  { 
    compress: 0,                        // 0 = sin compresión
    format: ImageManipulator.SaveFormat.PNG,
    quality: 1.0                        // Calidad máxima (solo afecta preview)
  }
);
```

### Nombres de archivo

**Formato:** `{DNI}_{Tipo}_{Visita}_{Índice}.png`

**Ejemplos:**
- `12345678_Conjuntiva_1_1.png`
- `12345678_Conjuntiva_1_2.png`
- `12345678_Labio_1_1.png`
- `12345678_Labio_1_2.png`
- `12345678_Indice_1_1.png`
- `12345678_Indice_1_2.png`

### Backend (Django)

**Almacenamiento:**
```
media/
  photos/
    {DNI}/
      {DNI}_Conjuntiva_{visita}_{index}.png
      {DNI}_Labio_{visita}_{index}.png
      {DNI}_Indice_{visita}_{index}.png
```

---

## Recomendaciones de Uso

### Para obtener la mejor calidad:

1. **Iluminación uniforme** - Evita sombras duras
2. **Distancia fija** - Mantén encuadre consistente
3. **Enfoque manual** (si es posible) - Toca pantalla para enfocar
4. **Limpia la lente** - Huellas dactilares degradan calidad
5. **Modo HDR desactivado** - Para colores más naturales
6. **Flash consistente** - Siempre con o siempre sin flash

### Consideraciones de almacenamiento:

- **6 fotos por paciente** (2 de cada tipo)
- **~9 MB por registro** (6 fotos × 1.5 MB)
- **100 pacientes = ~900 MB**
- **Sync periódico** recomendado para liberar espacio local

---

## Preguntas Frecuentes

### ¿Por qué no usar JPG con quality: 1.0?

Incluso con `quality: 1.0`, JPG aplica compresión destructiva. La diferencia:
- **PNG compress: 0** = 100% de la información preservada
- **JPG quality: 1.0** = ~98% de la información (pierde ~2%)

Para diagnóstico médico, ese 2% puede contener detalles críticos.

### ¿Las fotos se ven diferentes en diferentes celulares?

**SÍ**, porque:
- Cada fabricante tiene **algoritmos propios** de procesamiento
- Sensores de diferentes calidades capturan **diferente nivel de detalle**
- Pantallas diferentes muestran **colores diferentes**

Pero PNG garantiza que **los píxeles guardados son exactos** - la variación viene del hardware, no del formato.

### ¿Podría cambiarse a RAW en el futuro?

Técnicamente sí, pero requeriría:
1. Crear módulos nativos (Java + Swift)
2. Implementar Camera2 API (Android) y AVFoundation (iOS)
3. Procesar archivos DNG
4. Aumentar almacenamiento 10x
5. Solo funcionaría en celulares gama alta

**Costo/beneficio: NO recomendado** para esta aplicación.

---

## Conclusión

**PNG sin compresión es el punto óptimo entre:**
- ✅ Calidad profesional
- ✅ Simplicidad técnica
- ✅ Portabilidad universal
- ✅ Viabilidad práctica

Para una aplicación médica móvil, es la **mejor elección posible** sin entrar en complejidad de desarrollo nativo.

---

**Documento técnico generado para MucosaView**  
*Enero 2026 - Formato de imágenes clínicas*
