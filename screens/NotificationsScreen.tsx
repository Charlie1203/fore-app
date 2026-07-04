import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0f0f0f', border: '#1a1a1a', lime: '#c8e03a',
  white: '#f0f0f0', muted: '#666', dim: '#444',
};

const NOTIFS = [
  { id: '1', icon: 'trophy-outline', text: 'Pepe Noceti ganó la Copa Junio', time: 'hace 5 min', unread: true },
  { id: '2', icon: 'person-add-outline', text: 'Carlitos Laprida te siguió', time: 'hace 1 h', unread: true },
  { id: '3', icon: 'chatbubble-outline', text: 'Pepe comentó en tu ronda', time: 'hace 2 h', unread: true },
  { id: '4', icon: 'golf-outline', text: 'Manu Rivero publicó una nueva ronda', time: 'ayer', unread: false },
  { id: '5', icon: 'trophy-outline', text: 'Torneo del Club empieza mañana', time: 'ayer', unread: false },
  { id: '6', icon: 'trending-down-outline', text: 'Tu handicap bajó a 12.4', time: 'hace 3 días', unread: false },
];

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 2 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Notificaciones</Text>
        <TouchableOpacity>
          <Text style={styles.markAll}>Marcar todo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={NOTIFS}
        keyExtractor={n => n.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.row, item.unread && styles.rowUnread]} activeOpacity={0.7}>
            <View style={[styles.iconWrap, item.unread && styles.iconWrapUnread]}>
              <Ionicons name={item.icon as any} size={20} color={item.unread ? COLORS.lime : COLORS.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.text, item.unread && styles.textUnread]}>{item.text}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
            {item.unread && <View style={styles.dot} />}
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
});
