import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { FollowDoc } from '../firebase/types';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444',
};

type Mode = 'followers' | 'following';

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

  const [follows, setFollows] = useState<FollowDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const field = mode === 'followers' ? 'followingUid' : 'followerUid';
    const q = query(collection(db, 'follows'), where(field, '==', uid));
    return onSnapshot(q, snap => {
      setFollows(snap.docs.map(d => d.data() as FollowDoc));
      setLoading(false);
    }, () => setLoading(false));
  }, [uid, mode]);

  const abrirPerfil = (rowUid: string, name: string, initials: string) => {
    if (rowUid === firebaseUser?.uid) {
      navigation.navigate('Tabs', { screen: 'Perfil' });
    } else {
      navigation.navigate('PerfilUsuario', { viewUser: { uid: rowUid, name, initials, bg: COLORS.lime, color: '#0f0f0f' } });
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
      ) : follows.length === 0 ? (
        <Text style={styles.empty}>
          {mode === 'followers' ? 'Todavía no tiene seguidores.' : 'Todavía no sigue a nadie.'}
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {follows.map(f => {
            const rowUid = mode === 'followers' ? f.followerUid : f.followingUid;
            const name = mode === 'followers' ? f.followerName : f.followingName;
            const initials = mode === 'followers' ? f.followerInitials : f.followingInitials;
            return (
              <TouchableOpacity key={rowUid} style={styles.row} onPress={() => abrirPerfil(rowUid, name, initials)}>
                <Avatar initials={initials} />
                <Text style={styles.rowName}>{name}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
              </TouchableOpacity>
            );
          })}
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
  rowName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.white },
});
