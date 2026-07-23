import { collection, doc, setDoc, updateDoc, serverTimestamp, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { TournamentModality, UserDoc } from '../firebase/types';

function initialsOf(name: string): string {
	return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

/** Crea un torneo y deja al creador como primer participante. Devuelve el id del torneo. */
export async function createTournament(params: {
	name: string;
	modality: TournamentModality;
	groupId: string | null;
	groupName: string | null;
	roundDates: (string | null)[];
}, user: UserDoc): Promise<string> {
	const ref = doc(collection(db, 'tournaments'));
	await setDoc(ref, {
		id: ref.id,
		name: params.name,
		modality: params.modality,
		groupId: params.groupId,
		groupName: params.groupName,
		createdBy: user.uid,
		createdByName: user.displayName,
		roundDates: params.roundDates,
		participantUids: [user.uid],
		participantsCount: 1,
		createdAt: serverTimestamp(),
	});
	await setDoc(doc(db, 'tournaments', ref.id, 'participants', user.uid), {
		uid: user.uid,
		displayName: user.displayName,
		initials: initialsOf(user.displayName),
		handicap: user.handicap ?? null,
		joinedAt: serverTimestamp(),
	});
	return ref.id;
}

/** Suma un participante al torneo y le deja una notificación. */
export async function addParticipantToTournament(
	tournamentId: string,
	tournamentName: string,
	participant: Pick<UserDoc, 'uid' | 'displayName' | 'handicap'>,
	addedByName: string,
): Promise<void> {
	await setDoc(doc(db, 'tournaments', tournamentId, 'participants', participant.uid), {
		uid: participant.uid,
		displayName: participant.displayName,
		initials: initialsOf(participant.displayName),
		handicap: participant.handicap ?? null,
		joinedAt: serverTimestamp(),
	});
	await updateDoc(doc(db, 'tournaments', tournamentId), {
		participantUids: arrayUnion(participant.uid),
		participantsCount: increment(1),
	});
	const notifRef = doc(collection(db, 'users', participant.uid, 'notifications'));
	await setDoc(notifRef, {
		id: notifRef.id,
		type: 'tournament_added',
		icon: 'trophy-outline',
		text: `${addedByName} te invitó al torneo ${tournamentName}`,
		read: false,
		createdAt: serverTimestamp(),
	});
}

export type TorneoEstado = 'próximo' | 'en curso' | 'finalizado';

/** Deriva el estado del torneo a partir de las fechas de ronda, no se guarda en el doc. */
export function estadoDeTorneo(roundDates: (string | null)[]): TorneoEstado {
	const fechas = roundDates.filter((d): d is string => !!d).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
	if (fechas.length === 0) return 'próximo';
	const hoy = new Date();
	hoy.setHours(0, 0, 0, 0);
	const primera = fechas[0];
	const ultima = fechas[fechas.length - 1];
	if (hoy < primera) return 'próximo';
	if (hoy > ultima) return 'finalizado';
	return 'en curso';
}

/** Cuántas rondas ya pasaron (incluye la de hoy), 1-indexed. Solo tiene sentido si el torneo está en curso. */
export function rondaActualDeTorneo(roundDates: (string | null)[]): number {
	const hoy = new Date();
	hoy.setHours(0, 0, 0, 0);
	const fechas = roundDates.filter((d): d is string => !!d).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
	const pasadas = fechas.filter(f => f <= hoy).length;
	return Math.max(1, pasadas);
}
