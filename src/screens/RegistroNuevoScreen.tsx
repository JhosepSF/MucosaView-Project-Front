// src/screens/RegistroNuevoScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert,
  ScrollView, TextInputProps, Platform, ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { saveRegistroNuevoOffline } from '../libs/outbox';
import { commonStyles, COLORS } from '../styles';
import { ubigeoData } from '../data/ubigeo';
import { BASE_URL } from '../libs/sync';

type Foto = { uri: string };

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
  lat?: number;
  lng?: number;
};

type DatosObstetricos = {
  pulsaciones: string;
  hemoglobina: string;
  oxigeno: string;
  fechaUltimoPeriodo: string;
  semanasEmbarazo: number;
};

/** Helpers de formato */
const onlyDigits = (s: string) => s.replace(/\D/g, '');

/** Normalizar texto: sin tildes, minúsculas, sin espacios extras */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD') // Descompone caracteres con tildes
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
    .trim();
};

export default function RegistroNuevoScreen() {
  const navigation = useNavigation<any>();
  const [nroVisita] = useState('1'); // No editable
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [capturandoUbicacion, setCapturandoUbicacion] = useState(false);
  const [buscandoDNI, setBuscandoDNI] = useState(false);
  const [dp, setDp] = useState<DatosPersonales>({
    dni: '', nombre: '', apellido: '', edad: '',
    region: '', provincia: '', distrito: '', direccion: '', mapsUrl: '',
    lat: undefined, lng: undefined,
  });
  const [do_, setDo] = useState<DatosObstetricos>({
    pulsaciones: '', hemoglobina: '', oxigeno: '', fechaUltimoPeriodo: '', semanasEmbarazo: 0,
  });
  const [fotosConjuntiva, setFotosConjuntiva] = useState<Foto[]>([]);
  const [fotosLabio, setFotosLabio] = useState<Foto[]>([]);
  const [fotosIndice, setFotosIndice] = useState<Foto[]>([]);

  // Lógica para selectores en cascada
  const provinciasDisponibles = useMemo(() => {
    if (!dp.region) return [];
    const dpto = ubigeoData.find(d => d.nombre === dp.region);
    return dpto?.provincias || [];
  }, [dp.region]);

  const distritosDisponibles = useMemo(() => {
    if (!dp.provincia) return [];
    const prov = provinciasDisponibles.find(p => p.nombre === dp.provincia);
    return prov?.distritos || [];
  }, [dp.provincia, provinciasDisponibles]);

  // Resetear provincia y distrito cuando cambia la región
  const handleRegionChange = (newRegion: string) => {
    setDp(s => ({ ...s, region: newRegion, provincia: '', distrito: '' }));
  };

  // Resetear distrito cuando cambia la provincia
  const handleProvinciaChange = (newProvincia: string) => {
    setDp(s => ({ ...s, provincia: newProvincia, distrito: '' }));
  };

  const calcularSemanas = (fechaISO: string) => {
    if (!fechaISO) return 0;
    const d0 = new Date(fechaISO + 'T00:00:00');
    if (isNaN(d0.getTime())) return 0;
    const diffMs = Date.now() - d0.getTime();
    return Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)), 0);
  };
  const semanasEmbarazoCalc = useMemo(
    () => calcularSemanas(do_.fechaUltimoPeriodo),
    [do_.fechaUltimoPeriodo]
  );

  /** onChange DNI: solo dígitos, máx 8 */
  const handleDniChange = (v: string) => {
    const digits = onlyDigits(v).slice(0, 8);
    setDp(s => ({ ...s, dni: digits }));
  };

  /** Buscar DNI en BD y RENIEC */
  const buscarDNI = async () => {
    if (!dp.dni || dp.dni.length !== 8) {
      return Alert.alert('DNI inválido', 'Ingresa un DNI de 8 dígitos');
    }

    setBuscandoDNI(true);
    try {
      // 1. Verificar si ya existe en la BD
      const bdResponse = await fetch(`${BASE_URL}/api/mucosa/registro/${dp.dni}/info`);
      
      if (bdResponse.ok) {
        const bdData = await bdResponse.json();
        Alert.alert(
          '⚠️ Paciente ya registrado',
          `Este DNI ya está registrado:\n\n` +
          `Nombre: ${bdData.nombre} ${bdData.apellido}\n` +
          `Visitas: ${bdData.total_visitas}\n\n` +
          `Usa "Agregar fotos" para registrar otra visita.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // 2. Si no existe, consultar RENIEC
      const reniecResponse = await fetch(
        `https://dniruc.apisperu.com/api/v1/dni/${dp.dni}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Impob3NlcHNhbmZsb0BnbWFpbC5jb20ifQ.kl1A34r9TM7eoA3Sx7RefcKKcs0T6yfPMD-4WaBzLDg`
      );

      if (reniecResponse.ok) {
        const reniecData = await reniecResponse.json();
        setDp(s => ({
          ...s,
          nombre: reniecData.nombres || '',
          apellido: `${reniecData.apellidoPaterno || ''} ${reniecData.apellidoMaterno || ''}`.trim(),
        }));
        Alert.alert('✅ Datos encontrados', `Nombre: ${reniecData.nombres}\nApellidos: ${reniecData.apellidoPaterno} ${reniecData.apellidoMaterno}`);
      } else {
        Alert.alert('DNI no encontrado', 'No se encontraron datos en RENIEC. Ingresa manualmente.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo verificar el DNI. Continúa con el registro manual.');
    } finally {
      setBuscandoDNI(false);
    }
  };

  /** onChange Fecha con validación de 40 semanas */
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // iOS mantiene abierto
    
    if (selectedDate) {
      const today = new Date();
      const diffMs = today.getTime() - selectedDate.getTime();
      const weeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
      
      if (weeks > 40) {
        Alert.alert('⚠️ Fecha inválida', 'La fecha seleccionada resulta en más de 40 semanas de embarazo. Por favor, elige una fecha más reciente.');
        return;
      }
      
      if (weeks < 0) {
        Alert.alert('⚠️ Fecha inválida', 'No puedes seleccionar una fecha futura.');
        return;
      }
      
      const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      setDo(s => ({ ...s, fechaUltimoPeriodo: formattedDate }));
    }
  };

  const onPickFoto = async (tipo: 'Conjuntiva' | 'Labio' | 'Indice', from: 'camera' | 'gallery') => {
    try {
      if (from === 'camera') {
        const res = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 1.0 });
        if (!res.canceled && res.assets?.length) {
          // Convertir a PNG sin compresión (formato crudo)
          const convertidas = await Promise.all(
            res.assets.map(async (asset) => {
              const manipResult = await ImageManipulator.manipulateAsync(
                asset.uri,
                [], // Sin transformaciones
                { compress: 0, format: ImageManipulator.SaveFormat.PNG } // PNG sin compresión
              );
              return { uri: manipResult.uri };
            })
          );
          if (tipo === 'Conjuntiva') setFotosConjuntiva(p => [...p, ...convertidas]);
          else if (tipo === 'Labio') setFotosLabio(p => [...p, ...convertidas]);
          else setFotosIndice(p => [...p, ...convertidas]);
        }
      } else {
        const res = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: false, quality: 1.0, allowsMultipleSelection: true, selectionLimit: 10,
        } as any);
        if (!res.canceled && res.assets?.length) {
          // Convertir a PNG sin compresión (formato crudo)
          const convertidas = await Promise.all(
            res.assets.map(async (asset) => {
              const manipResult = await ImageManipulator.manipulateAsync(
                asset.uri,
                [], // Sin transformaciones
                { compress: 0, format: ImageManipulator.SaveFormat.PNG } // PNG sin compresión
              );
              return { uri: manipResult.uri };
            })
          );
          if (tipo === 'Conjuntiva') setFotosConjuntiva(p => [...p, ...convertidas]);
          else if (tipo === 'Labio') setFotosLabio(p => [...p, ...convertidas]);
          else setFotosIndice(p => [...p, ...convertidas]);
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar/tomar la foto.');
    }
  };

  /** Captura GPS SIEMPRE y completa dirección si hay internet */
  const capturarUbicacion = async () => {
    setCapturandoUbicacion(true);
    try {
      // 1. Siempre captura GPS primero (funciona offline)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere permiso de ubicación.');
        setCapturandoUbicacion(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

      // Guarda coordenadas inmediatamente
      setDp(s => ({ ...s, lat: latitude, lng: longitude, mapsUrl }));

      // 2. Verifica si hay internet para completar dirección
      const net = await NetInfo.fetch();
      const hasInternet = net.isConnected && net.isInternetReachable !== false;

      if (hasInternet) {
        // Tiene internet: completa dirección automáticamente
        try {
          const [addr] = await Location.reverseGeocodeAsync({ latitude, longitude });
          
          // Intentar mapear región/departamento
          const regionGeo = addr?.region ?? '';
          const subregionGeo = addr?.subregion ?? '';
          const cityGeo = addr?.city ?? '';
          const districtGeo = addr?.district ?? '';
          
          // Normalizar textos del GPS
          const regionNorm = normalizeText(regionGeo);
          const subregionNorm = normalizeText(subregionGeo);
          const cityNorm = normalizeText(cityGeo);
          const districtNorm = normalizeText(districtGeo);
          
          // Buscar departamento
          const departamento = ubigeoData.find(d => {
            const deptoNorm = normalizeText(d.nombre);
            return deptoNorm.includes(regionNorm) ||
                   regionNorm.includes(deptoNorm) ||
                   deptoNorm.includes(subregionNorm) ||
                   subregionNorm.includes(deptoNorm);
          });
          
          if (departamento) {
            // Buscar provincia
            const provincia = departamento.provincias.find(p => {
              const provNorm = normalizeText(p.nombre);
              return provNorm.includes(cityNorm) ||
                     cityNorm.includes(provNorm) ||
                     provNorm.includes(subregionNorm) ||
                     subregionNorm.includes(provNorm) ||
                     provNorm.includes(districtNorm) ||
                     districtNorm.includes(provNorm);
            });
            
            if (provincia) {
              // Buscar distrito
              const distrito = provincia.distritos.find(d => {
                const distNorm = normalizeText(d.nombre);
                return distNorm.includes(districtNorm) ||
                       districtNorm.includes(distNorm) ||
                       distNorm.includes(cityNorm) ||
                       cityNorm.includes(distNorm);
              });
              
              // Actualizar todos los campos encontrados
              // Solo actualizar dirección si no hay una escrita por el usuario
              const direccionGPS = [addr?.street, addr?.name].filter(Boolean).join(', ');
              setDp(s => ({
                ...s,
                region: departamento.nombre,
                provincia: provincia.nombre,
                distrito: distrito?.nombre || '',
                direccion: s.direccion || direccionGPS || '',
              }));
              
              if (distrito) {
                Alert.alert('✅ Ubicación completa', '¡Región, provincia y distrito encontrados automáticamente!');
              } else {
                Alert.alert('✅ Ubicación parcial', 'Región y provincia encontradas. Selecciona el distrito manualmente.');
              }
            } else {
              const direccionGPS = [addr?.street, addr?.name].filter(Boolean).join(', ');
              setDp(s => ({
                ...s,
                region: departamento.nombre,
                direccion: s.direccion || direccionGPS || '',
              }));
              Alert.alert('✅ Ubicación parcial', 'Región encontrada. Selecciona provincia y distrito manualmente.');
            }
          } else {
            const direccionGPS = [addr?.street, addr?.name].filter(Boolean).join(', ');
            setDp(s => ({
              ...s,
              direccion: s.direccion || direccionGPS || '',
            }));
            Alert.alert('⚠️ GPS guardado', 'No se pudo mapear la región. Selecciona manualmente desde los catálogos.');
          }
        } catch (error) {
          Alert.alert('⚠️ GPS guardado', 'Coordenadas guardadas. No se pudo obtener la dirección (puedes seleccionar manualmente).');
        }
      } else {
        // Sin internet: solo GPS, NO tocar la dirección que el usuario escribió
        Alert.alert('📍 GPS guardado', 'Coordenadas guardadas. La dirección que escribiste se mantendrá. Selecciona región, provincia y distrito.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación.');
    } finally {
      setCapturandoUbicacion(false);
    }
  };

  const guardarRegistro = async () => {
    if (!dp.dni) return Alert.alert('Falta DNI', 'Ingresa el DNI.');
    if (dp.dni.length !== 8) return Alert.alert('DNI inválido', 'El DNI debe tener 8 dígitos.');
    if (!nroVisita) return Alert.alert('Falta Visita', 'Ingresa el número de visita.');
    if (!fotosConjuntiva.length && !fotosLabio.length && !fotosIndice.length) {
      return Alert.alert('Sin fotos', 'Agrega al menos una foto (Conjuntiva, Labio o Índice).');
    }

    try {
      await saveRegistroNuevoOffline(
        dp,
        { ...do_, semanasEmbarazo: semanasEmbarazoCalc },
        Number(nroVisita),
        fotosConjuntiva,
        fotosLabio,
        fotosIndice
      );
      Alert.alert(
        '✅ Registro guardado', 
        'El registro se almacenó y se sincronizará cuando haya conexión.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('MenuRegistro')
          }
        ]
      );
      setFotosConjuntiva([]); setFotosLabio([]); setFotosIndice([]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar localmente.');
    }
  };

  return (
    <ScrollView contentContainerStyle={localStyles.container}>
      <Text style={localStyles.h1}>Nuevo registro</Text>

      <Text style={localStyles.h2}>Datos Personales</Text>
      
      {/* DNI con botón de búsqueda */}
      <View style={{ marginBottom: 10 }}>
        <Text style={localStyles.label}>DNI</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TextInput
            style={[localStyles.input, { flex: 1 }]}
            value={dp.dni}
            onChangeText={handleDniChange}
            keyboardType="number-pad"
            maxLength={8}
            placeholder="Ingresa DNI"
          />
          <TouchableOpacity
            style={[localStyles.btnBuscar, buscandoDNI && { opacity: 0.5 }]}
            onPress={buscarDNI}
            disabled={buscandoDNI}
          >
            {buscandoDNI ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="search" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Input label="Nombre" value={dp.nombre} onChangeText={(v: string) => setDp(s => ({ ...s, nombre: v }))} />
      <Input label="Apellido" value={dp.apellido} onChangeText={(v: string) => setDp(s => ({ ...s, apellido: v }))} />
      <Input 
        label="Edad" 
        value={dp.edad} 
        onChangeText={(v: string) => {
          const edad = onlyDigits(v);
          const edadNum = parseInt(edad);
          if (edad === '' || (edadNum >= 0 && edadNum <= 130)) {
            setDp(s => ({ ...s, edad }));
          } else if (edadNum > 130) {
            Alert.alert('Edad inválida', 'La edad máxima permitida es 130 años.');
          }
        }} 
        keyboardType="number-pad"
        maxLength={3}
      />
      
      {/* Selectores de Región, Provincia y Distrito */}
      <View style={{ marginBottom: 10 }}>
        <Text style={localStyles.label}>Región / Departamento</Text>
        <View style={localStyles.pickerContainer}>
          <Picker
            selectedValue={dp.region}
            onValueChange={handleRegionChange}
            style={localStyles.picker}
          >
            <Picker.Item label="Selecciona una región..." value="" />
            {ubigeoData.map(dpto => (
              <Picker.Item key={dpto.nombre} label={dpto.nombre} value={dpto.nombre} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={{ marginBottom: 10 }}>
        <Text style={localStyles.label}>Provincia</Text>
        <View style={localStyles.pickerContainer}>
          <Picker
            selectedValue={dp.provincia}
            onValueChange={handleProvinciaChange}
            style={localStyles.picker}
            enabled={!!dp.region}
          >
            <Picker.Item label={dp.region ? "Selecciona una provincia..." : "Primero selecciona región"} value="" />
            {provinciasDisponibles.map(prov => (
              <Picker.Item key={prov.nombre} label={prov.nombre} value={prov.nombre} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={{ marginBottom: 10 }}>
        <Text style={localStyles.label}>Distrito</Text>
        <View style={localStyles.pickerContainer}>
          <Picker
            selectedValue={dp.distrito}
            onValueChange={(v: string) => setDp(s => ({ ...s, distrito: v }))}
            style={localStyles.picker}
            enabled={!!dp.provincia}
          >
            <Picker.Item label={dp.provincia ? "Selecciona un distrito..." : "Primero selecciona provincia"} value="" />
            {distritosDisponibles.map(dist => (
              <Picker.Item key={dist.id} label={dist.nombre} value={dist.nombre} />
            ))}
          </Picker>
        </View>
      </View>

      <Input label="Dirección" value={dp.direccion} onChangeText={(v: string) => setDp(s => ({ ...s, direccion: v }))} />
      <Input label="Maps URL" value={dp.mapsUrl} onChangeText={(v: string) => setDp(s => ({ ...s, mapsUrl: v }))} placeholder="https://www.google.com/maps?q=lat,lng" />

      {/* Sección de Ubicación con ayuda */}
      <View style={localStyles.gpsSection}>
        <View style={localStyles.gpsHeader}>
          <Text style={localStyles.gpsTitle}>📍 Ubicación del Paciente</Text>
          <TouchableOpacity onPress={() => Alert.alert(
            'Cómo funciona',
            '📍 El botón captura automáticamente:\n\n✅ Coordenadas GPS (siempre, con o sin internet)\n✅ Dirección (si hay internet)\n\n⚠️ Región, Provincia y Distrito:\nDebes seleccionarlos manualmente desde los catálogos desplegables.\n\nSin internet, las coordenadas se guardan y sincronizarán después.',
            [{ text: 'Entendido' }]
          )}>
            <Ionicons name="help-circle" size={24} color={COLORS.info} />
          </TouchableOpacity>
        </View>
        <Text style={localStyles.gpsHint}>
          Captura GPS y luego selecciona región, provincia y distrito manualmente.
        </Text>
        <TouchableOpacity 
          style={[commonStyles.btn, commonStyles.btnSecondary, { marginTop: 8 }]} 
          onPress={capturarUbicacion}
          disabled={capturandoUbicacion}
        >
          {capturandoUbicacion ? (
            <>
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              <Text style={commonStyles.btnText}>Capturando ubicación...</Text>
            </>
          ) : (
            <>
              <Ionicons name="location" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={commonStyles.btnText}>Capturar Ubicación</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={localStyles.h2}>Datos Obstétricos</Text>
      <Input label="Pulsaciones por minuto" value={do_.pulsaciones} onChangeText={(v: string) => setDo(s => ({ ...s, pulsaciones: v.replace(/\D/g, '') }))} keyboardType="number-pad" />
      <Input label="Hemoglobina (g/dL)" value={do_.hemoglobina} onChangeText={(v: string) => setDo(s => ({ ...s, hemoglobina: v }))} keyboardType="decimal-pad" />
      <Input label="Oxígeno en sangre (%)" value={do_.oxigeno} onChangeText={(v: string) => { const num = parseInt(v.replace(/\D/g, '') || '0'); setDo(s => ({ ...s, oxigeno: num > 100 ? '100' : v.replace(/\D/g, '') })); }} keyboardType="number-pad" />
      
      {/* DatePicker para fecha del último periodo */}
      <View style={{ marginBottom: 10 }}>
        <Text style={localStyles.label}>Fecha del último periodo</Text>
        <TouchableOpacity 
          style={localStyles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={localStyles.dateText}>
            {do_.fechaUltimoPeriodo || 'Seleccionar fecha'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={do_.fechaUltimoPeriodo ? new Date(do_.fechaUltimoPeriodo) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>
      
      <Text style={localStyles.calcText}>Semanas de embarazo: <Text style={{ color: COLORS.primary, fontWeight: '800' }}>{semanasEmbarazoCalc}</Text></Text>

      {/* N° de visita no editable */}
      <View style={{ marginBottom: 10 }}>
        <Text style={localStyles.label}>N° de visita</Text>
        <View style={localStyles.readOnlyInput}>
          <Text style={localStyles.readOnlyText}>{nroVisita}</Text>
          <Text style={localStyles.readOnlyHint}>(Primera visita)</Text>
        </View>
      </View>

      <Text style={localStyles.h2}>Fotos</Text>
      <Text style={localStyles.h3}>Conjuntiva</Text>
      <Row>
        <SmallBtn color="#e53935" icon="camera" onPress={() => onPickFoto('Conjuntiva', 'camera')} text="Cámara" />
        <SmallBtn color="#3949ab" icon="images" onPress={() => onPickFoto('Conjuntiva', 'gallery')} text="Galería" />
      </Row>
      <PreviewGrid fotos={fotosConjuntiva} />

      <Text style={localStyles.h3}>Labio</Text>
      <Row>
        <SmallBtn color="#e53935" icon="camera" onPress={() => onPickFoto('Labio', 'camera')} text="Cámara" />
        <SmallBtn color="#3949ab" icon="images" onPress={() => onPickFoto('Labio', 'gallery')} text="Galería" />
      </Row>
      <PreviewGrid fotos={fotosLabio} />

      <Text style={localStyles.h3}>Índice</Text>
      <Row>
        <SmallBtn color="#e53935" icon="camera" onPress={() => onPickFoto('Indice', 'camera')} text="Cámara" />
        <SmallBtn color="#3949ab" icon="images" onPress={() => onPickFoto('Indice', 'gallery')} text="Galería" />
      </Row>
      <PreviewGrid fotos={fotosIndice} />

      <TouchableOpacity style={[commonStyles.btn, commonStyles.btnSuccess]} onPress={guardarRegistro}>
        <Text style={commonStyles.btnText}>Guardar registro</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/** UI helpers tipados */
type InputProps = {
  label: string; value?: string; onChangeText?: (text: string) => void;
} & Omit<TextInputProps, 'value' | 'onChangeText'>;

const Input: React.FC<InputProps> = ({ label, value, onChangeText, ...rest }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={localStyles.label}>{label}</Text>
    <TextInput value={value} onChangeText={onChangeText} placeholderTextColor="#99a" {...rest} style={localStyles.input} />
  </View>
);

const Row: React.FC<React.PropsWithChildren> = ({ children }) => (
  <View style={{ flexDirection: 'row', gap: 10, marginVertical: 8 }}>{children}</View>
);

type SmallBtnProps = { color: string; icon: any; text: string; onPress: () => void };
const SmallBtn: React.FC<SmallBtnProps> = ({ color, icon, text, onPress }) => (
  <TouchableOpacity style={[localStyles.smallBtn, { backgroundColor: color }]} onPress={onPress}>
    <Ionicons name={icon} size={18} color="#fff" />
    <Text style={localStyles.smallBtnText}> {text}</Text>
  </TouchableOpacity>
);

const PreviewGrid: React.FC<{ fotos: Foto[] }> = ({ fotos }) => (
  <View style={localStyles.previewGrid}>
    {fotos.map((f, i) => <Image key={i} source={{ uri: f.uri }} style={localStyles.thumb} />)}
  </View>
);

// Estilos específicos de esta pantalla
const localStyles = StyleSheet.create({
  container: { padding: 20, backgroundColor: COLORS.bg, flexGrow: 1 },
  h1: { color: COLORS.text, fontWeight: '800', fontSize: 24, marginBottom: 16, textAlign: 'center' },
  h2: { 
    color: COLORS.primary, 
    fontWeight: '800', 
    fontSize: 18, 
    marginTop: 20, 
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  h3: { color: COLORS.text, fontWeight: '700', fontSize: 16, marginTop: 12, marginBottom: 8 },
  label: { color: COLORS.text, fontWeight: '600', marginBottom: 4, fontSize: 14 },
  input: {
    backgroundColor: '#FFFFFF', 
    color: COLORS.text, 
    borderRadius: 12,
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  calcText: { color: COLORS.subtext, marginBottom: 6, marginTop: -4, fontSize: 14 },
  btnFlex: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  smallBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 14, 
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  smallBtnText: { color: '#fff', fontWeight: '700', marginLeft: 4 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  thumb: { 
    width: 90, 
    height: 90, 
    borderRadius: 10, 
    backgroundColor: COLORS.border,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gpsSection: {
    backgroundColor: '#E8F4F8',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  gpsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gpsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  gpsHint: {
    fontSize: 13,
    color: COLORS.subtext,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dateText: {
    color: COLORS.text,
    fontSize: 15,
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.ghostBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  readOnlyText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  readOnlyHint: {
    color: COLORS.subtext,
    fontSize: 12,
    fontStyle: 'italic',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.text,
    height: Platform.OS === 'ios' ? 180 : 50,
  },
  btnBuscar: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
