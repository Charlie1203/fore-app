import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { SafeAreaView as SafeAreaViewCtx } from 'react-native-safe-area-context';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444', dark2: '#242424',
  red: '#e07070',
};

const RANKING = [
  { pos: 1, name: 'Pepe Noceti', initials: 'PE', bg: '#333', color: '#c8e03a', score: 71, vsPar: -1, course: 'Haras Santa María', date: '28 Jun' },
  { pos: 2, name: 'Juan Noceti', initials: 'JN', bg: '#c8e03a', color: '#0f0f0f', score: 74, vsPar: 2, course: 'Haras Santa María', date: '27 Jun', isMe: true },
  { pos: 3, name: 'Manu Rivero', initials: 'MR', bg: '#3a2a1a', color: '#e0a03a', score: 77, vsPar: 5, course: 'Martindale CC', date: '25 Jun' },
  { pos: 4, name: 'Tomás Bidegain', initials: 'TB', bg: '#2a1a3a', color: '#b070e0', score: 79, vsPar: 7, course: 'San Andrés GC', date: '22 Jun' },
  { pos: 5, name: 'Carlitos Laprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', score: 81, vsPar: 9, course: 'Olivos GC', date: '20 Jun' },
  { pos: 6, name: 'Sofía Lagos', initials: 'SL', bg: '#1a2a3a', color: '#5fa0e0', score: 84, vsPar: 12, course: 'Martindale CC', date: '18 Jun' },
];

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function Avatar({ initials, bg, color, size = 40 }: { initials: string; bg: string; color: string; size?: number }) {
  return (
    <View style={[styles.avatar, { backgroundColor: bg, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
}

function PodiumCard({ player }: { player: typeof RANKING[0] }) {
  const isFirst = player.pos === 1;
  return (
    <View style={[styles.podiumCard, isFirst && styles.podiumCardFirst]}>
      <Text style={styles.podiumMedal}>{MEDAL[player.pos]}</Text>
      <Avatar initials={player.initials} bg={player.bg} color={player.color} size={isFirst ? 56 : 46} />
      <Text style={[styles.podiumName, isFirst && { color: COLORS.white, fontSize: 13 }]} numberOfLines={1}>{player.name.split(' ')[0]}</Text>
      <Text style={[styles.podiumScore, { color: player.vsPar <= 0 ? COLORS.lime : COLORS.muted }]}>{player.score}</Text>
      <Text style={[styles.podiumVsPar, { color: player.vsPar <= 0 ? COLORS.lime : COLORS.muted }]}>
        {player.vsPar > 0 ? '+' : ''}{player.vsPar}
      </Text>
    </View>
  );
}

export default function RankingScreen() {
  const now = new Date();
  const mes = now.toLocaleString('es', { month: 'long' });

  return (
    <SafeAreaViewCtx style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Ranking</Text>
        <Text style={styles.subtitle}>{mes.charAt(0).toUpperCase() + mes.slice(1)} · Amigos</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Podio top 3 */}
        <View style={styles.podium}>
          <PodiumCard player={RANKING[1]} />
          <PodiumCard player={RANKING[0]} />
          <PodiumCard player={RANKING[2]} />
        </View>

        {/* Lista 4 en adelante */}
        <View style={styles.list}>
          {RANKING.slice(3).map(p => (
            <View key={p.pos} style={[styles.row, p.isMe && styles.rowMe]}>
              <Text style={styles.rowPos}>{p.pos}</Text>
              <Avatar initials={p.initials} bg={p.bg} color={p.color} size={38} />
              <View style={styles.rowInfo}>
                <Text style={[styles.rowName, p.isMe && { color: COLORS.lime }]}>
                  {p.name}{p.isMe ? ' (vos)' : ''}
                </Text>
                <Text style={styles.rowMeta}>{p.course} · {p.date}</Text>
              </View>
              <View style={styles.rowScores}>
                <Text style={styles.rowScore}>{p.score}</Text>
                <Text style={[styles.rowVsPar, { color: p.vsPar <= 0 ? COLORS.lime : COLORS.muted }]}>
                  {p.vsPar > 0 ? '+' : ''}{p.vsPar}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footnote}>Mejor ronda del mes entre amigos mutuos</Text>
      </ScrollView>
    </SafeAreaViewCtx>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  subtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  scroll: { paddingBottom: 32 },

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

  footnote: { fontSize: 11, color: COLORS.dim, textAlign: 'center', marginTop: 20 },
});
