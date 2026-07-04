import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const SCREEN_W = Dimensions.get('window').width;

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444', dark2: '#242424',
};

type Estado = 'próximo' | 'en curso' | 'finalizado';

interface Torneo {
  id: string;
  nombre: string;
  modalidad: string;
  fecha: string;
  estado: Estado;
  grupo: string | null;
  adminId: string;
  fechasRonda: string[];
  participantes: { nombre: string; initials: string; bg: string; color: string; hcp: number }[];
  leaderboard?: { pos: number; nombre: string; initials: string; bg: string; color: string; score: number; diff: number }[];
  leaderboardPorRonda?: { pos: number; nombre: string; initials: string; bg: string; color: string; score: number; diff: number }[][];
  rondaActual?: number;
  rondas?: number;
}

// Mock: el usuario actual es admin del torneo 1
const MY_UID = 'juann';

const TORNEOS: Torneo[] = [
  {
    id: '1',
    nombre: 'Open de Verano',
    modalidad: 'Stableford',
    fecha: 'Jul 2026',
    estado: 'próximo',
    grupo: null,
    adminId: 'juann',
    fechasRonda: ['2026-07-12', '2026-07-13'],
    participantes: [
      { nombre: 'Pepe Noceti', initials: 'PE', bg: '#333', color: '#c8e03a', hcp: 7.3 },
      { nombre: 'Juan Noceti', initials: 'JN', bg: '#c8e03a', color: '#0f0f0f', hcp: 12.1 },
      { nombre: 'Carlitos Laprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', hcp: 15.1 },
    ],
  },
  {
    id: '2',
    nombre: 'Torneo del Club',
    modalidad: 'Stroke Play',
    fecha: 'Jul 2026',
    estado: 'en curso',
    grupo: 'Haras Santa María',
    adminId: 'pepe',
    fechasRonda: ['2026-07-05', '2026-07-06'],
    rondaActual: 1,
    rondas: 2,
    participantes: [
      { nombre: 'Pepe Noceti', initials: 'PE', bg: '#333', color: '#c8e03a', hcp: 7.3 },
      { nombre: 'Manu Rivero', initials: 'MR', bg: '#3a2a1a', color: '#e0a03a', hcp: 9.8 },
      { nombre: 'Sofía Lagos', initials: 'SL', bg: '#1a2a3a', color: '#5fa0e0', hcp: 18.4 },
      { nombre: 'Tomás Bidegain', initials: 'TB', bg: '#2a1a3a', color: '#b070e0', hcp: 11.2 },
    ],
    leaderboard: [
      { pos: 1, nombre: 'Pepe Noceti', initials: 'PE', bg: '#333', color: '#c8e03a', score: 71, diff: -1 },
      { pos: 2, nombre: 'Manu Rivero', initials: 'MR', bg: '#3a2a1a', color: '#e0a03a', score: 74, diff: 2 },
      { pos: 3, nombre: 'Sofía Lagos', initials: 'SL', bg: '#1a2a3a', color: '#5fa0e0', score: 77, diff: 5 },
      { pos: 4, nombre: 'Tomás Bidegain', initials: 'TB', bg: '#2a1a3a', color: '#b070e0', score: 79, diff: 7 },
    ],
    leaderboardPorRonda: [
      [
        { pos: 1, nombre: 'Pepe Noceti', initials: 'PE', bg: '#333', color: '#c8e03a', score: 71, diff: -1 },
        { pos: 2, nombre: 'Manu Rivero', initials: 'MR', bg: '#3a2a1a', color: '#e0a03a', score: 74, diff: 2 },
        { pos: 3, nombre: 'Sofía Lagos', initials: 'SL', bg: '#1a2a3a', color: '#5fa0e0', score: 77, diff: 5 },
        { pos: 4, nombre: 'Tomás Bidegain', initials: 'TB', bg: '#2a1a3a', color: '#b070e0', score: 79, diff: 7 },
      ],
    ],
  },
  {
    id: '3',
    nombre: 'Copa Junio',
    modalidad: 'Stableford',
    fecha: 'Jun 2026',
    estado: 'finalizado',
    grupo: 'Haras Santa María',
    adminId: 'pepe',
    fechasRonda: ['2026-06-07'],
    rondas: 1,
    participantes: [],
    leaderboard: [
      { pos: 1, nombre: 'Pepe Noceti', initials: 'PE', bg: '#333', color: '#c8e03a', score: 38, diff: 0 },
      { pos: 2, nombre: 'Carlitos Laprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', score: 35, diff: 0 },
      { pos: 3, nombre: 'Manu Rivero', initials: 'MR', bg: '#3a2a1a', color: '#e0a03a', score: 32, diff: 0 },
      { pos: 4, nombre: 'Tomás Bidegain', initials: 'TB', bg: '#2a1a3a', color: '#b070e0', score: 29, diff: 0 },
    ],
    leaderboardPorRonda: [
      [
        { pos: 1, nombre: 'Pepe Noceti', initials: 'PE', bg: '#333', color: '#c8e03a', score: 38, diff: 0 },
        { pos: 2, nombre: 'Carlitos Laprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', score: 35, diff: 0 },
        { pos: 3, nombre: 'Manu Rivero', initials: 'MR', bg: '#3a2a1a', color: '#e0a03a', score: 32, diff: 0 },
        { pos: 4, nombre: 'Tomás Bidegain', initials: 'TB', bg: '#2a1a3a', color: '#b070e0', score: 29, diff: 0 },
      ],
    ],
  },
  {
    id: '4',
    nombre: 'Copa Invierno',
    modalidad: 'Match Play',
    fecha: 'Jun 2026',
    estado: 'finalizado',
    grupo: 'Los del Jueves',
    adminId: 'carlitos',
    fechasRonda: ['2026-06-14'],
    participantes: [],
    leaderboard: [
      { pos: 1, nombre: 'Carlitos Laprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', score: 3, diff: 0 },
      { pos: 2, nombre: 'Juan Noceti', initials: 'JN', bg: '#c8e03a', color: '#0f0f0f', score: 1, diff: 0 },
    ],
  },
];

