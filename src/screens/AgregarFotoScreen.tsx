// src/screens/AgregarFotosScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ScrollView, TextInputProps,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { enqueueAgregarFotosOffline } from '../libs/outbox';

type Foto = { uri: string };

type DatosObstetricos = {
  pulsaciones: string;
  hemoglobina: string;
  oxigeno: string;
  fechaUltimoPeriodo: string; 
  semanasEmbarazo: number; 
};

const onlyDigits = (s: string) => s.replace(/\D/g, '');
const formatYYYYMMDD = (raw: string) => {
  const d = onlyDigits(raw).slice(0, 8); // YYYYMMDD
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0,4)}-${d.slice(4)}`;
  return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6)}`;
};

const calcularSemanas = (fechaISO: string) => {
  if (!fechaISO || fechaISO.length !== 10) return 0;
  const d0 = new Date(fechaISO + 'T00:00:00');
  if (isNaN(d0.getTime())) return 0;
  const diffMs = Date.now() - d0.getTime();
  return Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)), 0);
};

export default function AgregarFotosScreen() {
  const [dni, setDni] = useState('');
  const [nroVisita, setNroVisita] = useState('2');
  const [fotosConjuntiva, setFotosConjuntiva] = useState<Foto[]>([]);
  const [fotosLabio, setFotosLabio] = useState<Foto[]>([]);

  // Obstétricos de la visita actual (v2, v3, etc.)
  const [do2, setDo2] = useState<DatosObstetricos>({
    pulsaciones: '',
    hemoglobina: '',
    oxigeno: '',
    fechaUltimoPeriodo: '',
    semanasEmbarazo: 0,
  });
  const semanasCalc = useMemo(
    () => calcularSemanas(do2.fechaUltimoPeriodo),
    [do2.fechaUltimoPeriodo]
  );

  const handleDniChange = (v: string) => setDni(onlyDigits(v).slice(0, 8));
  const handleFechaChange = (v: string) => setDo2(s => ({ ...s, fechaUltimoPeriodo: formatYYYYMMDD(v) }));

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

  const adjuntar = async () => {
    if (!dni) return Alert.alert('Falta DNI', 'Ingresa el DNI.');
    if (dni.length !== 8) return Alert.alert('DNI inválido', 'El DNI debe tener 8 dígitos.');
    if (!nroVisita) return Alert.alert('Falta Visita', 'Ingresa el número de visita.');
    if (!fotosConjuntiva.length && !fotosLabio.length) {
      return Alert.alert('Sin fotos', 'Selecciona al menos una foto.');
    }

    try {
      const obst = { ...do2, semanasEmbarazo: semanasCalc };
      // Encola: 1) JSON con obstétricos de esta visita  2) Fotos
      await enqueueAgregarFotosOffline(
        dni,
        Number(nroVisita),
        fotosConjuntiva,
        fotosLabio,
        obst 
      );

      Alert.alert('Guardado', 'Datos de visita y fotos encolados para sincronizar.');
      setFotosConjuntiva([]); setFotosLabio([]);
      // Si quieres limpiar obstétricos:
      // setDo2({ pulsaciones:'', hemoglobina:'', oxigeno:'', fechaUltimoPeriodo:'', semanasEmbarazo:0 });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar localmente.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Agregar fotos a registro</Text>
      <Input label="DNI" value={dni} onChangeText={handleDniChange} keyboardType="number-pad" maxLength={8} />
      <Input label="N° de visita" value={nroVisita} onChangeText={(v: string) => setNroVisita(v)} keyboardType="number-pad" />

      {/* Obstétricos de esta visita */}
      <Text style={styles.h2}>Datos Obstétricos (visita {nroVisita})</Text>
      <Input label="Pulsaciones por minuto" value={do2.pulsaciones} onChangeText={(v: string) => setDo2(s => ({ ...s, pulsaciones: v }))} keyboardType="number-pad" />
      <Input label="Hemoglobina (g/dL)" value={do2.hemoglobina} onChangeText={(v: string) => setDo2(s => ({ ...s, hemoglobina: v }))} keyboardType="decimal-pad" />
      <Input label="Oxígeno en sangre (%)" value={do2.oxigeno} onChangeText={(v: string) => setDo2(s => ({ ...s, oxigeno: v }))} keyboardType="decimal-pad" />
      <Input
        label="Fecha del último periodo (YYYY-MM-DD)"
        value={do2.fechaUltimoPeriodo}
        onChangeText={handleFechaChange}
        keyboardType="number-pad"
        maxLength={10}
        placeholder="YYYY-MM-DD"
      />
      <Text style={{ color: '#aab', marginBottom: 6, marginTop: -4 }}>
        Semanas de embarazo (auto): <Text style={{ color: '#fff', fontWeight: '800' }}>{semanasCalc}</Text>
      </Text>

      <Text style={styles.h2}>Conjuntiva</Text>
      <Row>
        <SmallBtn color="#e53935" icon="camera" onPress={() => onPickFoto('Conjuntiva', 'camera')} text="Cámara" />
        <SmallBtn color="#3949ab" icon="images" onPress={() => onPickFoto('Conjuntiva', 'gallery')} text="Galería" />
      </Row>
      <PreviewGrid fotos={fotosConjuntiva} />

      <Text style={styles.h2}>Labio</Text>
      <Row>
        <SmallBtn color="#e53935" icon="camera" onPress={() => onPickFoto('Labio', 'camera')} text="Cámara" />
        <SmallBtn color="#3949ab" icon="images" onPress={() => onPickFoto('Labio', 'gallery')} text="Galería" />
      </Row>
      <PreviewGrid fotos={fotosLabio} />

      <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={adjuntar}>
        <Text style={styles.btnSaveText}>Adjuntar fotos y datos</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/** UI helpers */
type InputProps = { label: string; value?: string; onChangeText?: (text: string) => void; } & Omit<TextInputProps, 'value' | 'onChangeText'>;

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
  h2: { color: '#cfd3ff', fontWeight: '700', marginTop: 10, marginBottom: 6 },
  label: { color: '#aab' },
  input: {
    backgroundColor: '#1a2033', color: '#fff', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#2c3350',
  },
  smallBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  smallBtnText: { color: '#fff', fontWeight: '700' },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  thumb: { width: 90, height: 90, borderRadius: 10, backgroundColor: '#222' },
  btn: { alignItems: 'center', paddingVertical: 12, borderRadius: 12, marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  btnSave: { backgroundColor: '#00b894' },
  btnSaveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
