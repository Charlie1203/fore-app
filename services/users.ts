import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { UserDoc } from '../firebase/types';

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
	const snap = await getDoc(doc(db, 'users', uid));
	return snap.exists() ? (snap.data() as UserDoc) : null;
}
