import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { debugDumpQueue, trySync } from '../libs/sync';
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

  const load = () => {
    setLoading(true);
    try {
      const data = debugDumpQueue(200) as QueueItem[]; // devuelve también el array
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
    await trySync();
    load();
  };

  const renderItem = ({ item }: { item: QueueItem }) => (
    <View style={localStyles.card}>
      <View style={localStyles.cardHeader}>
        <Text style={localStyles.itemId}>#{item.id}</Text>
        <View style={[localStyles.badge, item.kind.startsWith('FILE') ? localStyles.badgeFile : localStyles.badgeJson]}>
          <Text style={localStyles.badgeText}>{item.kind}</Text>
        </View>
      </View>
      <Text style={localStyles.line}><Text style={localStyles.label}>Método:</Text> <Text style={localStyles.value}>{item.method}</Text></Text>
      <Text style={localStyles.line}><Text style={localStyles.label}>Endpoint:</Text> <Text style={localStyles.value}>{item.endpoint}</Text></Text>
      {item.filename ? <Text style={localStyles.line}><Text style={localStyles.label}>Archivo:</Text> <Text style={localStyles.value}>{item.filename}</Text></Text> : null}
      <Text style={localStyles.line}><Text style={localStyles.label}>Reintentos:</Text> <Text style={localStyles.value}>{item.retries}</Text></Text>
      <Text style={localStyles.uuidLine}><Text style={localStyles.label}>UUID:</Text> <Text style={localStyles.uuid}>{item.client_uuid}</Text></Text>
    </View>
  );

  return (
    <View style={localStyles.container}>
      <Text style={localStyles.title}>Cola de sincronización</Text>
      <Text style={localStyles.subtitle}>
        {items.length} operación{items.length !== 1 ? 'es' : ''} pendiente{items.length !== 1 ? 's' : ''}
      </Text>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TouchableOpacity style={[commonStyles.btn, localStyles.btnSync]} onPress={onSyncNow}>
          <Ionicons name="sync" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={commonStyles.btnText}>Sincronizar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[commonStyles.btn, localStyles.btnRefresh]} onPress={load}>
          <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={commonStyles.btnText}>Actualizar</Text>
        </TouchableOpacity>
      </View>

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
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
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
    marginBottom: 16,
  },
  btnSync: {
    flex: 1,
    backgroundColor: COLORS.blueBtn,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRefresh: {
    flex: 1,
    backgroundColor: COLORS.cyanBtn,
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
});