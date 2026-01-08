// src/screens/RegistroNuevoScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert,
  ScrollView, TextInputProps,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { saveRegistroNuevoOffline } from '../libs/outbox';

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
const formatYMD = (input: string) => {
  const d = onlyDigits(input).slice(0, 8); // YYYYMMDD (máx 8 dígitos)
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
};

export default function RegistroNuevoScreen() {
  const [nroVisita, setNroVisita] = useState('1');
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

  /** onChange Fecha: auto YYYY-MM-DD */
  const handleFechaChange = (v: string) => {
    const fmt = formatYMD(v);
    setDo(s => ({ ...s, fechaUltimoPeriodo: fmt }));
  };

  const onPickFoto = async (tipo: 'Conjuntiva' | 'Labio', from: 'camera' | 'gallery') => {
    try {
      if (from === 'camera') {
        const res = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
        if (!res.canceled && res.assets?.length) {
          const nuevas = res.assets.map(a => ({ uri: a.uri }));
          if (tipo === 'Conjuntiva') setFotosConjuntiva(p => [...p, ...nuevas]); else setFotosLabio(p => [...p, ...nuevas]);
        }
      } else {
        const res = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: false, quality: 0.8, allowsMultipleSelection: true, selectionLimit: 10,
        } as any);
        if (!res.canceled && res.assets?.length) {
          const nuevas = res.assets.map(a => ({ uri: a.uri }));
          if (tipo === 'Conjuntiva') setFotosConjuntiva(p => [...p, ...nuevas]); else setFotosLabio(p => [...p, ...nuevas]);
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar/tomar la foto.');
    }
  };

  /** Captura GPS SIEMPRE (offline o online) y genera el Maps URL localmente */
  const capturarGps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere permiso de ubicación.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

      setDp(s => ({ ...s, lat: latitude, lng: longitude, mapsUrl }));
      Alert.alert('GPS guardado', 'Coordenadas y link de Maps listos. La dirección se completará con Internet.');
    } catch {
      Alert.alert('Error', 'No se pudo obtener la ubicación.');
    }
  };

  /** Completa dirección vía reverse geocoding (requiere Internet). */
  const completarDireccion = async () => {
    try {
      const net = await NetInfo.fetch();
      if (!net.isConnected || net.isInternetReachable === false) {
        Alert.alert('Sin Internet', 'Conéctate para completar la dirección automáticamente.');
        return;
      }

      let lat = dp.lat, lng = dp.lng;
      if (lat == null || lng == null) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se requiere permiso de ubicación.');
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude; lng = loc.coords.longitude;
        setDp(s => ({ ...s, lat, lng, mapsUrl: `https://www.google.com/maps?q=${lat},${lng}` }));
      }

      const [addr] = await Location.reverseGeocodeAsync({ latitude: lat!, longitude: lng! });
      setDp(s => ({
        ...s,
        region: addr?.region ?? s.region,
        provincia: addr?.city ?? addr?.subregion ?? s.provincia,
        distrito: addr?.district ?? s.distrito,
        direccion: [addr?.street, addr?.name, addr?.postalCode].filter(Boolean).join(' ') || s.direccion,
        mapsUrl: s.mapsUrl || `https://www.google.com/maps?q=${lat},${lng}`,
      }));
      Alert.alert('Listo', 'Dirección completada.');
    } catch {
      Alert.alert('Error', 'No se pudo completar la dirección.');
    }
  };

  const guardarRegistro = async () => {
    if (!dp.dni) return Alert.alert('Falta DNI', 'Ingresa el DNI.');
    if (dp.dni.length !== 8) return Alert.alert('DNI inválido', 'El DNI debe tener 8 dígitos.');
    if (!nroVisita) return Alert.alert('Falta Visita', 'Ingresa el número de visita.');
    if (!fotosConjuntiva.length && !fotosLabio.length) {
      return Alert.alert('Sin fotos', 'Agrega al menos una foto (Conjuntiva o Labio).');
    }

    try {
      await saveRegistroNuevoOffline(
        dp,
        { ...do_, semanasEmbarazo: semanasEmbarazoCalc },
        Number(nroVisita),
        fotosConjuntiva,
        fotosLabio
      );
      Alert.alert('Guardado', 'Registro almacenado y encolado para sincronizar.');
      setFotosConjuntiva([]); setFotosLabio([]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar localmente.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Nuevo registro</Text>

      <Text style={styles.h2}>Datos Personales</Text>
      <Input
        label="DNI"
        value={dp.dni}
        onChangeText={handleDniChange}
        keyboardType="number-pad"
        maxLength={8} // 8 dígitos
      />
      <Input label="Nombre" value={dp.nombre} onChangeText={(v: string) => setDp(s => ({ ...s, nombre: v }))} />
      <Input label="Apellido" value={dp.apellido} onChangeText={(v: string) => setDp(s => ({ ...s, apellido: v }))} />
      <Input label="Edad" value={dp.edad} onChangeText={(v: string) => setDp(s => ({ ...s, edad: v }))} keyboardType="number-pad" />
      <Input label="Región" value={dp.region} onChangeText={(v: string) => setDp(s => ({ ...s, region: v }))} />
      <Input label="Provincia" value={dp.provincia} onChangeText={(v: string) => setDp(s => ({ ...s, provincia: v }))} />
      <Input label="Distrito" value={dp.distrito} onChangeText={(v: string) => setDp(s => ({ ...s, distrito: v }))} />
      <Input label="Dirección" value={dp.direccion} onChangeText={(v: string) => setDp(s => ({ ...s, direccion: v }))} />
      <Input label="Maps URL" value={dp.mapsUrl} onChangeText={(v: string) => setDp(s => ({ ...s, mapsUrl: v }))} placeholder="https://www.google.com/maps?q=lat,lng" />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={capturarGps}>
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={styles.btnText}> Capturar GPS (offline)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={completarDireccion}>
          <Ionicons name="earth" size={18} color="#fff" />
          <Text style={styles.btnText}> Completar dirección</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.h2}>Datos Obstétricos</Text>
      <Input label="Pulsaciones por minuto" value={do_.pulsaciones} onChangeText={(v: string) => setDo(s => ({ ...s, pulsaciones: v }))} keyboardType="number-pad" />
      <Input label="Hemoglobina (g/dL)" value={do_.hemoglobina} onChangeText={(v: string) => setDo(s => ({ ...s, hemoglobina: v }))} keyboardType="decimal-pad" />
      <Input label="Oxígeno en sangre (%)" value={do_.oxigeno} onChangeText={(v: string) => setDo(s => ({ ...s, oxigeno: v }))} keyboardType="decimal-pad" />
      <Input
        label="Fecha del último periodo (YYYY-MM-DD)"
        value={do_.fechaUltimoPeriodo}
        onChangeText={handleFechaChange}
        keyboardType="number-pad"
        maxLength={10} // YYYY-MM-DD
        placeholder="YYYY-MM-DD"
      />
      <Text style={styles.calcText}>Semanas de embarazo (auto): <Text style={{ color: '#fff', fontWeight: '800' }}>{semanasEmbarazoCalc}</Text></Text>

      <Input label="N° de visita" value={nroVisita} onChangeText={(v: string) => setNroVisita(v)} keyboardType="number-pad" />

      <Text style={styles.h2}>Fotos</Text>
      <Text style={styles.h3}>Conjuntiva</Text>
      <Row>
        <SmallBtn color="#e53935" icon="camera" onPress={() => onPickFoto('Conjuntiva', 'camera')} text="Cámara" />
        <SmallBtn color="#3949ab" icon="images" onPress={() => onPickFoto('Conjuntiva', 'gallery')} text="Galería" />
      </Row>
      <PreviewGrid fotos={fotosConjuntiva} />

      <Text style={styles.h3}>Labio</Text>
      <Row>
        <SmallBtn color="#e53935" icon="camera" onPress={() => onPickFoto('Labio', 'camera')} text="Cámara" />
        <SmallBtn color="#3949ab" icon="images" onPress={() => onPickFoto('Labio', 'gallery')} text="Galería" />
      </Row>
      <PreviewGrid fotos={fotosLabio} />

      <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={guardarRegistro}>
        <Text style={styles.btnSaveText}>Guardar registro</Text>
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
    <Text style={styles.label}>{label}</Text>
    <TextInput value={value} onChangeText={onChangeText} placeholderTextColor="#99a" {...rest} style={styles.input} />
  </View>
);

const Row: React.FC<React.PropsWithChildren> = ({ children }) => (
  <View style={{ flexDirection: 'row', gap: 10, marginVertical: 8 }}>{children}</View>
);

type SmallBtnProps = { color: string; icon: any; text: string; onPress: () => void };
const SmallBtn: React.FC<SmallBtnProps> = ({ color, icon, text, onPress }) => (
  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: color }]} onPress={onPress}>
    <Ionicons name={icon} size={18} color="#fff" />
    <Text style={styles.smallBtnText}> {text}</Text>
  </TouchableOpacity>
);

const PreviewGrid: React.FC<{ fotos: Foto[] }> = ({ fotos }) => (
  <View style={styles.previewGrid}>
    {fotos.map((f, i) => <Image key={i} source={{ uri: f.uri }} style={styles.thumb} />)}
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#0e1220', flexGrow: 1 },
  h1: { color: '#fff', fontWeight: '800', fontSize: 20, marginBottom: 10 },
  h2: { color: '#fff', fontWeight: '800', fontSize: 16, marginTop: 14, marginBottom: 6 },
  h3: { color: '#cfd3ff', fontWeight: '700', marginTop: 6 },
  label: { color: '#aab' },
  input: {
    backgroundColor: '#1a2033', color: '#fff', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#2c3350',
  },
  calcText: { color: '#aab', marginBottom: 6, marginTop: -4 },
  btn: { alignItems: 'center', paddingVertical: 12, borderRadius: 12, marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnSecondary: { backgroundColor: '#3949ab' },
  smallBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  smallBtnText: { color: '#fff', fontWeight: '700' },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  thumb: { width: 90, height: 90, borderRadius: 10, backgroundColor: '#222' },
  btnSave: { backgroundColor: '#00b894' },
  btnSaveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
