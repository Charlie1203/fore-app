import { useEffect, useRef, useState } from 'react';
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
import { auth } from '../../firebase/config';
import { registerWithEmail, loginWithEmail, mapAuthError } from '../../services/auth';
import { isValidUsernameFormat, isUsernameAvailable, reserveUsernameAndCreateUser } from '../../services/usernames';

const COLORS = {
	bg: '#0f0f0f',
	card: '#1a1a1a',
	border: '#2a2a2a',
	lime: '#c8e03a',
	white: '#f0f0f0',
	muted: '#666',
	red: '#e07070',
};

export default function RegisterScreen() {
	const navigation = useNavigation<any>();
	const [step, setStep] = useState<'credentials' | 'profile'>('credentials');

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const [displayName, setDisplayName] = useState('');
	const [username, setUsername] = useState('');
	const [matricula, setMatricula] = useState('');
	const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const usernameLower = username.trim().toLowerCase();
		if (!usernameLower) {
			setUsernameStatus('idle');
			return;
		}
		if (!isValidUsernameFormat(usernameLower)) {
			setUsernameStatus('invalid');
			return;
		}
		setUsernameStatus('checking');
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			const available = await isUsernameAvailable(usernameLower);
			setUsernameStatus(available ? 'available' : 'taken');
		}, 400);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [username]);

	const handleContinueCredentials = async () => {
		if (!email || !password || !confirmPassword) {
			setError('Completá todos los campos.');
			return;
		}
		if (password !== confirmPassword) {
			setError('Las contraseñas no coinciden.');
			return;
		}
		if (password.length < 6) {
			setError('La contraseña debe tener al menos 6 caracteres.');
			return;
		}
		setError(null);
		setLoading(true);
		try {
			await registerWithEmail(email.trim(), password);
			setStep('profile');
		} catch (e: any) {
			if (e.code === 'auth/email-already-in-use') {
				// Puede ser una cuenta propia de un registro anterior que quedó sin terminar
				// (se creó en Auth pero nunca se llegó a guardar el username). Reintentamos
				// como login con las mismas credenciales para retomar el registro donde quedó.
				try {
					await loginWithEmail(email.trim(), password);
					setStep('profile');
				} catch {
					setError(mapAuthError('auth/email-already-in-use'));
				}
			} else {
				setError(mapAuthError(e.code));
			}
		} finally {
			setLoading(false);
		}
	};

	const handleFinishProfile = async () => {
		const usernameLower = username.trim().toLowerCase();
		if (!displayName.trim()) {
			setError('Ingresá tu nombre.');
			return;
		}
		if (!isValidUsernameFormat(usernameLower)) {
			setError('El usuario debe tener 3-20 caracteres: minúsculas, números o guión bajo.');
			return;
		}
		const matriculaValue = matricula.trim() || null;
		const user = auth.currentUser;
		if (!user) {
			setError('Se perdió la sesión, volvé a intentar.');
			return;
		}
		setError(null);
		setLoading(true);
		try {
			await reserveUsernameAndCreateUser(user.uid, usernameLower, {
				displayName: displayName.trim(),
				email: user.email ?? '',
				photoURL: user.photoURL ?? null,
				matricula: matriculaValue,
				handicap: null, // se completa solo cuando se sincroniza con la matrícula
				club: null,
				clubId: null,
				bio: null,
				followersCount: 0,
				followingCount: 0,
				roundsCount: 0,
				bestScore: null,
				provider: 'password',
			});
			// AuthContext detecta el nuevo users/{uid} vía onSnapshot y navega solo a las Tabs.
		} catch (e: any) {
			if (e.message === 'USERNAME_TAKEN') {
				setError('Ese usuario ya está en uso, probá otro.');
				setUsernameStatus('taken');
			} else {
				setError('No se pudo completar el registro. Probá de nuevo.');
			}
		} finally {
			setLoading(false);
		}
	};

	const usernameHint =
		usernameStatus === 'checking' ? 'Verificando...' :
		usernameStatus === 'available' ? 'Disponible ✓' :
		usernameStatus === 'taken' ? 'Ya está en uso' :
		usernameStatus === 'invalid' ? '3-20 caracteres: minúsculas, números o _' : '';

	return (
		<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
				<ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
					<Text style={styles.logo}>
						FORE<Text style={{ color: COLORS.lime }}>!</Text>
					</Text>
					<Text style={styles.subtitle}>
						{step === 'credentials' ? 'Creá tu cuenta' : 'Elegí tu nombre de usuario'}
					</Text>

					<View style={styles.stepsRow}>
						<View style={[styles.stepDot, styles.stepDotActive]} />
						<View style={styles.stepLine} />
						<View style={[styles.stepDot, step === 'profile' && styles.stepDotActive]} />
					</View>

					{step === 'credentials' ? (
						<View style={styles.form}>
							<AuthTextInput
								icon="mail-outline"
								placeholder="Email"
								autoCapitalize="none"
								keyboardType="email-address"
								value={email}
								onChangeText={setEmail}
							/>
							<AuthTextInput
								icon="lock-closed-outline"
								placeholder="Contraseña"
								isPassword
								value={password}
								onChangeText={setPassword}
							/>
							<AuthTextInput
								icon="lock-closed-outline"
								placeholder="Confirmar contraseña"
								isPassword
								value={confirmPassword}
								onChangeText={setConfirmPassword}
							/>

							{error && <Text style={styles.error}>{error}</Text>}

							<TouchableOpacity style={styles.primaryBtn} onPress={handleContinueCredentials} disabled={loading}>
								{loading ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.primaryBtnText}>Continuar</Text>}
							</TouchableOpacity>
						</View>
					) : (
						<View style={styles.form}>
							<AuthTextInput
								icon="person-outline"
								placeholder="Nombre y apellido"
								value={displayName}
								onChangeText={setDisplayName}
							/>
							<View>
								<AuthTextInput
									icon="at-outline"
									placeholder="usuario"
									autoCapitalize="none"
									value={username}
									onChangeText={setUsername}
								/>
								{usernameHint && (
									<Text style={[styles.hint, usernameStatus === 'available' && { color: COLORS.lime }, (usernameStatus === 'taken' || usernameStatus === 'invalid') && { color: COLORS.red }]}>
										{usernameHint}
									</Text>
								)}
							</View>
							<View>
								<AuthTextInput
									icon="card-outline"
									placeholder="Matrícula (opcional)"
									keyboardType="number-pad"
									value={matricula}
									onChangeText={setMatricula}
								/>
								<Text style={styles.hint}>La usamos para vincular tu handicap automáticamente. Si no la tenés, la podés completar más adelante</Text>
							</View>

							{error && <Text style={styles.error}>{error}</Text>}

							<TouchableOpacity style={styles.primaryBtn} onPress={handleFinishProfile} disabled={loading}>
								{loading ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.primaryBtnText}>Crear cuenta</Text>}
							</TouchableOpacity>
						</View>
					)}

					{step === 'credentials' && (
						<TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footerLink}>
							<Text style={styles.footerText}>
								¿Ya tenés cuenta? <Text style={{ color: COLORS.lime }}>Ingresá</Text>
							</Text>
						</TouchableOpacity>
					)}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.bg },
	scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
	logo: { fontSize: 40, fontWeight: '800', color: COLORS.white, textAlign: 'center' },
	subtitle: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginTop: 8, marginBottom: 20 },
	stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 6 },
	stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
	stepDotActive: { backgroundColor: COLORS.lime },
	stepLine: { width: 28, height: 1, backgroundColor: COLORS.border },
	form: { gap: 12 },
	hint: { fontSize: 12, color: COLORS.muted, marginTop: 6, marginLeft: 4 },
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
