import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444', dark2: '#242424',
};

const MY_GROUPS = [
  {
    id: '1', name: 'Haras Santa María', type: 'club', members: 142,
    initials: 'HS', bg: '#1a2a0a', color: '#c8e03a', lastActivity: 'hace 2 horas',
  },
  {
    id: '2', name: 'Los del Jueves', type: 'privado', members: 6,
    initials: 'LJ', bg: '#2a1a3a', color: '#b070e0', lastActivity: 'hace 1 día',
  },
  {
    id: '3', name: 'Martindale CC', type: 'club', members: 89,
    initials: 'MC', bg: '#1a2a3a', color: '#5fa0e0', lastActivity: 'hace 3 días',
  },
];

const ALL_GROUPS = [
  ...MY_GROUPS,
  { id: '4', name: 'San Andrés GC', type: 'club', members: 67, initials: 'SA', bg: '#2a1a1a', color: '#e07070', lastActivity: 'hace 1 semana' },
  { id: '5', name: 'Olivos GC', type: 'club', members: 201, initials: 'OG', bg: '#1a1a2a', color: '#7070e0', lastActivity: 'hace 2 días' },
  { id: '6', name: 'Los Birdies', type: 'privado', members: 4, initials: 'LB', bg: '#2a2a1a', color: '#e0c03a', lastActivity: 'hace 5 días' },
];

const PLAYERS = [
  { name: 'Pepe Noceti', username: '@peponoceti', initials: 'PE', bg: '#333', color: '#c8e03a', hcp: 7.3 },
  { name: 'Carlitos Laprida', username: '@carlitoslaprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', hcp: 15.1 },
  { name: 'Manu Rivero', username: '@manurivero', initials: 'MR', bg: '#3a2a1a', color: '#e0a03a', hcp: 9.8 },
  { name: 'Sofía Lagos', username: '@sofilagos', initials: 'SL', bg: '#1a2a3a', color: '#5fa0e0', hcp: 18.4 },
  { name: 'Tomás Bidegain', username: '@tomibide', initials: 'TB', bg: '#2a1a3a', color: '#b070e0', hcp: 11.2 },
];

type Group = typeof MY_GROUPS[0];
type Player = typeof PLAYERS[0];

