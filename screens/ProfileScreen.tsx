import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import Svg, { Ellipse, Line, Polygon, Circle, Path } from 'react-native-svg';

function GolfBallIcon({ color, size = 16 }: { color: string; size?: number }) {
  const d = [
    'M 11,9.5 a 1.1,0.7 0 0,1 2.2,0',
    'M 14,9.5 a 1.1,0.7 0 0,1 2.2,0',
    'M 17,10 a 1.1,0.7 0 0,1 2.2,0',
    'M 9,12.5 a 1.1,0.7 0 0,1 2.2,0',
    'M 12,12.5 a 1.1,0.7 0 0,1 2.2,0',
    'M 15,12.5 a 1.1,0.7 0 0,1 2.2,0',
    'M 18,13 a 1.1,0.7 0 0,1 2.2,0',
    'M 8,15.5 a 1.1,0.7 0 0,1 2.2,0',
    'M 11,15.5 a 1.1,0.7 0 0,1 2.2,0',
    'M 14,15.5 a 1.1,0.7 0 0,1 2.2,0',
    'M 17,16 a 1.1,0.7 0 0,1 2.2,0',
    'M 8,18.5 a 1.1,0.7 0 0,1 2.2,0',
    'M 11,18.5 a 1.1,0.7 0 0,1 2.2,0',
    'M 14,18.5 a 1.1,0.7 0 0,1 2.2,0',
  ].join(' ');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.6" fill="none" />
      <Path d={d} stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function GolfFlagIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 2 24 24">
      <Ellipse cx="12" cy="20" rx="7" ry="2.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Polygon points="12,4 21,8 12,12" fill={color} />
    </Svg>
  );
}

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
  eagles: 0,
  birdies: 34,
  followers: 142,
  following: 98,
  friends: 31,
};

const COURSES = [
  { name: 'Haras Santa María', rounds: 9, bestScore: 74 },
  { name: 'Martindale CC', rounds: 5, bestScore: 79 },
  { name: 'San Andrés GC', rounds: 3, bestScore: 81 },
  { name: 'Olivos GC', rounds: 1, bestScore: 85 },
];

const ACHIEVEMENTS = [
  { icon: '🦅', title: 'Primer eagle', sub: 'Hoyo 14 · Haras Santa María', date: 'Mar 2026' },
  { icon: '🔥', title: 'Rompió 75', sub: 'Score 74 en Haras Santa María', date: 'Jun 2026' },
  { icon: '📉', title: 'HCP bajo de 13', sub: 'De 15.2 a 12.4 en 6 meses', date: 'Jun 2026' },
  { icon: '⛳', title: '10 rondas jugadas', sub: 'Primer hito del año', date: 'May 2026' },
];

const HCP_HISTORY = [
  { month: 'Ene', value: 15.2 }, { month: 'Feb', value: 14.8 }, { month: 'Mar', value: 14.1 },
  { month: 'Abr', value: 13.6 }, { month: 'May', value: 13.9 }, { month: 'Jun', value: 13.2 }, { month: 'Jul', value: 12.4 },
];

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const CHART_W = SCREEN_W - 64;
const CHART_H = 90;
const TAB_BAR_H = 44;
const BOTTOM_TAB_H = 80;

function HcpChart({ thirdKpi }: { thirdKpi: { value: number; label: string } }) {
  const values = HCP_HISTORY.map(h => h.value);
  const min = Math.min(...values) - 0.8;
  const max = Math.max(...values) + 0.8;
  const range = max - min;
  const stepX = CHART_W / (values.length - 1);
  const points = values.map((v, i) => ({ x: i * stepX, y: CHART_H - ((v - min) / range) * CHART_H }));

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Evolución del handicap</Text>
      <View style={{ height: CHART_H, width: CHART_W, marginTop: 8 }}>
        {points.slice(0, -1).map((p, i) => {
          const next = points[i + 1];
          const dx = next.x - p.x, dy = next.y - p.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View key={i} style={{
              position: 'absolute', left: p.x, top: p.y - 1, width: length, height: 2,
              backgroundColor: COLORS.lime, transform: [{ rotate: `${angle}deg` }], transformOrigin: '0 50%',
            }} />
          );
        })}
        {points.map((p, i) => (
          <View key={i} style={{ position: 'absolute', left: p.x - 3, top: p.y - 3, width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.lime }} />
        ))}
      </View>
      <View style={styles.chartLabels}>
        {HCP_HISTORY.map((h, i) => <Text key={i} style={styles.chartLabel}>{h.month}</Text>)}
      </View>

      <View style={styles.kpiFooter}>
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
    </View>
  );
}

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
        <GolfFlagIcon color={COLORS.dim} size={16} />
        <Text style={styles.actionText}>{likes}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.action}>
        <GolfBallIcon color={COLORS.dim} size={15} />
        <Text style={styles.actionText}>{comments}</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }} />
      <TouchableOpacity>
        <Ionicons name="repeat-outline" size={18} color={COLORS.dim} />
      </TouchableOpacity>
    </View>
  );
}

