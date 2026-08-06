import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, getDocs, documentId } from 'firebase/firestore';
import type { FollowDoc, UserDoc } from '../firebase/types';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444',
};

type Mode = 'followers' | 'following';

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

export default function FollowListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { firebaseUser } = useAuth();
  const uid: string = route.params.uid;
  const mode: Mode = route.params.mode;
  const title: string = route.params.title ?? (mode === 'followers' ? 'Seguidores' : 'Siguiendo');

  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const field = mode === 'followers' ? 'followingUid' : 'followerUid';
    const q = query(collection(db, 'follows'), where(field, '==', uid));
    // Los uids de follows no traen nombre — se busca el UserDoc real de cada uno
    // para no mostrar nunca un nombre viejo si la persona lo cambió después.
    const unsubscribe = onSnapshot(q, async snap => {
      const otherField = mode === 'followers' ? 'followerUid' : 'followingUid';
      const uids = snap.docs.map(d => (d.data() as FollowDoc)[otherField]).slice(0, 30);
      if (uids.length === 0) { setUsers([]); setLoading(false); return; }
      const usersSnap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', uids)));
      setUsers(usersSnap.docs.map(d => d.data() as UserDoc));
      setLoading(false);
    }, () => setLoading(false));
    return unsubscribe;
  }, [uid, mode]);

  const abrirPerfil = (u: UserDoc) => {
    if (u.uid === firebaseUser?.uid) {
      navigation.navigate('Tabs', { screen: 'Perfil' });
    } else {
      navigation.navigate('PerfilUsuario', { viewUser: { uid: u.uid, name: u.displayName, initials: initialsOf(u.displayName), bg: COLORS.lime, color: '#0f0f0f', handicap: u.handicap ?? undefined } });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.lime} style={{ marginTop: 48 }} />
      ) : users.length === 0 ? (
        <Text style={styles.empty}>
          {mode === 'followers' ? 'Todavía no tiene seguidores.' : 'Todavía no sigue a nadie.'}
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {users.map(u => (
            <TouchableOpacity key={u.uid} style={styles.row} onPress={() => abrirPerfil(u)}>
              <Avatar initials={initialsOf(u.displayName)} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowName} numberOfLines={1}>{u.displayName}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>@{u.username}{u.handicap != null ? ` · HCP ${u.handicap}` : ''}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  empty: { textAlign: 'center', color: COLORS.muted, fontSize: 13, marginTop: 48 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  rowName: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  rowSub: { fontSize: 12, color: COLORS.muted, marginTop: 1 },
});
