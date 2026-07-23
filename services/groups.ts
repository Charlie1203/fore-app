import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, serverTimestamp, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
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

/** Un admin agrega a otro usuario al grupo y le deja una notificación. */
export async function addMemberToGroup(
	groupId: string,
	groupName: string,
	member: Pick<UserDoc, 'uid' | 'displayName' | 'handicap'>,
	addedByName: string,
): Promise<void> {
	await setDoc(doc(db, 'groups', groupId, 'members', member.uid), {
		uid: member.uid,
		displayName: member.displayName,
		handicap: member.handicap ?? null,
		role: 'member',
		joinedAt: serverTimestamp(),
	});
	await updateDoc(doc(db, 'groups', groupId), {
		memberUids: arrayUnion(member.uid),
		membersCount: increment(1),
		lastActivityAt: serverTimestamp(),
	});
	const notifRef = doc(collection(db, 'users', member.uid, 'notifications'));
	await setDoc(notifRef, {
		id: notifRef.id,
		type: 'group_added',
		icon: 'people-outline',
		text: `${addedByName} te agregó al grupo ${groupName}`,
		read: false,
		createdAt: serverTimestamp(),
	});
}

/** Saca a un miembro del grupo. Lo usan tanto "salir del grupo" (uno mismo) como el admin al eliminar a otro. */
export async function removeMemberFromGroup(groupId: string, uid: string): Promise<void> {
	await deleteDoc(doc(db, 'groups', groupId, 'members', uid));
	await updateDoc(doc(db, 'groups', groupId), {
		memberUids: arrayRemove(uid),
		membersCount: increment(-1),
	});
}

/** El admin elimina el grupo. Borra también los miembros; posts y torneos vinculados quedan huérfanos. */
export async function deleteGroup(groupId: string): Promise<void> {
	const membersSnap = await getDocs(collection(db, 'groups', groupId, 'members'));
	await deleteDoc(doc(db, 'groups', groupId));
	await Promise.all(membersSnap.docs.map(d => deleteDoc(d.ref)));
}
