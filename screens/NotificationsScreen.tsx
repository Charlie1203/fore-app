import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import type { NotificationDoc } from '../firebase/types';

const COLORS = {
  bg: '#0f0f0f', border: '#1a1a1a', lime: '#c8e03a',
  white: '#f0f0f0', muted: '#666', dim: '#444',
};

function formatTs(ts: any): string {
  if (!ts?.toDate) return 'ahora';
  const mins = (Date.now() - ts.toDate().getTime()) / 60000;
  if (mins < 60) return `hace ${Math.max(1, Math.round(mins))} min`;
  if (mins < 60 * 24) return `hace ${Math.round(mins / 60)} h`;
  if (mins < 60 * 24 * 7) return `hace ${Math.round(mins / (60 * 24))} d`;
  return ts.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { firebaseUser } = useAuth();
  const [notifs, setNotifs] = useState<NotificationDoc[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(
      collection(db, 'users', firebaseUser.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    return onSnapshot(q, snap => setNotifs(snap.docs.map(d => ({ ...d.data(), id: d.id }) as NotificationDoc)));
  }, [firebaseUser?.uid]);

  const marcarTodo = async () => {
    if (!firebaseUser) return;
    const sinLeer = notifs.filter(n => !n.read);
    if (sinLeer.length === 0) return;
    const batch = writeBatch(db);
    sinLeer.forEach(n => batch.update(doc(db, 'users', firebaseUser.uid, 'notifications', n.id), { read: true }));
    await batch.commit().catch(() => {});
  };

  const marcarLeida = async (n: NotificationDoc) => {
    if (!firebaseUser || n.read) return;
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', firebaseUser.uid, 'notifications', n.id), { read: true });
    await batch.commit().catch(() => {});
  };

  const hayNoLeidas = notifs.some(n => !n.read);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 2 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Notificaciones</Text>
        <TouchableOpacity onPress={marcarTodo} disabled={!hayNoLeidas}>
          <Text style={[styles.markAll, !hayNoLeidas && { opacity: 0.3 }]}>Marcar todo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifs}
        keyExtractor={n => n.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No tenés notificaciones todavía.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, !item.read && styles.rowUnread]}
            activeOpacity={0.7}
            onPress={() => marcarLeida(item)}
          >
            <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
              <Ionicons name={item.icon as any} size={20} color={!item.read ? COLORS.lime : COLORS.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.text, !item.read && styles.textUnread]}>{item.text}</Text>
              <Text style={styles.time}>{formatTs(item.createdAt)}</Text>
            </View>
            {!item.read && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  markAll: { fontSize: 13, color: COLORS.lime },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
  rowUnread: { backgroundColor: '#0f120f' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  iconWrapUnread: { backgroundColor: '#1a2a0a' },
  text: { fontSize: 14, color: COLORS.muted, lineHeight: 20 },
  textUnread: { color: COLORS.white },
  time: { fontSize: 11, color: COLORS.dim, marginTop: 3 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.lime },
  separator: { height: 0.5, backgroundColor: COLORS.border },
  empty: { textAlign: 'center', color: COLORS.muted, fontSize: 13, marginTop: 60, paddingHorizontal: 32 },
});
