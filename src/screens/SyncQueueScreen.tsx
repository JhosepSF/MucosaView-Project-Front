import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { debugDumpQueue, trySync } from '../libs/sync';

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
    <View style={styles.card}>
      <Text style={styles.line}><Text style={styles.k}>#{item.id}</Text>  <Text style={styles.v}>{item.kind}</Text></Text>
      <Text style={styles.line}><Text style={styles.k}>Method:</Text> <Text style={styles.v}>{item.method}</Text></Text>
      <Text style={styles.line}><Text style={styles.k}>Endpoint:</Text> <Text style={styles.v}>{item.endpoint}</Text></Text>
      {item.filename ? <Text style={styles.line}><Text style={styles.k}>File:</Text> <Text style={styles.v}>{item.filename}</Text></Text> : null}
      <Text style={styles.line}><Text style={styles.k}>Retries:</Text> <Text style={styles.v}>{item.retries}</Text></Text>
      <Text style={styles.lineSmall}><Text style={styles.k}>UUID:</Text> <Text style={styles.v}>{item.client_uuid}</Text></Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cola de sincronización</Text>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onSyncNow}>
          <Text style={styles.btnText}>Forzar Sync</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={load}>
          <Text style={styles.btnText}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={it => String(it.id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>No hay operaciones pendientes 🎉</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0e1220', padding:16 },
  title: { color:'#fff', fontSize:18, fontWeight:'800', marginBottom:12 },
  card: { backgroundColor:'#161B22', borderRadius:12, padding:12, marginBottom:10, borderWidth:1, borderColor:'#2c2f3f' },
  line: { color:'#cfd3ff', marginBottom:4 },
  lineSmall: { color:'#99a', marginTop:4 },
  k: { color:'#8ab4ff', fontWeight:'700' },
  v: { color:'#fff' },
  btn: { paddingVertical:10, paddingHorizontal:14, borderRadius:10 },
  btnPrimary: { backgroundColor:'#00b894' },
  btnGhost: { backgroundColor:'#273043' },
  btnText: { color:'#fff', fontWeight:'700' },
  empty: { color:'#aab', textAlign:'center', marginTop:20 }
});
