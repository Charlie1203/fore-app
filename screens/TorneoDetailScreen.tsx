import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MY_UID } from './TorneosScreen';
import type { Torneo } from './TorneosScreen';

const SCREEN_W = Dimensions.get('window').width;

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444', dark2: '#242424',
};

function Avatar({ initials, bg, color, size = 36 }: { initials: string; bg: string; color: string; size?: number }) {
  return (
    <View style={[{ backgroundColor: bg, width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color, fontSize: size * 0.32, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

function DetailNav({ torneo, onBack, badge, onEdit }: { torneo: Torneo; onBack: () => void; badge: React.ReactNode; onEdit?: () => void }) {
  const insets = useSafeAreaInsets();
  const isAdmin = torneo.adminId === MY_UID;
  return (
    <View style={[styles.detailNav, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity onPress={onBack} style={{ padding: 2 }}>
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

const MODALIDAD_INFO: Record<string, { icon: string; desc: string }> = {
  'Stroke Play': { icon: 'trophy-outline', desc: 'Gana el que menor score haga en la vuelta.' },
  'Stableford': { icon: 'flag-outline', desc: 'Sumá puntos en cada hoyo. Gana el que más acumule.' },
  'Match Play': { icon: 'people-outline', desc: 'Competencia hoyo a hoyo contra otro jugador o equipo.' },
};

function TorneoProximoContent({ torneo }: { torneo: Torneo }) {
  const navigation = useNavigation<any>();
  const isAdmin = torneo.adminId === MY_UID;
  const modalidadInfo = MODALIDAD_INFO[torneo.modalidad] ?? { icon: 'trophy-outline', desc: '' };
  return (
    <View style={styles.container}>
      <DetailNav
        torneo={torneo}
        onBack={() => navigation.goBack()}
        badge={<View style={styles.estadoBadge}><Text style={styles.estadoBadgeText}>Próximo</Text></View>}
        onEdit={() => navigation.navigate('CreateTorneo', { torneo })}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name={modalidadInfo.icon as any} size={22} color="#0f0f0f" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Modalidad</Text>
            <Text style={styles.infoValue}>{torneo.modalidad}</Text>
            {!!modalidadInfo.desc && <Text style={styles.infoDesc}>{modalidadInfo.desc}</Text>}
          </View>
        </View>

        <View style={styles.participantesHeader}>
          <Text style={styles.sectionLabel}>Participantes ({torneo.participantes.length})</Text>
          {isAdmin && (
            <TouchableOpacity onPress={() => navigation.navigate('InvitarJugadores', { nombreTorneo: torneo.nombre, standalone: true })}>
              <Text style={styles.invitarLink}>+ Invitar</Text>
            </TouchableOpacity>
          )}
        </View>
        {torneo.participantes.map((p, i) => (
          <TouchableOpacity
            key={i}
            style={styles.participanteRow}
            onPress={() => navigation.navigate('PerfilUsuario', { viewUser: { name: p.nombre, initials: p.initials, bg: p.bg, color: p.color, handicap: p.hcp } })}
          >
            <Avatar initials={p.initials} bg={p.bg} color={p.color} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.participanteNombre}>{p.nombre}</Text>
              <Text style={styles.participanteSub}>HCP {p.hcp}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
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
  const navigation = useNavigation<any>();
  if (rows.length === 0) return (
    <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', marginTop: 48 }}>
      Sin tarjetas cargadas
    </Text>
  );
  return (
    <>
      {rows.map((p, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.leaderRow, p.pos === 1 && styles.leaderRowFirst]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('PerfilUsuario', { viewUser: { name: p.nombre, initials: p.initials, bg: p.bg, color: p.color } })}
        >
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
  const navigation = useNavigation<any>();
  const orden = [lb[1], lb[0], lb[2]].filter(Boolean);
  const heights = { 1: 72, 2: 52, 3: 40 };
  return (
    <View style={styles.podio}>
      {orden.map(p => (
        <TouchableOpacity
          key={p.pos}
          style={styles.podioItem}
          onPress={() => navigation.navigate('PerfilUsuario', { viewUser: { name: p.nombre, initials: p.initials, bg: p.bg, color: p.color } })}
        >
          <Avatar initials={p.initials} bg={p.bg} color={p.color} size={p.pos === 1 ? 50 : 40} />
          <Text style={styles.podioNombre} numberOfLines={1}>{p.nombre.split(' ')[0]}</Text>
          <Text style={[styles.podioScore, p.pos === 1 && { color: COLORS.lime }]}>
            {p.score}{isStableford ? ' pts' : ''}
          </Text>
          <View style={[styles.podioPedestal, { height: heights[p.pos as 1|2|3] ?? 40 }, p.pos === 1 && styles.podioPedestalFirst]}>
            <Text style={[styles.podioPedNum, p.pos === 1 && { color: COLORS.lime }]}>{p.pos}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function TorneoEnCursoContent({ torneo }: { torneo: Torneo }) {
  const navigation = useNavigation<any>();
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
    <View style={styles.container}>
      <DetailNav
        torneo={torneo}
        onBack={() => navigation.goBack()}
        badge={
          <View style={[styles.estadoBadge, styles.estadoBadgeEnCurso]}>
            <View style={styles.estadoBadgeDot} />
            <Text style={[styles.estadoBadgeText, { color: COLORS.lime }]}>En curso</Text>
          </View>
        }
        onEdit={() => navigation.navigate('CreateTorneo', { torneo })}
      />
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
  );
}

function TorneoFinalizadoContent({ torneo }: { torneo: Torneo }) {
  const navigation = useNavigation<any>();
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
    <View style={styles.container}>
      <DetailNav
        torneo={torneo}
        onBack={() => navigation.goBack()}
        badge={
          <View style={[styles.estadoBadge, styles.estadoBadgeFinalizado]}>
            <Text style={styles.estadoBadgeText}>Finalizado</Text>
          </View>
        }
      />
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
  );
}

export default function TorneoDetailScreen() {
  const route = useRoute<any>();
  const torneo: Torneo = route.params.torneo;

  if (torneo.estado === 'próximo') return <TorneoProximoContent torneo={torneo} />;
  if (torneo.estado === 'en curso') return <TorneoEnCursoContent torneo={torneo} />;
  return <TorneoFinalizadoContent torneo={torneo} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  sectionLabel: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },

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

  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 18, marginTop: 18, padding: 16, backgroundColor: '#141f09', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(200,224,58,0.28)' },
  infoIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.lime, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, color: COLORS.lime, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  infoValue: { fontSize: 17, fontWeight: '800', color: COLORS.white, marginTop: 2 },
  infoDesc: { fontSize: 12, color: COLORS.muted, marginTop: 3, lineHeight: 16 },

  participantesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 },
  invitarLink: { fontSize: 12, fontWeight: '700', color: COLORS.lime },
  participanteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  participanteNombre: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  participanteSub: { fontSize: 12, color: COLORS.muted, marginTop: 1 },

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
});
