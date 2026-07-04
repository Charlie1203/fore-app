import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { UserDoc } from '../firebase/types';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export function isValidUsernameFormat(usernameLower: string): boolean {
	return USERNAME_REGEX.test(usernameLower);
}

/** Chequeo rápido para UX mientras el usuario tipea. No es la fuente de verdad de unicidad. */
export async function isUsernameAvailable(usernameLower: string): Promise<boolean> {
	const snap = await getDoc(doc(db, 'usernames', usernameLower));
	return !snap.exists();
}

/**
 * Reserva el username y crea el doc de usuario en una única transacción atómica.
 * Firestore reintenta automáticamente ante conflicto (optimistic concurrency), por lo que
 * dos registros simultáneos con el mismo username nunca pueden tener éxito ambos.
 * Lanza Error('USERNAME_TAKEN') si el username ya fue reservado por otro uid.
 */
export async function reserveUsernameAndCreateUser(
	uid: string,
	usernameLower: string,
	userData: Omit<UserDoc, 'uid' | 'username' | 'createdAt' | 'updatedAt'>
): Promise<void> {
	const usernameRef = doc(db, 'usernames', usernameLower);
	const userRef = doc(db, 'users', uid);

	await runTransaction(db, async (tx) => {
		const usernameSnap = await tx.get(usernameRef);
		if (usernameSnap.exists()) {
			throw new Error('USERNAME_TAKEN');
		}
		tx.set(usernameRef, { uid });
		tx.set(userRef, {
			uid,
			username: usernameLower,
			...userData,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
	});
}
