import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import type { UserDoc } from '../firebase/types';

interface AuthContextValue {
	firebaseUser: User | null;
	userDoc: UserDoc | null;
	loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
	firebaseUser: null,
	userDoc: null,
	loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
	const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
	const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsubAuth = onAuthStateChanged(auth, (u) => {
			setFirebaseUser(u);
			if (!u) {
				setUserDoc(null);
				setLoading(false);
			}
		});
		return unsubAuth;
	}, []);

	useEffect(() => {
		if (!firebaseUser) return;
		const ref = doc(db, 'users', firebaseUser.uid);
		const unsubDoc = onSnapshot(ref, (snap) => {
			setUserDoc(snap.exists() ? (snap.data() as UserDoc) : null);
			setLoading(false);
		});
		return unsubDoc;
	}, [firebaseUser]);

	return (
		<AuthContext.Provider value={{ firebaseUser, userDoc, loading }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
