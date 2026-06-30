import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444', dark2: '#242424',
};

const FRIENDS = [
  { name: 'Pepe Noceti', username: '@peponoceti', initials: 'PE', bg: '#333', color: '#c8e03a', hcp: 7.3, following: true },
  { name: 'Carlitos Laprida', username: '@carlitoslaprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', hcp: 15.1, following: true },
];

const SUGGESTED = [
  { name: 'Manu Rivero', username: '@manurivero', initials: 'MR', bg: '#3a2a1a', color: '#e0a03a', hcp: 9.8, following: false },
  { name: 'Sofía Lagos', username: '@sofilagos', initials: 'SL', bg: '#1a2a3a', color: '#5fa0e0', hcp: 18.4, following: false },
  { name: 'Tomás Bidegain', username: '@tomibide', initials: 'TB', bg: '#2a1a3a', color: '#b070e0', hcp: 11.2, following: false },
];

function Avatar({ initials, bg, color }: { initials: string; bg: string; color: string }) {
  return (
    <View style={[styles.avatar, { backgroundColor: bg }]}>
      <Text style={[styles.avatarText, { color }]}>{initials}</Text>
    </View>
  );
}

function PersonRow({ person }: { person: typeof FRIENDS[0] }) {
  const [following, setFollowing] = useState(person.following);
  return (
    <View style={styles.row}>
      <Avatar initials={person.initials} bg={person.bg} color={person.color} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{person.name}</Text>
        <Text style={styles.rowSub}>{person.username} · HCP {person.hcp}</Text>
      </View>
      <TouchableOpacity
        style={[styles.followBtn, following && styles.followBtnActive]}
        onPress={() => setFollowing(!following)}
      >
        <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
          {following ? 'Siguiendo' : 'Seguir'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SearchScreen() {
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={COLORS.dim} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar jugadores..."
          placeholderTextColor={COLORS.dim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Tus amigos</Text>
        <View style={styles.list}>
          {FRIENDS.map((p, i) => <PersonRow key={i} person={p} />)}
        </View>

        <Text style={styles.sectionTitle}>Sugeridos para vos</Text>
        <View style={styles.list}>
          {SUGGESTED.map((p, i) => <PersonRow key={i} person={p} />)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border,
    marginHorizontal: 18, paddingHorizontal: 12, marginBottom: 10,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.white },
  scroll: { paddingHorizontal: 18, paddingBottom: 24 },
  sectionTitle: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 14 },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, padding: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  rowSub: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  followBtn: { borderWidth: 0.5, borderColor: COLORS.lime, backgroundColor: COLORS.lime, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  followBtnActive: { borderColor: COLORS.border, backgroundColor: COLORS.dark2 },
  followBtnText: { fontSize: 11, fontWeight: '700', color: '#0f0f0f' },
  followBtnTextActive: { color: COLORS.muted },
});
