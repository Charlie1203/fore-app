import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createGroup, updateGroupName } from '../services/groups';
import type { GroupDoc } from '../firebase/types';

const COLORS = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#222', border2: '#2a2a2a',
  lime: '#c8e03a', white: '#f0f0f0', muted: '#666', dim: '#444',
};

export default function CreateGrupoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { userDoc } = useAuth();
  const editing: GroupDoc | null = route.params?.group ?? null;
  const [nombre, setNombre] = useState(editing?.name ?? '');
  const [saving, setSaving] = useState(false);

  const canCreate = nombre.trim().length > 0 && !saving;

  const handleCreate = async () => {
    if (!canCreate || !userDoc) return;
    setSaving(true);
    try {
      if (editing) {
        await updateGroupName(editing.id, nombre.trim());
        navigation.goBack();
        return;
      }
      const groupId = await createGroup(nombre.trim(), userDoc);
      // replace: si vuelve atrás desde "agregar gente", el grupo ya quedó creado.
      navigation.replace('AgregarMiembros', { groupId, groupName: nombre.trim(), fromCreate: true });
    } catch {
      Alert.alert('Error', editing ? 'No se pudo guardar el cambio. Probá de nuevo.' : 'No se pudo crear el grupo. Probá de nuevo.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editing ? 'Editar grupo' : 'Nuevo grupo'}</Text>
        <TouchableOpacity disabled={!canCreate} onPress={handleCreate}>
          {saving
            ? <ActivityIndicator size="small" color={COLORS.lime} />
            : <Text style={[styles.createBtn, !canCreate && { opacity: 0.3 }]}>{editing ? 'Guardar' : 'Crear'}</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={{ padding: 18, gap: 20 }}>
        <View>
          <Text style={styles.label}>Nombre del grupo</Text>
          <View style={[styles.inputBox, { marginTop: 8 }]}>
            <TextInput
              style={styles.inputText}
              placeholder="Ej: Los del Jueves"
              placeholderTextColor={COLORS.dim}
              value={nombre}
              onChangeText={setNombre}
              maxLength={40}
            />
          </View>
          <Text style={styles.hint}>Después de crearlo vas a poder agregar a tus amigos.</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.lime} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Grupo privado</Text>
            <Text style={styles.infoDesc}>Solo los participantes ven la actividad. Vos sos el admin y decidís quién entra.</Text>
          </View>
        </View>
      </View>
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
  inputBox: { backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border2, paddingHorizontal: 14 },
  inputText: { fontSize: 15, color: COLORS.white, paddingVertical: 14 },
  hint: { fontSize: 11, color: COLORS.dim, marginTop: 8, lineHeight: 15 },

  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#141f09', borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(200,224,58,0.25)' },
  infoIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1a2a0a', alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  infoDesc: { fontSize: 12, color: COLORS.muted, marginTop: 2, lineHeight: 16 },
});
