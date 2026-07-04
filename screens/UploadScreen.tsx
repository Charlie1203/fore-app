import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

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

function StepIndicator({ step }: { step: number }) {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
      <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
      <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
    </View>
  );
}

function ClubPickerModal({ club, course, onSelect, onClose }: {
  club: string; course: string;
  onSelect: (club: string, course: string) => void;
  onClose: () => void;
}) {
  const [selectedClub, setSelectedClub] = useState<string | null>(club || null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(course || null);
  const [search, setSearch] = useState('');

  const filtered = CLUBS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const clubData = CLUBS.find(c => c.name === selectedClub);

  const canConfirm = selectedClub && (clubData && clubData.courses.length === 1 ? true : !!selectedCourse);

  const handleConfirm = () => {
    const finalCourse = selectedCourse || (clubData?.courses[0] ?? '');
    onSelect(selectedClub!, finalCourse);
    onClose();
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.pickerSheet}>
        <View style={styles.pickerHandle} />
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>¿Dónde jugaste?</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBox, { marginHorizontal: 18, marginBottom: 12 }]}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar club..."
            placeholderTextColor={COLORS.dim}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 20, gap: 6 }}>
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
        </ScrollView>

        {canConfirm && (
          <View style={{ paddingHorizontal: 18, paddingBottom: 24, paddingTop: 8 }}>
            <TouchableOpacity style={styles.nextBtn} onPress={handleConfirm}>
              <Text style={styles.nextBtnText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
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

function Step2({ club, course, onClubChange, onPublish }: {
  club: string; course: string;
  onClubChange: (club: string, course: string) => void;
  onPublish: (scores: number[]) => void;
}) {
  const [scores, setScores] = useState(DEFAULT_PARS.map(p => p));
  const [showPicker, setShowPicker] = useState(false);

  const inc = (i: number) => setScores(s => s.map((v, idx) => idx === i ? v + 1 : v));
  const dec = (i: number) => setScores(s => s.map((v, idx) => idx === i ? Math.max(1, v - 1) : v));

  const totalScore = scores.reduce((a, b) => a + b, 0);
  const totalPar = DEFAULT_PARS.reduce((a, b) => a + b, 0);
  const vsPar = totalScore - totalPar;

  return (
    <>
      {showPicker && (
        <ClubPickerModal
          club={club} course={course}
          onSelect={(c, cr) => onClubChange(c, cr)}
          onClose={() => setShowPicker(false)}
        />
      )}
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <TouchableOpacity style={styles.coursePill} onPress={() => setShowPicker(true)}>
        <Ionicons name="location-outline" size={14} color={COLORS.muted} />
        <Text style={styles.coursePillText}>
          {club ? `${club}${course ? ` · ${course}` : ''}` : 'Elegir cancha...'}
        </Text>
        <Ionicons name="pencil-outline" size={13} color={COLORS.dim} />
      </TouchableOpacity>

      <View style={styles.totalBox}>
        <View style={styles.totalItem}>
          <Text style={styles.totalVal}>{totalScore}</Text>
          <Text style={styles.totalLbl}>Score</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={[styles.totalVal, { color: vsPar <= 0 ? COLORS.lime : COLORS.red }]}>
            {vsPar > 0 ? '+' : ''}{vsPar}
          </Text>
          <Text style={styles.totalLbl}>vs Par</Text>
        </View>
      </View>

      <Text style={styles.label}>Frente</Text>
      <View style={styles.holeGroup}>
        {DEFAULT_PARS.slice(0, 9).map((par, i) => (
          <HoleRow key={i} num={i + 1} par={par} score={scores[i]} onInc={() => inc(i)} onDec={() => dec(i)} />
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 16 }]}>Vuelta</Text>
      <View style={styles.holeGroup}>
        {DEFAULT_PARS.slice(9).map((par, i) => (
          <HoleRow key={i} num={i + 10} par={par} score={scores[i + 9]} onInc={() => inc(i + 9)} onDec={() => dec(i + 9)} />
        ))}
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={() => onPublish(scores)}>
        <Text style={styles.nextBtnText}>Continuar →</Text>
      </TouchableOpacity>
    </ScrollView>
    </>
  );
}

const TORNEOS_ACTIVOS = [
  { id: '1', nombre: 'Open de Verano', modalidad: 'Stableford' },
  { id: '2', nombre: 'Torneo del Club', modalidad: 'Stroke Play' },
];

function Step3({ scores, club, course, onDone }: {
  scores: number[]; club: string; course: string; onDone: (photos: string[]) => void;
}) {
  const [shareOnFeed, setShareOnFeed] = useState(false);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [torneoIds, setTorneoIds] = useState<string[]>([]);
  const [showTorneos, setShowTorneos] = useState(false);

  const totalScore = scores.reduce((a, b) => a + b, 0);
  const totalPar = DEFAULT_PARS.reduce((a, b) => a + b, 0);
  const vsPar = totalScore - totalPar;
  const birdies = scores.filter((s, i) => s - DEFAULT_PARS[i] === -1).length;

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
          <Text style={styles.summaryPillCourse}>{club} · {course}</Text>
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

      <TouchableOpacity style={styles.nextBtn} onPress={() => onDone(shareOnFeed ? photos : [])}>
        <Text style={styles.nextBtnText}>{shareOnFeed ? 'Publicar vuelta' : 'Guardar vuelta'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function UploadScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(1);
  const [club, setClub] = useState('');
  const [course, setCourse] = useState('');
  const [scores, setScores] = useState(DEFAULT_PARS.map(p => p));

  const handleScoresDone = (s: number[]) => { setScores(s); setStep(2); };

  const handleDone = (photos: string[]) => {
    setStep(1);
    setClub('');
    setCourse('');
    setScores(DEFAULT_PARS.map(p => p));
    navigation.navigate('Inicio', { showSuccess: Date.now(), photos });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          {step > 1 && (
            <TouchableOpacity onPress={() => setStep(step - 1)}>
              <Text style={styles.backBtn}>← Atrás</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Cargar vuelta</Text>
        </View>
        <View style={{ paddingHorizontal: 18 }}><StepIndicator step={step} /></View>
      </View>

      {step === 1 && (
        <Step2
          club={club} course={course}
          onClubChange={(c, cr) => { setClub(c); setCourse(cr); }}
          onPublish={handleScoresDone}
        />
      )}
      {step === 2 && <Step3 scores={scores} club={club} course={course} onDone={handleDone} />}
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
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.dim },
  stepLineActive: { backgroundColor: COLORS.lime },
  stepContent: { paddingHorizontal: 18, paddingBottom: 40 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 20 },
  label: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  searchBox: { borderBottomWidth: 0.5, borderBottomColor: COLORS.border, marginBottom: 4 },
  searchInput: { paddingVertical: 12, paddingHorizontal: 0, fontSize: 14, color: COLORS.white },
  optionList: { gap: 0 },
  option: { paddingVertical: 14, paddingHorizontal: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  optionSelected: { },
  shareToggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, marginBottom: 16 },
  shareToggleTitle: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  shareToggleSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  shareToggleBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.dim, alignItems: 'center', justifyContent: 'center' },
  shareToggleBoxOn: { backgroundColor: COLORS.lime, borderColor: COLORS.lime },
  optionText: { fontSize: 14, color: COLORS.white },
  optionTextSelected: { color: COLORS.lime, fontWeight: '700' },
  checkmark: { color: COLORS.lime, fontSize: 16, fontWeight: '700' },
  sectionLabelUpload: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  torneoNoneRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  torneoRowText: { fontSize: 14, color: COLORS.muted },
  torneoRowSub: { fontSize: 11, color: COLORS.dim, marginTop: 1 },
  nextBtn: { backgroundColor: COLORS.lime, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: '#0f0f0f' },
  coursePill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, marginBottom: 4, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  coursePillText: { flex: 1, fontSize: 14, color: COLORS.white, fontWeight: '600' },
  coursePillEdit: { fontSize: 12 },
  modalOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 100 },
  pickerSheet: { backgroundColor: '#161616', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '80%', paddingTop: 12 },
  pickerHandle: { width: 36, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginBottom: 12 },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  pickerClose: { fontSize: 16, color: COLORS.muted, padding: 4 },
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
  summaryPillBirdies: { fontSize: 12, color: COLORS.lime, fontWeight: '600' },
  optionSub: { fontSize: 11, color: COLORS.dim, marginTop: 2 },
  labelOptional: { color: COLORS.dim, fontWeight: '400', textTransform: 'none' },
  commentBox: { borderBottomWidth: 0.5, borderBottomColor: COLORS.border, paddingVertical: 12 },
  commentInput: { fontSize: 14, color: COLORS.white, minHeight: 80, textAlignVertical: 'top' },
  commentCount: { fontSize: 10, color: COLORS.dim, textAlign: 'right', marginTop: 4 },
  toast: { position: 'absolute', bottom: 40, left: 24, right: 24, backgroundColor: '#1e2e0a', borderWidth: 1, borderColor: COLORS.lime, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  toastEmoji: { fontSize: 36 },
  toastTitle: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  toastSub: { fontSize: 12, color: COLORS.lime, marginTop: 2 },

  photosRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  photoThumb: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden' },
  photoThumbImg: { width: 72, height: 72 },
  photoRemove: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  photoRemoveText: { color: '#fff', fontSize: 14, lineHeight: 18, fontWeight: '700' },
  photoAddGroup: { flexDirection: 'row', gap: 8 },
  photoAdd: { width: 72, height: 72, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2 },
  photoAddIcon: { fontSize: 22, lineHeight: 26 },
  photoAddText: { fontSize: 10, color: COLORS.dim },
});
