import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { TournamentDoc, TournamentParticipantDoc, TournamentRoundScore } from '../firebase/types';
import { estadoDeTorneo, joinTournament, removeParticipantFromTournament, deleteTournament } from '../services/tournaments';
import { formatFechaTorneo } from './TorneosScreen';
import { Scorecard } from '../components/RoundCard';

const SCREEN_W = Dimensions.get('window').width;

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444', dark2: '#242424', red: '#e07070',
};

function Avatar({ initials, photoURL, size = 36 }: { initials: string; photoURL?: string | null; size?: number }) {
  if (photoURL) {
    return <Image source={{ uri: photoURL }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={[{ backgroundColor: COLORS.lime, width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: '#0f0f0f', fontSize: size * 0.32, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

function SettingsMenu({ visible, onClose, onEdit, onDelete, editLabel, deleteLabel }: {
  visible: boolean; onClose: () => void; onEdit?: () => void; onDelete: () => void; editLabel: string; deleteLabel: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.menuCard}>
          {onEdit && (
            <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onEdit(); }}>
              <Ionicons name="pencil-outline" size={17} color={COLORS.white} />
              <Text style={styles.menuItemText}>{editLabel}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.menuItem, onEdit && styles.menuItemBorder]} onPress={() => { onClose(); onDelete(); }}>
            <Ionicons name="trash-outline" size={17} color={COLORS.red} />
            <Text style={[styles.menuItemText, { color: COLORS.red }]}>{deleteLabel}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function DetailNav({ torneo, onBack, badge, isAdmin, onEdit, onDelete, deleting }: { torneo: TournamentDoc; onBack: () => void; badge: React.ReactNode; isAdmin: boolean; onEdit?: () => void; onDelete?: () => void; deleting?: boolean }) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
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
        <TouchableOpacity onPress={() => setMenuOpen(true)} disabled={deleting} style={{ marginLeft: 10, padding: 2 }}>
          {deleting
            ? <ActivityIndicator size="small" color={COLORS.muted} />
            : <Ionicons name="settings-outline" size={19} color={COLORS.muted} />
          }
        </TouchableOpacity>
      )}
      {isAdmin && onDelete && (
        <SettingsMenu
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          onEdit={onEdit}
          onDelete={onDelete}
          editLabel="Editar torneo"
          deleteLabel="Eliminar torneo"
        />
      )}
    </View>
  );
}

const MODALIDAD_INFO: Record<string, { icon: string; desc: string }> = {
  'Stroke Play': { icon: 'trophy-outline', desc: 'Gana el que menor score haga en la vuelta.' },
  'Stableford': { icon: 'flag-outline', desc: 'Sumá puntos en cada hoyo. Gana el que más acumule.' },
  'Match Play': { icon: 'people-outline', desc: 'Competencia hoyo a hoyo contra otro jugador o equipo.' },
};

function TorneoProximoContent({ torneo, participantes, isAdmin, isParticipante, joining, onJoin, onDelete, deleting }: { torneo: TournamentDoc; participantes: TournamentParticipantDoc[]; isAdmin: boolean; isParticipante: boolean; joining: boolean; onJoin: () => void; onDelete: () => void; deleting: boolean }) {
  const navigation = useNavigation<any>();
  const { firebaseUser } = useAuth();
  const modalidadInfo = MODALIDAD_INFO[torneo.modality] ?? { icon: 'trophy-outline', desc: '' };
  const [removingUid, setRemovingUid] = useState<string | null>(null);

  const quitarParticipante = async (uid: string) => {
    if (removingUid) return;
    setRemovingUid(uid);
    try {
      await removeParticipantFromTournament(torneo.id, uid);
    } catch {
      Alert.alert('Error', 'No pudimos completar la acción. Probá de nuevo.');
    } finally {
      setRemovingUid(null);
    }
  };

  const confirmarSalir = () => {
    Alert.alert('Salir del torneo', `¿Seguro que querés salir de ${torneo.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => firebaseUser && quitarParticipante(firebaseUser.uid) },
    ]);
  };

  const confirmarEliminar = (p: TournamentParticipantDoc) => {
    Alert.alert('Eliminar del torneo', `¿Sacar a ${p.displayName} del torneo?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => quitarParticipante(p.uid) },
    ]);
  };

  return (
    <View style={styles.container}>
      <DetailNav
        torneo={torneo}
        onBack={() => navigation.goBack()}
        isAdmin={isAdmin}
        badge={<View style={styles.estadoBadge}><Text style={styles.estadoBadgeText}>Próximo</Text></View>}
        onEdit={() => navigation.navigate('CreateTorneo', { torneo })}
        onDelete={onDelete}
        deleting={deleting}
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
        {participantes.map(p => {
          const esYo = p.uid === firebaseUser?.uid;
          return (
            <TouchableOpacity
              key={p.uid}
              style={styles.participanteRow}
              onPress={() => esYo
                ? navigation.navigate('Tabs', { screen: 'Perfil' })
                : navigation.navigate('PerfilUsuario', { viewUser: { uid: p.uid, name: p.displayName, initials: p.initials, bg: COLORS.lime, color: '#0f0f0f', handicap: p.handicap } })
              }
            >
              <Avatar initials={p.initials} photoURL={p.photoURL} size={40} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.participanteNombre} numberOfLines={1}>{p.displayName}{esYo ? ' (vos)' : ''}</Text>
                <Text style={styles.participanteSub} numberOfLines={1}>{p.handicap != null ? `HCP ${p.handicap}` : 'Sin HCP cargado'}</Text>
              </View>
              {esYo ? (
                <TouchableOpacity onPress={confirmarSalir} disabled={removingUid === p.uid} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {removingUid === p.uid
                    ? <ActivityIndicator size="small" color={COLORS.muted} />
                    : <Ionicons name="exit-outline" size={20} color={COLORS.muted} />
                  }
                </TouchableOpacity>
              ) : isAdmin ? (
                <TouchableOpacity onPress={() => confirmarEliminar(p)} disabled={removingUid === p.uid} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {removingUid === p.uid
                    ? <ActivityIndicator size="small" color={COLORS.muted} />
                    : <Ionicons name="person-remove-outline" size={19} color={COLORS.muted} />
                  }
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
              )}
            </TouchableOpacity>
          );
        })}
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