function RoundCard({ post }: { post: typeof POSTS[0] }) {
  const [expanded, setExpanded] = useState(false);
  const score = post.holes.reduce((a, h) => a + h.score, 0);
  const totalPar = post.holes.reduce((a, h) => a + h.par, 0);
  const vsPar = score - totalPar;
  const eagles  = post.holes.filter(h => h.score - h.par <= -2).length;
  const birdies = post.holes.filter(h => h.score - h.par === -1).length;
  const pares   = post.holes.filter(h => h.score - h.par === 0).length;
  const bogeys  = post.holes.filter(h => h.score - h.par === 1).length;
  const doubles = post.holes.filter(h => h.score - h.par >= 2).length;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.courseBadge}>
          <Text style={styles.courseText}>📍 {post.course}</Text>
        </View>
        <Text style={styles.cardTime}>{post.time}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryScores}>
            <View style={styles.summaryMain}>
              <Text style={styles.summaryBigScore}>{score}</Text>
              <Text style={[styles.summaryVsPar, { color: vsPar <= 0 ? COLORS.lime : COLORS.red }]}>
                {vsPar > 0 ? '+' : ''}{vsPar}
              </Text>
            </View>
            <View style={styles.summaryStats}>
              {eagles > 0 && <View style={styles.summaryItem}><Text style={[styles.summaryVal, { color: COLORS.lime }]}>{eagles}</Text><Text style={styles.summaryLbl}>Eagles</Text></View>}
              <View style={styles.summaryItem}><Text style={[styles.summaryVal, { color: COLORS.lime }]}>{birdies}</Text><Text style={styles.summaryLbl}>Birdies</Text></View>
              <View style={styles.summaryItem}><Text style={styles.summaryVal}>{pares}</Text><Text style={styles.summaryLbl}>Pares</Text></View>
              <View style={styles.summaryItem}><Text style={[styles.summaryVal, { color: COLORS.red }]}>{bogeys}</Text><Text style={styles.summaryLbl}>Bogeys</Text></View>
              {doubles > 0 && <View style={styles.summaryItem}><Text style={[styles.summaryVal, { color: '#ff6060' }]}>{doubles}</Text><Text style={styles.summaryLbl}>Dobles+</Text></View>}
            </View>
          </View>

          {expanded && (
            <>
              <View style={styles.holesRow}>
                {post.holes.slice(0, 9).map((h, i) => <HoleCell key={i} num={i + 1} score={h.score} par={h.par} />)}
              </View>
              <View style={[styles.holesRow, { marginBottom: 4 }]}>
                {post.holes.slice(9, 18).map((h, i) => <HoleCell key={i} num={i + 10} score={h.score} par={h.par} />)}
              </View>
            </>
          )}

          <TouchableOpacity style={styles.expandBtn} onPress={() => setExpanded(!expanded)}>
            <Text style={styles.expandBtnText}>{expanded ? 'Ocultar tarjeta' : 'Ver tarjeta'}</Text>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={COLORS.lime} />
          </TouchableOpacity>
        </View>
      </View>
      <CardFooter likes={post.likes} comments={post.comments} />
    </View>
  );
}

function CourseRow({ course }: { course: typeof COURSES[0] }) {
  return (
    <View style={styles.courseRow}>
      <View style={styles.courseIcon}><Text style={{ fontSize: 18 }}>⛳</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.courseName}>{course.name}</Text>
        <Text style={styles.courseSub}>{course.rounds} {course.rounds === 1 ? 'ronda' : 'rondas'} jugadas</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.courseBest}>{course.bestScore}</Text>
        <Text style={styles.courseBestLbl}>mejor</Text>
      </View>
    </View>
  );
}

