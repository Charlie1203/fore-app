import { collection, doc, setDoc, deleteDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase/config';

export function followDocId(followerUid: string, followingUid: string): string {
	return `${followerUid}_${followingUid}`;
}

/** followerUid empieza a seguir a followingUid. */
export async function followUser(followerUid: string, followingUid: string): Promise<void> {
	await setDoc(doc(db, 'follows', followDocId(followerUid, followingUid)), {
		followerUid,
		followingUid,
		createdAt: serverTimestamp(),
	});
	await updateDoc(doc(db, 'users', followingUid), { followersCount: increment(1) });
	await updateDoc(doc(db, 'users', followerUid), { followingCount: increment(1) });
}

/** followerUid deja de seguir a followingUid. */
export async function unfollowUser(followerUid: string, followingUid: string): Promise<void> {
	await deleteDoc(doc(db, 'follows', followDocId(followerUid, followingUid)));
	await updateDoc(doc(db, 'users', followingUid), { followersCount: increment(-1) });
	await updateDoc(doc(db, 'users', followerUid), { followingCount: increment(-1) });
}
