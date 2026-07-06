import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

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
export const MY_UID = 'juann';

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export type { Torneo };

export default function TorneosScreen() {
  const navigation = useNavigation<any>();

  const proximos = TORNEOS.filter(t => t.estado === 'próximo');
  const enCurso = TORNEOS.filter(t => t.estado === 'en curso');
  const finalizados = TORNEOS.filter(t => t.estado === 'finalizado');

  const abrir = (torneo: Torneo) => navigation.navigate('TorneoDetail', { torneo });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Torneos</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateTorneo')}>
          <Ionicons name="add" size={26} color={COLORS.lime} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {enCurso.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>En curso</Text>
            {enCurso.map(t => <TorneoRow key={t.id} torneo={t} onPress={() => abrir(t)} />)}
          </>
        )}
        {proximos.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Próximos</Text>
            {proximos.map(t => <TorneoRow key={t.id} torneo={t} onPress={() => abrir(t)} />)}
          </>
        )}
        {finalizados.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Finalizados</Text>
            {finalizados.map(t => <TorneoRow key={t.id} torneo={t} onPress={() => abrir(t)} />)}
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

  torneoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  torneoNombre: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  torneoMeta: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  torneoGanador: { fontSize: 12, color: COLORS.muted, marginTop: 3 },
});
