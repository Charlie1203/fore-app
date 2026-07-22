import { collection, doc, setDoc, updateDoc, serverTimestamp, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { UserDoc } from '../firebase/types';

/** Crea un grupo privado y deja al creador como admin. Devuelve el id del grupo. */
export async function createGroup(name: string, user: UserDoc): Promise<string> {
	const groupRef = doc(collection(db, 'groups'));
	// El doc del grupo tiene que existir antes que el member: las reglas del member
	// validan createdBy leyendo el grupo.
	await setDoc(groupRef, {
		id: groupRef.id,
		name,
		type: 'privado',
		photoURL: null,
		membersCount: 1,
		memberUids: [user.uid],
		createdBy: user.uid,
		createdAt: serverTimestamp(),
		lastActivityAt: serverTimestamp(),
	});
	await setDoc(doc(db, 'groups', groupRef.id, 'members', user.uid), {
		uid: user.uid,
		displayName: user.displayName,
		handicap: user.handicap ?? null,
		role: 'admin',
		joinedAt: serverTimestamp(),
	});
	return groupRef.id;
}

/** Unirse a un grupo tipo club como miembro. */
export async function joinGroup(groupId: string, user: UserDoc): Promise<void> {
	await setDoc(doc(db, 'groups', groupId, 'members', user.uid), {
		uid: user.uid,
		displayName: user.displayName,
		handicap: user.handicap ?? null,
		role: 'member',
		joinedAt: serverTimestamp(),
	});
	await updateDoc(doc(db, 'groups', groupId), {
		memberUids: arrayUnion(user.uid),
		membersCount: increment(1),
		lastActivityAt: serverTimestamp(),
	});
}
