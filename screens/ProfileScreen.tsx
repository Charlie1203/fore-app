import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, Animated, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import Svg, { Ellipse, Line, Polygon, Circle, Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

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

// Stats que todavía no vienen de Firestore en esta etapa (se migran junto con Historial/Stats).
const MOCK_USER_STATS = {
  rounds: 18,
  bestScore: 74,
  eagles: 0,
  birdies: 34,
};

const COURSES = [
  { name: 'Haras Santa María', rounds: 9, bestScore: 74 },
  { name: 'Martindale CC', rounds: 5, bestScore: 79 },
  { name: 'San Andrés GC', rounds: 3, bestScore: 81 },
  { name: 'Olivos GC', rounds: 1, bestScore: 85 },
];

const ACHIEVEMENTS = [
  { icon: 'trophy-outline', title: 'Primer eagle', sub: 'Hoyo 14 · Haras Santa María', date: 'Mar 2026' },
  { icon: 'stats-chart-outline', title: 'Rompió 75', sub: 'Score 74 en Haras Santa María', date: 'Jun 2026' },
  { icon: 'trending-down-outline', title: 'HCP bajo de 13', sub: 'De 15.2 a 12.4 en 6 meses', date: 'Jun 2026' },
  { icon: 'checkmark-circle-outline', title: '10 rondas jugadas', sub: 'Primer hito del año', date: 'May 2026' },
];

const HCP_HISTORY = [
  { month: 'Ene', value: 15.2 }, { month: 'Feb', value: 14.8 }, { month: 'Mar', value: 14.1 },
  { month: 'Abr', value: 13.6 }, { month: 'May', value: 13.9 }, { month: 'Jun', value: 13.2 }, { month: 'Jul', value: 12.4 },
];

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const CHART_W = SCREEN_W - 80;
const CHART_H = 110;
const Y_AXIS_W = 32;
const TAB_BAR_H = 44;
const BOTTOM_TAB_H = 80;

function HcpChart({ thirdKpi }: { thirdKpi: { value: number; label: string } }) {
  const values = HCP_HISTORY.map(h => h.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const min = rawMin - 0.5;
  const max = rawMax + 0.5;
  const range = max - min;

  // Plot area: leave Y_AXIS_W on left, DOT_PAD on right so dots don't clip
  const DOT_PAD = 8;
  const plotX0 = Y_AXIS_W;
  const plotX1 = CHART_W - DOT_PAD;
  const plotW = plotX1 - plotX0;
  const VPAD = 8;
  const stepX = plotW / (values.length - 1);

  const toY = (v: number) => VPAD + (1 - (v - min) / range) * (CHART_H - VPAD * 2);
  const points = values.map((v, i) => ({ x: plotX0 + i * stepX, y: toY(v) }));

  const yLabels = [rawMax, (rawMax + rawMin) / 2, rawMin].map(v => ({
    v: v.toFixed(1),
    y: toY(v),
  }));

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Evolución del handicap</Text>
      <View style={{ marginTop: 10 }}>
        <Svg width={CHART_W} height={CHART_H}>
          {/* Grid lines */}
          {yLabels.map((l, i) => (
            <Path key={i} d={`M ${plotX0} ${l.y} H ${CHART_W}`} stroke="#2a2a2a" strokeWidth="1" />
          ))}
          {/* Curve */}
          <Path
            d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`}
            stroke={COLORS.lime}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dots */}
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r="3.5" fill={COLORS.lime} />
          ))}
        </Svg>
        {/* Y axis labels — absolute over SVG */}
        <View style={{ position: 'absolute', left: 0, top: 0, height: CHART_H, width: Y_AXIS_W }}>
          {yLabels.map((l, i) => (
            <Text key={i} style={[styles.chartLabel, { position: 'absolute', top: l.y - 6, right: 4, textAlign: 'right' }]}>
              {l.v}
            </Text>
          ))}
        </View>
      </View>
      {/* X labels centered under each dot */}
      <View style={{ flexDirection: 'row', marginTop: 4, paddingLeft: plotX0 - stepX / 2, paddingRight: DOT_PAD }}>
        {HCP_HISTORY.map((h, i) => (
          <Text key={i} style={[styles.chartLabel, { width: stepX, textAlign: 'center' }]}>{h.month}</Text>
        ))}
      </View>

      <View style={styles.kpiFooter}>
        <View style={styles.kpiItem}>
          <Text style={styles.kpiVal}>{MOCK_USER_STATS.rounds}</Text>
          <Text style={styles.kpiLabel}>Rondas{'\n'}este año</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Text style={styles.kpiVal}>{MOCK_USER_STATS.bestScore}</Text>
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
        <View>
          <Text style={styles.cardCourse}>📍 {post.course}</Text>
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
      <View style={styles.achIcon}><Ionicons name={a.icon as any} size={22} color={COLORS.lime} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.achTitle}>{a.title}</Text>
        <Text style={styles.achSub}>{a.sub}</Text>
      </View>
      <Text style={styles.achDate}>{a.date}</Text>
    </View>
  );
}

function EditProfileModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { firebaseUser, userDoc } = useAuth();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState(userDoc?.displayName ?? '');
  const [username, setUsername] = useState(userDoc?.username ?? '');
  const [handicap, setHandicap] = useState(userDoc?.handicap?.toString() ?? '');
  const [photoURI, setPhotoURI] = useState<string | null>(userDoc?.photoURL ?? null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled || !firebaseUser) return;
    const uri = result.assets[0].uri;
    setUploadingPhoto(true);
    try {
      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = reject;
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });
      const storageRef = ref(storage, `users/${firebaseUser.uid}/avatar.jpg`);
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(storageRef);
      setPhotoURI(url);
      await updateDoc(doc(db, 'users', firebaseUser.uid), { photoURL: url });
    } catch (err: any) { console.error('AVATAR UPLOAD ERROR:', JSON.stringify(err), err?.message, err?.code); Alert.alert('Error', err?.message ?? 'No se pudo subir la foto.'); }
    finally { setUploadingPhoto(false); }
  };

  const handleSave = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase().replace(/^@/, ''),
        handicap: handicap ? parseFloat(handicap) : null,
      });
      onClose();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (userDoc?.displayName ?? '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[epStyles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={epStyles.handle} />
            <View style={epStyles.header}>
              <Text style={epStyles.title}>Editar perfil</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={20} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            {/* Avatar */}
            <TouchableOpacity style={epStyles.avatarWrap} onPress={pickPhoto} disabled={uploadingPhoto}>
              {photoURI
                ? <Image source={{ uri: photoURI }} style={epStyles.avatarImg} />
                : <View style={epStyles.avatarFallback}><Text style={epStyles.avatarInitials}>{initials}</Text></View>
              }
              <View style={epStyles.avatarOverlay}>
                {uploadingPhoto
                  ? <Ionicons name="hourglass-outline" size={16} color="#fff" />
                  : <Ionicons name="camera" size={16} color="#fff" />
                }
              </View>
            </TouchableOpacity>

            <Text style={epStyles.label}>Nombre</Text>
            <View style={epStyles.inputBox}>
              <TextInput style={epStyles.input} value={displayName} onChangeText={setDisplayName} placeholder="Tu nombre" placeholderTextColor={COLORS.dim} />
            </View>

            <Text style={epStyles.label}>Usuario</Text>
            <View style={epStyles.inputBox}>
              <TextInput style={epStyles.input} value={username} onChangeText={setUsername} placeholder="@usuario" placeholderTextColor={COLORS.dim} autoCapitalize="none" />
            </View>

            <Text style={epStyles.label}>Matrícula (HCP)</Text>
            <View style={epStyles.inputBox}>
              <TextInput style={epStyles.input} value={handicap} onChangeText={t => setHandicap(t.replace(/[^0-9.]/g, ''))} placeholder="Ej: 12.4" placeholderTextColor={COLORS.dim} keyboardType="decimal-pad" />
            </View>

            <TouchableOpacity style={[epStyles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
              <Text style={epStyles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const epStyles = StyleSheet.create({
  sheet: { backgroundColor: '#161616', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 24, paddingTop: 12 },
  handle: { width: 36, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: '700', color: '#f0f0f0' },
  label: { fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  inputBox: { backgroundColor: '#1e1e1e', borderRadius: 10, borderWidth: 0.5, borderColor: '#2a2a2a', paddingHorizontal: 14, justifyContent: 'center' },
  input: { color: '#f0f0f0', fontSize: 15, paddingVertical: 12 },
  saveBtn: { backgroundColor: '#c8e03a', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#0f0f0f', fontWeight: '700', fontSize: 15 },
  avatarWrap: { alignSelf: 'center', marginBottom: 8 },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#c8e03a', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 24, fontWeight: '800', color: '#0f0f0f' },
  avatarOverlay: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#161616' },
});

export default function ProfileScreen() {
  const { userDoc } = useAuth();
  const [tab, setTab] = useState(0);
  const [editVisible, setEditVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const pagerRef = useRef<PagerView>(null);
  const thirdKpi = MOCK_USER_STATS.eagles > 0
    ? { value: MOCK_USER_STATS.eagles, label: 'Eagles' }
    : { value: MOCK_USER_STATS.birdies, label: 'Birdies' };

  const initials = (userDoc?.displayName ?? '??')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const displayUser = {
    name: userDoc?.displayName ?? '',
    initials,
    username: '@' + (userDoc?.username ?? ''),
    club: userDoc?.club ?? 'Sin club',
    handicap: userDoc?.handicap ?? 0,
    followers: userDoc?.followersCount ?? 0,
    following: userDoc?.followingCount ?? 0,
  };

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
      <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} />
      {/* Settings menu */}
      <Modal visible={menuVisible} animationType="fade" transparent onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.settingsMenu}>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setMenuVisible(false); setTimeout(() => setEditVisible(true), 200); }}>
              <Ionicons name="person-outline" size={18} color={COLORS.white} />
              <Text style={styles.settingsItemText}>Editar perfil</Text>
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setMenuVisible(false); Alert.alert('Cerrar sesión', '¿Seguro?', [{ text: 'Cancelar' }, { text: 'Salir', style: 'destructive', onPress: logout }]); }}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.red} />
              <Text style={[styles.settingsItemText, { color: COLORS.red }]}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
            <View style={{ marginHorizontal: 18, marginTop: 8, marginBottom: 8 }}>
              <HcpChart thirdKpi={thirdKpi} />
            </View>
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
            {userDoc?.photoURL
              ? <Image source={{ uri: userDoc.photoURL }} style={styles.avatarLarge} />
              : <View style={styles.avatarLarge}><Text style={styles.avatarText}>{displayUser.initials}</Text></View>
            }
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{displayUser.name}</Text>
                <View style={styles.hcpBadge}>
                  <Text style={styles.hcpBadgeNum}>{displayUser.handicap}</Text>
                  <Text style={styles.hcpBadgeLabel}>HCP</Text>
                </View>
              </View>
              <Text style={styles.username}>{displayUser.username}</Text>
              <Text style={styles.club}>📍 {displayUser.club}</Text>
            </View>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => setMenuVisible(true)}>
              <Ionicons name="settings-outline" size={20} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialItem}>
              <Text style={styles.socialVal}>{displayUser.following}</Text>
              <Text style={styles.socialLabel}>Siguiendo</Text>
            </TouchableOpacity>
            <View style={styles.socialDivider} />
            <TouchableOpacity style={styles.socialItem}>
              <Text style={styles.socialVal}>{displayUser.followers}</Text>
              <Text style={styles.socialLabel}>Seguidores</Text>
            </TouchableOpacity>
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
          {['Historial', 'Stats', 'Logros'].map((label, i) => (
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
  settingsBtn: { padding: 6 },
  settingsMenu: { backgroundColor: '#1e1e1e', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32, paddingTop: 8 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 16 },
  settingsItemText: { fontSize: 15, color: COLORS.white },
  settingsDivider: { height: 0.5, backgroundColor: COLORS.border, marginHorizontal: 24 },
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
  feed: { paddingBottom: 20 },

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

  achRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  achIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  achTitle: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  achSub: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  achDate: { fontSize: 10, color: COLORS.dim },

  card: { backgroundColor: COLORS.bg, borderBottomWidth: 8, borderBottomColor: '#1a1a1a', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingBottom: 6 },
  cardTime: { fontSize: 11, color: COLORS.muted },
  cardBody: { paddingHorizontal: 12, paddingBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, paddingHorizontal: 12, borderTopWidth: 0.5, borderTopColor: '#222' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 12, color: COLORS.dim },
  courseBadge: { backgroundColor: COLORS.dark2, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  courseText: { fontSize: 11, color: COLORS.muted },
  cardCourse: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
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
