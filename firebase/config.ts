import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth } from 'firebase/auth';
// El exports map de @firebase/auth declara "types" como hermano de "react-native" (no anidado
// dentro), así que tsc siempre resuelve el .d.ts genérico y no ve este export, aunque en runtime
// Metro sí resuelve correctamente la condición "react-native" y obtiene la función real.
// @ts-expect-error — ver comentario arriba, es una limitación de tipos del paquete, no del código.
import { getReactNativePersistence } from '@firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
	apiKey: 'AIzaSyC2USRTsDB_3UT7DQWPlQiWXMq1FYMrMco',
	authDomain: 'fore-app-3c7d0.firebaseapp.com',
	projectId: 'fore-app-3c7d0',
	storageBucket: 'fore-app-3c7d0.firebasestorage.app',
	messagingSenderId: '325481438385',
	appId: '1:325481438385:web:5380d6fb8892abf1035690',
	// measurementId omitido a propósito: getAnalytics no funciona en React Native.
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
try {
	auth = initializeAuth(app, {
		persistence: getReactNativePersistence(AsyncStorage),
	});
} catch {
	// Ya inicializado (Fast Refresh en desarrollo).
	auth = getAuth(app);
}
export { auth };

export const db = getFirestore(app);
export const storage = getStorage(app);
