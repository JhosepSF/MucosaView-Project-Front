// src/screens/AgregarFotosScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ScrollView, TextInputProps,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { enqueueAgregarFotosOffline } from '../libs/outbox';
import { commonStyles, COLORS} from '../styles';

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
  const navigation = useNavigation<any>();
  const [dni, setDni] = useState('');
  const [nroVisita] = useState('2'); // No editable - Segunda visita
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
          if (tipo === 'Conjuntiva') setFotosConjuntiva(p => [...p, ...convertidas]); else setFotosLabio(p => [...p, ...convertidas]);
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
          if (tipo === 'Conjuntiva') setFotosConjuntiva(p => [...p, ...convertidas]); else setFotosLabio(p => [...p, ...convertidas]);
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

      Alert.alert(
        '✅ Fotos guardadas', 
        'Las fotos y datos se agregaron correctamente. Se sincronizarán cuando haya conexión.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('MenuRegistro')
          }
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar localmente.');
    }
  };

  return (
    <ScrollView contentContainerStyle={localStyles.container}>
      <Text style={localStyles.h1}>Agregar fotos a registro</Text>
      <Input label="DNI" value={dni} onChangeText={handleDniChange} keyboardType="number-pad" maxLength={8} />
      
      {/* N° de visita no editable */}
      <View style={{ marginBottom: 10 }}>
        <Text style={localStyles.label}>N° de visita</Text>
        <View style={localStyles.readOnlyInput}>
          <Text style={localStyles.readOnlyText}>{nroVisita}</Text>
          <Text style={localStyles.readOnlyHint}>(Segunda visita)</Text>
        </View>
      </View>

      {/* Obstétricos de esta visita */}
      <Text style={localStyles.h2}>Datos Obstétricos (visita {nroVisita})</Text>
      <Input label="Pulsaciones por minuto" value={do2.pulsaciones} onChangeText={(v: string) => setDo2(s => ({ ...s, pulsaciones: v }))} keyboardType="number-pad" />
      <Input label="Hemoglobina (g/dL)" value={do2.hemoglobina} onChangeText={(v: string) => setDo2(s => ({ ...s, hemoglobina: v }))} keyboardType="decimal-pad" />
      <Input label="Oxígeno en sangre (%)" value={do2.oxigeno} onChangeText={(v: string) => setDo2(s => ({ ...s, oxigeno: v }))} keyboardType="decimal-pad" />

      <Text style={localStyles.h2}>Conjuntiva</Text>
      <Row>
        <SmallBtn color="#e53935" icon="camera" onPress={() => onPickFoto('Conjuntiva', 'camera')} text="Cámara" />
        <SmallBtn color="#3949ab" icon="images" onPress={() => onPickFoto('Conjuntiva', 'gallery')} text="Galería" />
      </Row>
      <PreviewGrid fotos={fotosConjuntiva} />

      <Text style={localStyles.h2}>Labio</Text>
      <Row>
        <SmallBtn color="#e53935" icon="camera" onPress={() => onPickFoto('Labio', 'camera')} text="Cámara" />
        <SmallBtn color="#3949ab" icon="images" onPress={() => onPickFoto('Labio', 'gallery')} text="Galería" />
      </Row>
      <PreviewGrid fotos={fotosLabio} />

      <TouchableOpacity style={[commonStyles.btn, commonStyles.btnSuccess]} onPress={adjuntar}>
        <Text style={commonStyles.btnText}>Adjuntar fotos y datos</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/** UI helpers */
type InputProps = { label: string; value?: string; onChangeText?: (text: string) => void; } & Omit<TextInputProps, 'value' | 'onChangeText'>;

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
  smallBtn: { 
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
});
