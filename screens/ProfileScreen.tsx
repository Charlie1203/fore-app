import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

const COLORS = {
  bg: '#0f0f0f',
  card: '#1a1a1a',
  border: '#2a2a2a',
  lime: '#c8e03a',
  white: '#f0f0f0',
  muted: '#666',
  dim: '#444',
  red: '#e07070',
  dark2: '#242424',
};

const USER = {
  name: 'Juan Noceti',
  initials: 'JN',
  username: '@juannoceti',
  club: 'Haras Santa María',
  handicap: 12.4,
  rounds: 18,
  bestScore: 74,
  eagles: 0,   // si > 0 muestra Eagles, si no muestra Birdies
  birdies: 34,
};

const POSTS = [
  {
    course: 'Haras Santa María',
    time: 'hace 3 días',
    likes: 8,
    comments: 2,
    holes: [
      { score: 4, par: 4 }, { score: 3, par: 4 }, { score: 5, par: 5 }, { score: 3, par: 3 },
      { score: 5, par: 4 }, { score: 4, par: 4 }, { score: 4, par: 4 }, { score: 3, par: 3 }, { score: 4, par: 4 },
      { score: 4, par: 4 }, { score: 4, par: 4 }, { score: 5, par: 4 }, { score: 4, par: 4 },
      { score: 3, par: 3 }, { score: 4, par: 4 }, { score: 5, par: 5 }, { score: 3, par: 4 }, { score: 4, par: 4 },
    ],
  },
  {
    course: 'Martindale CC',
    time: 'hace 1 semana',
    likes: 4,
    comments: 0,
    holes: [
      { score: 4, par: 4 }, { score: 4, par: 4 }, { score: 5, par: 4 }, { score: 3, par: 3 },
      { score: 3, par: 4 }, { score: 5, par: 4 }, { score: 4, par: 4 }, { score: 5, par: 4 }, { score: 4, par: 4 },
      { score: 4, par: 4 }, { score: 5, par: 4 }, { score: 3, par: 3 }, { score: 4, par: 4 },
      { score: 3, par: 4 }, { score: 5, par: 4 }, { score: 5, par: 5 }, { score: 4, par: 4 }, { score: 4, par: 4 },
    ],
  },
];

const HOLE_SIZE = 24;

function HoleCell({ num, score, par }: { num: number; score: number; par: number }) {
  const diff = score - par;
  if (diff <= -2) return (
    <View style={hStyles.wrap}>
      <Text style={hStyles.num}>{num}</Text>
      <View style={[hStyles.outer, { borderColor: COLORS.lime, backgroundColor: '#0a1a00', borderRadius: (HOLE_SIZE + 4) / 2 }]}>
        <View style={[hStyles.inner, { borderColor: COLORS.lime, borderRadius: (HOLE_SIZE - 4) / 2 }]}>
          <Text style={[hStyles.score, { color: COLORS.lime }]}>{score}</Text>
        </View>
      </View>
    </View>
  );
  if (diff === -1) return (
    <View style={hStyles.wrap}>
      <Text style={hStyles.num}>{num}</Text>
      <View style={[hStyles.circle, { borderColor: COLORS.lime, backgroundColor: '#1e2e0a' }]}>
        <Text style={[hStyles.score, { color: COLORS.lime }]}>{score}</Text>
      </View>
    </View>
  );
  if (diff === 0) return (
    <View style={hStyles.wrap}>
      <Text style={hStyles.num}>{num}</Text>
      <View style={[hStyles.plain, { backgroundColor: '#222' }]}>
        <Text style={[hStyles.score, { color: COLORS.dim }]}>{score}</Text>
      </View>
    </View>
  );
  if (diff === 1) return (
    <View style={hStyles.wrap}>
      <Text style={hStyles.num}>{num}</Text>
      <View style={[hStyles.square, { borderColor: COLORS.red, backgroundColor: '#2a1a1a' }]}>
        <Text style={[hStyles.score, { color: COLORS.red }]}>{score}</Text>
      </View>
    </View>
  );
  if (diff === 2) return (
    <View style={hStyles.wrap}>
      <Text style={hStyles.num}>{num}</Text>
      <View style={[hStyles.outer, { borderColor: COLORS.red, backgroundColor: '#3a1010', borderRadius: 3 }]}>
        <View style={[hStyles.inner, { borderColor: COLORS.red, borderRadius: 2 }]}>
          <Text style={[hStyles.score, { color: COLORS.red }]}>{score}</Text>
        </View>
      </View>
    </View>
  );
  return (
    <View style={hStyles.wrap}>
      <Text style={hStyles.num}>{num}</Text>
      <View style={[hStyles.plain, { backgroundColor: '#3a0a0a' }]}>
        <Text style={[hStyles.score, { color: '#ff6060' }]}>{score}</Text>
      </View>
    </View>
  );
}

const hStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 1 },
  num: { fontSize: 7, color: COLORS.dim },
  score: { fontSize: 9, fontWeight: '700' },
  circle: { width: HOLE_SIZE, height: HOLE_SIZE, borderRadius: HOLE_SIZE / 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  plain: { width: HOLE_SIZE, height: HOLE_SIZE, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  square: { width: HOLE_SIZE, height: HOLE_SIZE, borderRadius: 3, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  outer: { width: HOLE_SIZE + 4, height: HOLE_SIZE + 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  inner: { width: HOLE_SIZE - 4, height: HOLE_SIZE - 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});

function CardFooter({ likes, comments }: { likes: number; comments: number }) {
  return (
    <View style={styles.cardFooter}>
      <TouchableOpacity style={styles.action}>
        <Text style={{ fontSize: 15, color: COLORS.dim }}>👍</Text>
        <Text style={styles.actionText}>{likes}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.action}>
        <Text style={{ fontSize: 15, color: COLORS.dim }}>💬</Text>
        <Text style={styles.actionText}>{comments}</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }} />
      <TouchableOpacity>
        <Text style={{ fontSize: 15, color: COLORS.dim }}>↗</Text>
      </TouchableOpacity>
    </View>
  );
}

function RoundCard({ post }: { post: typeof POSTS[0] }) {
  const score = post.holes.reduce((a, h) => a + h.score, 0);
  const totalPar = post.holes.reduce((a, h) => a + h.par, 0);
  const vsPar = score - totalPar;
  const eagles  = post.holes.filter(h => h.score - h.par <= -2).length;
  const birdies = post.holes.filter(h => h.score - h.par === -1).length;
  const pares   = post.holes.filter(h => h.score - h.par === 0).length;
  const bogeys  = post.holes.filter(h => h.score - h.par >= 1).length;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.courseBadge}>
          <Text style={styles.courseText}>📍 {post.course}</Text>
        </View>
        <Text style={styles.cardTime}>{post.time}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.scorecard}>
          <View style={styles.scHeader}>
            <Text style={styles.scLabel}>Frente · Vuelta</Text>
            <Text style={[styles.scTotal, { color: vsPar <= 0 ? COLORS.lime : COLORS.red }]}>
              {score} · {vsPar > 0 ? '+' : ''}{vsPar}
            </Text>
          </View>
          <View style={styles.holesRow}>
            {post.holes.slice(0, 9).map((h, i) => <HoleCell key={i} num={i + 1} score={h.score} par={h.par} />)}
          </View>
          <View style={[styles.holesRow, { marginBottom: 6 }]}>
            {post.holes.slice(9, 18).map((h, i) => <HoleCell key={i} num={i + 10} score={h.score} par={h.par} />)}
          </View>
          <View style={styles.scSummary}>
            {eagles > 0 && <View style={styles.scItem}><Text style={[styles.scVal, { color: COLORS.lime }]}>{eagles}</Text><Text style={styles.scLbl}>Eagles</Text></View>}
            <View style={styles.scItem}><Text style={[styles.scVal, { color: COLORS.lime }]}>{birdies}</Text><Text style={styles.scLbl}>Birdies</Text></View>
            <View style={styles.scItem}><Text style={styles.scVal}>{pares}</Text><Text style={styles.scLbl}>Pares</Text></View>
            <View style={styles.scItem}><Text style={[styles.scVal, { color: COLORS.red }]}>{bogeys}</Text><Text style={styles.scLbl}>Bogeys</Text></View>
          </View>
        </View>
      </View>
      <CardFooter likes={post.likes} comments={post.comments} />
    </View>
  );
}

