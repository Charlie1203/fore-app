import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0f0f0f',
  card: '#1a1a1a',
  border: '#2a2a2a',
  lime: '#c8e03a',
  white: '#f0f0f0',
  muted: '#666',
  dim: '#444',
};

const USERS_MOCK = [
  { id: '1', initials: 'PE', name: 'Pepe Noceti', username: '@pepe', hcp: '7.3', bg: '#333' },
  { id: '2', initials: 'CA', name: 'Carlitos Laprida', username: '@carlitos', hcp: '15.1', bg: '#2a3a1a' },
  { id: '3', initials: 'MR', name: 'Manu Rivero', username: '@manu', hcp: '11.4', bg: '#3a2a1a' },
  { id: '4', initials: 'JN', name: 'Juan Noceti', username: '@juann', hcp: '12.4', bg: '#1a2a3a' },
];

const COURSES_MOCK = [
  { id: '1', name: 'Haras Santa María', location: 'Pilar, Buenos Aires', holes: 18 },
  { id: '2', name: 'Olivos Golf Club', location: 'Olivos, Buenos Aires', holes: 18 },
  { id: '3', name: 'San Andrés Golf Club', location: 'General Rodríguez', holes: 18 },
];

export default function GlobalSearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');

  const filteredUsers = query.length > 0
    ? USERS_MOCK.filter(u =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase())
      )
    : USERS_MOCK;

  const filteredCourses = query.length > 0
    ? COURSES_MOCK.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header con input */}
      <View style={styles.header}>
        <View style={styles.inputRow}>
          <Ionicons name="search-outline" size={16} color={COLORS.muted} />
          <TextInput
            autoFocus
            placeholder="Buscar jugadores o grupos..."
            placeholderTextColor={COLORS.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.input}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtn}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}
        keyExtractor={() => ''}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {/* Jugadores */}
            {filteredUsers.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>{query.length > 0 ? 'JUGADORES' : 'SUGERIDOS'}</Text>
                {filteredUsers.map(u => (
                  <View key={u.id} style={styles.row}>
                    <View style={[styles.avatar, { backgroundColor: u.bg }]}>
                      <Text style={styles.avatarText}>{u.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName}>{u.name}</Text>
                      <Text style={styles.rowSub}>{u.username} · HCP {u.hcp}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
                  </View>
                ))}
              </>
            )}

            {/* Canchas — solo cuando hay búsqueda */}
            {filteredCourses.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>CANCHAS</Text>
                {filteredCourses.map(c => (
                  <View key={c.id} style={styles.row}>
                    <View style={[styles.avatar, { backgroundColor: '#1a2a1a' }]}>
                      <Ionicons name="golf-outline" size={18} color={COLORS.lime} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName}>{c.name}</Text>
                      <Text style={styles.rowSub}>{c.location} · {c.holes} hoyos</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
                  </View>
                ))}
              </>
            )}

            {/* Sin resultados */}
            {query.length > 0 && filteredUsers.length === 0 && filteredCourses.length === 0 && (
              <Text style={styles.empty}>Sin resultados para "{query}"</Text>
            )}
          </>
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  input: { flex: 1, color: COLORS.white, fontSize: 14 },
  cancelBtn: { color: COLORS.lime, fontSize: 14 },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.lime, fontWeight: '700', fontSize: 14 },
  rowName: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  rowSub: { color: COLORS.muted, fontSize: 12, marginTop: 1 },
  empty: { color: COLORS.muted, fontSize: 14, textAlign: 'center', marginTop: 60 },
});
