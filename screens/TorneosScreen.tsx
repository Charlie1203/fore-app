import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import type { TournamentDoc } from '../firebase/types';
import { estadoDeTorneo, rondaActualDeTorneo } from '../services/tournaments';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444', dark2: '#242424',
};

const SCREEN_W = Dimensions.get('window').width;
const FEATURED_GAP = 12;
const FEATURED_W = SCREEN_W - 18 * 2 - 28; // deja asomar un poco la próxima tarjeta

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function formatFechaTorneo(roundDates: (string | null)[]): string {
  const fechas = roundDates.filter((d): d is string => !!d).map(d => new Date(d));
  if (fechas.length === 0) return 'A definir';
  const primera = fechas.sort((a, b) => a.getTime() - b.getTime())[0];
  return `${MESES[primera.getMonth()]} ${primera.getFullYear()}`;
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function TorneoRow({ torneo, onPress }: { torneo: TournamentDoc; onPress: () => void }) {
  const estado = estadoDeTorneo(torneo.roundDates);
  const dotColor = estado === 'en curso' ? COLORS.lime : COLORS.dim;
  return (
    <TouchableOpacity style={styles.torneoRow} onPress={onPress}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.torneoNombre} numberOfLines={1}>{torneo.name}</Text>
        <Text style={styles.torneoMeta} numberOfLines={1}>
          {torneo.modality} · {formatFechaTorneo(torneo.roundDates)}{torneo.groupName ? ` · ${torneo.groupName}` : ' · Abierto'}
        </Text>
        {estado === 'en curso' && (
          <Text style={[styles.torneoMeta, { color: COLORS.lime, marginTop: 2 }]}>
            Ronda {rondaActualDeTorneo(torneo.roundDates)}/{torneo.roundDates.length} en curso
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
    </TouchableOpacity>
  );
}

// ─── Tarjeta destacada (en curso) ──────────────────────────────────────────────

function ParticipantesAvatares({ torneoId, count }: { torneoId: string; count: number }) {
  const [previos, setPrevios] = useState<{ uid: string; initials: string }[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'tournaments', torneoId, 'participants'), orderBy('joinedAt', 'asc'), limit(4));
    return onSnapshot(q, snap => setPrevios(snap.docs.map(d => ({ uid: d.id, initials: (d.data() as any).initials ?? '?' }))));
  }, [torneoId]);

  const extra = count - previos.length;

  return (
    <View style={styles.avatarRow}>
      {previos.map((p, i) => (
        <View key={p.uid} style={[styles.avatarChip, i > 0 && { marginLeft: -10 }, { zIndex: 10 - i }]}>
          <Text style={styles.avatarChipText}>{p.initials}</Text>
        </View>
      ))}
      {extra > 0 && (
        <View style={[styles.avatarChip, styles.avatarChipExtra, { marginLeft: -10 }]}>
          <Text style={[styles.avatarChipText, styles.avatarChipExtraText]}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

function TorneoFeaturedCard({ torneo, onPress }: { torneo: TournamentDoc; onPress: () => void }) {
  const total = torneo.roundDates.length || 1;
  const actual = rondaActualDeTorneo(torneo.roundDates);
  const pct = Math.min(100, Math.round((actual / total) * 100));

  return (
    <TouchableOpacity activeOpacity={0.85} style={[styles.featuredCard, { width: FEATURED_W }]} onPress={onPress}>
      <View style={styles.featuredHeader}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.featuredNombre} numberOfLines={1}>{torneo.name}</Text>
          <Text style={styles.featuredMeta} numberOfLines={1}>
            {torneo.modality} · {total} {total === 1 ? 'ronda' : 'rondas'}
          </Text>
        </View>
        <Ionicons name="flag" size={20} color={COLORS.lime} />
      </View>

      <View style={styles.featuredBadge}>
        <View style={styles.featuredBadgeDot} />
        <Text style={styles.featuredBadgeText}>EN PROGRESO</Text>
      </View>

      <View style={styles.featuredProgress}>
        <View style={styles.featuredProgressLabelRow}>
          <Text style={styles.featuredProgressLabel}>Ronda {actual} de {total}</Text>
          <Text style={styles.featuredProgressPct}>{pct}%</Text>
        </View>
        <View style={styles.featuredProgressTrack}>
          <View style={[styles.featuredProgressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      <View style={styles.featuredFooter}>
        <ParticipantesAvatares torneoId={torneo.id} count={torneo.participantsCount} />
        <View style={styles.featuredCta}>
          <Text style={styles.featuredCtaText}>Ver clasificación</Text>
          <Ionicons name="chevron-forward" size={14} color="#0f0f0f" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TorneosEnCursoCarrusel({ torneos, onOpen }: { torneos: TournamentDoc[]; onOpen: (t: TournamentDoc) => void }) {
  const [index, setIndex] = useState(0);

  const onScroll = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (FEATURED_W + FEATURED_GAP));
    if (i !== index) setIndex(i);
  };

  return (
    <View style={{ paddingTop: 8 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={FEATURED_W + FEATURED_GAP}
        snapToAlignment="start"
        contentContainerStyle={{ paddingHorizontal: 18, gap: FEATURED_GAP }}
        onMomentumScrollEnd={onScroll}
      >
        {torneos.map(t => (
          <TorneoFeaturedCard key={t.id} torneo={t} onPress={() => onOpen(t)} />
        ))}
      </ScrollView>
      {torneos.length > 1 && (
        <View style={styles.dotsRow}>
          {torneos.map((t, i) => (
            <View key={t.id} style={[styles.pageDot, { backgroundColor: i === index ? COLORS.lime : COLORS.dim }]} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TorneosScreen() {
  const navigation = useNavigation<any>();
  const { firebaseUser } = useAuth();
  const [torneos, setTorneos] = useState<TournamentDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(collection(db, 'tournaments'), where('participantUids', 'array-contains', firebaseUser.uid));
    return onSnapshot(q, snap => {
      setTorneos(snap.docs.map(d => ({ ...d.data(), id: d.id }) as TournamentDoc));
      setLoading(false);
    }, () => setLoading(false));
  }, [firebaseUser?.uid]);

  const proximos = torneos.filter(t => estadoDeTorneo(t.roundDates) === 'próximo');
  const enCurso = torneos.filter(t => estadoDeTorneo(t.roundDates) === 'en curso');
  const finalizados = torneos.filter(t => estadoDeTorneo(t.roundDates) === 'finalizado');

  const abrir = (torneo: TournamentDoc) => navigation.navigate('TorneoDetail', { torneoId: torneo.id });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Torneos</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateTorneo')}>
          <Ionicons name="add" size={26} color={COLORS.lime} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.lime} style={{ marginTop: 48 }} />
      ) : torneos.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="trophy-outline" size={40} color={COLORS.dim} />
          <Text style={styles.emptyTitle}>Todavía no tenés torneos</Text>
          <Text style={styles.emptyText}>Creá uno o esperá a que te inviten a alguno.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {enCurso.length > 0 && <TorneosEnCursoCarrusel torneos={enCurso} onOpen={abrir} />}
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
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  sectionTitle: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white, marginTop: 4 },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 18 },

  torneoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  torneoNombre: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  torneoMeta: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  torneoGanador: { fontSize: 12, color: COLORS.muted, marginTop: 3 },

  featuredCard: { backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 18 },
  featuredHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featuredNombre: { fontSize: 19, fontWeight: '800', color: COLORS.white },
  featuredMeta: { fontSize: 12, color: COLORS.muted, marginTop: 3 },

  featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 12, borderWidth: 1, borderColor: 'rgba(200,224,58,0.35)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  featuredBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.lime },
  featuredBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.lime, letterSpacing: 0.5 },

  featuredProgress: { marginTop: 18 },
  featuredProgressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  featuredProgressLabel: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  featuredProgressPct: { fontSize: 12, fontWeight: '700', color: COLORS.lime },
  featuredProgressTrack: { height: 6, borderRadius: 3, backgroundColor: COLORS.dark2, marginTop: 8, overflow: 'hidden' },
  featuredProgressFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.lime },

  featuredFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarChip: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.lime, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.card },
  avatarChipExtra: { backgroundColor: COLORS.dark2 },
  avatarChipText: { fontSize: 10, fontWeight: '700', color: '#0f0f0f' },
  avatarChipExtraText: { color: COLORS.white },

  featuredCta: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.lime, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  featuredCtaText: { fontSize: 12, fontWeight: '800', color: '#0f0f0f' },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  pageDot: { width: 6, height: 6, borderRadius: 3 },
});
