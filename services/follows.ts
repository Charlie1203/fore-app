import { collection, doc, setDoc, deleteDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase/config';

export function followDocId(followerUid: string, followingUid: string): string {
	return `${followerUid}_${followingUid}`;
}

function initialsOf(name: string): string {
	return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

/** follower empieza a seguir a following. */
export async function followUser(
	follower: { uid: string; displayName: string },
	following: { uid: string; displayName: string },
): Promise<void> {
	await setDoc(doc(db, 'follows', followDocId(follower.uid, following.uid)), {
		followerUid: follower.uid,
		followerName: follower.displayName,
		followerInitials: initialsOf(follower.displayName),
		followingUid: following.uid,
		followingName: following.displayName,
		followingInitials: initialsOf(following.displayName),
		createdAt: serverTimestamp(),
	});
	await updateDoc(doc(db, 'users', following.uid), { followersCount: increment(1) });
	await updateDoc(doc(db, 'users', follower.uid), { followingCount: increment(1) });
}

/** followerUid deja de seguir a followingUid. */
export async function unfollowUser(followerUid: string, followingUid: string): Promise<void> {
	await deleteDoc(doc(db, 'follows', followDocId(followerUid, followingUid)));
	await updateDoc(doc(db, 'users', followingUid), { followersCount: increment(-1) });
	await updateDoc(doc(db, 'users', followerUid), { followingCount: increment(-1) });
}