function Avatar({ initials, bg, color, size = 36 }: { initials: string; bg: string; color: string; size?: number }) {
  return (
    <View style={[{ backgroundColor: bg, width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color, fontSize: size * 0.32, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

// ─── Detail modals ────────────────────────────────────────────────────────────

function DetailNav({ torneo, onClose, badge, onEdit }: { torneo: Torneo; onClose: () => void; badge: React.ReactNode; onEdit?: () => void }) {
  const insets = useSafeAreaInsets();
  const isAdmin = torneo.adminId === MY_UID;
  return (
    <View style={[styles.detailNav, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity onPress={onClose} style={{ padding: 2 }}>
        <Ionicons name="chevron-back" size={22} color={COLORS.white} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailNavTitle} numberOfLines={1}>{torneo.nombre}</Text>
        <Text style={styles.detailNavSub}>{torneo.modalidad} · {torneo.fecha}{torneo.grupo ? ` · ${torneo.grupo}` : ''}</Text>
      </View>
      {badge}
      {isAdmin && (
        <TouchableOpacity onPress={onEdit} style={{ marginLeft: 10, padding: 2 }}>
          <Ionicons name="pencil-outline" size={18} color={COLORS.lime} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function TorneoProximoDetail({ torneo, onClose }: { torneo: Torneo; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <DetailNav torneo={torneo} onClose={onClose} badge={
          <View style={styles.estadoBadge}><Text style={styles.estadoBadgeText}>Próximo</Text></View>
        } />
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={[styles.sectionLabel, { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 }]}>
            Participantes ({torneo.participantes.length})
          </Text>
          {torneo.participantes.map((p, i) => (
            <View key={i} style={styles.participanteRow}>
              <Avatar initials={p.initials} bg={p.bg} color={p.color} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={styles.participanteNombre}>{p.nombre}</Text>
                <Text style={styles.participanteSub}>HCP {p.hcp}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

type LeaderRow = { pos: number; nombre: string; initials: string; bg: string; color: string; score: number; diff: number };

function TabBar({ tabs, tab, onPress }: { tabs: string[]; tab: number; onPress: (i: number) => void }) {
  return (
    <View style={styles.detailTabBar}>
      {tabs.map((label, i) => (
        <TouchableOpacity key={label} style={[styles.detailTabBtn, tab === i && styles.detailTabBtnActive]} onPress={() => onPress(i)}>
          <Text style={[styles.detailTabText, tab === i && styles.detailTabTextActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function LeaderList({ rows, showDiff }: { rows: LeaderRow[]; showDiff?: boolean }) {
  if (rows.length === 0) return (
    <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', marginTop: 48 }}>
      Sin tarjetas cargadas
    </Text>
  );
  return (
    <>
      {rows.map((p, i) => (
        <TouchableOpacity key={i} style={[styles.leaderRow, p.pos === 1 && styles.leaderRowFirst]} activeOpacity={0.7}>
          <Text style={[styles.leaderPos, p.pos === 1 && { color: COLORS.lime }]}>{p.pos}</Text>
          <Avatar initials={p.initials} bg={p.bg} color={p.color} size={38} />
          <Text style={styles.leaderNombre}>{p.nombre}</Text>
          <View style={styles.leaderScores}>
            <Text style={[styles.leaderScore, p.pos === 1 && { color: COLORS.lime }]}>{p.score}</Text>
            {showDiff && (
              <Text style={[styles.leaderDiff, { color: p.diff <= 0 ? COLORS.lime : COLORS.muted }]}>
                {p.diff > 0 ? '+' : ''}{p.diff}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={14} color={COLORS.dim} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      ))}
    </>
  );
}

function Podio({ lb, isStableford }: { lb: LeaderRow[]; isStableford: boolean }) {
  const orden = [lb[1], lb[0], lb[2]].filter(Boolean);
  const heights = { 1: 72, 2: 52, 3: 40 };
  return (
    <View style={styles.podio}>
      {orden.map(p => (
        <View key={p.pos} style={styles.podioItem}>
          <Avatar initials={p.initials} bg={p.bg} color={p.color} size={p.pos === 1 ? 50 : 40} />
          <Text style={styles.podioNombre} numberOfLines={1}>{p.nombre.split(' ')[0]}</Text>
          <Text style={[styles.podioScore, p.pos === 1 && { color: COLORS.lime }]}>
            {p.score}{isStableford ? ' pts' : ''}
          </Text>
          <View style={[styles.podioPedestal, { height: heights[p.pos as 1|2|3] ?? 40 }, p.pos === 1 && styles.podioPedestalFirst]}>
            <Text style={[styles.podioPedNum, p.pos === 1 && { color: COLORS.lime }]}>{p.pos}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function TorneoEnCursoDetail({ torneo, onClose }: { torneo: Torneo; onClose: () => void }) {
  const totalRondas = torneo.rondas ?? 1;
  const tabs = ['General', ...Array.from({ length: totalRondas }, (_, i) => `Ronda ${i + 1}`)];
  const [tab, setTab] = useState(0);
  const pagerRef = useRef<ScrollView>(null);

  const onTabPress = (i: number) => {
    setTab(i);
    pagerRef.current?.scrollTo({ x: i * SCREEN_W, animated: true });
  };

  const onScroll = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== tab) setTab(i);
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <DetailNav torneo={torneo} onClose={onClose} badge={
          <View style={[styles.estadoBadge, styles.estadoBadgeEnCurso]}>
            <View style={styles.estadoBadgeDot} />
            <Text style={[styles.estadoBadgeText, { color: COLORS.lime }]}>En curso</Text>
          </View>
        } />
        <TabBar tabs={tabs} tab={tab} onPress={onTabPress} />
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          style={{ flex: 1 }}
        >
          {tabs.map((_, i) => {
            const rows = i === 0 ? torneo.leaderboard ?? [] : torneo.leaderboardPorRonda?.[i - 1] ?? [];
            return (
              <ScrollView key={i} style={{ width: SCREEN_W }} contentContainerStyle={{ paddingBottom: 40 }}>
                <LeaderList rows={rows} showDiff />
              </ScrollView>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function TorneoFinalizadoDetail({ torneo, onClose }: { torneo: Torneo; onClose: () => void }) {
  const isStableford = torneo.modalidad === 'Stableford';
  const totalRondas = torneo.rondas ?? (torneo.leaderboardPorRonda?.length ?? 1);
  const tabs = ['General', ...Array.from({ length: totalRondas }, (_, i) => `Ronda ${i + 1}`)];
  const [tab, setTab] = useState(0);
  const pagerRef = useRef<ScrollView>(null);

  const onTabPress = (i: number) => {
    setTab(i);
    pagerRef.current?.scrollTo({ x: i * SCREEN_W, animated: true });
  };

  const onScroll = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== tab) setTab(i);
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <DetailNav torneo={torneo} onClose={onClose} badge={
          <View style={[styles.estadoBadge, styles.estadoBadgeFinalizado]}>
            <Text style={styles.estadoBadgeText}>Finalizado</Text>
          </View>
        } />
        <TabBar tabs={tabs} tab={tab} onPress={onTabPress} />
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          style={{ flex: 1 }}
        >
          {/* General */}
          <ScrollView style={{ width: SCREEN_W }} contentContainerStyle={{ paddingBottom: 40 }}>
            {torneo.leaderboard && torneo.leaderboard.length >= 2 && (
              <Podio lb={torneo.leaderboard} isStableford={isStableford} />
            )}
            <LeaderList rows={torneo.leaderboard ?? []} />
          </ScrollView>
          {/* Por ronda */}
          {Array.from({ length: totalRondas }, (_, i) => (
            <ScrollView key={i} style={{ width: SCREEN_W }} contentContainerStyle={{ paddingBottom: 40 }}>
              <LeaderList rows={torneo.leaderboardPorRonda?.[i] ?? []} />
            </ScrollView>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function TorneoRow({ torneo, onPress }: { torneo: Torneo; onPress: () => void }) {
  const dotColor = torneo.estado === 'próximo' ? COLORS.dim : torneo.estado === 'en curso' ? COLORS.lime : COLORS.dim;
  const ganador = torneo.leaderboard?.[0];
  return (
    <TouchableOpacity style={styles.torneoRow} onPress={onPress}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.torneoNombre}>{torneo.nombre}</Text>
        <Text style={styles.torneoMeta}>
          {torneo.modalidad} · {torneo.fecha}{torneo.grupo ? ` · ${torneo.grupo}` : ' · Público'}
        </Text>
        {torneo.estado === 'finalizado' && ganador && (
          <Text style={styles.torneoGanador}>🏆 {ganador.nombre}</Text>
        )}
        {torneo.estado === 'en curso' && (
          <Text style={[styles.torneoMeta, { color: COLORS.lime, marginTop: 2 }]}>
            Ronda {torneo.rondaActual}/{torneo.rondas} en curso
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
    </TouchableOpacity>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

const MODALIDADES = [
  { key: 'Stroke Play', desc: 'Suma de todos los golpes' },
  { key: 'Stableford', desc: 'Puntos por hoyo vs par' },
  { key: 'Match Play', desc: 'Hoyo a hoyo entre jugadores' },
  { key: 'Better Ball', desc: 'Mejor score de la pareja' },
  { key: 'Scramble', desc: 'Equipo elige el mejor tiro' },
];

function ModalidadDropdown({ value, onChange }: { value: string | null; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.dropdown}>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(o => !o)}>
        <Text style={[styles.dropdownBtnText, !value && { color: COLORS.dim }]}>
          {value ?? 'Elegir modalidad...'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.muted} />
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownList}>
          {MODALIDADES.map((m, i) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.dropdownItem, i < MODALIDADES.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: '#222' }, value === m.key && styles.dropdownItemActive]}
              onPress={() => { onChange(m.key); setOpen(false); }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.dropdownItemText, value === m.key && { color: COLORS.lime, fontWeight: '600' }]}>{m.key}</Text>
                <Text style={styles.dropdownItemDesc}>{m.desc}</Text>
              </View>
              {value === m.key && <Ionicons name="checkmark" size={16} color={COLORS.lime} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const GRUPOS_DISPONIBLES = ['Haras Santa María', 'Los del Jueves', 'Martindale CC'];

function GrupoDropdown({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.dropdown}>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(o => !o)}>
        <Text style={[styles.dropdownBtnText, !value && { color: COLORS.dim }]}>
          {value ?? 'Sin grupo (abierto)'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.muted} />
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownList}>
          <TouchableOpacity
            style={[styles.dropdownItem, { borderBottomWidth: 0.5, borderBottomColor: '#222' }, !value && styles.dropdownItemActive]}
            onPress={() => { onChange(null); setOpen(false); }}
          >
            <Text style={[styles.dropdownItemText, !value && { color: COLORS.lime, fontWeight: '600' }]}>Sin grupo (abierto)</Text>
            {!value && <Ionicons name="checkmark" size={16} color={COLORS.lime} />}
          </TouchableOpacity>
          {GRUPOS_DISPONIBLES.map((g, i) => (
            <TouchableOpacity
              key={g}
              style={[styles.dropdownItem, i < GRUPOS_DISPONIBLES.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: '#222' }, value === g && styles.dropdownItemActive]}
              onPress={() => { onChange(g); setOpen(false); }}
            >
              <Text style={[styles.dropdownItemText, value === g && { color: COLORS.lime, fontWeight: '600' }]}>{g}</Text>
              {value === g && <Ionicons name="checkmark" size={16} color={COLORS.lime} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function CreateTorneoModal({ onClose }: { onClose: () => void }) {
  const [nombre, setNombre] = useState('');
  const [modalidad, setModalidad] = useState<string | null>(null);
  const [grupo, setGrupo] = useState<string | null>(null);
  const [fechas, setFechas] = useState<(Date | null)[]>([null]);
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);

  const canCreate = nombre.trim() && modalidad;

  const addFecha = () => { if (fechas.length < 4) setFechas(f => [...f, null]); };
  const removeFecha = (i: number) => setFechas(f => f.filter((_, idx) => idx !== i));
  const formatDate = (d: Date | null) =>
    d ? d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'A definir';

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo torneo</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={20} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 12 }}>
              <Text style={styles.label}>Nombre</Text>
              <View style={styles.inputBox}>
                <TextInput style={styles.inputText} placeholder="Ej: Copa Julio" placeholderTextColor={COLORS.dim} value={nombre} onChangeText={setNombre} autoFocus />
              </View>

              <Text style={styles.label}>Modalidad</Text>
              <ModalidadDropdown value={modalidad} onChange={setModalidad} />

              <Text style={styles.label}>Grupo <Text style={{ color: COLORS.dim, fontWeight: '400', textTransform: 'none' }}>(opcional)</Text></Text>
              <GrupoDropdown value={grupo} onChange={setGrupo} />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.label}>Fechas de juego</Text>
                {fechas.length < 4 && (
                  <TouchableOpacity onPress={addFecha} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="add" size={14} color={COLORS.lime} />
                    <Text style={{ color: COLORS.lime, fontSize: 12 }}>Ronda</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.dropdown}>
                {fechas.map((f, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dropdownBtn, i < fechas.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: '#2a2a2a' }]}
                    onPress={() => setPickerIdx(i)}
                  >
                    <Text style={[styles.dropdownBtnText, { fontSize: 13, color: COLORS.muted }]}>Ronda {i + 1}</Text>
                    <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 10 }}>
                      <Text style={[styles.dropdownBtnText, !f && { color: COLORS.dim }]}>{formatDate(f)}</Text>
                    </View>
                    <Ionicons name="calendar-outline" size={15} color={COLORS.dim} />
                    {fechas.length > 1 && (
                      <TouchableOpacity onPress={() => removeFecha(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 10 }}>
                        <Ionicons name="close" size={15} color={COLORS.dim} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {pickerIdx !== null && (
                <DateTimePicker
                  value={fechas[pickerIdx] ?? new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    if (date) setFechas(f => f.map((x, idx) => idx === pickerIdx ? date : x));
                    setPickerIdx(null);
                  }}
                />
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.createBtn, !canCreate && { opacity: 0.4 }]} onPress={onClose} disabled={!canCreate}>
                <Text style={styles.createBtnText}>Crear torneo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export type { Torneo };

export default function TorneosScreen() {
  const [selected, setSelected] = useState<Torneo | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const proximos = TORNEOS.filter(t => t.estado === 'próximo');
  const enCurso = TORNEOS.filter(t => t.estado === 'en curso');
  const finalizados = TORNEOS.filter(t => t.estado === 'finalizado');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {selected?.estado === 'próximo' && <TorneoProximoDetail torneo={selected} onClose={() => setSelected(null)} />}
      {selected?.estado === 'en curso' && <TorneoEnCursoDetail torneo={selected} onClose={() => setSelected(null)} />}
      {selected?.estado === 'finalizado' && <TorneoFinalizadoDetail torneo={selected} onClose={() => setSelected(null)} />}
      {showCreate && <CreateTorneoModal onClose={() => setShowCreate(false)} />}

      <View style={styles.header}>
        <Text style={styles.title}>Torneos</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={26} color={COLORS.lime} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {enCurso.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>En curso</Text>
            {enCurso.map(t => <TorneoRow key={t.id} torneo={t} onPress={() => setSelected(t)} />)}
          </>
        )}
        {proximos.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Próximos</Text>
            {proximos.map(t => <TorneoRow key={t.id} torneo={t} onPress={() => setSelected(t)} />)}
          </>
        )}
        {finalizados.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Finalizados</Text>
            {finalizados.map(t => <TorneoRow key={t.id} torneo={t} onPress={() => setSelected(t)} />)}
          </>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  sectionTitle: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 },
  sectionLabel: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },

  torneoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  torneoNombre: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  torneoMeta: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  torneoGanador: { fontSize: 12, color: COLORS.muted, marginTop: 3 },

  detailTabBar: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  detailTabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  detailTabBtnActive: { borderBottomWidth: 2, borderBottomColor: COLORS.lime },
  detailTabText: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },
  detailTabTextActive: { color: COLORS.lime },
  detailNav: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  detailNavTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  detailNavSub: { fontSize: 11, color: COLORS.muted, marginTop: 1 },

  estadoBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#222' },
  estadoBadgeEnCurso: { backgroundColor: '#1a2a0a', flexDirection: 'row', alignItems: 'center', gap: 5 },
  estadoBadgeFinalizado: { backgroundColor: '#1e1e1e' },
  estadoBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.lime },
  estadoBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.muted },

  participanteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  participanteNombre: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  participanteSub: { fontSize: 12, color: COLORS.muted, marginTop: 1 },
  inscribirseBtn: { backgroundColor: COLORS.lime, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  inscribirseBtnText: { fontSize: 14, fontWeight: '800', color: '#0f0f0f' },

  podio: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 0 },
  podioItem: { flex: 1, alignItems: 'center', gap: 4 },
  podioNombre: { fontSize: 12, fontWeight: '600', color: COLORS.muted, marginTop: 6 },
  podioScore: { fontSize: 16, fontWeight: '800', color: COLORS.white, marginBottom: 8 },
  podioPedestal: { width: '100%', backgroundColor: '#1a1a1a', borderTopLeftRadius: 4, borderTopRightRadius: 4, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8 },
  podioPedestalFirst: { backgroundColor: '#1a2a0a' },
  podioPedNum: { fontSize: 13, fontWeight: '800', color: COLORS.dim },

  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  leaderRowFirst: { backgroundColor: '#0f1a0a' },
  leaderPos: { fontSize: 13, fontWeight: '700', color: COLORS.dim, width: 20, textAlign: 'center' },
  leaderNombre: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.white },
  leaderScores: { alignItems: 'flex-end' },
  leaderScore: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  leaderDiff: { fontSize: 11, fontWeight: '700' },

  fab: { position: 'absolute', bottom: 20, right: 18, width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.lime, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: { backgroundColor: '#161616', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHandle: { width: 36, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  modalFooter: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#222' },
  label: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputBox: { backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 0.5, borderColor: '#2a2a2a', paddingHorizontal: 14 },
  inputText: { fontSize: 14, color: COLORS.white, paddingVertical: 12 },
  dropdown: { borderRadius: 10, borderWidth: 0.5, borderColor: '#2a2a2a', overflow: 'hidden' },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#1a1a1a' },
  dropdownBtnText: { fontSize: 14, color: COLORS.white, fontWeight: '500' },
  dropdownList: { borderTopWidth: 0.5, borderTopColor: '#2a2a2a' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#161616' },
  dropdownItemActive: { backgroundColor: '#1a2a0a' },
  dropdownItemText: { flex: 1, fontSize: 14, color: COLORS.muted },
  dropdownItemDesc: { fontSize: 11, color: COLORS.dim, marginTop: 2 },
  createBtn: { backgroundColor: COLORS.lime, borderRadius: 12, padding: 14, alignItems: 'center' },
  createBtnText: { fontSize: 14, fontWeight: '800', color: '#0f0f0f' },
});
