import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase/config';
import { collection, doc, setDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { HoleResult, RoundDoc } from '../firebase/types';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444',
  red: '#e07070', dark2: '#242424',
};

const CLUBS = [
  {
    name: 'Haras Santa María',
    courses: ['Campo Principal'],
  },
  {
    name: 'Martindale CC',
    courses: ['Campo Norte', 'Campo Sur'],
  },
  {
    name: 'San Andrés GC',
    courses: ['Campo Principal'],
  },
  {
    name: 'Olivos GC',
    courses: ['Campo A', 'Campo B'],
  },
];

const DEFAULT_PARS = [4, 4, 5, 3, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 4, 5];

type Step = 1 | 2 | 3 | 4;
const STEP_TITLES: Record<Step, string> = {
  1: 'Cargar tarjeta',
  2: 'Ida · hoyos 1-9',
  3: 'Vuelta · hoyos 10-18',
  4: 'Publicar',
};

function StepIndicator({ step }: { step: Step }) {
  return (
    <View style={styles.stepRow}>
      {[1, 2, 3, 4].map(n => (
        <View key={n} style={{ flexDirection: 'row', alignItems: 'center', flex: n < 4 ? 1 : undefined }}>
          <View style={[styles.stepDot, step >= n && styles.stepDotActive]} />
          {n < 4 && <View style={[styles.stepLine, step > n && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );
}

function StepCancha({ club, course, onNext }: {
  club: string; course: string;
  onNext: (club: string, course: string) => void;
}) {
  const { firebaseUser } = useAuth();
  const [selectedClub, setSelectedClub] = useState<string | null>(club || null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(course || null);
  const [search, setSearch] = useState('');
  const [recientes, setRecientes] = useState<{ club: string; course: string }[]>([]);
  const [loadingRecientes, setLoadingRecientes] = useState(true);

  useEffect(() => {
    if (!firebaseUser) { setLoadingRecientes(false); return; }
    const q = query(collection(db, 'rounds'), where('userId', '==', firebaseUser.uid), orderBy('date', 'desc'), limit(15));
    getDocs(q).then(snap => {
      const seen = new Set<string>();
      const list: { club: string; course: string }[] = [];
      snap.docs.forEach(d => {
        const r = d.data() as RoundDoc;
        const key = `${r.clubName}__${r.courseName}`;
        if (!seen.has(key) && list.length < 3) { seen.add(key); list.push({ club: r.clubName, course: r.courseName }); }
      });
      setRecientes(list);
    }).finally(() => setLoadingRecientes(false));
  }, [firebaseUser?.uid]);

  const filtered = search.length > 0 ? CLUBS.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : [];
  const clubData = CLUBS.find(c => c.name === selectedClub);

  const canConfirm = selectedClub && (clubData && clubData.courses.length === 1 ? true : !!selectedCourse);

  const handleConfirm = () => {
    const finalCourse = selectedCourse || (clubData?.courses[0] ?? '');
    onNext(selectedClub!, finalCourse);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepTitle}>¿Dónde jugaste?</Text>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar club..."
          placeholderTextColor={COLORS.dim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {search.length === 0 && !loadingRecientes && recientes.length === 0 && (
        <Text style={styles.hintText}>Buscá tu club para empezar.</Text>
      )}

      {search.length === 0 && !loadingRecientes && recientes.length > 0 && (
        <>
          <Text style={styles.label}>Jugaste recientemente</Text>
          {recientes.map(r => (
            <TouchableOpacity
              key={`${r.club}__${r.course}`}
              style={[styles.option, selectedClub === r.club && selectedCourse === r.course && styles.optionSelected]}
              onPress={() => { setSelectedClub(r.club); setSelectedCourse(r.course); }}
            >
              <View>
                <Text style={[styles.optionText, selectedClub === r.club && selectedCourse === r.course && styles.optionTextSelected]}>{r.club}</Text>
                <Text style={styles.optionSub}>{r.course}</Text>
              </View>
              {selectedClub === r.club && selectedCourse === r.course && <Ionicons name="checkmark" size={16} color={COLORS.lime} />}
            </TouchableOpacity>
          ))}
        </>
      )}

      {filtered.map(c => (
        <TouchableOpacity
          key={c.name}
          style={[styles.option, selectedClub === c.name && styles.optionSelected]}
          onPress={() => { setSelectedClub(c.name); setSelectedCourse(null); }}
        >
          <Text style={[styles.optionText, selectedClub === c.name && styles.optionTextSelected]}>{c.name}</Text>
          {selectedClub === c.name && <Ionicons name="checkmark" size={16} color={COLORS.lime} />}
        </TouchableOpacity>
      ))}

      {clubData && clubData.courses.length > 1 && (
        <>
          <Text style={[styles.label, { marginTop: 16 }]}>Cancha</Text>
          {clubData.courses.map(cr => (
            <TouchableOpacity
              key={cr}
              style={[styles.option, selectedCourse === cr && styles.optionSelected]}
              onPress={() => setSelectedCourse(cr)}
            >
              <Text style={[styles.optionText, selectedCourse === cr && styles.optionTextSelected]}>{cr}</Text>
              {selectedCourse === cr && <Ionicons name="checkmark" size={16} color={COLORS.lime} />}
            </TouchableOpacity>
          ))}
        </>
      )}

      <TouchableOpacity
        style={[styles.nextBtn, !canConfirm && { opacity: 0.4 }]}
        onPress={handleConfirm}
        disabled={!canConfirm}
      >
        <Text style={styles.nextBtnText}>Continuar →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function HoleRow({ num, par, score, onInc, onDec }: {
  num: number; par: number; score: number;
  onInc: () => void; onDec: () => void;
}) {
  const diff = score - par;
  const scoreColor = diff < 0 ? COLORS.lime : diff > 0 ? COLORS.red : COLORS.muted;
  const diffLabel = diff === 0 ? 'Par' : diff > 0 ? `+${diff}` : `${diff}`;

  return (
    <View style={styles.holeRow}>
      <View style={styles.holeInfo}>
        <Text style={styles.holeNumText}>H{num}</Text>
        <Text style={styles.holeParText}>Par {par}</Text>
      </View>
      <View style={styles.holeControls}>
        <TouchableOpacity style={styles.controlBtn} onPress={onDec}>
          <Text style={styles.controlBtnText}>−</Text>
        </TouchableOpacity>
        <View style={styles.scoreBox}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>{score}</Text>
          <Text style={[styles.diffText, { color: scoreColor }]}>{diffLabel}</Text>
        </View>
        <TouchableOpacity style={styles.controlBtn} onPress={onInc}>
          <Text style={styles.controlBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StepNueve({ club, course, label, offset, scores, onInc, onDec, footer }: {
  club: string; course: string; label: string; offset: 0 | 9;
  scores: number[];
  onInc: (i: number) => void; onDec: (i: number) => void;
  footer: React.ReactNode;
}) {
  const pars = DEFAULT_PARS.slice(offset, offset + 9);
  const holeScores = scores.slice(offset, offset + 9);
  const totalScore = holeScores.reduce((a, b) => a + b, 0);
  const totalPar = pars.reduce((a, b) => a + b, 0);
  const vsPar = totalScore - totalPar;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <View style={styles.coursePill}>
        <Ionicons name="location-outline" size={14} color={COLORS.muted} />
        <Text style={styles.coursePillText}>{club} · {course}</Text>
      </View>

      <View style={styles.totalBox}>
        <View style={styles.totalItem}>
          <Text style={styles.totalVal}>{totalScore}</Text>
          <Text style={styles.totalLbl}>Score {label}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={[styles.totalVal, { color: vsPar <= 0 ? COLORS.lime : COLORS.red }]}>
            {vsPar > 0 ? '+' : ''}{vsPar}
          </Text>
          <Text style={styles.totalLbl}>vs Par</Text>
        </View>
      </View>

      <Text style={styles.label}>{label}</Text>
      <View style={styles.holeGroup}>
        {pars.map((par, i) => (
          <HoleRow key={i} num={offset + i + 1} par={par} score={holeScores[i]} onInc={() => onInc(offset + i)} onDec={() => onDec(offset + i)} />
        ))}
      </View>

      {footer}
    </ScrollView>
  );
}

const TORNEOS_ACTIVOS = [
  { id: '1', nombre: 'Open de Verano', modalidad: 'Stableford' },
  { id: '2', nombre: 'Torneo del Club', modalidad: 'Stroke Play' },
];

function StepPublicar({ scores, holesPlayed, club, course, saving, onDone }: {
  scores: number[]; holesPlayed: 9 | 18; club: string; course: string; saving: boolean;
  onDone: (opts: { photos: string[]; shareOnFeed: boolean }) => void;
}) {
  const [shareOnFeed, setShareOnFeed] = useState(false);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [torneoIds, setTorneoIds] = useState<string[]>([]);
  const [showTorneos, setShowTorneos] = useState(false);

  const jugados = scores.slice(0, holesPlayed);
  const pares = DEFAULT_PARS.slice(0, holesPlayed);
  const totalScore = jugados.reduce((a, b) => a + b, 0);
  const totalPar = pares.reduce((a, b) => a + b, 0);
  const vsPar = totalScore - totalPar;

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4 - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 4));
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setPhotos(prev => [...prev, result.assets[0].uri].slice(0, 4));
    }
  };

  const removePhoto = (i: number) => setPhotos(prev => prev.filter((_, idx) => idx !== i));

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>

      <View style={styles.summaryPill}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location-outline" size={12} color={COLORS.muted} />
          <Text style={styles.summaryPillCourse}>{club} · {course}{holesPlayed === 9 ? ' · 9 hoyos' : ''}</Text>
        </View>
        <View style={styles.summaryPillStats}>
          <Text style={styles.summaryPillScore}>{totalScore}</Text>
          <Text style={[styles.summaryPillVsPar, { color: vsPar <= 0 ? COLORS.lime : COLORS.red }]}>
            {vsPar > 0 ? '+' : ''}{vsPar}
          </Text>
        </View>
      </View>

      {/* Vincular a torneo */}
      <TouchableOpacity style={styles.shareToggleRow} onPress={() => setShowTorneos(v => !v)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.shareToggleTitle}>Vincular a torneo</Text>
          <Text style={styles.shareToggleSub}>
            {torneoIds.length === 0 ? 'Ninguno seleccionado' : TORNEOS_ACTIVOS.filter(t => torneoIds.includes(t.id)).map(t => t.nombre).join(', ')}
          </Text>
        </View>
        <Ionicons name={showTorneos ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.muted} />
      </TouchableOpacity>
      {showTorneos && (
        <View style={{ marginBottom: 4 }}>
          {TORNEOS_ACTIVOS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={styles.torneoNoneRow}
              onPress={() => setTorneoIds(ids => ids.includes(t.id) ? ids.filter(x => x !== t.id) : [...ids, t.id])}
            >
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={[styles.torneoRowText, torneoIds.includes(t.id) && { color: COLORS.white, fontWeight: '600' }]}>{t.nombre}</Text>
                <Text style={styles.torneoRowSub}>{t.modalidad}</Text>
              </View>
              {torneoIds.includes(t.id) && <Ionicons name="checkmark" size={16} color={COLORS.lime} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Toggle compartir */}
      <TouchableOpacity style={styles.shareToggleRow} onPress={() => setShareOnFeed(v => !v)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.shareToggleTitle}>Compartir con tus seguidores</Text>
          <Text style={styles.shareToggleSub}>Aparece en el feed de tus amigos</Text>
        </View>
        <View style={[styles.shareToggleBox, shareOnFeed && styles.shareToggleBoxOn]}>
          {shareOnFeed && <Ionicons name="checkmark" size={16} color="#0f0f0f" />}
        </View>
      </TouchableOpacity>

      {shareOnFeed && (
        <>
          <View style={styles.commentBox}>
            <TextInput
              style={styles.commentInput}
              placeholder="Contá cómo estuvo la vuelta..."
              placeholderTextColor={COLORS.dim}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={200}
            />
            <Text style={styles.commentCount}>{comment.length}/200</Text>
          </View>

          {/* Fotos */}
          <View style={styles.photosRow}>
            {photos.map((uri, i) => (
              <View key={i} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoThumbImg} />
                <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(i)}>
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 4 && (
              <View style={styles.photoAddGroup}>
                <TouchableOpacity style={styles.photoAdd} onPress={pickFromCamera}>
                  <Ionicons name="camera-outline" size={22} color={COLORS.muted} />
                  <Text style={styles.photoAddText}>Cámara</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoAdd} onPress={pickFromGallery}>
                  <Ionicons name="image-outline" size={22} color={COLORS.muted} />
                  <Text style={styles.photoAddText}>Galería</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.nextBtn, saving && { opacity: 0.6 }]}
        onPress={() => onDone({ photos: shareOnFeed ? photos : [], shareOnFeed })}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="#0f0f0f" />
          : <Text style={styles.nextBtnText}>{shareOnFeed ? 'Publicar vuelta' : 'Guardar vuelta'}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const uploadRoundPhoto = async (uri: string, uid: string, roundId: string, index: number): Promise<string> => {
  const blob: Blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = reject;
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
  const photoRef = storageRef(storage, `rounds/${uid}/${roundId}/${index}.jpg`);
  await uploadBytes(photoRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(photoRef);
};

export default function UploadScreen() {
  const navigation = useNavigation<any>();
  const { firebaseUser, userDoc } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [club, setClub] = useState('');
  const [course, setCourse] = useState('');
  const [scores, setScores] = useState(DEFAULT_PARS.map(p => p));
  const [holesPlayed, setHolesPlayed] = useState<9 | 18>(18);
  const [saving, setSaving] = useState(false);

  const inc = (i: number) => setScores(s => s.map((v, idx) => idx === i ? v + 1 : v));
  const dec = (i: number) => setScores(s => s.map((v, idx) => idx === i ? Math.max(1, v - 1) : v));

  const goBack = () => {
    if (step === 4) setStep(holesPlayed === 18 ? 3 : 2);
    else if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  const reset = () => {
    setStep(1);
    setClub('');
    setCourse('');
    setScores(DEFAULT_PARS.map(p => p));
    setHolesPlayed(18);
  };

  const guardarRonda = async (holes: 9 | 18, { photos, shareOnFeed }: { photos: string[]; shareOnFeed: boolean }) => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      const jugados = scores.slice(0, holes);
      const pares = DEFAULT_PARS.slice(0, holes);
      const totalScore = jugados.reduce((a, b) => a + b, 0);
      const totalPar = pares.reduce((a, b) => a + b, 0);
      let eagles = 0, birdies = 0, parCount = 0, bogeys = 0, doublesPlus = 0;
      const holeResults: HoleResult[] = jugados.map((score, i) => {
        const diff = score - pares[i];
        if (diff <= -2) eagles++;
        else if (diff === -1) birdies++;
        else if (diff === 0) parCount++;
        else if (diff === 1) bogeys++;
        else doublesPlus++;
        return { number: i + 1, score, par: pares[i] };
      });

      const roundRef = doc(collection(db, 'rounds'));
      const photoUrls = photos.length > 0
        ? await Promise.all(photos.map((uri, i) => uploadRoundPhoto(uri, firebaseUser.uid, roundRef.id, i)))
        : [];

      const authorName = userDoc?.displayName ?? 'Jugador';
      const authorInitials = authorName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

      await setDoc(roundRef, {
        id: roundRef.id,
        userId: firebaseUser.uid,
        authorName,
        authorInitials,
        courseId: null,
        courseName: course,
        clubName: club,
        date: serverTimestamp(),
        holes: holeResults,
        totalScore,
        totalPar,
        vsPar: totalScore - totalPar,
        eagles, birdies: birdies, pars: parCount, bogeys, doublesPlus,
        photos: photoUrls,
        visibility: shareOnFeed ? 'public' : 'private',
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });

      reset();
      navigation.navigate('Inicio', { showSuccess: Date.now() });
    } catch {
      Alert.alert('Error', 'No se pudo guardar la vuelta. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          {step > 1 && (
            <TouchableOpacity onPress={goBack}>
              <Text style={styles.backBtn}>← Atrás</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{STEP_TITLES[step]}</Text>
        </View>
        <View style={{ paddingHorizontal: 18 }}><StepIndicator step={step} /></View>
      </View>

      {step === 1 && (
        <StepCancha
          club={club} course={course}
          onNext={(c, cr) => { setClub(c); setCourse(cr); setStep(2); }}
        />
      )}

      {step === 2 && (
        <StepNueve
          club={club} course={course} label="Ida" offset={0}
          scores={scores} onInc={inc} onDec={dec}
          footer={
            <View style={{ marginTop: 24, gap: 12 }}>
              <TouchableOpacity style={styles.nextBtn} onPress={() => { setHolesPlayed(18); setStep(3); }}>
                <Text style={styles.nextBtnText}>Continuar a la vuelta →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setHolesPlayed(9); setStep(4); }}>
                <Text style={styles.skipLink}>Jugué solo 9 hoyos, guardar así</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {step === 3 && (
        <StepNueve
          club={club} course={course} label="Vuelta" offset={9}
          scores={scores} onInc={inc} onDec={dec}
          footer={
            <TouchableOpacity style={[styles.nextBtn, { marginTop: 24 }]} onPress={() => { setHolesPlayed(18); setStep(4); }}>
              <Text style={styles.nextBtnText}>Continuar →</Text>
            </TouchableOpacity>
          }
        />
      )}

      {step === 4 && (
        <StepPublicar
          scores={scores} holesPlayed={holesPlayed} club={club} course={course} saving={saving}
          onDone={opts => guardarRonda(holesPlayed, opts)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 10, paddingBottom: 12, gap: 8 },
  headerInner: { paddingHorizontal: 18, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  backBtn: { fontSize: 14, color: COLORS.lime },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.dim },
  stepDotActive: { backgroundColor: COLORS.lime },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.dim, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: COLORS.lime },
  stepContent: { paddingHorizontal: 18, paddingBottom: 40 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white, marginTop: 18, marginBottom: 20 },
  label: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  searchBox: { borderBottomWidth: 0.5, borderBottomColor: COLORS.border, marginBottom: 12 },
  searchInput: { paddingVertical: 12, paddingHorizontal: 0, fontSize: 14, color: COLORS.white },
  option: { paddingVertical: 14, paddingHorizontal: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  optionSelected: { },
  optionSub: { fontSize: 11, color: COLORS.dim, marginTop: 2 },
  hintText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 24 },
  shareToggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, marginBottom: 16 },
  shareToggleTitle: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  shareToggleSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  shareToggleBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.dim, alignItems: 'center', justifyContent: 'center' },
  shareToggleBoxOn: { backgroundColor: COLORS.lime, borderColor: COLORS.lime },
  optionText: { fontSize: 14, color: COLORS.white },
  optionTextSelected: { color: COLORS.lime, fontWeight: '700' },
  torneoNoneRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  torneoRowText: { fontSize: 14, color: COLORS.muted },
  torneoRowSub: { fontSize: 11, color: COLORS.dim, marginTop: 1 },
  nextBtn: { backgroundColor: COLORS.lime, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: '#0f0f0f' },
  skipLink: { fontSize: 13, color: COLORS.muted, textAlign: 'center', fontWeight: '600' },
  coursePill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, marginBottom: 4, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  coursePillText: { flex: 1, fontSize: 14, color: COLORS.white, fontWeight: '600' },
  totalBox: { flexDirection: 'row', paddingVertical: 20, marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  totalItem: { flex: 1, alignItems: 'center' },
  totalVal: { fontSize: 32, fontWeight: '800', color: COLORS.white },
  totalLbl: { fontSize: 10, color: COLORS.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalDivider: { width: 0.5, backgroundColor: COLORS.border },
  holeGroup: { overflow: 'hidden' },
  holeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  holeInfo: { gap: 2 },
  holeNumText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  holeParText: { fontSize: 11, color: COLORS.dim },
  holeControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  controlBtnText: { fontSize: 20, color: COLORS.white, lineHeight: 24 },
  scoreBox: { width: 48, alignItems: 'center' },
  scoreText: { fontSize: 20, fontWeight: '800' },
  diffText: { fontSize: 10, fontWeight: '600' },
  summaryPill: { paddingVertical: 16, marginBottom: 4, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, gap: 6 },
  summaryPillCourse: { fontSize: 12, color: COLORS.muted },
  summaryPillStats: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  summaryPillScore: { fontSize: 32, fontWeight: '800', color: COLORS.white },
  summaryPillVsPar: { fontSize: 18, fontWeight: '700' },
  commentBox: { borderBottomWidth: 0.5, borderBottomColor: COLORS.border, paddingVertical: 12 },
  commentInput: { fontSize: 14, color: COLORS.white, minHeight: 80, textAlignVertical: 'top' },
  commentCount: { fontSize: 10, color: COLORS.dim, textAlign: 'right', marginTop: 4 },

  photosRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  photoThumb: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden' },
  photoThumbImg: { width: 72, height: 72 },
  photoRemove: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  photoAddGroup: { flexDirection: 'row', gap: 8 },
  photoAdd: { width: 72, height: 72, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2 },
  photoAddText: { fontSize: 10, color: COLORS.dim },
});
