import { View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions } from 'react-native';

const COLORS = {
  bg: '#0f0f0f',
  card: '#1a1a1a',
  border: '#2a2a2a',
  lime: '#c8e03a',
  white: '#f0f0f0',
  muted: '#666',
  dim: '#444',
};

const HCP_HISTORY = [
  { month: 'Ene', value: 15.2 },
  { month: 'Feb', value: 14.8 },
  { month: 'Mar', value: 14.1 },
  { month: 'Abr', value: 13.6 },
  { month: 'May', value: 13.9 },
  { month: 'Jun', value: 13.2 },
  { month: 'Jul', value: 12.4 },
];

const STATS = [
  { label: 'Score promedio', value: '77.3', sub: 'últimas 10 rondas' },
  { label: 'Mejor ronda', value: '74', sub: 'Haras Santa María' },
  { label: 'Birdies totales', value: '34', sub: 'este año' },
  { label: 'Rondas jugadas', value: '18', sub: 'este año' },
];

const SCREEN_W = Dimensions.get('window').width;
const CHART_H = 100;
const CHART_W = SCREEN_W - 64;

function HcpChart() {
  const values = HCP_HISTORY.map(h => h.value);
  const min = Math.min(...values) - 0.8;
  const max = Math.max(...values) + 0.8;
  const range = max - min;
  const stepX = CHART_W / (values.length - 1);

  const points = values.map((v, i) => ({
    x: i * stepX,
    y: CHART_H - ((v - min) / range) * CHART_H,
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Evolución del handicap</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 20 }}>
        <Text style={styles.hcpBig}>12.4</Text>
        <Text style={styles.hcpTrend}>▼ −2.8 este año</Text>
      </View>

      <View style={{ height: CHART_H, width: CHART_W, position: 'relative' }}>
        {points.slice(0, -1).map((p, i) => {
          const next = points[i + 1];
          const dx = next.x - p.x;
          const dy = next.y - p.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: p.x,
                top: p.y - 1,
                width: length,
                height: 2,
                backgroundColor: COLORS.lime,
                transform: [{ rotate: `${angle}deg` }],
                transformOrigin: '0 50%',
              }}
            />
          );
        })}
        {points.map((p, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: p.x - 4,
              top: p.y - 4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: COLORS.lime,
            }}
          />
        ))}
      </View>

      <View style={styles.chartLabels}>
        {HCP_HISTORY.map((h, i) => (
          <Text key={i} style={styles.chartLabel}>{h.month}</Text>
        ))}
      </View>
    </View>
  );
}

export default function StatsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <HcpChart />
        <View style={styles.grid}>
          {STATS.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statSub}>{s.sub}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 18, paddingVertical: 14 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  scroll: { paddingHorizontal: 18, paddingBottom: 24, gap: 14 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 0.5, borderColor: COLORS.border, padding: 16 },
  cardTitle: { fontSize: 12, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  hcpBig: { fontSize: 40, fontWeight: '800', color: COLORS.lime, lineHeight: 44 },
  hcpTrend: { fontSize: 13, color: COLORS.lime, fontWeight: '600' },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  chartLabel: { fontSize: 10, color: COLORS.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.border,
    padding: 14, width: (SCREEN_W - 48 - 10) / 2,
  },
  statVal: { fontSize: 28, fontWeight: '800', color: COLORS.white, marginBottom: 2 },
  statLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 2 },
  statSub: { fontSize: 10, color: COLORS.dim },
});
