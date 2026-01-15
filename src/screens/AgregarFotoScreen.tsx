import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ScrollView, TextInputProps, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { enqueueAgregarFotosOffline } from '../libs/outbox';
import { commonStyles, COLORS} from '../styles';
import { BASE_URL } from '../libs/sync';

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
  const [nroVisita, setNroVisita] = useState('');
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [fotosConjuntiva, setFotosConjuntiva] = useState<Foto[]>([]);
  const [fotosLabio, setFotosLabio] = useState<Foto[]>([]);
  const [fotosIndice, setFotosIndice] = useState<Foto[]>([]);

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

  const buscarPaciente = async () => {
    if (!dni || dni.length !== 8) {
      return Alert.alert('DNI inválido', 'Ingresa un DNI de 8 dígitos');
    }

    setBuscando(true);
    try {
      // Primero verificar en la BD local
      const { db } = await import('../libs/db');
      const localRecords = db.getAllSync('SELECT dni, nro_visita, payload FROM records WHERE dni = ?', [dni]);
      
      let pacienteEncontrado = false;
      
      if (localRecords.length > 0) {
        // Paciente existe en BD local
        const firstRecord = localRecords[0] as { dni: string; nro_visita: number; payload: string };
        const payload = JSON.parse(firstRecord.payload);
        const nombre = payload.datos_personales?.nombre || '';
        const apellido = payload.datos_personales?.apellido || '';
        const totalVisitas = localRecords.length;
        const siguienteVisita = totalVisitas + 1;
        
        setNombrePaciente(`${nombre} ${apellido}`);
        setNroVisita(siguienteVisita.toString());
        pacienteEncontrado = true;
        
        Alert.alert(
          '✅ Paciente encontrado (BD Local)',
          `Nombre: ${nombre} ${apellido}\nVisitas previas: ${totalVisitas}\nSiguiente visita: ${siguienteVisita}`
        );
      } else {
        // Si no está en local, buscar en el servidor
        try {
          const response = await fetch(`${BASE_URL}/api/mucosa/registro/${dni}/info`);
          const data = await response.json();

          if (response.ok) {
            setNombrePaciente(`${data.nombre} ${data.apellido}`);
            setNroVisita(data.siguiente_visita.toString());
            pacienteEncontrado = true;
            Alert.alert(
              '✅ Paciente encontrado (Servidor)',
              `Nombre: ${data.nombre} ${data.apellido}\nVisitas previas: ${data.total_visitas}\nSiguiente visita: ${data.siguiente_visita}`
            );
          }
        } catch (error) {
          console.error('Error al buscar en servidor:', error);
        }
      }
      
      // Si no se encontró ni en local ni en servidor
      if (!pacienteEncontrado) {
        setNombrePaciente('');
        setNroVisita('');
        Alert.alert(
          '⚠️ Paciente no registrado',
          `El DNI ${dni} no tiene ningún registro previo en el sistema.\n\nPara agregar fotos, primero debe registrar al paciente con sus datos personales.`,
          [
            {
              text: 'Cancelar',
              style: 'cancel'
            },
            {
              text: 'Ir a Nuevo Registro',
              onPress: () => navigation.navigate('RegistroNuevo')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo verificar el paciente');
      console.error(error);
    } finally {
      setBuscando(false);
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

  const adjuntar = async () => {
    if (!dni) return Alert.alert('Falta DNI', 'Ingresa el DNI.');
    if (dni.length !== 8) return Alert.alert('DNI inválido', 'El DNI debe tener 8 dígitos.');
    if (!nroVisita) return Alert.alert('Falta Visita', 'Ingresa el número de visita.');
    if (!fotosConjuntiva.length && !fotosLabio.length && !fotosIndice.length) {
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
        fotosIndice,
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
      
      {/* DNI con botón de búsqueda */}
      <View style={{ marginBottom: 10 }}>
        <Text style={localStyles.label}>DNI</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TextInput
            style={[localStyles.input, { flex: 1 }]}
            value={dni}
            onChangeText={handleDniChange}
            keyboardType="number-pad"
            maxLength={8}
            placeholder="Ingresa DNI"
          />
          <TouchableOpacity
            style={[localStyles.btnBuscar, buscando && { opacity: 0.5 }]}
            onPress={buscarPaciente}
            disabled={buscando}
          >
            {buscando ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="search" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Nombre del paciente (solo lectura) */}
      {nombrePaciente ? (
        <View style={{ marginBottom: 10 }}>
          <Text style={localStyles.label}>Paciente</Text>
          <View style={localStyles.readOnlyInput}>
            <Text style={localStyles.readOnlyText}>{nombrePaciente}</Text>
          </View>
        </View>
      ) : null}
      
      {/* N° de visita (auto-calculado) */}
      <View style={{ marginBottom: 10 }}>
        <Text style={localStyles.label}>N° de visita</Text>
        <View style={localStyles.readOnlyInput}>
          <Text style={localStyles.readOnlyText}>{nroVisita || '---'}</Text>
          <Text style={localStyles.readOnlyHint}>{nroVisita ? '(Auto-calculado)' : '(Busca un paciente)'}</Text>
        </View>
      </View>

      {/* Obstétricos de esta visita */}
      <Text style={localStyles.h2}>Datos Obstétricos (visita {nroVisita})</Text>
      <Input label="Pulsaciones por minuto" value={do2.pulsaciones} onChangeText={(v: string) => setDo2(s => ({ ...s, pulsaciones: v.replace(/\D/g, '') }))} keyboardType="number-pad" />
      <Input label="Hemoglobina (g/dL)" value={do2.hemoglobina} onChangeText={(v: string) => setDo2(s => ({ ...s, hemoglobina: v }))} keyboardType="decimal-pad" />
      <Input label="Oxígeno en sangre (%)" value={do2.oxigeno} onChangeText={(v: string) => { const num = parseInt(v.replace(/\D/g, '') || '0'); setDo2(s => ({ ...s, oxigeno: num > 100 ? '100' : v.replace(/\D/g, '') })); }} keyboardType="number-pad" />

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

      <Text style={localStyles.h2}>Índice</Text>
      <Row>
        <SmallBtn color="#e53935" icon="camera" onPress={() => onPickFoto('Indice', 'camera')} text="Cámara" />
        <SmallBtn color="#3949ab" icon="images" onPress={() => onPickFoto('Indice', 'gallery')} text="Galería" />
      </Row>
      <PreviewGrid fotos={fotosIndice} />

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
