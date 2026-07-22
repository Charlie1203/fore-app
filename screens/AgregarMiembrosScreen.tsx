import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, limit, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { addMemberToGroup } from '../services/groups';
import type { UserDoc, GroupDoc } from '../firebase/types';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#222', border2: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444',
};

function initialsOf(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

export default function AgregarMiembrosScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { firebaseUser, userDoc } = useAuth();
  const groupId: string = route.params.groupId;
  const groupName: string = route.params?.groupName ?? 'el grupo';
  const fromCreate: boolean = route.params?.fromCreate ?? false;

  const [search, setSearch] = useState('');
  const [usuarios, setUsuarios] = useState<UserDoc[]>([]);
  const [memberUids, setMemberUids] = useState<string[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Usuarios registrados (hasta 50 por ahora; con más gente esto pasa a búsqueda por prefijo).
  useEffect(() => {
    getDocs(query(collection(db, 'users'), limit(50)))
      .then(snap => setUsuarios(snap.docs.map(d => d.data() as UserDoc)))
      .catch(() => Alert.alert('Error', 'No se pudieron cargar los jugadores.'))
      .finally(() => setLoading(false));
  }, []);

  // Miembros actuales del grupo, para no ofrecer agregar a quien ya está.
  useEffect(() => {
    return onSnapshot(doc(db, 'groups', groupId), snap => {
      const data = snap.data() as GroupDoc | undefined;
      setMemberUids(data?.memberUids ?? []);
    });
  }, [groupId]);

  const toggle = (uid: string) =>
    setSeleccionados(s => s.includes(uid) ? s.filter(x => x !== uid) : [...s, uid]);

  const q = search.toLowerCase();
  const candidatos = usuarios.filter(u =>
    u.uid !== firebaseUser?.uid &&
    !memberUids.includes(u.uid) &&
    (u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
  );

  const salir = () => fromCreate ? navigation.popToTop() : navigation.goBack();

  const agregar = async () => {
    if (seleccionados.length === 0 || !userDoc || saving) return;
    setSaving(true);
    try {
      const elegidos = usuarios.filter(u => seleccionados.includes(u.uid));
      await Promise.all(elegidos.map(u =>
        addMemberToGroup(groupId, groupName, { uid: u.uid, displayName: u.displayName, handicap: u.handicap }, userDoc.displayName)
      ));
      Alert.alert(
        '¡Listo!',
        `${elegidos.length === 1 ? `${elegidos[0].displayName} ya es parte` : `${elegidos.length} jugadores ya son parte`} de ${groupName}.`,
        [{ text: 'OK', onPress: salir }],
      );
    } catch {
      Alert.alert('Error', 'No se pudo agregar a todos. Probá de nuevo.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Agregar participantes</Text>
          <Text style={styles.headerSub} numberOfLines={1}>a {groupName}</Text>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {loading ? (
          <ActivityIndicator color={COLORS.lime} style={{ marginTop: 48 }} />
        ) : candidatos.length === 0 ? (
          <Text style={styles.emptyText}>
            {search.length > 0 ? `Sin resultados para "${search}"` : 'No hay más jugadores para agregar.'}
          </Text>
        ) : candidatos.map((u, i) => {
          const active = seleccionados.includes(u.uid);
          const initials = initialsOf(u.displayName);
          return (
            <TouchableOpacity key={u.uid} style={[styles.row, i < candidatos.length - 1 && styles.rowBorder]} onPress={() => toggle(u.uid)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
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
        <TouchableOpacity onPress={salir} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.skipText}>{fromCreate ? 'Omitir por ahora' : 'Cancelar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addBtn, (seleccionados.length === 0 || saving) && { opacity: 0.4 }]}
          onPress={agregar}
          disabled={seleccionados.length === 0 || saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#0f0f0f" />
            : <Text style={styles.addBtnText}>Agregar{seleccionados.length > 0 ? ` (${seleccionados.length})` : ''}</Text>
          }
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
  emptyText: { textAlign: 'center', color: COLORS.muted, fontSize: 13, marginTop: 40, paddingHorizontal: 32 },

  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.lime, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0f0f0f', fontWeight: '700', fontSize: 14 },

  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: COLORS.border2, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: COLORS.lime, borderColor: COLORS.lime },

  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14, paddingBottom: 24,
    borderTopWidth: 0.5, borderTopColor: COLORS.border,
  },
  skipText: { fontSize: 14, color: COLORS.muted, fontWeight: '600' },
  addBtn: { backgroundColor: COLORS.lime, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 12, minWidth: 110, alignItems: 'center' },
  addBtnText: { fontSize: 14, fontWeight: '800', color: '#0f0f0f' },
});
