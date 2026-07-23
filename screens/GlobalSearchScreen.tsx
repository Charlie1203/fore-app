import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, getDocs, limit, query as fbQuery } from 'firebase/firestore';
import type { UserDoc } from '../firebase/types';

const COLORS = {
  bg: '#0f0f0f',
  card: '#1a1a1a',
  border: '#2a2a2a',
  lime: '#c8e03a',
  white: '#f0f0f0',
  muted: '#666',
  dim: '#444',
};

function initialsOf(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

export default function GlobalSearchScreen() {
  const navigation = useNavigation<any>();
  const { firebaseUser } = useAuth();
  const [query, setQuery] = useState('');
  const [usuarios, setUsuarios] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(fbQuery(collection(db, 'users'), limit(50)))
      .then(snap => setUsuarios(snap.docs.map(d => d.data() as UserDoc)))
      .finally(() => setLoading(false));
  }, []);

  const otros = usuarios.filter(u => u.uid !== firebaseUser?.uid);

  const filteredUsers = query.length > 0
    ? otros.filter(u =>
        u.displayName.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase())
      )
    : otros;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header con input */}
      <View style={styles.header}>
        <View style={styles.inputRow}>
          <Ionicons name="search-outline" size={16} color={COLORS.muted} />
          <TextInput
            autoFocus
            placeholder="Buscar jugadores o grupos..."
            placeholderTextColor={COLORS.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.input}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtn}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.lime} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {filteredUsers.length > 0 ? (
                <>
                  <Text style={styles.sectionLabel}>{query.length > 0 ? 'JUGADORES' : 'TODOS'}</Text>
                  {filteredUsers.map(u => {
                    const initials = initialsOf(u.displayName);
                    return (
                      <TouchableOpacity
                        key={u.uid}
                        style={styles.row}
                        onPress={() => navigation.navigate('PerfilUsuario', { viewUser: { name: u.displayName, initials, bg: COLORS.lime, color: '#0f0f0f', handicap: u.handicap ?? undefined } })}
                      >
                        <View style={[styles.avatar, { backgroundColor: COLORS.lime }]}>
                          <Text style={[styles.avatarText, { color: '#0f0f0f' }]}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rowName}>{u.displayName}</Text>
                          <Text style={styles.rowSub}>@{u.username}{u.handicap != null ? ` · HCP ${u.handicap}` : ''}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
                      </TouchableOpacity>
                    );
                  })}
                </>
              ) : (
                <Text style={styles.empty}>
                  {query.length > 0 ? `Sin resultados para "${query}"` : 'Todavía no hay más jugadores registrados.'}
                </Text>
              )}
            </>
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  input: { flex: 1, color: COLORS.white, fontSize: 14 },
  cancelBtn: { color: COLORS.lime, fontSize: 14 },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.lime, fontWeight: '700', fontSize: 14 },
  rowName: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  rowSub: { color: COLORS.muted, fontSize: 12, marginTop: 1 },
  empty: { color: COLORS.muted, fontSize: 14, textAlign: 'center', marginTop: 60 },
});
