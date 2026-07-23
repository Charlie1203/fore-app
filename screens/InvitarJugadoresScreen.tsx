import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import type { UserDoc } from '../firebase/types';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#222', border2: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444',
};

function initialsOf(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function Avatar({ initials, size = 42 }: { initials: string; size?: number }) {
  return (
    <View style={{ backgroundColor: COLORS.lime, width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#0f0f0f', fontSize: size * 0.36, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

export default function InvitarJugadoresScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { firebaseUser } = useAuth();
  const nombreTorneo: string = route.params?.nombreTorneo ?? 'tu torneo';
  // standalone = se abrió desde el detalle de un torneo ya creado, no desde el flujo de creación.
  const standalone: boolean = route.params?.standalone ?? false;
  const [search, setSearch] = useState('');
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [usuarios, setUsuarios] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'users'), limit(50)))
      .then(snap => setUsuarios(snap.docs.map(d => d.data() as UserDoc)))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (uid: string) => setSeleccionados(s => s.includes(uid) ? s.filter(x => x !== uid) : [...s, uid]);

  const q = search.toLowerCase();
  const filtrados = usuarios.filter(u =>
    u.uid !== firebaseUser?.uid &&
    (u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
  );

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
        {loading ? (
          <ActivityIndicator color={COLORS.lime} style={{ marginTop: 48 }} />
        ) : filtrados.length === 0 ? (
          <Text style={styles.emptyText}>
            {search.length > 0 ? `Sin resultados para "${search}"` : 'No hay más jugadores para invitar.'}
          </Text>
        ) : filtrados.map((u, i) => {
          const active = seleccionados.includes(u.uid);
          const initials = initialsOf(u.displayName);
          return (
            <TouchableOpacity key={u.uid} style={[styles.row, i < filtrados.length - 1 && styles.rowBorder]} onPress={() => toggle(u.uid)}>
              <Avatar initials={initials} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{u.displayName}</Text>
                <Text style={styles.rowSub}>@{u.username}{u.handicap != null ? ` · HCP ${u.handicap}` : ''}</Text>
              </View>
              <View style={[styles.checkbox, active && styles.checkboxActive]}>
                {active && <Ionicons name="checkmark" size={14} color="#0f0f0f" />}
              </View>
            </TouchableOpacity>
          );
        })}
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
