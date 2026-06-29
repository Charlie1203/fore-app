import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444',
  red: '#e07070', dark2: '#242424',
};

const stories = [
  { initials: 'JN', bg: '#c8e03a', color: '#0f0f0f', name: 'Vos', active: true },
  { initials: 'PE', bg: '#333', color: '#aaa', name: 'Pepe', active: false },
  { initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', name: 'Carlitos', active: true },
  { initials: 'MR', bg: '#3a2a1a', color: '#e0a03a', name: 'Manu R.', active: false },
];

function Avatar({ initials, bg, color, size = 38 }: { initials: string; bg: string; color: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, backgroundColor: bg }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

function HoleCell({ num, score, par }: { num: number; score: number; par: number }) {
  const diff = score - par;

  if (diff <= -2) {
    return (
      <View style={styles.holeWrap}>
        <Text style={styles.holeNum}>{num}</Text>
        <View style={[styles.holeOuter, { borderColor: COLORS.lime, backgroundColor: '#0a1a00' }]}>
          <View style={[styles.holeInner, { borderColor: COLORS.lime }]}>
            <Text style={[styles.holeScore, { color: COLORS.lime }]}>{score}</Text>
          </View>
        </View>
      </View>
    );
  }
  if (diff === -1) {
    return (
      <View style={styles.holeWrap}>
        <Text style={styles.holeNum}>{num}</Text>
        <View style={[styles.holeCircle, { borderColor: COLORS.lime, backgroundColor: '#1e2e0a' }]}>
          <Text style={[styles.holeScore, { color: COLORS.lime }]}>{score}</Text>
        </View>
      </View>
    );
  }
  if (diff === 0) {
    return (
      <View style={styles.holeWrap}>
        <Text style={styles.holeNum}>{num}</Text>
        <View style={[styles.holePlain, { backgroundColor: '#222' }]}>
          <Text style={[styles.holeScore, { color: COLORS.dim }]}>{score}</Text>
        </View>
      </View>
    );
  }
  if (diff === 1) {
    return (
      <View style={styles.holeWrap}>
        <Text style={styles.holeNum}>{num}</Text>
        <View style={[styles.holeSquare, { borderColor: COLORS.red, backgroundColor: '#2a1a1a' }]}>
          <Text style={[styles.holeScore, { color: COLORS.red }]}>{score}</Text>
        </View>
      </View>
    );
  }
  if (diff === 2) {
    return (
      <View style={styles.holeWrap}>
        <Text style={styles.holeNum}>{num}</Text>
        <View style={[styles.holeOuter, { borderColor: COLORS.red, backgroundColor: '#3a1010', borderRadius: 3 }]}>
          <View style={[styles.holeInner, { borderColor: COLORS.red, borderRadius: 2 }]}>
            <Text style={[styles.holeScore, { color: COLORS.red }]}>{score}</Text>
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.holeWrap}>
      <Text style={styles.holeNum}>{num}</Text>
      <View style={[styles.holeTriangleWrap, { backgroundColor: '#3a0a0a' }]}>
        <Text style={[styles.holeScore, { color: '#ff6060' }]}>{score}</Text>
        <View style={styles.triangleTop} />
      </View>
    </View>
  );
}

function Scorecard({ holes, score, vsPar }: { holes: { score: number; par: number }[]; score: number; vsPar: number }) {
  const eagles  = holes.filter(h => h.score - h.par <= -2).length;
  const birdies = holes.filter(h => h.score - h.par === -1).length;
  const pares   = holes.filter(h => h.score - h.par === 0).length;
  const bogeys  = holes.filter(h => h.score - h.par >= 1).length;
  return (
    <View style={styles.scorecard}>
      <View style={styles.scHeader}>
        <Text style={styles.scLabel}>Frente · Vuelta</Text>
        <Text style={[styles.scTotal, { color: vsPar <= 0 ? COLORS.lime : COLORS.red }]}>
          {score} · {vsPar > 0 ? '+' : ''}{vsPar}
        </Text>
      </View>
      <View style={styles.holesRow}>
        {holes.slice(0, 9).map((h, i) => <HoleCell key={i} num={i + 1} score={h.score} par={h.par} />)}
      </View>
      <View style={[styles.holesRow, { marginBottom: 6 }]}>
        {holes.slice(9, 18).map((h, i) => <HoleCell key={i} num={i + 10} score={h.score} par={h.par} />)}
      </View>
      <View style={styles.scSummary}>
        {eagles > 0 && <View style={styles.scItem}><Text style={[styles.scVal, { color: COLORS.lime }]}>{eagles}</Text><Text style={styles.scLbl}>Eagles</Text></View>}
        <View style={styles.scItem}><Text style={[styles.scVal, { color: COLORS.lime }]}>{birdies}</Text><Text style={styles.scLbl}>Birdies</Text></View>
        <View style={styles.scItem}><Text style={styles.scVal}>{pares}</Text><Text style={styles.scLbl}>Pares</Text></View>
        <View style={styles.scItem}><Text style={[styles.scVal, { color: COLORS.red }]}>{bogeys}</Text><Text style={styles.scLbl}>Bogeys</Text></View>
        <View style={styles.scItem}><Text style={[styles.scVal, { color: vsPar <= 0 ? COLORS.lime : COLORS.red }]}>{vsPar > 0 ? '+' : ''}{vsPar}</Text><Text style={styles.scLbl}>vs par</Text></View>
      </View>
    </View>
  );
}

function CardFooter({ likes, comments, liked = false }: { likes: number; comments: number; liked?: boolean }) {
  return (
    <View style={styles.cardFooter}>
      <TouchableOpacity style={styles.action}>
        <Text style={{ fontSize: 16, color: liked ? COLORS.lime : COLORS.dim }}>👍</Text>
        <Text style={[styles.actionText, liked && { color: COLORS.lime }]}>{likes}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.action}>
        <Text style={{ fontSize: 16, color: COLORS.dim }}>💬</Text>
        <Text style={styles.actionText}>{comments}</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }} />
      <TouchableOpacity><Text style={{ fontSize: 16, color: COLORS.dim }}>↗</Text></TouchableOpacity>
    </View>
  );
}

function HcpCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar initials="PE" bg="#333" color={COLORS.lime} />
        <View style={styles.cardMeta}>
          <Text style={styles.cardName}>Pepe Noceti</Text>
          <Text style={styles.cardTime}>hace 2 horas</Text>
        </View>
        <Text style={styles.dots}>···</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.hcpRow}>
          <View style={styles.hcpBadge}>
            <Text style={styles.hcpNum}>7.3</Text>
            <Text style={styles.hcpLabel}>HCP</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bodyText}>
              <Text style={styles.bold}>Pepe</Text> bajó su handicap a <Text style={styles.bold}>7.3</Text> — mejor marca personal
            </Text>
            <Text style={styles.trend}>▼ −0.8 pts este mes</Text>
          </View>
        </View>
      </View>
      <CardFooter likes={14} comments={3} liked />
    </View>
  );
}

const JUAN_HOLES = [
  { score: 4, par: 4 }, { score: 2, par: 4 }, { score: 5, par: 5 }, { score: 3, par: 3 },
  { score: 6, par: 4 }, { score: 4, par: 4 }, { score: 4, par: 4 }, { score: 3, par: 3 }, { score: 4, par: 4 },
  { score: 4, par: 4 }, { score: 4, par: 4 }, { score: 5, par: 4 }, { score: 4, par: 4 },
  { score: 3, par: 3 }, { score: 4, par: 4 }, { score: 5, par: 5 }, { score: 3, par: 4 }, { score: 4, par: 4 },
];

function RoundCard() {
  const score = JUAN_HOLES.reduce((a, h) => a + h.score, 0);
  const totalPar = JUAN_HOLES.reduce((a, h) => a + h.par, 0);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar initials="JN" bg={COLORS.lime} color="#0f0f0f" />
        <View style={styles.cardMeta}>
          <Text style={styles.cardName}>Juan Noceti</Text>
          <Text style={styles.cardTime}>hace 5 horas</Text>
        </View>
        <Text style={styles.dots}>···</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.courseBadge}>
          <Text style={styles.courseText}>📍 Haras Santa María · 18 hoyos</Text>
        </View>
        <Scorecard holes={JUAN_HOLES} score={score} vsPar={score - totalPar} />
      </View>
      <CardFooter likes={8} comments={2} />
    </View>
  );
}

function MilestoneCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar initials="CA" bg="#2a3a1a" color={COLORS.lime} />
        <View style={styles.cardMeta}>
          <Text style={styles.cardName}>Carlitos Laprida</Text>
          <Text style={styles.cardTime}>ayer</Text>
        </View>
        <Text style={styles.dots}>···</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.milestone}>
          <View style={styles.milestoneIcon}><Text style={{ fontSize: 24 }}>🏆</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bold, { color: COLORS.white, fontSize: 14 }]}>Primer eagle de su carrera</Text>
            <Text style={[styles.cardTime, { marginTop: 2 }]}>Hoyo 7 · Martindale CC</Text>
          </View>
        </View>
      </View>
      <CardFooter likes={21} comments={7} />
    </View>
  );
}

