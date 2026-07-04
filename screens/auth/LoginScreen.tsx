import { useState } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AuthTextInput from '../../components/AuthTextInput';
import { loginWithEmail, mapAuthError } from '../../services/auth';
import { getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const COLORS = {
	bg: '#0f0f0f',
	card: '#1a1a1a',
	border: '#2a2a2a',
	lime: '#c8e03a',
	white: '#f0f0f0',
	muted: '#666',
	red: '#e07070',
};

async function resolveEmail(input: string): Promise<string> {
	// Si tiene @ en el medio es un email, si no es un username
	if (input.includes('@') && input.indexOf('@') > 0) return input;
	// Buscar el email asociado al username
	const username = input.replace(/^@/, '').toLowerCase();
	const snap = await getDocs(query(collection(db, 'users'), where('username', '==', username)));
	if (snap.empty) throw { code: 'auth/user-not-found' };
	return snap.docs[0].data().email as string;
}

export default function LoginScreen() {
	const navigation = useNavigation<any>();
	const [identifier, setIdentifier] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleLogin = async () => {
		if (!identifier || !password) {
			setError('Completá usuario/email y contraseña.');
			return;
		}
		setError(null);
		setLoading(true);
		try {
			const email = await resolveEmail(identifier.trim());
			await loginWithEmail(email, password);
		} catch (e: any) {
			setError(mapAuthError(e.code));
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
					<View style={styles.badge}>
						<Text style={styles.badgeEmoji}>⛳</Text>
					</View>
					<Text style={styles.logo}>
						FORE<Text style={{ color: COLORS.lime }}>!</Text>
					</Text>
					<Text style={styles.subtitle}>Iniciá sesión para seguir jugando</Text>

					<View style={styles.form}>
						<AuthTextInput
							icon="person-outline"
							placeholder="Email o @usuario"
							autoCapitalize="none"
							keyboardType="email-address"
							value={identifier}
							onChangeText={setIdentifier}
						/>
						<AuthTextInput
							icon="lock-closed-outline"
							placeholder="Contraseña"
							isPassword
							value={password}
							onChangeText={setPassword}
						/>

						{error && <Text style={styles.error}>{error}</Text>}

						<TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
							{loading ? (
								<ActivityIndicator color={COLORS.bg} />
							) : (
								<Text style={styles.primaryBtnText}>Ingresar</Text>
							)}
						</TouchableOpacity>
						{/* Login con Google pendiente: expo-auth-session está deprecado y requiere
						    migrar a un dev client con @react-native-google-signin/google-signin. */}
					</View>

					<TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footerLink}>
						<Text style={styles.footerText}>
							¿No tenés cuenta? <Text style={{ color: COLORS.lime }}>Registrate</Text>
						</Text>
					</TouchableOpacity>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.bg },
	scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
	badge: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: COLORS.card,
		borderWidth: 0.5,
		borderColor: COLORS.border,
		alignItems: 'center',
		justifyContent: 'center',
		alignSelf: 'center',
		marginBottom: 16,
	},
	badgeEmoji: { fontSize: 28 },
	logo: { fontSize: 40, fontWeight: '800', color: COLORS.white, textAlign: 'center' },
	subtitle: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginTop: 8, marginBottom: 32 },
	form: { gap: 12 },
	error: { color: COLORS.red, fontSize: 13, textAlign: 'center' },
	primaryBtn: {
		backgroundColor: COLORS.lime,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
		marginTop: 8,
	},
	primaryBtnText: { color: COLORS.bg, fontSize: 15, fontWeight: '800' },
	footerLink: { marginTop: 24, alignItems: 'center' },
	footerText: { color: COLORS.muted, fontSize: 13 },
});
