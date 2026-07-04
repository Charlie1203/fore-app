import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	GoogleAuthProvider,
	signInWithCredential,
	type UserCredential,
} from 'firebase/auth';
import { auth } from '../firebase/config';

export async function registerWithEmail(email: string, password: string): Promise<UserCredential> {
	return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithEmail(email: string, password: string): Promise<UserCredential> {
	return signInWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogleIdToken(idToken: string): Promise<UserCredential> {
	const credential = GoogleAuthProvider.credential(idToken);
	return signInWithCredential(auth, credential);
}

export async function logout(): Promise<void> {
	return signOut(auth);
}

const ERROR_MESSAGES: Record<string, string> = {
	'auth/invalid-email': 'El email no es válido.',
	'auth/user-disabled': 'Esta cuenta fue deshabilitada.',
	'auth/user-not-found': 'No existe una cuenta con ese email.',
	'auth/wrong-password': 'Contraseña incorrecta.',
	'auth/invalid-credential': 'Email o contraseña incorrectos.',
	'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
	'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
	'auth/too-many-requests': 'Demasiados intentos. Probá de nuevo más tarde.',
	'auth/network-request-failed': 'Error de conexión. Revisá tu internet.',
	'auth/operation-not-allowed': 'El login por email todavía no está habilitado en Firebase.',
};

export function mapAuthError(code: string): string {
	return ERROR_MESSAGES[code] ?? 'Ocurrió un error inesperado. Probá de nuevo.';
}