function AchievementRow({ a }: { a: typeof ACHIEVEMENTS[0] }) {
  return (
    <View style={styles.achRow}>
      <View style={styles.achIcon}><Text style={{ fontSize: 20 }}>{a.icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.achTitle}>{a.title}</Text>
        <Text style={styles.achSub}>{a.sub}</Text>
      </View>
      <Text style={styles.achDate}>{a.date}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const [tab, setTab] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const thirdKpi = USER.eagles > 0
    ? { value: USER.eagles, label: 'Eagles' }
    : { value: USER.birdies, label: 'Birdies' };

  // Collapsible header
  const scrollY = useRef(new Animated.Value(0)).current;
  const currentScrollY = useRef(0);
  const scrollViewRefs = useRef<(ScrollView | null)[]>([null, null, null]);
  const [headerHeight, setHeaderHeight] = useState(0);

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, headerHeight || 1],
    outputRange: [0, -(headerHeight || 1)],
    extrapolate: 'clamp',
  });

  const tabBarTranslate = scrollY.interpolate({
    inputRange: [0, headerHeight || 1],
    outputRange: [0, -(headerHeight || 1)],
    extrapolate: 'clamp',
  });

  const makeScrollHandler = () =>
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      {
        useNativeDriver: true,
        listener: (e: any) => {
          currentScrollY.current = e.nativeEvent.contentOffset.y;
        },
      }
    );

  const scrollHandler = makeScrollHandler();

  const syncNewTab = (position: number) => {
    const ref = scrollViewRefs.current[position];
    if (ref) {
      ref.scrollTo({ y: currentScrollY.current, animated: false });
    }
  };

  const handleTabPress = (i: number) => {
    setTab(i);
    pagerRef.current?.setPage(i);
    syncNewTab(i);
  };

  const handlePageSelected = (position: number) => {
    setTab(position);
    syncNewTab(position);
  };

  const handlePageScrollStateChanged = (state: string) => {
    if (state === 'dragging') {
      scrollViewRefs.current.forEach((ref, i) => {
        if (i !== tab && ref) {
          (ref as any).scrollTo({ y: currentScrollY.current, animated: false });
        }
      });
    }
  };

  const totalHeaderH = headerHeight + TAB_BAR_H + 12;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* Scrollable pages — PagerView takes full space */}
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={e => handlePageSelected(e.nativeEvent.position)}
          onPageScrollStateChanged={e => handlePageScrollStateChanged(e.nativeEvent.pageScrollState)}
        >
          <Animated.ScrollView
            key="0"
            ref={r => { scrollViewRefs.current[0] = r as any; }}
            scrollEventThrottle={16}
            onScroll={scrollHandler}
            contentContainerStyle={[styles.feed, { paddingTop: totalHeaderH, minHeight: SCREEN_H - BOTTOM_TAB_H + headerHeight }]}
            showsVerticalScrollIndicator={false}
          >
            {POSTS.map((post, i) => <RoundCard key={i} post={post} />)}
          </Animated.ScrollView>

          <Animated.ScrollView
            key="1"
            ref={r => { scrollViewRefs.current[1] = r as any; }}
            scrollEventThrottle={16}
            onScroll={scrollHandler}
            contentContainerStyle={[styles.feed, { paddingTop: totalHeaderH, minHeight: SCREEN_H - BOTTOM_TAB_H + headerHeight }]}
            showsVerticalScrollIndicator={false}
          >
            {COURSES.map((c, i) => <CourseRow key={i} course={c} />)}
          </Animated.ScrollView>

          <Animated.ScrollView
            key="2"
            ref={r => { scrollViewRefs.current[2] = r as any; }}
            scrollEventThrottle={16}
            onScroll={scrollHandler}
            contentContainerStyle={[styles.feed, { paddingTop: totalHeaderH, minHeight: SCREEN_H - BOTTOM_TAB_H + headerHeight }]}
            showsVerticalScrollIndicator={false}
          >
            {ACHIEVEMENTS.map((a, i) => <AchievementRow key={i} a={a} />)}
          </Animated.ScrollView>
        </PagerView>

        {/* Floating header — scrolls up and disappears */}
        <Animated.View
          style={[styles.floatingHeader, { transform: [{ translateY: headerTranslate }] }]}
          onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)}
          pointerEvents="box-none"
        >
          <View style={styles.header}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{USER.initials}</Text>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{USER.name}</Text>
                <View style={styles.hcpBadge}>
                  <Text style={styles.hcpBadgeNum}>{USER.handicap}</Text>
                  <Text style={styles.hcpBadgeLabel}>HCP</Text>
                </View>
              </View>
              <Text style={styles.username}>{USER.username}</Text>
              <Text style={styles.club}>📍 {USER.club}</Text>
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialItem}>
              <Text style={styles.socialVal}>{USER.following}</Text>
              <Text style={styles.socialLabel}>Siguiendo</Text>
            </TouchableOpacity>
            <View style={styles.socialDivider} />
            <TouchableOpacity style={styles.socialItem}>
              <Text style={styles.socialVal}>{USER.followers}</Text>
              <Text style={styles.socialLabel}>Seguidores</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginHorizontal: 18, marginTop: 4 }}>
            <HcpChart thirdKpi={thirdKpi} />
          </View>

          <View style={styles.divider} />
        </Animated.View>

        {/* Sticky tab bar — sticks at top when header scrolls away */}
        <Animated.View
          style={[
            styles.tabBar,
            {
              top: headerHeight,
              transform: [{ translateY: tabBarTranslate }],
            },
          ]}
          pointerEvents="box-none"
        >
          {['Historial', 'Canchas', 'Logros'].map((label, i) => (
            <TouchableOpacity
              key={label}
              style={[styles.tabBtn, tab === i && styles.tabBtnActive]}
              onPress={() => handleTabPress(i)}
            >
              <Text style={[styles.tabBtnText, tab === i && styles.tabBtnTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: COLORS.bg,
  },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, paddingBottom: 12 },
  avatarLarge: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.lime, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#0f0f0f' },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  username: { fontSize: 12, color: COLORS.muted, marginTop: 1 },
  club: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
  editBtn: { borderWidth: 0.5, borderColor: COLORS.dim, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editText: { fontSize: 12, color: COLORS.muted },

  hcpBadge: { backgroundColor: COLORS.lime, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  hcpBadgeNum: { fontSize: 13, fontWeight: '800', color: '#0f0f0f' },
  hcpBadgeLabel: { fontSize: 8, fontWeight: '700', color: '#3a5010' },

  socialRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: 18, marginTop: 14, marginBottom: 16, backgroundColor: '#161616', borderRadius: 10, paddingVertical: 10 },
  socialItem: { flex: 1, alignItems: 'center' },
  socialVal: { fontSize: 15, fontWeight: '700', color: COLORS.muted },
  socialLabel: { fontSize: 9, color: COLORS.dim, marginTop: 1 },
  socialDivider: { width: 0.5, height: 20, backgroundColor: COLORS.border },

  kpiFooter: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  kpiItem: { flex: 1, alignItems: 'center' },
  kpiVal: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  kpiLabel: { fontSize: 10, color: COLORS.muted, textAlign: 'center', marginTop: 3, lineHeight: 14 },
  kpiDivider: { width: 0.5, backgroundColor: COLORS.border },

  chartCard: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.border, padding: 14 },
  chartTitle: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chartLabel: { fontSize: 9, color: COLORS.muted },

  divider: { height: 0.5, backgroundColor: '#222', marginHorizontal: 18, marginTop: 20, marginBottom: 4 },
  feed: { paddingHorizontal: 12, paddingBottom: 20, gap: 8 },

  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TAB_BAR_H,
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e1e1e',
    backgroundColor: COLORS.bg,
    zIndex: 10,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: COLORS.lime },
  tabBtnText: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },
  tabBtnTextActive: { color: COLORS.white, fontWeight: '700' },

  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, padding: 12 },
  courseIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.dark2, alignItems: 'center', justifyContent: 'center' },
  courseName: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  courseSub: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  courseBest: { fontSize: 16, fontWeight: '800', color: COLORS.lime },
  courseBestLbl: { fontSize: 9, color: COLORS.muted },

  achRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, padding: 12 },
  achIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#1e2e0a', borderWidth: 0.5, borderColor: COLORS.lime, alignItems: 'center', justifyContent: 'center' },
  achTitle: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  achSub: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  achDate: { fontSize: 10, color: COLORS.dim },

  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingBottom: 6 },
  cardTime: { fontSize: 11, color: COLORS.muted },
  cardBody: { paddingHorizontal: 12, paddingBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, paddingHorizontal: 12, borderTopWidth: 0.5, borderTopColor: '#222' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 12, color: COLORS.dim },
  courseBadge: { backgroundColor: COLORS.dark2, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  courseText: { fontSize: 11, color: COLORS.muted },
  holesRow: { flexDirection: 'row', gap: 3, marginBottom: 6 },
  summaryBox: { backgroundColor: '#141414', borderRadius: 10, padding: 10, gap: 10 },
  summaryScores: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryMain: { alignItems: 'center', paddingRight: 12, borderRightWidth: 0.5, borderRightColor: '#2a2a2a' },
  summaryBigScore: { fontSize: 32, fontWeight: '800', color: COLORS.white, lineHeight: 34 },
  summaryVsPar: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  summaryStats: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryItem: { alignItems: 'center', minWidth: 40 },
  summaryVal: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  summaryLbl: { fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 },
  expandBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#2a2a2a' },
  expandBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.lime },
});
