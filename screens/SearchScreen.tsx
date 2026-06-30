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

const MODALIDADES = ['Stroke Play', 'Stableford', 'Match Play', 'Better Ball', 'Scramble'];

const TORNEOS_MOCK = [
  { id: '1', nombre: 'Copa Junio', modalidad: 'Stableford', fecha: '28 Jun 2026', estado: 'finalizado', ganador: 'Pepe Noceti', score: 38 },
  { id: '2', nombre: 'Torneo del Club', modalidad: 'Stroke Play', fecha: '12 Jul 2026', estado: 'próximo', ganador: null, score: null },
];

const ACTIVIDAD_MOCK = [
  { tipo: 'torneo', texto: '🏆 Pepe Noceti ganó la Copa Junio con 38 puntos Stableford', tiempo: 'hace 2 días' },
  { tipo: 'post', autor: 'Carlitos Laprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', texto: 'Qué cañazo el hoyo 7 hoy, eagle de 6 metros 🔥', tiempo: 'hace 3 días' },
  { tipo: 'post', autor: 'Pepe Noceti', initials: 'PE', bg: '#333', color: '#c8e03a', texto: 'Se viene el torneo del club, a prepararse', tiempo: 'hace 5 días' },
  { tipo: 'torneo', texto: '📋 Torneo del Club creado para el 12 de julio', tiempo: 'hace 1 semana' },
];

const MODALIDADES_INFO = [
  { key: 'Stroke Play', icon: '🏌️', desc: 'Suma de todos los golpes' },
  { key: 'Stableford', icon: '⭐', desc: 'Puntos por hoyo vs par' },
  { key: 'Match Play', icon: '⚔️', desc: 'Hoyo a hoyo entre jugadores' },
  { key: 'Better Ball', icon: '👥', desc: 'Mejor score de la pareja' },
  { key: 'Scramble', icon: '🎯', desc: 'Equipo elige el mejor tiro' },
];

