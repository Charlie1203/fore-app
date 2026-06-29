import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { useState } from 'react';

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

function Step1({ onNext }: { onNext: (club: string, course: string) => void }) {
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = CLUBS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const clubData = CLUBS.find(c => c.name === selectedClub);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepTitle}>¿Dónde jugaste?</Text>

      <Text style={styles.label}>Club</Text>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar club..."
          placeholderTextColor={COLORS.dim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.optionList}>
        {filtered.map(c => (
          <TouchableOpacity
            key={c.name}
            style={[styles.option, selectedClub === c.name && styles.optionSelected]}
            onPress={() => { setSelectedClub(c.name); setSelectedCourse(null); }}
          >
            <Text style={[styles.optionText, selectedClub === c.name && styles.optionTextSelected]}>
              {c.name}
            </Text>
            {selectedClub === c.name && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {clubData && (
        <>
          <Text style={[styles.label, { marginTop: 20 }]}>Cancha</Text>
          <View style={styles.optionList}>
            {clubData.courses.map(course => (
              <TouchableOpacity
                key={course}
                style={[styles.option, selectedCourse === course && styles.optionSelected]}
                onPress={() => setSelectedCourse(course)}
              >
                <Text style={[styles.optionText, selectedCourse === course && styles.optionTextSelected]}>
                  {course}
                </Text>
                {selectedCourse === course && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {selectedClub && selectedCourse && (
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => onNext(selectedClub, selectedCourse)}
        >
          <Text style={styles.nextBtnText}>Cargar tarjeta →</Text>
        </TouchableOpacity>
      )}
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

function Step2({ club, course, onPublish }: { club: string; course: string; onPublish: () => void }) {
  const [scores, setScores] = useState(DEFAULT_PARS.map(p => p));

  const inc = (i: number) => setScores(s => s.map((v, idx) => idx === i ? v + 1 : v));
  const dec = (i: number) => setScores(s => s.map((v, idx) => idx === i ? Math.max(1, v - 1) : v));

  const totalScore = scores.reduce((a, b) => a + b, 0);
  const totalPar = DEFAULT_PARS.reduce((a, b) => a + b, 0);
  const vsPar = totalScore - totalPar;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <View style={styles.coursePill}>
        <Text style={styles.coursePillText}>📍 {club} · {course}</Text>
      </View>

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
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={[styles.totalVal, { color: COLORS.lime }]}>
            {scores.filter((s, i) => s - DEFAULT_PARS[i] === -1).length}
          </Text>
          <Text style={styles.totalLbl}>Birdies</Text>
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

      <TouchableOpacity style={styles.nextBtn} onPress={onPublish}>
        <Text style={styles.nextBtnText}>Publicar vuelta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SuccessScreen({ onReset }: { onReset: () => void }) {
  return (
    <View style={styles.successContainer}>
      <Text style={{ fontSize: 56 }}>🏌️</Text>
      <Text style={styles.successTitle}>¡Vuelta publicada!</Text>
      <Text style={styles.successSub}>Ya aparece en el feed de tus amigos</Text>
      <TouchableOpacity style={styles.nextBtn} onPress={onReset}>
        <Text style={styles.nextBtnText}>Cargar otra vuelta</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function UploadScreen() {
  const [step, setStep] = useState(1);
  const [club, setClub] = useState('');
  const [course, setCourse] = useState('');

  const handleNext = (c: string, cr: string) => { setClub(c); setCourse(cr); setStep(2); };
  const handlePublish = () => setStep(3);
  const handleReset = () => { setStep(1); setClub(''); setCourse(''); };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {step > 1 && step < 3 && (
          <TouchableOpacity onPress={() => setStep(step - 1)}>
            <Text style={styles.backBtn}>← Atrás</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Cargar vuelta</Text>
        {step < 3 && <StepIndicator step={step} />}
      </View>

      {step === 1 && <Step1 onNext={handleNext} />}
      {step === 2 && <Step2 club={club} course={course} onPublish={handlePublish} />}
      {step === 3 && <SuccessScreen onReset={handleReset} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8, gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  backBtn: { fontSize: 14, color: COLORS.lime },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.dim },
  stepDotActive: { backgroundColor: COLORS.lime },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.dim, maxWidth: 40 },
  stepLineActive: { backgroundColor: COLORS.lime },
  stepContent: { paddingHorizontal: 18, paddingBottom: 40 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 20 },
  label: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  searchBox: { backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border, marginBottom: 10 },
  searchInput: { padding: 12, fontSize: 14, color: COLORS.white },
  optionList: { gap: 6 },
  option: { backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionSelected: { borderColor: COLORS.lime, backgroundColor: '#1a2a0a' },
  optionText: { fontSize: 14, color: COLORS.muted },
  optionTextSelected: { color: COLORS.lime, fontWeight: '600' },
  checkmark: { color: COLORS.lime, fontSize: 16, fontWeight: '700' },
  nextBtn: { backgroundColor: COLORS.lime, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: '#0f0f0f' },
  coursePill: { backgroundColor: COLORS.dark2, borderRadius: 8, padding: 10, marginBottom: 16, alignSelf: 'flex-start' },
  coursePillText: { fontSize: 12, color: COLORS.muted },
  totalBox: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.border, padding: 16, marginBottom: 20 },
  totalItem: { flex: 1, alignItems: 'center' },
  totalVal: { fontSize: 26, fontWeight: '800', color: COLORS.white },
  totalLbl: { fontSize: 10, color: COLORS.muted, marginTop: 2 },
  totalDivider: { width: 0.5, backgroundColor: COLORS.border },
  holeGroup: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden' },
  holeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  holeInfo: { gap: 2 },
  holeNumText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  holeParText: { fontSize: 11, color: COLORS.dim },
  holeControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.dark2, alignItems: 'center', justifyContent: 'center' },
  controlBtnText: { fontSize: 20, color: COLORS.white, lineHeight: 24 },
  scoreBox: { width: 48, alignItems: 'center' },
  scoreText: { fontSize: 20, fontWeight: '800' },
  diffText: { fontSize: 10, fontWeight: '600' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  successSub: { fontSize: 14, color: COLORS.muted, textAlign: 'center' },
});
