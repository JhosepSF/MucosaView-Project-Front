// src/screens/MenuRegistroScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Modal, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { trySync, debugDumpQueue } from '../libs/sync';
import { purgeQueueAll, resetDatabase, nukeAllStorage, purgeUnsyncedByDni } from '../libs/maintenance';

export default function MenuRegistroScreen() {
  const navigation = useNavigation<any>();
  const [dniModal, setDniModal] = useState(false);
  const [dni, setDni] = useState('');

  const onPurgeQueue = () => {
    purgeQueueAll();
    Alert.alert('Hecho', 'Cola vaciada.');
    debugDumpQueue();
  };

  const onResetDb = () => {
    Alert.alert('Confirmar', 'Esto borrará TODAS las tablas locales. ¿Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, borrar', style: 'destructive', onPress: () => { resetDatabase(); Alert.alert('Listo', 'DB reiniciada'); } },
    ]);
  };

  const onNukeAll = async () => {
    Alert.alert('MUY PELIGROSO', 'Borra cola, tablas y fotos locales. ¿Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, borrar todo', style: 'destructive', onPress: async () => {
          await nukeAllStorage();
          Alert.alert('Listo', 'Todo el almacenamiento local fue borrado.');
        }
      },
    ]);
  };

  const onPurgeByDni = () => {
    setDniModal(true);
  };

  const confirmPurgeByDni = () => {
    if (!dni) return;
    purgeUnsyncedByDni(dni.trim());
    setDni('');
    setDniModal(false);
    Alert.alert('Hecho', `Se eliminó lo pendiente del DNI ${dni}.`);
    debugDumpQueue();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MucosaView</Text>
      <Image
        source={require('../../assets/Obstetra.png')} 
        style={styles.heroImg}
        resizeMode="contain"
      />
      <Text style={styles.subtitle}>¿Qué deseas hacer?</Text>

      <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => navigation.navigate('RegistroNuevo')}>
        <Text style={styles.btnText}>Crear nuevo registro</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => navigation.navigate('AgregarFotos')}>
        <Text style={styles.btnText}>Agregar fotos a registro existente</Text>
      </TouchableOpacity>

      {/* —— Sección DEV —— */}
      <View style={{ height: 1, backgroundColor: '#2c2f3f', width: '100%', marginVertical: 20 }} />

      <Text style={[styles.subtitle, { marginBottom: 8 }]}>Herramientas de depuración</Text>

      <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => navigation.navigate('SyncQueue')}>
        <Text style={styles.btnText}>Ver cola de Sync</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => trySync()}>
        <Text style={styles.btnText}>Forzar Sync ahora</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.btnWarn]} onPress={onPurgeQueue}>
        <Text style={styles.btnText}>Vaciar cola (solo ops)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.btnWarn]} onPress={onPurgeByDni}>
        <Text style={styles.btnText}>Borrar PENDIENTE por DNI…</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={onResetDb}>
        <Text style={styles.btnText}>Reiniciar DB (DROP + crear)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={onNukeAll}>
        <Text style={styles.btnText}>Borrar TODO local (incl. fotos)</Text>
      </TouchableOpacity>

      {/* Modal simple para pedir DNI */}
      <Modal visible={dniModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 10 }}>Eliminar pendiente por DNI</Text>
            <TextInput
              placeholder="DNI"
              placeholderTextColor="#889"
              value={dni}
              onChangeText={setDni}
              style={styles.input}
              keyboardType="number-pad"
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity style={[styles.btnSm, styles.btnGhost]} onPress={() => setDniModal(false)}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSm, styles.btnWarn]} onPress={confirmPurgeByDni}>
                <Text style={styles.btnText}>Borrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const OB_COLORS = {
  bg:        '#FFF7FB', // rosa muy claro
  card:      '#FFFFFF', // blanco
  text:      '#4B2142', // ciruela (legible en fondo claro)
  subtext:   '#8B6B85', // lavanda apagado

  primary:   '#7A1E61', // guinda/plum
  secondary: '#A78BFA', // lila suave
  accent:    '#F472B6', // rosa
  ghostBg:   '#F8EAF6', // rosa/lila muy suave
  border:    '#E9D5FF', // lavanda pálido

  warn:      '#D97706', // ámbar
  danger:    '#BE123C', // rojo frambuesa
};

// Estilos del menú principal 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OB_COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: OB_COLORS.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: OB_COLORS.subtext, marginTop: 8, marginBottom: 12 },

  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  btnPrimary:   { backgroundColor: OB_COLORS.primary },
  btnSecondary: { backgroundColor: OB_COLORS.secondary },
  btnGhost:     { backgroundColor: OB_COLORS.ghostBg, borderWidth: 1, borderColor: OB_COLORS.border },
  btnWarn:      { backgroundColor: OB_COLORS.warn },
  btnDanger:    { backgroundColor: OB_COLORS.danger },

  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  // Si usas el ghost con fondo claro, puedes sobreescribir el texto así:
  // btnTextGhost: { color: OB_COLORS.primary, fontWeight: '700', fontSize: 15 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(75,33,66,0.35)', // ciruela translúcido
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: OB_COLORS.card,
    padding: 16,
    borderRadius: 12,
    width: '88%',
    borderWidth: 1,
    borderColor: OB_COLORS.border,
  },

  input: {
    backgroundColor: '#F9F5FF', // lila muy claro
    color: OB_COLORS.text,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: OB_COLORS.border,
  },

  btnSm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  heroImg: {
  width: '48%',
  height: 80,
  marginTop: 4,
  marginBottom: 8,
  alignSelf: 'center',
  },
});