function Avatar({ initials, bg, color, size = 42 }: { initials: string; bg: string; color: string; size?: number }) {
  return (
    <View style={[styles.avatar, { backgroundColor: bg, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
}

function GroupDetail({ group, onBack }: { group: Group; onBack: () => void }) {
  const isMember = MY_GROUPS.some(g => g.id === group.id);
  const [joined, setJoined] = useState(isMember);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.detailTitle}>{group.name}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScroll}>
        <View style={styles.detailHero}>
          <Avatar initials={group.initials} bg={group.bg} color={group.color} size={64} />
          <View style={{ flex: 1 }}>
            <View style={styles.detailNameRow}>
              <Text style={styles.detailName}>{group.name}</Text>
              <View style={[styles.typeBadge, group.type === 'club' ? styles.typeBadgeClub : styles.typeBadgePrivado]}>
                <Text style={styles.typeBadgeText}>{group.type === 'club' ? 'Club' : 'Privado'}</Text>
              </View>
            </View>
            <Text style={styles.detailMembers}>{group.members} miembros</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.joinBtn, joined && styles.joinBtnActive]}
          onPress={() => setJoined(!joined)}
        >
          <Text style={[styles.joinBtnText, joined && styles.joinBtnTextActive]}>
            {joined ? '✓ En el grupo' : 'Unirse al grupo'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Miembros destacados</Text>
        <View style={styles.membersList}>
          {PLAYERS.slice(0, 4).map((p, i) => (
            <View key={i} style={styles.memberRow}>
              <Avatar initials={p.initials} bg={p.bg} color={p.color} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{p.name}</Text>
                <Text style={styles.memberSub}>{p.username}</Text>
              </View>
              <Text style={styles.memberHcp}>HCP {p.hcp}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function GroupRow({ group, onPress }: { group: Group; onPress: () => void }) {
  const isMember = MY_GROUPS.some(g => g.id === group.id);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Avatar initials={group.initials} bg={group.bg} color={group.color} />
      <View style={styles.rowInfo}>
        <View style={styles.rowNameRow}>
          <Text style={styles.rowName}>{group.name}</Text>
          <View style={[styles.typeBadge, group.type === 'club' ? styles.typeBadgeClub : styles.typeBadgePrivado]}>
            <Text style={styles.typeBadgeText}>{group.type === 'club' ? 'Club' : 'Privado'}</Text>
          </View>
        </View>
        <Text style={styles.rowSub}>{group.members} miembros · {group.lastActivity}</Text>
      </View>
      {isMember && <Ionicons name="checkmark-circle" size={18} color={COLORS.lime} />}
      <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
    </TouchableOpacity>
  );
}

function PlayerRow({ player }: { player: Player }) {
  const [following, setFollowing] = useState(false);
  return (
    <View style={styles.row}>
      <Avatar initials={player.initials} bg={player.bg} color={player.color} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{player.name}</Text>
        <Text style={styles.rowSub}>{player.username} · HCP {player.hcp}</Text>
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

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <View style={styles.modal}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nuevo grupo</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Nombre del grupo</Text>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Ej: Los del Jueves"
            placeholderTextColor={COLORS.dim}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>
        <TouchableOpacity
          style={[styles.createBtn, !name.trim() && { opacity: 0.4 }]}
          onPress={onClose}
          disabled={!name.trim()}
        >
          <Text style={styles.createBtnText}>Crear grupo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SearchScreen() {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const q = search.toLowerCase();
  const filteredGroups = ALL_GROUPS.filter(g => g.name.toLowerCase().includes(q));
  const filteredPlayers = PLAYERS.filter(p =>
    p.name.toLowerCase().includes(q) || p.username.toLowerCase().includes(q)
  );
  const isSearching = search.length > 0;

  if (selectedGroup) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GroupDetail group={selectedGroup} onBack={() => setSelectedGroup(null)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}

      <View style={styles.header}>
        <Text style={styles.title}>Grupos</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={18} color="#0f0f0f" />
          <Text style={styles.newBtnText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={COLORS.dim} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar grupos o jugadores..."
          placeholderTextColor={COLORS.dim}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={COLORS.dim} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {!isSearching && (
          <>
            <Text style={styles.sectionTitle}>Tus grupos</Text>
            <View style={styles.list}>
              {MY_GROUPS.map(g => (
                <GroupRow key={g.id} group={g} onPress={() => setSelectedGroup(g)} />
              ))}
            </View>
          </>
        )}

        {isSearching && filteredGroups.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Grupos</Text>
            <View style={styles.list}>
              {filteredGroups.map(g => (
                <GroupRow key={g.id} group={g} onPress={() => setSelectedGroup(g)} />
              ))}
            </View>
          </>
        )}

        {isSearching && filteredPlayers.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Jugadores</Text>
            <View style={styles.list}>
              {filteredPlayers.map((p, i) => <PlayerRow key={i} player={p} />)}
            </View>
          </>
        )}

        {isSearching && filteredGroups.length === 0 && filteredPlayers.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Sin resultados para "{search}"</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.lime, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  newBtnText: { fontSize: 12, fontWeight: '700', color: '#0f0f0f' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border,
    marginHorizontal: 18, paddingHorizontal: 12, marginBottom: 10,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.white },
  scroll: { paddingHorizontal: 18, paddingBottom: 24 },
  sectionTitle: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, padding: 10 },
  rowNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  rowSub: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700' },
  typeBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  typeBadgeClub: { backgroundColor: '#1a2a0a' },
  typeBadgePrivado: { backgroundColor: '#2a1a3a' },
  typeBadgeText: { fontSize: 9, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  followBtn: { borderWidth: 0.5, borderColor: COLORS.lime, backgroundColor: COLORS.lime, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  followBtnActive: { borderColor: COLORS.border, backgroundColor: COLORS.dark2 },
  followBtnText: { fontSize: 11, fontWeight: '700', color: '#0f0f0f' },
  followBtnTextActive: { color: COLORS.muted },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, color: COLORS.muted },

  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12 },
  backBtn: { padding: 2 },
  detailTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white, flex: 1 },
  detailScroll: { paddingHorizontal: 18, paddingBottom: 32 },
  detailHero: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.border, padding: 14, marginBottom: 12 },
  detailNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  detailName: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  detailMembers: { fontSize: 12, color: COLORS.muted },
  joinBtn: { backgroundColor: COLORS.lime, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 20 },
  joinBtnActive: { backgroundColor: COLORS.dark2, borderWidth: 0.5, borderColor: COLORS.border },
  joinBtnText: { fontSize: 14, fontWeight: '800', color: '#0f0f0f' },
  joinBtnTextActive: { color: COLORS.muted },
  membersList: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  memberName: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  memberSub: { fontSize: 11, color: COLORS.muted },
  memberHcp: { fontSize: 12, fontWeight: '700', color: COLORS.lime },

  modal: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 10 },
  modalCard: { backgroundColor: '#161616', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  label: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  createBtn: { backgroundColor: COLORS.lime, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  createBtnText: { fontSize: 14, fontWeight: '800', color: '#0f0f0f' },
});
