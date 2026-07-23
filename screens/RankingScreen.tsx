import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView as SafeAreaViewCtx } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import type { RoundDoc } from '../firebase/types';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444', dark2: '#242424',
  red: '#e07070',
};

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

type Entry = { pos: number; round: RoundDoc; isMe: boolean };

function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  return (
    <View style={[styles.avatar, { backgroundColor: COLORS.lime, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { color: '#0f0f0f', fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
}

function PodiumCard({ entry }: { entry: Entry }) {
  const navigation = useNavigation<any>();
  const { round, isMe } = entry;
  const isFirst = entry.pos === 1;
  const abrirPerfil = () => isMe
    ? navigation.navigate('Tabs', { screen: 'Perfil' })
    : navigation.navigate('PerfilUsuario', { viewUser: { name: round.authorName, initials: round.authorInitials, bg: COLORS.lime, color: '#0f0f0f' } });
  return (
    <TouchableOpacity style={[styles.podiumCard, isFirst && styles.podiumCardFirst]} onPress={abrirPerfil}>
      <Text style={styles.podiumMedal}>{MEDAL[entry.pos]}</Text>
      <Avatar initials={round.authorInitials} size={isFirst ? 56 : 46} />
      <Text style={[styles.podiumName, isFirst && { color: COLORS.white, fontSize: 13 }]} numberOfLines={1}>{round.authorName.split(' ')[0]}</Text>
      <Text style={[styles.podiumScore, { color: round.vsPar <= 0 ? COLORS.lime : COLORS.muted }]}>{round.totalScore}</Text>
      <Text style={[styles.podiumVsPar, { color: round.vsPar <= 0 ? COLORS.lime : COLORS.muted }]}>
        {round.vsPar > 0 ? '+' : ''}{round.vsPar}
      </Text>
    </TouchableOpacity>
  );
}

function formatFecha(ts: any): string {
  if (!ts?.toDate) return '';
  return ts.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

export default function RankingScreen() {
  const navigation = useNavigation<any>();
  const { firebaseUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rounds, setRounds] = useState<RoundDoc[]>([]);
  const now = new Date();
  const mes = now.toLocaleString('es', { month: 'long' });

  useEffect(() => {
    const inicioMes = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const q = query(
      collection(db, 'rounds'),
      where('visibility', '==', 'public'),
      where('date', '>=', inicioMes),
      orderBy('date', 'desc'),
    );
    return onSnapshot(q, snap => {
      setRounds(snap.docs.map(d => d.data() as RoundDoc));
      setLoading(false);
    }, () => setLoading(false));
  }, []);

  // Mejor ronda de cada jugador este mes, ordenadas por score.
  const mejorPorJugador = new Map<string, RoundDoc>();
  rounds.forEach(r => {
    const actual = mejorPorJugador.get(r.userId);
    if (!actual || r.totalScore < actual.totalScore) mejorPorJugador.set(r.userId, r);
  });
  const ranking: Entry[] = Array.from(mejorPorJugador.values())
    .sort((a, b) => a.totalScore - b.totalScore)
    .map((round, i) => ({ pos: i + 1, round, isMe: round.userId === firebaseUser?.uid }));

  const podio = ranking.slice(0, 3);
  const resto = ranking.slice(3);

  return (
    <SafeAreaViewCtx style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Ranking</Text>
        <Text style={styles.subtitle}>{mes.charAt(0).toUpperCase() + mes.slice(1)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.lime} style={{ marginTop: 48 }} />
      ) : ranking.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Todavía no hay vueltas cargadas este mes.{'\n'}Cargá la tuya para arrancar el ranking.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {podio.length > 0 && (
            <View style={styles.podium}>
              {podio[1] && <PodiumCard entry={podio[1]} />}
              <PodiumCard entry={podio[0]} />
              {podio[2] && <PodiumCard entry={podio[2]} />}
            </View>
          )}

          {resto.length > 0 && (
            <View style={styles.list}>
              {resto.map(entry => {
                const { round, isMe } = entry;
                return (
                  <TouchableOpacity
                    key={round.id}
                    style={[styles.row, isMe && styles.rowMe]}
                    onPress={() => isMe
                      ? navigation.navigate('Tabs', { screen: 'Perfil' })
                      : navigation.navigate('PerfilUsuario', { viewUser: { name: round.authorName, initials: round.authorInitials, bg: COLORS.lime, color: '#0f0f0f' } })
                    }
                  >
                    <Text style={styles.rowPos}>{entry.pos}</Text>
                    <Avatar initials={round.authorInitials} size={38} />
                    <View style={styles.rowInfo}>
                      <Text style={[styles.rowName, isMe && { color: COLORS.lime }]}>
                        {round.authorName}{isMe ? ' (vos)' : ''}
                      </Text>
                      <Text style={styles.rowMeta}>{round.clubName} · {formatFecha(round.date)}</Text>
                    </View>
                    <View style={styles.rowScores}>
                      <Text style={styles.rowScore}>{round.totalScore}</Text>
                      <Text style={[styles.rowVsPar, { color: round.vsPar <= 0 ? COLORS.lime : COLORS.muted }]}>
                        {round.vsPar > 0 ? '+' : ''}{round.vsPar}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.footnote}>Mejor ronda del mes entre las vueltas públicas — todavía sin filtrar por amigos.</Text>
        </ScrollView>
      )}
    </SafeAreaViewCtx>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  subtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  scroll: { paddingBottom: 32 },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 19 },

  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 24 },
  podiumCard: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 0.5, borderColor: COLORS.border, padding: 12 },
  podiumCardFirst: { backgroundColor: '#1a2a0a', borderColor: COLORS.lime, paddingVertical: 18 },
  podiumMedal: { fontSize: 20 },
  podiumName: { fontSize: 12, fontWeight: '600', color: COLORS.muted, textAlign: 'center' },
  podiumScore: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  podiumVsPar: { fontSize: 11, fontWeight: '700' },

  list: { borderTopWidth: 0.5, borderTopColor: '#1e1e1e' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#1e1e1e' },
  rowMe: { backgroundColor: '#0f1a0a' },
  rowPos: { fontSize: 13, fontWeight: '700', color: COLORS.dim, width: 18, textAlign: 'center' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  rowMeta: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  rowScores: { alignItems: 'flex-end' },
  rowScore: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  rowVsPar: { fontSize: 11, fontWeight: '700' },

  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700' },

  footnote: { fontSize: 11, color: COLORS.dim, textAlign: 'center', marginTop: 20, paddingHorizontal: 24, lineHeight: 15 },
});
