import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, Alert, ScrollView, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { debugDumpQueue, trySync } from '../libs/sync';
import { exportDatabase, exportAllDataAsJSON, cleanOldBackups, shareFile, sharePatientPhotos } from '../libs/backup';
import { commonStyles, COLORS } from '../styles';

type QueueItem = {
  id: number;
  method: string;
  endpoint: string;
  client_uuid: string;
  retries: number;
  kind: string;       // "JSON" o "FILE(CONJ v1)"
  filename?: string | null;
  body?: any;
};

export default function SyncQueueScreen() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoDNIs, setPhotoDNIs] = useState('');

  const load = () => {
    setLoading(true);
    try {
      const data = debugDumpQueue(200) as QueueItem[];
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(load, []));
  useEffect(load, []);

  const onSyncNow = async () => {
    setSyncing(true);
    try {
      const result = await trySync();
      load();
      
      // Mostrar resumen de sincronización
      if (result) {
        const { total, success, errors } = result;
        if (errors > 0) {
          Alert.alert(
            '⚠️ Sincronización completada con errores',
            `Procesados: ${total}\nÉxitos: ${success}\nErrores: ${errors}\n\nRevisa la cola para ver los elementos pendientes.`,
            [{ text: 'OK' }]
          );
        } else if (success > 0) {
          Alert.alert('✅ Sincronización exitosa', `Se sincronizaron ${success} elementos correctamente.`, [{ text: 'OK' }]);
        }
      }
    } finally {
      setSyncing(false);
    }
  };

  const onExportDatabase = async () => {
    try {
      const filepath = await exportDatabase();
      
      // Compartir inmediatamente usando el diálogo nativo
      await shareFile(filepath, 'Backup MucosaView Database');
      
      Alert.alert(
        '✅ Base de datos exportada',
        'El archivo se ha compartido. Guárdalo en Downloads, WhatsApp, email, etc.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo exportar la base de datos: ' + String(error));
    }
  };

  const onExportJSON = async () => {
    try {
      const filepath = await exportAllDataAsJSON();
      
      // Limpiar backups antiguos
      await cleanOldBackups(10);
      
      // Compartir inmediatamente
      await shareFile(filepath, 'Backup MucosaView JSON');
      
      Alert.alert(
        '✅ Datos exportados a JSON',
        'El archivo se ha compartido. Guárdalo donde prefieras.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo exportar los datos: ' + String(error));
    }
  };

  const onExportPhotos = () => {
    setShowPhotoModal(true);
  };

  const handleExportPhotos = async () => {
    if (!photoDNIs || photoDNIs.trim() === '') {
      Alert.alert('Error', 'Debes ingresar al menos un DNI');
      return;
    }
    
    try {
      const dnis = photoDNIs.split(',').map(d => d.trim()).filter(d => d.length > 0);
      
      if (dnis.length === 0) {
        Alert.alert('Error', 'No se encontraron DNIs válidos');
        return;
      }
      
      setShowPhotoModal(false);
      setPhotoDNIs('');
      
      await sharePatientPhotos(dnis);
      
      Alert.alert(
        '✅ Fotos exportadas',
        `Las fotos de ${dnis.length} paciente(s) se han compartido. Úsalas para subirlas al servidor.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderItem = ({ item }: { item: QueueItem }) => {
    const isExpanded = expandedIds.has(item.id);
    const bodyText = item.body ? JSON.stringify(item.body, null, 2) : 'Sin datos';
    
    return (
      <View style={localStyles.card}>
        <TouchableOpacity onPress={() => toggleExpand(item.id)}>
          <View style={localStyles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={localStyles.itemId}>#{item.id}</Text>
              <Ionicons 
                name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={COLORS.textSecondary} 
                style={{ marginLeft: 8 }}
              />
            </View>
            <View style={[localStyles.badge, item.kind.startsWith('FILE') ? localStyles.badgeFile : localStyles.badgeJson]}>
              <Text style={localStyles.badgeText}>{item.kind}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={localStyles.line}><Text style={localStyles.label}>Método:</Text> <Text style={localStyles.value}>{item.method}</Text></Text>
        <Text style={localStyles.line}><Text style={localStyles.label}>Endpoint:</Text> <Text style={localStyles.value}>{item.endpoint}</Text></Text>
        {item.filename ? <Text style={localStyles.line}><Text style={localStyles.label}>Archivo:</Text> <Text style={localStyles.value}>{item.filename}</Text></Text> : null}
        <Text style={localStyles.line}>
          <Text style={localStyles.label}>Reintentos:</Text> 
          <Text style={[localStyles.value, item.retries > 5 && { color: COLORS.warn, fontWeight: 'bold' }]}>
            {item.retries} {item.retries > 10 ? '⚠️' : ''}
          </Text>
        </Text>
        <Text style={localStyles.uuidLine}><Text style={localStyles.label}>UUID:</Text> <Text style={localStyles.uuid}>{item.client_uuid}</Text></Text>

        {/* Body expandible */}
        {isExpanded && item.body && (
          <View style={localStyles.bodyContainer}>
            <View style={localStyles.bodyHeader}>
              <Text style={localStyles.bodyTitle}>📋 Datos del JSON:</Text>
            </View>
            <ScrollView style={localStyles.bodyScrollView} nestedScrollEnabled>
              <Text style={localStyles.bodyText} selectable>{bodyText}</Text>
            </ScrollView>
            <Text style={localStyles.bodyHint}>💡 Toma screenshot de estos datos para guardarlos</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={localStyles.container}>
      <Text style={localStyles.title}>Cola de sincronización</Text>
      <Text style={localStyles.subtitle}>
        {items.length} operación{items.length !== 1 ? 'es' : ''} pendiente{items.length !== 1 ? 's' : ''}
      </Text>
      
      <View style={localStyles.infoBox}>
        <Ionicons name="information-circle" size={20} color={COLORS.info} />
        <Text style={localStyles.infoText}>
          La sincronización es MANUAL. Presiona "Sincronizar" cuando estés listo. Toca cada elemento para ver los datos completos.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TouchableOpacity 
          style={[commonStyles.btn, localStyles.btnSync]} 
          onPress={onSyncNow}
          disabled={syncing || items.length === 0}
        >
          {syncing ? (
            <>
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
              <Text style={commonStyles.btnText}>Sincronizando...</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={commonStyles.btnText}>Sincronizar ({items.length})</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[commonStyles.btn, localStyles.btnRefresh]} onPress={load}>
          <Ionicons name="refresh" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Botones de exportación/backup */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TouchableOpacity 
          style={[commonStyles.btn, localStyles.btnExport]} 
          onPress={onExportJSON}
        >
          <Ionicons name="document-text" size={16} color="#fff" style={{ marginRight: 4 }} />
          <Text style={[commonStyles.btnText, { fontSize: 12 }]}>Export JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[commonStyles.btn, localStyles.btnExport]} 
          onPress={onExportDatabase}
        >
          <Ionicons name="save" size={16} color="#fff" style={{ marginRight: 4 }} />
          <Text style={[commonStyles.btnText, { fontSize: 12 }]}>Export DB</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[commonStyles.btn, localStyles.btnPhoto]} 
          onPress={onExportPhotos}
        >
          <Ionicons name="images" size={16} color="#fff" style={{ marginRight: 4 }} />
          <Text style={[commonStyles.btnText, { fontSize: 12 }]}>Fotos</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de carga durante sincronización */}
      <Modal transparent visible={syncing} animationType="fade">
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={localStyles.modalText}>Sincronizando datos...</Text>
            <Text style={localStyles.modalSubtext}>Por favor espera</Text>
          </View>
        </View>
      </Modal>

      <FlatList
        data={items}
        keyExtractor={it => String(it.id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <View style={localStyles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
            <Text style={localStyles.emptyText}>¡Todo sincronizado! 🎉</Text>
            <Text style={localStyles.emptySubtext}>No hay operaciones pendientes</Text>
          </View>
        }
      />

      {/* Modal para ingreso de DNIs */}
      <Modal
        visible={showPhotoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>📸 Exportar Fotos de Pacientes</Text>
            <Text style={localStyles.modalSubtitle}>
              Ingresa los DNIs separados por comas:
            </Text>
            <Text style={localStyles.modalExample}>
              Ejemplo: 73748665, 79217062, 45602895
            </Text>
            
            <TextInput
              style={localStyles.modalInput}
              value={photoDNIs}
              onChangeText={setPhotoDNIs}
              placeholder="DNIs separados por comas"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              autoFocus
            />
            
            <View style={localStyles.modalButtons}>
              <TouchableOpacity
                style={[localStyles.modalButton, localStyles.modalButtonCancel]}
                onPress={() => {
                  setShowPhotoModal(false);
                  setPhotoDNIs('');
                }}
              >
                <Text style={localStyles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[localStyles.modalButton, localStyles.modalButtonConfirm]}
                onPress={handleExportPhotos}
              >
                <Text style={localStyles.modalButtonTextConfirm}>Exportar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  btnSync: {
    flex: 1,
    width: 'auto', // Sobrescribir width: '100%' de commonStyles
    backgroundColor: COLORS.blueBtn,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  btnRefresh: {
    width: 'auto', // Sobrescribir width: '100%' de commonStyles
    backgroundColor: COLORS.cyanBtn,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnExport: {
    flex: 1,
    width: 'auto',
    backgroundColor: COLORS.orangeBtn,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPhoto: {
    flex: 1,
    width: 'auto',
    backgroundColor: '#9b59b6',
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeJson: {
    backgroundColor: '#E3F2FD',
  },
  badgeFile: {
    backgroundColor: '#FFF3E0',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  line: {
    fontSize: 14,
    marginBottom: 6,
  },
  label: {
    fontWeight: '600',
    color: COLORS.text,
  },
  value: {
    color: COLORS.textSecondary,
  },
  uuidLine: {
    fontSize: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  uuid: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#666',
  },
  bodyContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bodyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bodyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  bodyScrollView: {
    maxHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 8,
  },
  bodyText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#333',
    lineHeight: 16,
  },
  bodyHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  modalExample: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonConfirm: {
    backgroundColor: '#9C27B0',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  modalText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  modalSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});