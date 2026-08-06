import { useState } from 'react';
import {
	View,
	Text,
	Image,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AuthTextInput from '../../components/AuthTextInput';
import { loginWithEmail, resetPassword, mapAuthError } from '../../services/auth';
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
	const [remember, setRemember] = useState(false);
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

	const handleForgotPassword = async () => {
		if (!identifier.includes('@')) {
			Alert.alert('Recuperar contraseña', 'Escribí tu email arriba (no el @usuario) y volvé a tocar el link.');
			return;
		}
		try {
			await resetPassword(identifier.trim());
			Alert.alert('Listo', `Te mandamos un mail a ${identifier.trim()} para reestablecer tu contraseña.`);
		} catch (e: any) {
			Alert.alert('Error', mapAuthError(e.code));
		}
	};

	const handleSocialLogin = (provider: string) => {
		// expo-auth-session está deprecado para esto — hace falta migrar a un dev client
		// con @react-native-google-signin/google-signin o el equivalente de Apple.
		Alert.alert('Próximamente', `El login con ${provider} todavía no está disponible.`);
	};

	return (
		<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<View style={styles.scroll}>
					<Image source={require('../../assets/images/logo-full.png')} style={styles.logoImg} resizeMode="contain" />

					<Text style={styles.welcome}>Bienvenido a FORE!</Text>
					<Text style={styles.subtitle}>Iniciá sesión para seguir jugando</Text>

					<View style={styles.form}>
						<AuthTextInput
							icon="mail-outline"
							placeholder="Email"
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

						<View style={styles.optionsRow}>
							<TouchableOpacity style={styles.rememberRow} onPress={() => setRemember(v => !v)}>
								<View style={[styles.checkbox, remember && styles.checkboxActive]}>
									{remember && <Ionicons name="checkmark" size={12} color="#0f0f0f" />}
								</View>
								<Text style={styles.rememberText}>Recordarme</Text>
							</TouchableOpacity>
							<TouchableOpacity onPress={handleForgotPassword}>
								<Text style={styles.forgotText}>
									¿Olvidaste tu <Text style={{ color: COLORS.lime }}>contraseña?</Text>
								</Text>
							</TouchableOpacity>
						</View>

						{error && <Text style={styles.error}>{error}</Text>}

						<TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
							{loading ? (
								<ActivityIndicator color={COLORS.bg} />
							) : (
								<Text style={styles.primaryBtnText}>Ingresar</Text>
							)}
						</TouchableOpacity>

						<View style={styles.dividerRow}>
							<View style={styles.dividerLine} />
							<Text style={styles.dividerText}>o continuá con</Text>
							<View style={styles.dividerLine} />
						</View>

						<View style={styles.socialRow}>
							<TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('Google')}>
								<Ionicons name="logo-google" size={18} color={COLORS.white} />
								<Text style={styles.socialBtnText}>Google</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('Apple')}>
								<Ionicons name="logo-apple" size={20} color={COLORS.white} />
								<Text style={styles.socialBtnText}>Apple</Text>
							</TouchableOpacity>
						</View>
					</View>

					<TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footerLink}>
						<Text style={styles.footerText}>
							¿No tenés cuenta? <Text style={{ color: COLORS.lime }}>Registrate</Text>
						</Text>
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.bg },
	scroll: { flex: 1, justifyContent: 'center', padding: 24, paddingTop: 12 },
	logoImg: { width: '100%', height: 250, alignSelf: 'center', marginBottom: 0 },
	welcome: { fontSize: 15, fontWeight: '800', color: COLORS.white, textAlign: 'center', marginTop: 4 },
	subtitle: { fontSize: 12, color: COLORS.muted, textAlign: 'center', marginTop: 4, marginBottom: 12 },
	form: { gap: 10 },
	optionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
	rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: COLORS.lime, alignItems: 'center', justifyContent: 'center' },
	checkboxActive: { backgroundColor: COLORS.lime },
	rememberText: { fontSize: 13, color: COLORS.muted },
	forgotText: { fontSize: 13, color: COLORS.muted },
	error: { color: COLORS.red, fontSize: 13, textAlign: 'center' },
	primaryBtn: {
		backgroundColor: COLORS.lime,
		borderRadius: 12,
		paddingVertical: 13,
		alignItems: 'center',
		marginTop: 4,
	},
	primaryBtnText: { color: COLORS.bg, fontSize: 15, fontWeight: '800' },
	dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
	dividerLine: { flex: 1, height: 0.5, backgroundColor: COLORS.border },
	dividerText: { fontSize: 12, color: COLORS.muted },
	socialRow: { flexDirection: 'row', gap: 12 },
	socialBtn: {
		flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
		backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 11,
	},
	socialBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
	footerLink: { marginTop: 10, alignItems: 'center' },
	footerText: { color: COLORS.muted, fontSize: 13 },
});