function formatVsPar(vsPar: number): string {
  return vsPar === 0 ? 'E' : `${vsPar > 0 ? '+' : ''}${vsPar}`;
}

/** Modal con la tarjeta de un participante. Si tiene más de una ronda cargada, deja
 * pasar de una a otra con las flechas — abrís desde una ronda puntual o desde el
 * general y desde ahí vas viendo todas las que cargó. */
function ScorecardModal({ participante, roundIndex, onClose, onChangeRoundIndex }: {
  participante: TournamentParticipantDoc | null;
  roundIndex: number | null;
  onClose: () => void;
  onChangeRoundIndex: (i: number) => void;
}) {
  if (!participante || roundIndex === null) return null;
  const indices = Object.keys(participante.roundScores ?? {}).map(Number).sort((a, b) => a - b);
  const pos = indices.indexOf(roundIndex);
  const score: TournamentRoundScore | undefined = participante.roundScores?.[String(roundIndex)];
  if (!score || pos === -1) return null;

  const irA = (nuevaPos: number) => {
    if (nuevaPos < 0 || nuevaPos >= indices.length) return;
    onChangeRoundIndex(indices[nuevaPos]);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.scorecardOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.scorecardModalCard}>
          <View style={styles.scorecardModalHeader}>
            <Avatar initials={participante.initials} photoURL={participante.photoURL} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.leaderboardNombre} numberOfLines={1}>{participante.displayName}</Text>
              <Text style={styles.leaderboardSub}>{score.clubName} · {score.courseName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.scorecardPagerRow}>
            <TouchableOpacity onPress={() => irA(pos - 1)} disabled={pos === 0} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={20} color={pos === 0 ? COLORS.dim : COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.scorecardPagerText}>Ronda {roundIndex + 1}</Text>
            <TouchableOpacity onPress={() => irA(pos + 1)} disabled={pos === indices.length - 1} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-forward" size={20} color={pos === indices.length - 1 ? COLORS.dim : COLORS.white} />
            </TouchableOpacity>
          </View>

          <Scorecard holes={score.holes} score={score.totalScore} vsPar={score.vsPar} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/** Clasificación general: usa roundsPlayed/vsParTotal, que ya vienen sumados en el propio
 * doc del participante al vincular una ronda (ver linkRoundToTournaments). Así evitamos
 * consultar la colección rounds acá, que además chocaría con su regla de seguridad para
 * queries de lista. Quien todavía no cargó ninguna tarjeta aparece con "-", no con 0.
 * Tocar una fila abre su primera tarjeta cargada; desde ahí se navegan todas con las flechas. */
