// src/screens/MenuRegistroScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, Modal, Image, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { trySync, debugDumpQueue } from '../libs/sync';
import { purgeQueueAll, resetDatabase, nukeAllStorage, purgeUnsyncedByDni } from '../libs/maintenance';
import { commonStyles, COLORS } from '../styles';

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
    <ScrollView 
      style={{ flex: 1, backgroundColor: COLORS.bg }} 
      contentContainerStyle={{ 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 24, 
        paddingBottom: 40 
      }}
    >
      <Image
        source={require('../../assets/Obstetra.png')} 
        style={commonStyles.heroImg}
        resizeMode="contain"
      />
      <Text style={commonStyles.subtitle}>¿Qué deseas hacer?</Text>

      <TouchableOpacity style={[commonStyles.btn, localStyles.btnGreen]} onPress={() => navigation.navigate('RegistroNuevo')}>
        <Ionicons name="document-text" size={20} color="#fff" style={localStyles.icon} />
        <Text style={commonStyles.btnText}>Crear nuevo registro</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[commonStyles.btn, localStyles.btnBlue]} onPress={() => navigation.navigate('AgregarFotos')}>
        <Ionicons name="camera" size={20} color="#fff" style={localStyles.icon} />
        <Text style={commonStyles.btnText}>Agregar fotos a registro existente</Text>
      </TouchableOpacity>

      {/* —— Sección DEV —— */}
      <View style={commonStyles.divider} />

      <Text style={[commonStyles.subtitle, { marginBottom: 8 }]}>Herramientas de depuración</Text>

      <TouchableOpacity style={[commonStyles.btn, localStyles.btnCyan]} onPress={() => navigation.navigate('SyncQueue')}>
        <Ionicons name="eye" size={20} color="#fff" style={localStyles.icon} />
        <Text style={commonStyles.btnText}>Ver cola de Sync</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[commonStyles.btn, localStyles.btnCyan]} onPress={() => trySync()}>
        <Ionicons name="sync" size={20} color="#fff" style={localStyles.icon} />
        <Text style={commonStyles.btnText}>Forzar Sync ahora</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[commonStyles.btn, localStyles.btnOrange]} onPress={onPurgeQueue}>
        <Ionicons name="trash-bin" size={20} color="#fff" style={localStyles.icon} />
        <Text style={commonStyles.btnText}>Vaciar cola (solo ops)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[commonStyles.btn, localStyles.btnOrange]} onPress={onPurgeByDni}>
        <Ionicons name="trash" size={20} color="#fff" style={localStyles.icon} />
        <Text style={commonStyles.btnText}>Borrar PENDIENTE por DNI…</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[commonStyles.btn, localStyles.btnPink]} onPress={onResetDb}>
        <Ionicons name="refresh-circle" size={20} color="#fff" style={localStyles.icon} />
        <Text style={commonStyles.btnText}>Reiniciar DB (DROP + crear)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[commonStyles.btn, localStyles.btnPink]} onPress={onNukeAll}>
        <Ionicons name="nuclear" size={20} color="#fff" style={localStyles.icon} />
        <Text style={commonStyles.btnText}>Borrar TODO local (incl. fotos)</Text>
      </TouchableOpacity>

      {/* Modal simple para pedir DNI */}
      <Modal visible={dniModal} transparent animationType="fade">
        <View style={commonStyles.modalBackdrop}>
          <View style={commonStyles.modalCard}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 10 }}>Eliminar pendiente por DNI</Text>
            <TextInput
              placeholder="DNI"
              placeholderTextColor="#889"
              value={dni}
              onChangeText={setDni}
              style={commonStyles.input}
              keyboardType="number-pad"
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity style={[commonStyles.btnSm, commonStyles.btnGhost]} onPress={() => setDniModal(false)}>
                <Text style={commonStyles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[commonStyles.btnSm, commonStyles.btnWarn]} onPress={confirmPurgeByDni}>
                <Text style={commonStyles.btnText}>Borrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  btnGreen: { backgroundColor: COLORS.greenBtn, flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
  btnBlue: { backgroundColor: COLORS.blueBtn, flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
  btnCyan: { backgroundColor: COLORS.cyanBtn, flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
  btnOrange: { backgroundColor: COLORS.orangeBtn, flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
  btnPink: { backgroundColor: COLORS.pinkBtn, flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
  icon: { marginRight: 10 },
});
