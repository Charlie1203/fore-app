import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', lime: '#c8e03a', white: '#f0f0f0', muted: '#666',
};

type Kind = 'creado' | 'editado' | 'invitados';

export default function TorneoCreadoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const nombreTorneo: string = route.params?.nombreTorneo ?? 'Tu torneo';
  const kind: Kind = route.params?.kind ?? 'creado';
  const grupo: string | null = route.params?.grupo ?? null;
  const invitados: number = route.params?.invitados ?? 0;

  const title = kind === 'editado' ? '¡Cambios guardados!' : kind === 'invitados' ? '¡Invitaciones enviadas!' : '¡Torneo creado!';

  const subtitle = kind === 'editado'
    ? `${nombreTorneo} se actualizó correctamente.`
    : kind === 'invitados'
      ? `Invitaste a ${invitados} ${invitados === 1 ? 'jugador' : 'jugadores'} a ${nombreTorneo}.`
      : `${nombreTorneo} ya está listo.\n${
          grupo
            ? `Ya aparece en la pestaña Torneos de ${grupo} para que cada uno se sume.`
            : invitados > 0
              ? `Invitaste a ${invitados} ${invitados === 1 ? 'jugador' : 'jugadores'}.`
              : 'Podés invitar jugadores más tarde desde el torneo.'
        }`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={40} color="#0f0f0f" />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.popToTop()}>
        <Text style={styles.doneBtnText}>Ver torneos</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'space-between', padding: 24 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  checkCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: COLORS.lime, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  subtitle: { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 20 },
  doneBtn: { backgroundColor: COLORS.lime, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  doneBtnText: { fontSize: 15, fontWeight: '800', color: '#0f0f0f' },
});
