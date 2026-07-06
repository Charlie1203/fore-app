import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#222', border2: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444',
};

// Mock: gente que el usuario podría invitar (mismos jugadores que en SearchScreen)
const JUGADORES = [
  { id: '1', nombre: 'Pepe Noceti', username: '@peponoceti', initials: 'PE', bg: '#333', color: '#c8e03a', hcp: 7.3 },
  { id: '2', nombre: 'Carlitos Laprida', username: '@carlitoslaprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', hcp: 15.1 },
  { id: '3', nombre: 'Manu Rivero', username: '@manurivero', initials: 'MR', bg: '#3a2a1a', color: '#e0a03a', hcp: 9.8 },
  { id: '4', nombre: 'Sofía Lagos', username: '@sofilagos', initials: 'SL', bg: '#1a2a3a', color: '#5fa0e0', hcp: 18.4 },
  { id: '5', nombre: 'Tomás Bidegain', username: '@tomibide', initials: 'TB', bg: '#2a1a3a', color: '#b070e0', hcp: 11.2 },
];

function Avatar({ initials, bg, color, size = 42 }: { initials: string; bg: string; color: string; size?: number }) {
  return (
    <View style={{ backgroundColor: bg, width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontSize: size * 0.36, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

export default function InvitarJugadoresScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const nombreTorneo: string = route.params?.nombreTorneo ?? 'tu torneo';
  // standalone = se abrió desde el detalle de un torneo ya creado, no desde el flujo de creación.
  const standalone: boolean = route.params?.standalone ?? false;
  const [search, setSearch] = useState('');
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  const toggle = (id: string) => setSeleccionados(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const q = search.toLowerCase();
  const filtrados = JUGADORES.filter(j => j.nombre.toLowerCase().includes(q) || j.username.toLowerCase().includes(q));

  // Mock: no hay backend todavía, así que "invitar" y "omitir/cancelar" solo pasan a la confirmación.
  const finalizar = () => {
    if (standalone) {
      if (seleccionados.length === 0) { navigation.goBack(); return; }
      navigation.replace('TorneoCreado', { nombreTorneo, kind: 'invitados', invitados: seleccionados.length });
    } else {
      navigation.replace('TorneoCreado', { nombreTorneo, kind: 'creado', invitados: seleccionados.length });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Invitar jugadores</Text>
          <Text style={styles.headerSub} numberOfLines={1}>a {nombreTorneo}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={COLORS.dim} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o @usuario..."
          placeholderTextColor={COLORS.dim}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={COLORS.dim} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {filtrados.map((j, i) => {
          const active = seleccionados.includes(j.id);
          return (
            <TouchableOpacity key={j.id} style={[styles.row, i < filtrados.length - 1 && styles.rowBorder]} onPress={() => toggle(j.id)}>
              <Avatar initials={j.initials} bg={j.bg} color={j.color} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{j.nombre}</Text>
                <Text style={styles.rowSub}>{j.username} · HCP {j.hcp}</Text>
              </View>
              <View style={[styles.checkbox, active && styles.checkboxActive]}>
                {active && <Ionicons name="checkmark" size={14} color="#0f0f0f" />}
              </View>
            </TouchableOpacity>
          );
        })}
        {filtrados.length === 0 && (
          <Text style={styles.emptyText}>Sin resultados para "{search}"</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={finalizar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.skipText}>{standalone ? 'Cancelar' : 'Omitir por ahora'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.inviteBtn, seleccionados.length === 0 && { opacity: 0.4 }]}
          onPress={finalizar}
          disabled={seleccionados.length === 0}
        >
          <Text style={styles.inviteBtnText}>Invitar{seleccionados.length > 0 ? ` (${seleccionados.length})` : ''}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  headerSub: { fontSize: 12, color: COLORS.muted, marginTop: 1 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 18, marginTop: 14, marginBottom: 4,
    backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border2,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.white },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  rowSub: { fontSize: 12, color: COLORS.muted, marginTop: 1 },
  emptyText: { textAlign: 'center', color: COLORS.muted, fontSize: 13, marginTop: 40 },

  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: COLORS.border2, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: COLORS.lime, borderColor: COLORS.lime },

  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14, paddingBottom: 24,
    borderTopWidth: 0.5, borderTopColor: COLORS.border,
  },
  skipText: { fontSize: 14, color: COLORS.muted, fontWeight: '600' },
  inviteBtn: { backgroundColor: COLORS.lime, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 12 },
  inviteBtnText: { fontSize: 14, fontWeight: '800', color: '#0f0f0f' },
});