function Leaderboard({ totalRondas, participantes, onAbrirTarjeta }: { totalRondas: number; participantes: TournamentParticipantDoc[]; onAbrirTarjeta: (p: TournamentParticipantDoc, roundIndex: number) => void }) {
  if (participantes.length === 0) return <LeaderboardEmpty />;

  // ?? 0 por participantes creados antes de que existieran estos campos.
  const filas = participantes
    .map(p => ({ ...p, roundsPlayed: p.roundsPlayed ?? 0, vsParTotal: p.vsParTotal ?? 0 }))
    .sort((a, b) => {
      if (a.roundsPlayed === 0 || b.roundsPlayed === 0) return b.roundsPlayed - a.roundsPlayed;
      return a.vsParTotal - b.vsParTotal;
    });

  return (
    <View style={{ paddingTop: 8 }}>
      {filas.map((f, i) => {
        const primeraRondaCargada = Object.keys(f.roundScores ?? {}).map(Number).sort((a, b) => a - b)[0];
        return (
          <TouchableOpacity
            key={f.uid}
            style={styles.leaderboardRow}
            disabled={f.roundsPlayed === 0 || primeraRondaCargada === undefined}
            onPress={() => onAbrirTarjeta(f, primeraRondaCargada)}
          >
            <Text style={styles.leaderboardPos}>{i + 1}</Text>
            <Avatar initials={f.initials} photoURL={f.photoURL} size={32} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.leaderboardNombre} numberOfLines={1}>{f.displayName}</Text>
              <Text style={styles.leaderboardSub}>{f.roundsPlayed}/{totalRondas} cargadas</Text>
            </View>
            <Text style={[
              styles.leaderboardScore,
              f.roundsPlayed === 0 ? styles.leaderboardScoreVacio : { color: f.vsParTotal <= 0 ? COLORS.lime : COLORS.red },
            ]}>
              {f.roundsPlayed === 0 ? '-' : formatVsPar(f.vsParTotal)}
            </Text>
            {f.roundsPlayed > 0 && <Ionicons name="chevron-forward" size={14} color={COLORS.dim} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Clasificación de una ronda puntual: mismo criterio que Leaderboard pero mirando
 * solo roundScores[roundIndex] de cada participante, no el acumulado del torneo. */
function RoundLeaderboard({ roundIndex, participantes, onAbrirTarjeta }: { roundIndex: number; participantes: TournamentParticipantDoc[]; onAbrirTarjeta: (p: TournamentParticipantDoc, roundIndex: number) => void }) {
  if (participantes.length === 0) return <LeaderboardEmpty />;

  const filas = participantes
    .map(p => ({ p, score: p.roundScores?.[String(roundIndex)] }))
    .sort((a, b) => {
      if (!a.score || !b.score) return (b.score ? 1 : 0) - (a.score ? 1 : 0);
      return a.score.vsPar - b.score.vsPar;
    });

  return (
    <View style={{ paddingTop: 8 }}>
      {filas.map(({ p, score }, i) => (
        <TouchableOpacity
          key={p.uid}
          style={styles.leaderboardRow}
          disabled={!score}
          onPress={() => score && onAbrirTarjeta(p, roundIndex)}
        >
          <Text style={styles.leaderboardPos}>{i + 1}</Text>
          <Avatar initials={p.initials} photoURL={p.photoURL} size={32} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.leaderboardNombre} numberOfLines={1}>{p.displayName}</Text>
            {!!score && <Text style={styles.leaderboardSub}>{score.totalScore} golpes</Text>}
          </View>
          <Text style={[styles.leaderboardScore, !score ? styles.leaderboardScoreVacio : { color: score.vsPar <= 0 ? COLORS.lime : COLORS.red }]}>
            {score ? formatVsPar(score.vsPar) : '-'}
          </Text>
          {!!score && <Ionicons name="chevron-forward" size={14} color={COLORS.dim} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function TorneoEnCursoContent({ torneo, participantes, isAdmin, isParticipante, joining, onJoin, onDelete, deleting }: { torneo: TournamentDoc; participantes: TournamentParticipantDoc[]; isAdmin: boolean; isParticipante: boolean; joining: boolean; onJoin: () => void; onDelete: () => void; deleting: boolean }) {
  const navigation = useNavigation<any>();
  const totalRondas = torneo.roundDates.length || 1;
  const tabs = ['General', ...Array.from({ length: totalRondas }, (_, i) => `Ronda ${i + 1}`)];
  const [tab, setTab] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const [scorecardAbierto, setScorecardAbierto] = useState<{ participante: TournamentParticipantDoc; roundIndex: number } | null>(null);
  const abrirTarjeta = (participante: TournamentParticipantDoc, roundIndex: number) => setScorecardAbierto({ participante, roundIndex });

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
        onDelete={onDelete}
        deleting={deleting}
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
            {i === 0
              ? <Leaderboard totalRondas={totalRondas} participantes={participantes} onAbrirTarjeta={abrirTarjeta} />
              : <RoundLeaderboard roundIndex={i - 1} participantes={participantes} onAbrirTarjeta={abrirTarjeta} />
            }
          </ScrollView>
        ))}
      </ScrollView>
      <ScorecardModal
        participante={scorecardAbierto?.participante ?? null}
        roundIndex={scorecardAbierto?.roundIndex ?? null}
        onClose={() => setScorecardAbierto(null)}
        onChangeRoundIndex={i => setScorecardAbierto(s => s && { ...s, roundIndex: i })}
      />
    </View>
  );
}

function TorneoFinalizadoContent({ torneo, participantes, isAdmin, onDelete, deleting }: { torneo: TournamentDoc; participantes: TournamentParticipantDoc[]; isAdmin: boolean; onDelete: () => void; deleting: boolean }) {
  const navigation = useNavigation<any>();
  const totalRondas = torneo.roundDates.length || 1;
  const tabs = ['General', ...Array.from({ length: totalRondas }, (_, i) => `Ronda ${i + 1}`)];
  const [tab, setTab] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const [scorecardAbierto, setScorecardAbierto] = useState<{ participante: TournamentParticipantDoc; roundIndex: number } | null>(null);
  const abrirTarjeta = (participante: TournamentParticipantDoc, roundIndex: number) => setScorecardAbierto({ participante, roundIndex });

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
        onDelete={onDelete}
        deleting={deleting}
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
            {i === 0
              ? <Leaderboard totalRondas={totalRondas} participantes={participantes} onAbrirTarjeta={abrirTarjeta} />
              : <RoundLeaderboard roundIndex={i - 1} participantes={participantes} onAbrirTarjeta={abrirTarjeta} />
            }
          </ScrollView>
        ))}
      </ScrollView>
      <ScorecardModal
        participante={scorecardAbierto?.participante ?? null}
        roundIndex={scorecardAbierto?.roundIndex ?? null}
        onClose={() => setScorecardAbierto(null)}
        onChangeRoundIndex={i => setScorecardAbierto(s => s && { ...s, roundIndex: i })}
      />
    </View>
  );
}

export default function TorneoDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { firebaseUser, userDoc } = useAuth();
  const torneoId: string = route.params.torneoId;

  const [torneo, setTorneo] = useState<TournamentDoc | null>(null);
  const [participantes, setParticipantes] = useState<TournamentParticipantDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
  const estado = estadoDeTorneo(torneo.roundDates, torneo.roundsPlayedCount);

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

  const onDelete = () => {
    Alert.alert('Eliminar torneo', `¿Seguro que querés eliminar ${torneo.name}? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          setDeleting(true);
          try {
            await deleteTournament(torneoId);
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'No pudimos eliminar el torneo. Probá de nuevo.');
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (estado === 'próximo') return <TorneoProximoContent torneo={torneo} participantes={participantes} isAdmin={isAdmin} isParticipante={isParticipante} joining={joining} onJoin={onJoin} onDelete={onDelete} deleting={deleting} />;
  if (estado === 'en curso') return <TorneoEnCursoContent torneo={torneo} participantes={participantes} isAdmin={isAdmin} isParticipante={isParticipante} joining={joining} onJoin={onJoin} onDelete={onDelete} deleting={deleting} />;
  return <TorneoFinalizadoContent torneo={torneo} participantes={participantes} isAdmin={isAdmin} onDelete={onDelete} deleting={deleting} />;
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

  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'flex-end', paddingTop: 60, paddingRight: 18 },
  menuCard: { backgroundColor: '#1e1e1e', borderRadius: 12, borderWidth: 0.5, borderColor: '#2a2a2a', overflow: 'hidden', minWidth: 170 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13 },
  menuItemBorder: { borderTopWidth: 0.5, borderTopColor: '#2a2a2a' },
  menuItemText: { fontSize: 14, fontWeight: '600', color: COLORS.white },

  scorecardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  scorecardModalCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 0.5, borderColor: COLORS.border, padding: 16, width: '100%', maxWidth: 420 },
  scorecardModalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scorecardPagerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 14, marginBottom: 4 },
  scorecardPagerText: { fontSize: 13, fontWeight: '700', color: COLORS.white, minWidth: 70, textAlign: 'center' },

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

  leaderboardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  leaderboardPos: { width: 18, fontSize: 13, fontWeight: '700', color: COLORS.muted, textAlign: 'center' },
  leaderboardNombre: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  leaderboardSub: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  leaderboardScore: { fontSize: 15, fontWeight: '800', color: COLORS.lime, minWidth: 32, textAlign: 'right' },
  leaderboardScoreVacio: { color: COLORS.dim },
});