export default function ProfileScreen() {
  const thirdKpi = USER.eagles > 0
    ? { value: USER.eagles, label: 'Eagles' }
    : { value: USER.birdies, label: 'Birdies' };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{USER.initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{USER.name}</Text>
            <Text style={styles.username}>{USER.username}</Text>
            <Text style={styles.club}>📍 {USER.club}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editText}>Editar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hcpBlock}>
          <Text style={styles.hcpNumber}>{USER.handicap}</Text>
          <Text style={styles.hcpLabel}>HANDICAP</Text>
        </View>

        <View style={styles.kpis}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiVal}>{USER.rounds}</Text>
            <Text style={styles.kpiLabel}>Rondas{'\n'}este año</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiItem}>
            <Text style={styles.kpiVal}>{USER.bestScore}</Text>
            <Text style={styles.kpiLabel}>Mejor{'\n'}score</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiItem}>
            <Text style={[styles.kpiVal, { color: COLORS.lime }]}>{thirdKpi.value}</Text>
            <Text style={styles.kpiLabel}>{thirdKpi.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Historial</Text>
        <View style={styles.feed}>
          {POSTS.map((post, i) => <RoundCard key={i} post={post} />)}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, paddingBottom: 12 },
  avatarLarge: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.lime, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#0f0f0f' },
  headerInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  username: { fontSize: 12, color: COLORS.muted, marginTop: 1 },
  club: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
  editBtn: { borderWidth: 0.5, borderColor: COLORS.dim, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editText: { fontSize: 12, color: COLORS.muted },

  hcpBlock: { alignItems: 'center', paddingVertical: 16 },
  hcpNumber: { fontSize: 52, fontWeight: '800', color: COLORS.lime, lineHeight: 56 },
  hcpLabel: { fontSize: 11, color: COLORS.muted, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 },

  kpis: { flexDirection: 'row', marginHorizontal: 18, backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.border, paddingVertical: 16 },
  kpiItem: { flex: 1, alignItems: 'center' },
  kpiVal: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  kpiLabel: { fontSize: 10, color: COLORS.muted, textAlign: 'center', marginTop: 3, lineHeight: 14 },
  kpiDivider: { width: 0.5, backgroundColor: COLORS.border },

  divider: { height: 0.5, backgroundColor: '#222', marginHorizontal: 18, marginTop: 20, marginBottom: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.muted, paddingHorizontal: 18, paddingVertical: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  feed: { paddingHorizontal: 12, paddingBottom: 20 },

  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingBottom: 6 },
  cardTime: { fontSize: 11, color: COLORS.muted },
  cardBody: { paddingHorizontal: 12, paddingBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, paddingHorizontal: 12, borderTopWidth: 0.5, borderTopColor: '#222' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 12, color: COLORS.dim },
  courseBadge: { backgroundColor: COLORS.dark2, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  courseText: { fontSize: 11, color: COLORS.muted },
  scorecard: { backgroundColor: '#141414', borderRadius: 10, padding: 10 },
  scHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  scLabel: { fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  scTotal: { fontSize: 13, fontWeight: '700' },
  holesRow: { flexDirection: 'row', gap: 3, marginBottom: 6 },
  hole: { flex: 1, height: 28, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  holeNum: { fontSize: 7 },
  holeScore: { fontSize: 9, fontWeight: '700' },
  scSummary: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 7, borderTopWidth: 0.5, borderTopColor: '#222' },
  scItem: { alignItems: 'center' },
  scVal: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  scLbl: { fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
});