function CreateTorneoModal({ onClose }: { onClose: () => void }) {
  const [nombre, setNombre] = useState('');
  const [modalidad, setModalidad] = useState<string | null>(null);
  const [rondas, setRondas] = useState<number | null>(null);

  return (
    <View style={styles.modal}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nuevo torneo</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Nombre</Text>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Ej: Copa Julio"
            placeholderTextColor={COLORS.dim}
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        <Text style={styles.label}>Modalidad</Text>
        <View style={styles.modalidadList}>
          {MODALIDADES_INFO.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.modalidadBtn, modalidad === m.key && styles.modalidadBtnActive]}
              onPress={() => setModalidad(m.key)}
            >
              <Text style={styles.modalidadIcon}>{m.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalidadBtnText, modalidad === m.key && styles.modalidadBtnTextActive]}>{m.key}</Text>
                <Text style={styles.modalidadDesc}>{m.desc}</Text>
              </View>
              {modalidad === m.key && <Ionicons name="checkmark-circle" size={18} color={COLORS.lime} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Cantidad de rondas</Text>
        <View style={styles.rondasRow}>
          {[1, 2, 3, 4].map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.rondaBtn, rondas === n && styles.rondaBtnActive]}
              onPress={() => setRondas(n)}
            >
              <Text style={[styles.rondaBtnNum, rondas === n && styles.rondaBtnNumActive]}>{n}</Text>
              <Text style={[styles.rondaBtnLabel, rondas === n && styles.rondaBtnLabelActive]}>
                {n === 1 ? 'ronda' : 'rondas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.createBtn, (!nombre.trim() || !modalidad || !rondas) && { opacity: 0.4 }]}
          onPress={onClose}
          disabled={!nombre.trim() || !modalidad || !rondas}
        >
          <Text style={styles.createBtnText}>Crear torneo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GroupDetail({ group, onBack }: { group: Group; onBack: () => void }) {
  const isMember = MY_GROUPS.some(g => g.id === group.id);
  const [joined, setJoined] = useState(isMember);
  const [tab, setTab] = useState<'actividad' | 'torneos'>('actividad');
  const [showTorneo, setShowTorneo] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {showTorneo && <CreateTorneoModal onClose={() => setShowTorneo(false)} />}

      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.detailTitle}>{group.name}</Text>
        <TouchableOpacity
          style={[styles.joinBtnSmall, joined && styles.joinBtnSmallActive]}
          onPress={() => setJoined(!joined)}
        >
          <Text style={[styles.joinBtnSmallText, joined && styles.joinBtnSmallTextActive]}>
            {joined ? 'En el grupo' : 'Unirse'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lider del mes */}
      <View style={styles.leaderCard}>
        <View style={styles.leaderLeft}>
          <Text style={styles.leaderLabel}>⭐ Líder del mes</Text>
          <Text style={styles.leaderName}>Pepe Noceti</Text>
          <Text style={styles.leaderScore}>Score 71 · −1 vs par</Text>
        </View>
        <View style={styles.leaderBadge}>
          <Avatar initials="PE" bg="#333" color={COLORS.lime} size={48} />
          <View style={styles.leaderCrown}><Text style={{ fontSize: 10 }}>👑</Text></View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'actividad' && styles.tabBtnActive]}
          onPress={() => setTab('actividad')}
        >
          <Text style={[styles.tabBtnText, tab === 'actividad' && styles.tabBtnTextActive]}>Actividad</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'torneos' && styles.tabBtnActive]}
          onPress={() => setTab('torneos')}
        >
          <Text style={[styles.tabBtnText, tab === 'torneos' && styles.tabBtnTextActive]}>Torneos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScroll}>
        {tab === 'actividad' && (
          <View style={{ gap: 8 }}>
            {ACTIVIDAD_MOCK.map((a, i) => (
              a.tipo === 'torneo' ? (
                <View key={i} style={styles.actividadTorneo}>
                  <Text style={styles.actividadTorneoText}>{a.texto}</Text>
                  <Text style={styles.actividadTiempo}>{a.tiempo}</Text>
                </View>
              ) : (
                <View key={i} style={styles.actividadPost}>
                  <Avatar initials={a.initials!} bg={a.bg!} color={a.color!} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actividadAutor}>{a.autor}</Text>
                    <Text style={styles.actividadTexto}>{a.texto}</Text>
                    <Text style={styles.actividadTiempo}>{a.tiempo}</Text>
                  </View>
                </View>
              )
            ))}
          </View>
        )}

        {tab === 'torneos' && (
          <View style={{ gap: 8 }}>
            <TouchableOpacity style={styles.newTorneoBtn} onPress={() => setShowTorneo(true)}>
              <Ionicons name="add-circle-outline" size={18} color={COLORS.lime} />
              <Text style={styles.newTorneoBtnText}>Crear torneo</Text>
            </TouchableOpacity>
            {TORNEOS_MOCK.map(t => (
              <View key={t.id} style={styles.torneoCard}>
                <View style={styles.torneoTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.torneoNombre}>{t.nombre}</Text>
                    <Text style={styles.torneoMeta}>{t.modalidad} · {t.fecha}</Text>
                  </View>
                  <View style={[styles.torneoBadge, t.estado === 'finalizado' ? styles.torneoBadgeDone : styles.torneoBadgeNext]}>
                    <Text style={styles.torneoBadgeText}>{t.estado === 'finalizado' ? 'Finalizado' : 'Próximo'}</Text>
                  </View>
                </View>
                {t.ganador && (
                  <View style={styles.torneoGanador}>
                    <Text style={styles.torneoGanadorLabel}>🏆 Ganador</Text>
                    <Text style={styles.torneoGanadorNombre}>{t.ganador} · {t.score} pts</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
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
        <Text style={styles.title}>Buscar</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={COLORS.dim} />
        <TextInput
          style={styles.searchInput}
          placeholder="Grupos o jugadores..."
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

        <TouchableOpacity style={styles.createGroupBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add-circle-outline" size={20} color={COLORS.lime} />
          <Text style={styles.createGroupBtnText}>Crear grupo</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 4 }]}>Tus grupos</Text>
        <View style={styles.list}>
          {MY_GROUPS.map(g => (
            <GroupRow key={g.id} group={g} onPress={() => setSelectedGroup(g)} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  createGroupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.lime, borderStyle: 'dashed', borderRadius: 12, padding: 14, marginBottom: 16 },
  createGroupBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.lime },
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

  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10 },
  backBtn: { padding: 2 },
  detailTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white, flex: 1 },
  detailScroll: { paddingHorizontal: 16, paddingBottom: 32 },
  detailNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  detailName: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  detailMembers: { fontSize: 12, color: COLORS.muted },
  joinBtnSmall: { backgroundColor: COLORS.lime, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  joinBtnSmallActive: { backgroundColor: COLORS.dark2, borderWidth: 0.5, borderColor: COLORS.border },
  joinBtnSmallText: { fontSize: 12, fontWeight: '700', color: '#0f0f0f' },
  joinBtnSmallTextActive: { color: COLORS.muted },

  leaderCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 18, marginBottom: 10, backgroundColor: '#1a2a0a', borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.lime, padding: 14 },
  leaderLeft: { gap: 3 },
  leaderLabel: { fontSize: 10, color: COLORS.lime, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  leaderName: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  leaderScore: { fontSize: 12, color: COLORS.muted },
  leaderBadge: { position: 'relative' },
  leaderCrown: { position: 'absolute', top: -6, right: -4, backgroundColor: COLORS.bg, borderRadius: 10, padding: 2 },

  tabBar: { flexDirection: 'row', marginHorizontal: 18, marginBottom: 12, backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: COLORS.dark2 },
  tabBtnText: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },
  tabBtnTextActive: { color: COLORS.lime },

  actividadPost: { flexDirection: 'row', gap: 10, paddingHorizontal: 0, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#1e1e1e' },
  actividadAutor: { fontSize: 14, fontWeight: '700', color: COLORS.white, marginBottom: 3 },
  actividadTexto: { fontSize: 13, color: '#ccc', lineHeight: 18 },
  actividadTorneo: { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1e1e1e' },
  actividadTorneoText: { fontSize: 13, color: COLORS.white },
  actividadTiempo: { fontSize: 11, color: COLORS.dim, marginTop: 4 },

  modalidadList: { gap: 6 },
  modalidadBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.dark2, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border, padding: 12 },
  modalidadBtnActive: { borderColor: COLORS.lime, backgroundColor: '#1a2a0a' },
  modalidadIcon: { fontSize: 20 },
  modalidadBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.muted },
  modalidadBtnTextActive: { color: COLORS.lime },
  modalidadDesc: { fontSize: 11, color: COLORS.dim, marginTop: 1 },
  rondasRow: { flexDirection: 'row', gap: 8 },
  rondaBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: COLORS.dark2, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border },
  rondaBtnActive: { borderColor: COLORS.lime, backgroundColor: '#1a2a0a' },
  rondaBtnNum: { fontSize: 22, fontWeight: '800', color: COLORS.muted },
  rondaBtnNumActive: { color: COLORS.lime },
  rondaBtnLabel: { fontSize: 9, color: COLORS.dim, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  rondaBtnLabelActive: { color: COLORS.lime },
  newTorneoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.lime, borderStyle: 'dashed', borderRadius: 12, padding: 14 },
  newTorneoBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.lime },
  torneoCard: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, padding: 14, gap: 10 },
  torneoTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  torneoNombre: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  torneoMeta: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  torneoBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  torneoBadgeDone: { backgroundColor: '#242424' },
  torneoBadgeNext: { backgroundColor: '#1a2a0a' },
  torneoBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  torneoGanador: { backgroundColor: '#1a2a0a', borderRadius: 8, padding: 10, gap: 2 },
  torneoGanadorLabel: { fontSize: 10, color: COLORS.lime, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  torneoGanadorNombre: { fontSize: 14, fontWeight: '700', color: COLORS.white },

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