export default function FeedScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>FORE<Text style={{ color: COLORS.lime }}>!</Text></Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Text style={styles.headerIcon}>🔍</Text>
          <Text style={styles.headerIcon}>🔔</Text>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stories}>
          {stories.map((s, i) => (
            <View key={i} style={styles.storyItem}>
              <View style={[styles.storyRing, { borderColor: s.active ? COLORS.lime : '#333' }]}>
                <Avatar initials={s.initials} bg={s.bg} color={s.color} size={42} />
              </View>
              <Text style={styles.storyName}>{s.name}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.divider} />
        <View style={styles.feed}>
          <HcpCard />
          <RoundCard />
          <MilestoneCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const HOLE_SIZE = 26;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10 },
  logo: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerIcon: { fontSize: 20 },
  stories: { paddingHorizontal: 14, paddingBottom: 12 },
  storyItem: { alignItems: 'center', marginRight: 12, gap: 4 },
  storyRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  storyName: { fontSize: 10, color: COLORS.muted },
  divider: { height: 0.5, backgroundColor: '#222', marginHorizontal: 18, marginBottom: 12 },
  feed: { paddingHorizontal: 12, paddingBottom: 20 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingBottom: 6 },
  avatar: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700' },
  cardMeta: { flex: 1 },
  cardName: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  cardTime: { fontSize: 11, color: COLORS.muted },
  dots: { fontSize: 18, color: COLORS.dim },
  cardBody: { paddingHorizontal: 12, paddingBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, paddingHorizontal: 12, borderTopWidth: 0.5, borderTopColor: '#222' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 12, color: COLORS.dim },
  hcpRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hcpBadge: { width: 56, height: 56, borderRadius: 12, backgroundColor: COLORS.lime, alignItems: 'center', justifyContent: 'center' },
  hcpNum: { fontSize: 20, fontWeight: '800', color: '#0f0f0f', lineHeight: 22 },
  hcpLabel: { fontSize: 8, fontWeight: '700', color: '#3a5010', textTransform: 'uppercase', letterSpacing: 0.4 },
  bodyText: { fontSize: 13, color: '#ccc', lineHeight: 18 },
  bold: { fontWeight: '700', color: '#fff' },
  trend: { fontSize: 11, color: COLORS.lime, fontWeight: '700', marginTop: 3 },
  courseBadge: { backgroundColor: COLORS.dark2, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8, alignSelf: 'flex-start' },
  courseText: { fontSize: 11, color: COLORS.muted },
  scorecard: { backgroundColor: '#141414', borderRadius: 10, padding: 8 },
  scHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  scLabel: { fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  scTotal: { fontSize: 13, fontWeight: '700' },
  holesRow: { flexDirection: 'row', gap: 2, marginBottom: 3 },
  scSummary: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 7, borderTopWidth: 0.5, borderTopColor: '#222' },
  scItem: { alignItems: 'center' },
  scVal: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  scLbl: { fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#141414', borderRadius: 10, padding: 10 },
  milestoneIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#1e2e0a', borderWidth: 0.5, borderColor: COLORS.lime, alignItems: 'center', justifyContent: 'center' },

  holeWrap: { flex: 1, alignItems: 'center', gap: 2 },
  holeNum: { fontSize: 7, color: COLORS.dim },
  holeScore: { fontSize: 9, fontWeight: '700' },
  holeCircle: { width: HOLE_SIZE, height: HOLE_SIZE, borderRadius: HOLE_SIZE / 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  holePlain: { width: HOLE_SIZE, height: HOLE_SIZE, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  holeSquare: { width: HOLE_SIZE, height: HOLE_SIZE, borderRadius: 3, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  holeOuter: { width: HOLE_SIZE + 4, height: HOLE_SIZE + 4, borderRadius: (HOLE_SIZE + 4) / 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  holeInner: { width: HOLE_SIZE - 4, height: HOLE_SIZE - 4, borderRadius: (HOLE_SIZE - 4) / 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  holeTriangleWrap: { width: HOLE_SIZE, height: HOLE_SIZE, borderRadius: 4, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  triangleTop: { position: 'absolute', top: -1, left: '50%', marginLeft: -4, width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 5, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#ff6060' },
});
