import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { TournamentDoc } from '../firebase/types';
import { estadoDeTorneo, rondaActualDeTorneo } from '../services/tournaments';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444', dark2: '#242424',
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function formatFechaTorneo(roundDates: (string | null)[]): string {
  const fechas = roundDates.filter((d): d is string => !!d).map(d => new Date(d));
  if (fechas.length === 0) return 'A definir';
  const primera = fechas.sort((a, b) => a.getTime() - b.getTime())[0];
  return `${MESES[primera.getMonth()]} ${primera.getFullYear()}`;
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function TorneoRow({ torneo, onPress }: { torneo: TournamentDoc; onPress: () => void }) {
  const estado = estadoDeTorneo(torneo.roundDates);
  const dotColor = estado === 'en curso' ? COLORS.lime : COLORS.dim;
  return (
    <TouchableOpacity style={styles.torneoRow} onPress={onPress}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.torneoNombre}>{torneo.name}</Text>
        <Text style={styles.torneoMeta}>
          {torneo.modality} · {formatFechaTorneo(torneo.roundDates)}{torneo.groupName ? ` · ${torneo.groupName}` : ' · Abierto'}
        </Text>
        {estado === 'en curso' && (
          <Text style={[styles.torneoMeta, { color: COLORS.lime, marginTop: 2 }]}>
            Ronda {rondaActualDeTorneo(torneo.roundDates)}/{torneo.roundDates.length} en curso
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TorneosScreen() {
  const navigation = useNavigation<any>();
  const { firebaseUser } = useAuth();
  const [torneos, setTorneos] = useState<TournamentDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(collection(db, 'tournaments'), where('participantUids', 'array-contains', firebaseUser.uid));
    return onSnapshot(q, snap => {
      setTorneos(snap.docs.map(d => ({ ...d.data(), id: d.id }) as TournamentDoc));
      setLoading(false);
    }, () => setLoading(false));
  }, [firebaseUser?.uid]);

  const proximos = torneos.filter(t => estadoDeTorneo(t.roundDates) === 'próximo');
  const enCurso = torneos.filter(t => estadoDeTorneo(t.roundDates) === 'en curso');
  const finalizados = torneos.filter(t => estadoDeTorneo(t.roundDates) === 'finalizado');

  const abrir = (torneo: TournamentDoc) => navigation.navigate('TorneoDetail', { torneoId: torneo.id });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Torneos</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateTorneo')}>
          <Ionicons name="add" size={26} color={COLORS.lime} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.lime} style={{ marginTop: 48 }} />
      ) : torneos.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="trophy-outline" size={40} color={COLORS.dim} />
          <Text style={styles.emptyTitle}>Todavía no tenés torneos</Text>
          <Text style={styles.emptyText}>Creá uno o esperá a que te inviten a alguno.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {enCurso.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>En curso</Text>
              {enCurso.map(t => <TorneoRow key={t.id} torneo={t} onPress={() => abrir(t)} />)}
            </>
          )}
          {proximos.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Próximos</Text>
              {proximos.map(t => <TorneoRow key={t.id} torneo={t} onPress={() => abrir(t)} />)}
            </>
          )}
          {finalizados.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Finalizados</Text>
              {finalizados.map(t => <TorneoRow key={t.id} torneo={t} onPress={() => abrir(t)} />)}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  sectionTitle: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white, marginTop: 4 },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 18 },

  torneoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  torneoNombre: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  torneoMeta: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  torneoGanador: { fontSize: 12, color: COLORS.muted, marginTop: 3 },
});
