import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, getDocs, updateDoc, doc } from 'firebase/firestore';
import type { GroupDoc, GroupMemberDoc, TournamentDoc, TournamentModality } from '../firebase/types';
import { createTournament, addParticipantToTournament } from '../services/tournaments';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#222', border2: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444',
};

const MODALIDADES = [
  { key: 'Stroke Play', icon: 'trophy-outline', desc: 'Gana el que menor score haga en la vuelta.' },
  { key: 'Stableford', icon: 'flag-outline', desc: 'Sumá puntos en cada hoyo. Gana el que más acumule.' },
  { key: 'Match Play', icon: 'people-outline', desc: 'Competencia hoyo a hoyo contra otro jugador o equipo.' },
] as const;

function groupInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const MAX_RONDAS = 8;

function Avatar({ initials, bg, color, size = 20 }: { initials: string; bg: string; color: string; size?: number }) {
  return (
    <View style={{ backgroundColor: bg, width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontSize: size * 0.4, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

function FieldButton({ value, placeholder, onPress }: { value: string | null; placeholder: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.dropdown, styles.fieldBtn]} onPress={onPress}>
      <Text style={[styles.fieldBtnText, !value && styles.fieldBtnPlaceholder]} numberOfLines={1}>
        {value ?? placeholder}
      </Text>
      <Ionicons name="chevron-down" size={16} color={COLORS.muted} />
    </TouchableOpacity>
  );
}

function LockedField({ value }: { value: string }) {
  return (
    <View style={[styles.dropdown, styles.fieldBtn, styles.fieldBtnLocked]}>
      <Text style={[styles.fieldBtnText, styles.textActive]} numberOfLines={1}>{value}</Text>
      <Ionicons name="lock-closed" size={14} color={COLORS.lime} />
    </View>
  );
}

// Popup centrado que se cierra al tocar afuera — usado por Modalidad, Grupo y la fecha de cada ronda.
function PickerPopup({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.popupOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.popupCard} onPress={() => {}}>
          <Text style={styles.popupTitle}>{title}</Text>
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function CreateTorneoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { firebaseUser, userDoc } = useAuth();
  const grupoFijoId: string | null = route.params?.grupoFijoId ?? null;
  const grupoFijoNombre: string | null = route.params?.grupoFijoNombre ?? null;
  const editing: TournamentDoc | null = route.params?.torneo ?? null;
  const grupoLocked = !!grupoFijoId || !!editing;
  const modalidadLocked = !!editing;

  const [misGrupos, setMisGrupos] = useState<GroupDoc[]>([]);
  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(collection(db, 'groups'), where('memberUids', 'array-contains', firebaseUser.uid));
    return onSnapshot(q, snap => setMisGrupos(snap.docs.map(d => ({ ...d.data(), id: d.id }) as GroupDoc)));
  }, [firebaseUser?.uid]);

  const [nombre, setNombre] = useState(editing?.name ?? '');
  const [modalidad, setModalidad] = useState<string | null>(editing?.modality ?? null);
  const [grupoId, setGrupoId] = useState<string | null>(editing ? editing.groupId : grupoFijoId);
  const [grupoNombre, setGrupoNombre] = useState<string | null>(editing ? editing.groupName : grupoFijoNombre);
  const [grupoOpen, setGrupoOpen] = useState(false);
  const [fechas, setFechas] = useState<(Date | null)[]>(
    editing && editing.roundDates.length > 0 ? editing.roundDates.map(d => d ? new Date(d) : null) : [null]
  );
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const canCreate = !!nombre.trim() && !!modalidad && !saving;

  const setRondas = (n: number) => {
    const next = Math.max(1, Math.min(MAX_RONDAS, n));
    setFechas(f => next > f.length ? [...f, ...Array(next - f.length).fill(null)] : f.slice(0, next));
  };
  const clearFecha = (i: number) => setFechas(f => f.map((x, idx) => idx === i ? null : x));
  const formatDate = (d: Date | null) =>
    d ? d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' }) : 'A definir';

  const onSubmit = async () => {
    if (!canCreate || !userDoc) return;
    setSaving(true);
    const isoFechas = fechas.map(f => f ? toIsoDate(f) : null);
    try {
      if (editing) {
        await updateDoc(doc(db, 'tournaments', editing.id), {
          name: nombre.trim(),
          roundDates: isoFechas,
        });
        navigation.replace('TorneoCreado', { nombreTorneo: nombre.trim(), kind: 'editado' });
        return;
      }

      const torneoId = await createTournament({
        name: nombre.trim(),
        modality: modalidad as TournamentModality,
        groupId: grupoId,
        groupName: grupoNombre,
        roundDates: isoFechas,
      }, userDoc);

      if (grupoId) {
        // Torneo de grupo: se suman automáticamente todos los miembros.
        const membersSnap = await getDocs(collection(db, 'groups', grupoId, 'members'));
        const miembros = membersSnap.docs.map(d => d.data() as GroupMemberDoc).filter(m => m.uid !== userDoc.uid);
        await Promise.all(miembros.map(m =>
          addParticipantToTournament(torneoId, nombre.trim(), { uid: m.uid, displayName: m.displayName, handicap: m.handicap }, userDoc.displayName)
        ));
        navigation.replace('TorneoCreado', { nombreTorneo: nombre.trim(), kind: 'creado', grupo: grupoNombre });
      } else {
        // navigate (no replace): si vuelve para atrás desde Invitar, el torneo ya existe pero se puede seguir editando.
        navigation.navigate('InvitarJugadores', { torneoId, nombreTorneo: nombre.trim() });
      }
    } catch {
      Alert.alert('Error', 'No pudimos guardar el torneo. Probá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editing ? 'Editar torneo' : 'Nuevo torneo'}</Text>
        <TouchableOpacity disabled={!canCreate} onPress={onSubmit}>
          {saving
            ? <ActivityIndicator size="small" color={COLORS.lime} />
            : <Text style={[styles.createBtn, !canCreate && { opacity: 0.3 }]}>{editing ? 'Guardar' : 'Crear'}</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: 60, gap: 20 }}>

        <View>
          <Text style={styles.label}>Nombre</Text>
          <View style={[styles.inputBox, { marginTop: 8 }]}>
            <TextInput
              style={styles.inputText}
              placeholder="Ej: Copa Julio"
              placeholderTextColor={COLORS.dim}
              value={nombre}
              onChangeText={setNombre}
            />
          </View>
        </View>

        <View>
          <Text style={styles.label}>Modalidad</Text>
          {modalidadLocked ? (
            <View style={{ marginTop: 8 }}>
              <LockedField value={modalidad ?? ''} />
            </View>
          ) : (
            <View style={styles.modalidadGrid}>
              {MODALIDADES.map(m => {
                const active = modalidad === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[styles.modalidadCard, active && styles.modalidadCardActive]}
                    onPress={() => setModalidad(m.key)}
                  >
                    {active && (
                      <View style={styles.modalidadCheck}>
                        <Ionicons name="checkmark" size={11} color="#0f0f0f" />
                      </View>
                    )}
                    <View style={[styles.modalidadIconWrap, active && styles.modalidadIconWrapActive]}>
                      <Ionicons name={m.icon} size={22} color={active ? COLORS.lime : COLORS.muted} />
                    </View>
                    <Text style={[styles.modalidadCardTitle, active && styles.textActive]}>{m.key}</Text>
                    <Text style={styles.modalidadCardDesc}>{m.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View>
          <Text style={styles.label}>
            Grupo {!grupoLocked && <Text style={styles.labelOptional}>(opcional)</Text>}
          </Text>
          <View style={{ marginTop: 8 }}>
            {grupoLocked ? (
              <LockedField value={grupoNombre ?? 'Abierto'} />
            ) : (
              <FieldButton value={grupoNombre ?? 'Abierto'} placeholder="Abierto" onPress={() => setGrupoOpen(true)} />
            )}
          </View>
        </View>

        <View>
          <View style={styles.roundsHeader}>
            <Text style={styles.label}>Cantidad de rondas</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setRondas(fechas.length - 1)} disabled={fechas.length <= 1} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="remove" size={16} color={fechas.length <= 1 ? COLORS.dim : COLORS.white} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{fechas.length}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setRondas(fechas.length + 1)} disabled={fechas.length >= MAX_RONDAS} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="add" size={16} color={fechas.length >= MAX_RONDAS ? COLORS.dim : COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.dropdown, { marginTop: 8 }]}>
            {fechas.map((f, i) => (
              <View key={i} style={[styles.rondaRow, i < fechas.length - 1 && styles.itemBorder]}>
                <Text style={styles.rondaLabel}>Ronda {i + 1}</Text>
                <TouchableOpacity style={styles.rondaDateBtn} onPress={() => setPickerIdx(i)}>
                  <Ionicons name="calendar-outline" size={13} color={f ? COLORS.lime : COLORS.dim} />
                  <Text style={[styles.rondaDateText, !f && styles.rondaDateTextEmpty]}>{formatDate(f)}</Text>
                </TouchableOpacity>
                {f && (
                  <TouchableOpacity onPress={() => clearFecha(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 8 }}>
                    <Ionicons name="close-circle" size={15} color={COLORS.dim} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          <Text style={styles.hint}>Si todavía no tenés la fecha, dejala «a definir» y la cargás más adelante.</Text>
        </View>
      </ScrollView>

      <PickerPopup visible={grupoOpen} title="Grupo" onClose={() => setGrupoOpen(false)}>
        <TouchableOpacity style={[styles.popupItem, styles.itemBorder]} onPress={() => { setGrupoId(null); setGrupoNombre(null); setGrupoOpen(false); }}>
          <View style={styles.popupIconWrap}>
            <Ionicons name="globe-outline" size={16} color={COLORS.muted} />
          </View>
          <Text style={[styles.popupItemText, { flex: 1 }, !grupoId && styles.textActive]}>Abierto</Text>
          {!grupoId && <Ionicons name="checkmark" size={18} color={COLORS.lime} />}
        </TouchableOpacity>
        {misGrupos.map((g, i) => (
          <TouchableOpacity
            key={g.id}
            style={[styles.popupItem, i < misGrupos.length - 1 && styles.itemBorder]}
            onPress={() => { setGrupoId(g.id); setGrupoNombre(g.name); setGrupoOpen(false); }}
          >
            <Avatar initials={groupInitials(g.name)} bg={COLORS.lime} color="#0f0f0f" size={28} />
            <Text style={[styles.popupItemText, { flex: 1 }, grupoId === g.id && styles.textActive]}>{g.name}</Text>
            {grupoId === g.id && <Ionicons name="checkmark" size={18} color={COLORS.lime} />}
          </TouchableOpacity>
        ))}
      </PickerPopup>

      {pickerIdx !== null && Platform.OS === 'ios' ? (
        <Modal transparent animationType="fade" onRequestClose={() => setPickerIdx(null)}>
          <TouchableOpacity style={styles.popupOverlay} activeOpacity={1} onPress={() => setPickerIdx(null)}>
            <TouchableOpacity activeOpacity={1} style={styles.popupCard} onPress={() => {}}>
              <Text style={styles.popupTitle}>Ronda {pickerIdx + 1}</Text>
              <DateTimePicker
                value={fechas[pickerIdx] ?? new Date()}
                mode="date"
                display="spinner"
                themeVariant="dark"
                onChange={(_, date) => {
                  if (date) setFechas(f => f.map((x, idx) => idx === pickerIdx ? date : x));
                }}
              />
              <TouchableOpacity style={styles.popupDoneBtn} onPress={() => setPickerIdx(null)}>
                <Text style={styles.popupDoneBtnText}>Listo</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : pickerIdx !== null && (
        <DateTimePicker
          value={fechas[pickerIdx] ?? new Date()}
          mode="date"
          display="default"
          onChange={(_, date) => {
            if (date) setFechas(f => f.map((x, idx) => idx === pickerIdx ? date : x));
            setPickerIdx(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  createBtn: { fontSize: 15, fontWeight: '700', color: COLORS.lime },

  label: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  labelOptional: { color: COLORS.dim, fontWeight: '400', textTransform: 'none' },

  inputBox: { backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border2, paddingHorizontal: 14 },
  inputText: { fontSize: 15, color: COLORS.white, paddingVertical: 14 },

  dropdown: { borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border2, overflow: 'hidden' },
  itemBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.border2 },

  fieldBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14, backgroundColor: COLORS.card },
  fieldBtnText: { flex: 1, fontSize: 15, color: COLORS.white, fontWeight: '600', marginRight: 8 },
  fieldBtnPlaceholder: { color: COLORS.dim, fontWeight: '400' },
  fieldBtnLocked: { backgroundColor: '#141f09', borderColor: COLORS.lime },

  textActive: { color: COLORS.lime },

  modalidadGrid: { flexDirection: 'row', gap: 8, marginTop: 8 },
  modalidadCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border2, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', gap: 6 },
  modalidadCardActive: { borderColor: COLORS.lime, backgroundColor: '#141f09' },
  modalidadCheck: { position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.lime, alignItems: 'center', justifyContent: 'center' },
  modalidadIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#242424', alignItems: 'center', justifyContent: 'center' },
  modalidadIconWrapActive: { backgroundColor: '#1a2a0a' },
  modalidadCardTitle: { fontSize: 12, fontWeight: '800', color: COLORS.white, textAlign: 'center' },
  modalidadCardDesc: { fontSize: 10, color: COLORS.dim, textAlign: 'center', lineHeight: 13 },

  roundsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 0.5, borderColor: COLORS.border2 },
  stepperBtn: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#242424' },
  stepperValue: { fontSize: 14, fontWeight: '800', color: COLORS.white, width: 16, textAlign: 'center' },

  rondaRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: COLORS.card },
  rondaLabel: { flex: 1, fontSize: 13, color: COLORS.muted, fontWeight: '600' },
  rondaDateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#242424' },
  rondaDateText: { fontSize: 13, color: COLORS.white, fontWeight: '600' },
  rondaDateTextEmpty: { color: COLORS.dim, fontWeight: '500', fontStyle: 'italic' },
  hint: { fontSize: 11, color: COLORS.dim, marginTop: 8, lineHeight: 15 },

  popupOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  popupCard: { width: '100%', maxWidth: 340, backgroundColor: '#161616', borderRadius: 16, borderWidth: 0.5, borderColor: COLORS.border2, overflow: 'hidden', paddingBottom: 8 },
  popupTitle: { fontSize: 13, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, padding: 16, paddingBottom: 10 },
  popupItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  popupItemText: { fontSize: 14, fontWeight: '600', color: COLORS.muted },
  popupItemDesc: { fontSize: 11, color: COLORS.dim, marginTop: 2 },
  popupIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#242424', alignItems: 'center', justifyContent: 'center' },
  popupDoneBtn: { margin: 12, marginTop: 0, backgroundColor: COLORS.lime, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  popupDoneBtnText: { fontSize: 14, fontWeight: '800', color: '#0f0f0f' },
});
