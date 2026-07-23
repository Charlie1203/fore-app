import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { TournamentDoc, TournamentParticipantDoc } from '../firebase/types';
import { estadoDeTorneo, joinTournament } from '../services/tournaments';
import { formatFechaTorneo } from './TorneosScreen';

const SCREEN_W = Dimensions.get('window').width;

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444', dark2: '#242424',
};

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  return (
    <View style={[{ backgroundColor: COLORS.lime, width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: '#0f0f0f', fontSize: size * 0.32, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

function DetailNav({ torneo, onBack, badge, isAdmin, onEdit }: { torneo: TournamentDoc; onBack: () => void; badge: React.ReactNode; isAdmin: boolean; onEdit?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.detailNav, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity onPress={onBack} style={{ padding: 2 }}>
        <Ionicons name="chevron-back" size={22} color={COLORS.white} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailNavTitle} numberOfLines={1}>{torneo.name}</Text>
        <Text style={styles.detailNavSub}>{torneo.modality} · {formatFechaTorneo(torneo.roundDates)}{torneo.groupName ? ` · ${torneo.groupName}` : ''}</Text>
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

function TorneoProximoContent({ torneo, participantes, isAdmin, isParticipante, joining, onJoin }: { torneo: TournamentDoc; participantes: TournamentParticipantDoc[]; isAdmin: boolean; isParticipante: boolean; joining: boolean; onJoin: () => void }) {
  const navigation = useNavigation<any>();
  const modalidadInfo = MODALIDAD_INFO[torneo.modality] ?? { icon: 'trophy-outline', desc: '' };
  return (
    <View style={styles.container}>
      <DetailNav
        torneo={torneo}
        onBack={() => navigation.goBack()}
        isAdmin={isAdmin}
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
            <Text style={styles.infoValue}>{torneo.modality}</Text>
            {!!modalidadInfo.desc && <Text style={styles.infoDesc}>{modalidadInfo.desc}</Text>}
          </View>
        </View>

        {!isAdmin && !isParticipante && (
          <TouchableOpacity style={styles.joinCard} onPress={onJoin} disabled={joining}>
            {joining
              ? <ActivityIndicator size="small" color="#0f0f0f" />
              : <Text style={styles.joinCardText}>Unirme a este torneo</Text>
            }
          </TouchableOpacity>
        )}

        <View style={styles.participantesHeader}>
          <Text style={styles.sectionLabel}>Participantes ({participantes.length})</Text>
          {isAdmin && (
            <TouchableOpacity onPress={() => navigation.navigate('InvitarJugadores', { torneoId: torneo.id, nombreTorneo: torneo.name, standalone: true })}>
              <Text style={styles.invitarLink}>+ Invitar</Text>
            </TouchableOpacity>
          )}
        </View>
        {participantes.map(p => (
          <TouchableOpacity
            key={p.uid}
            style={styles.participanteRow}
            onPress={() => navigation.navigate('PerfilUsuario', { viewUser: { name: p.displayName, initials: p.initials, bg: COLORS.lime, color: '#0f0f0f', handicap: p.handicap } })}
          >
            <Avatar initials={p.initials} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.participanteNombre}>{p.displayName}</Text>
              <Text style={styles.participanteSub}>{p.handicap != null ? `HCP ${p.handicap}` : 'Sin HCP cargado'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

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

function LeaderboardEmpty() {
  return (
    <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 8 }}>
      <Ionicons name="golf-outline" size={32} color={COLORS.dim} />
      <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
        Sin tarjetas cargadas todavía.
      </Text>
    </View>
  );
}

function TorneoEnCursoContent({ torneo, isAdmin, isParticipante, joining, onJoin }: { torneo: TournamentDoc; isAdmin: boolean; isParticipante: boolean; joining: boolean; onJoin: () => void }) {
  const navigation = useNavigation<any>();
  const totalRondas = torneo.roundDates.length || 1;
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
        isAdmin={isAdmin}
        badge={
          <View style={[styles.estadoBadge, styles.estadoBadgeEnCurso]}>
            <View style={styles.estadoBadgeDot} />
            <Text style={[styles.estadoBadgeText, { color: COLORS.lime }]}>En curso</Text>
          </View>
        }
        onEdit={() => navigation.navigate('CreateTorneo', { torneo })}
      />
      {!isAdmin && !isParticipante && (
        <TouchableOpacity style={[styles.joinCard, { marginTop: 14 }]} onPress={onJoin} disabled={joining}>
          {joining
            ? <ActivityIndicator size="small" color="#0f0f0f" />
            : <Text style={styles.joinCardText}>Unirme a este torneo</Text>
          }
        </TouchableOpacity>
      )}
      <TabBar tabs={tabs} tab={tab} onPress={onTabPress} />
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ flex: 1 }}
      >
        {tabs.map((_, i) => (
          <ScrollView key={i} style={{ width: SCREEN_W }} contentContainerStyle={{ paddingBottom: 40 }}>
            <LeaderboardEmpty />
          </ScrollView>
        ))}
      </ScrollView>
    </View>
  );
}

function TorneoFinalizadoContent({ torneo, isAdmin }: { torneo: TournamentDoc; isAdmin: boolean }) {
  const navigation = useNavigation<any>();
  const totalRondas = torneo.roundDates.length || 1;
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
        isAdmin={isAdmin}
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
        {tabs.map((_, i) => (
          <ScrollView key={i} style={{ width: SCREEN_W }} contentContainerStyle={{ paddingBottom: 40 }}>
            <LeaderboardEmpty />
          </ScrollView>
        ))}
      </ScrollView>
    </View>
  );
}

export default function TorneoDetailScreen() {
  const route = useRoute<any>();
  const { firebaseUser, userDoc } = useAuth();
  const torneoId: string = route.params.torneoId;

  const [torneo, setTorneo] = useState<TournamentDoc | null>(null);
  const [participantes, setParticipantes] = useState<TournamentParticipantDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    return onSnapshot(doc(db, 'tournaments', torneoId), snap => {
      if (snap.exists()) setTorneo({ ...snap.data(), id: snap.id } as TournamentDoc);
      setLoading(false);
    }, () => setLoading(false));
  }, [torneoId]);

  useEffect(() => {
    const q = query(collection(db, 'tournaments', torneoId, 'participants'), orderBy('joinedAt', 'asc'));
    return onSnapshot(q, snap => setParticipantes(snap.docs.map(d => d.data() as TournamentParticipantDoc)));
  }, [torneoId]);

  if (loading || !torneo) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={COLORS.lime} />
      </View>
    );
  }

  const isAdmin = torneo.createdBy === firebaseUser?.uid;
  const isParticipante = !!firebaseUser && torneo.participantUids.includes(firebaseUser.uid);
  const estado = estadoDeTorneo(torneo.roundDates);

  const onJoin = async () => {
    if (!userDoc || joining) return;
    setJoining(true);
    try {
      await joinTournament(torneoId, userDoc);
    } catch {
      Alert.alert('Error', 'No te pudimos sumar al torneo. Probá de nuevo.');
    } finally {
      setJoining(false);
    }
  };

  if (estado === 'próximo') return <TorneoProximoContent torneo={torneo} participantes={participantes} isAdmin={isAdmin} isParticipante={isParticipante} joining={joining} onJoin={onJoin} />;
  if (estado === 'en curso') return <TorneoEnCursoContent torneo={torneo} isAdmin={isAdmin} isParticipante={isParticipante} joining={joining} onJoin={onJoin} />;
  return <TorneoFinalizadoContent torneo={torneo} isAdmin={isAdmin} />;
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

  joinCard: { marginHorizontal: 18, marginTop: 18, backgroundColor: COLORS.lime, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  joinCardText: { fontSize: 14, fontWeight: '800', color: '#0f0f0f' },

  participantesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 },
  invitarLink: { fontSize: 12, fontWeight: '700', color: COLORS.lime },
  participanteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  participanteNombre: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  participanteSub: { fontSize: 12, color: COLORS.muted, marginTop: 1 },
});
