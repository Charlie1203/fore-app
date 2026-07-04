import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

const COLORS = {
  bg: '#0f0f0f', border: '#222', lime: '#c8e03a',
  white: '#f0f0f0', muted: '#666', dim: '#333',
};

const MODALIDADES = ['Stroke Play', 'Stableford', 'Match Play', 'Better Ball', 'Scramble'];
const GRUPOS = ['Sin grupo', 'Haras Santa María', 'Los del Jueves', 'Martindale CC'];

export default function CreateTorneoScreen() {
  const navigation = useNavigation<any>();
  const [nombre, setNombre] = useState('');
  const [modalidad, setModalidad] = useState<string | null>(null);
  const [grupo, setGrupo] = useState<string>('Sin grupo');
  const [fechas, setFechas] = useState<(Date | null)[]>([null]);
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);

  const canCreate = nombre.trim() && modalidad;

  const addFecha = () => { if (fechas.length < 4) setFechas(f => [...f, null]); };
  const removeFecha = (i: number) => setFechas(f => f.filter((_, idx) => idx !== i));
  const formatDate = (d: Date | null) =>
    d ? d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' }) : 'A definir';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo torneo</Text>
        <TouchableOpacity disabled={!canCreate} onPress={() => navigation.goBack()}>
          <Text style={[styles.createBtn, !canCreate && { opacity: 0.3 }]}>Crear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Nombre */}
        <TextInput
          style={styles.nameInput}
          placeholder="Nombre del torneo"
          placeholderTextColor={COLORS.muted}
          value={nombre}
          onChangeText={setNombre}
          autoFocus
        />

        {/* Modalidad */}
        <Text style={styles.sectionLabel}>MODALIDAD</Text>
        {MODALIDADES.map((m, i) => (
          <TouchableOpacity key={m} style={[styles.row, i === MODALIDADES.length - 1 && styles.rowLast]} onPress={() => setModalidad(m)}>
            <Text style={[styles.rowText, modalidad === m && styles.rowTextActive]}>{m}</Text>
            {modalidad === m && <Ionicons name="checkmark" size={18} color={COLORS.lime} />}
          </TouchableOpacity>
        ))}

        {/* Grupo */}
        <Text style={styles.sectionLabel}>GRUPO</Text>
        {GRUPOS.map((g, i) => (
          <TouchableOpacity key={g} style={[styles.row, i === GRUPOS.length - 1 && styles.rowLast]} onPress={() => setGrupo(g)}>
            <Text style={[styles.rowText, grupo === g && styles.rowTextActive]}>{g}</Text>
            {grupo === g && <Ionicons name="checkmark" size={18} color={COLORS.lime} />}
          </TouchableOpacity>
        ))}

        {/* Fechas */}
        <View style={styles.fechasHeader}>
          <Text style={styles.sectionLabel}>FECHAS</Text>
          {fechas.length < 4 && (
            <TouchableOpacity onPress={addFecha} style={styles.addBtn}>
              <Ionicons name="add" size={15} color={COLORS.lime} />
              <Text style={styles.addBtnText}>Agregar ronda</Text>
            </TouchableOpacity>
          )}
        </View>
        {fechas.map((f, i) => (
          <View key={i} style={[styles.row, i === fechas.length - 1 && styles.rowLast]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setPickerIdx(i)}>
              <Text style={styles.rowLabel}>Ronda {i + 1}</Text>
              <Text style={[styles.rowText, !f && { color: COLORS.muted }]}>{formatDate(f)}</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity onPress={() => setPickerIdx(i)}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.muted} />
              </TouchableOpacity>
              {fechas.length > 1 && (
                <TouchableOpacity onPress={() => removeFecha(i)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={18} color={COLORS.muted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {pickerIdx !== null && (
          <DateTimePicker
            value={fechas[pickerIdx] ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              if (date) setFechas(f => f.map((x, idx) => idx === pickerIdx ? date : x));
              setPickerIdx(null);
            }}
          />
        )}
      </ScrollView>
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
  nameInput: {
    fontSize: 22, fontWeight: '700', color: COLORS.white,
    paddingHorizontal: 18, paddingVertical: 20,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.muted, letterSpacing: 0.8,
    paddingHorizontal: 18, paddingTop: 24, paddingBottom: 8,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 11, color: COLORS.muted, marginBottom: 2 },
  rowText: { fontSize: 15, color: COLORS.white },
  rowTextActive: { color: COLORS.lime, fontWeight: '600' },
  fechasHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingRight: 18,
  },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 24, paddingBottom: 8 },
  addBtnText: { fontSize: 13, color: COLORS.lime },
});
