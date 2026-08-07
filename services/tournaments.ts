import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, serverTimestamp, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
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
		roundsPlayedCount: 0,
		createdAt: serverTimestamp(),
	});
	await setDoc(doc(db, 'tournaments', ref.id, 'participants', user.uid), {
		uid: user.uid,
		displayName: user.displayName,
		initials: initialsOf(user.displayName),
		handicap: user.handicap ?? null,
		roundsPlayed: 0,
		vsParTotal: 0,
		roundsLoaded: [],
		joinedAt: serverTimestamp(),
	});
	return ref.id;
}

/** El propio jugador se une a un torneo (por ejemplo, desde la pestaña Torneos de un grupo). */
export async function joinTournament(tournamentId: string, user: UserDoc): Promise<void> {
	await setDoc(doc(db, 'tournaments', tournamentId, 'participants', user.uid), {
		uid: user.uid,
		displayName: user.displayName,
		initials: initialsOf(user.displayName),
		handicap: user.handicap ?? null,
		roundsPlayed: 0,
		vsParTotal: 0,
		roundsLoaded: [],
		joinedAt: serverTimestamp(),
	});
	await updateDoc(doc(db, 'tournaments', tournamentId), {
		participantUids: arrayUnion(user.uid),
		participantsCount: increment(1),
	});
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
		roundsPlayed: 0,
		vsParTotal: 0,
		roundsLoaded: [],
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

/** Saca a un participante del torneo. Lo usan tanto "salir del torneo" (uno mismo) como el admin al eliminar a otro. */
export async function removeParticipantFromTournament(tournamentId: string, uid: string): Promise<void> {
	await deleteDoc(doc(db, 'tournaments', tournamentId, 'participants', uid));
	await updateDoc(doc(db, 'tournaments', tournamentId), {
		participantUids: arrayRemove(uid),
		participantsCount: increment(-1),
	});
}

/** El creador elimina el torneo. Borra primero a los participantes: la regla de esa
 * subcolección lee el doc del torneo para validar al admin, así que tiene que borrarse último. */
export async function deleteTournament(tournamentId: string): Promise<void> {
	const participantsSnap = await getDocs(collection(db, 'tournaments', tournamentId, 'participants'));
	await Promise.all(participantsSnap.docs.map(d => deleteDoc(d.ref)));
	await deleteDoc(doc(db, 'tournaments', tournamentId));
}

export interface TorneoRondaSeleccion {
	tournamentId: string;
	roundIndex: number; // 0-based, posición dentro de roundDates
}

/** Se llama al publicar una vuelta vinculada a una o más rondas de torneo: suma 1 a
 * roundsPlayedCount del torneo (señal que usa estadoDeTorneo) y también al
 * roundsPlayed/vsParTotal/roundsLoaded del propio participante, para armar la
 * clasificación y saber qué rondas le quedan por cargar sin leer la colección de rounds. */
export async function linkRoundToTournaments(selecciones: TorneoRondaSeleccion[], uid: string, vsPar: number): Promise<void> {
	await Promise.all(selecciones.map(({ tournamentId, roundIndex }) => Promise.all([
		updateDoc(doc(db, 'tournaments', tournamentId), { roundsPlayedCount: increment(1) }),
		updateDoc(doc(db, 'tournaments', tournamentId, 'participants', uid), {
			roundsPlayed: increment(1),
			vsParTotal: increment(vsPar),
			roundsLoaded: arrayUnion(roundIndex),
		}),
	])));
}

export type TorneoEstado = 'próximo' | 'en curso' | 'finalizado';

/** Deriva el estado del torneo, no se guarda en el doc. Combina dos señales:
 * (1) por fechas — hoy cae entre la primera y la última ronda cargada, y solo es
 * "finalizado" cuando TODAS las rondas tienen fecha y todas ya pasaron; y
 * (2) por carga real — si el torneo tiene más de una ronda y ya se publicó al menos
 * una tarjeta (pero no todas), está "en curso" aunque las fechas no lo digan (o no haya
 * fechas cargadas). Así no depende solo de que alguien haya cargado fechas a tiempo. */
export function estadoDeTorneo(roundDates: (string | null)[], roundsPlayedCount: number = 0): TorneoEstado {
	const total = roundDates.length;
	const empezoPorCarga = total > 1 && roundsPlayedCount > 0 && roundsPlayedCount < total;

	const fechas = roundDates.filter((d): d is string => !!d).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
	if (fechas.length === 0) return empezoPorCarga ? 'en curso' : 'próximo';

	const hoy = new Date();
	hoy.setHours(0, 0, 0, 0);
	const primera = fechas[0];
	if (hoy < primera) return empezoPorCarga ? 'en curso' : 'próximo';

	const ultima = fechas[fechas.length - 1];
	const quedaRondaSinFecha = roundDates.some(d => !d);
	if (hoy > ultima && !quedaRondaSinFecha) return 'finalizado';
	return 'en curso';
}

/** Cuántas rondas ya pasaron (incluye la de hoy), 1-indexed. Toma la mayor entre lo que
 * dicen las fechas y las tarjetas realmente cargadas. Solo tiene sentido si el torneo está en curso. */
export function rondaActualDeTorneo(roundDates: (string | null)[], roundsPlayedCount: number = 0): number {
	const hoy = new Date();
	hoy.setHours(0, 0, 0, 0);
	const fechas = roundDates.filter((d): d is string => !!d).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
	const pasadas = fechas.filter(f => f <= hoy).length;
	return Math.max(1, pasadas, roundsPlayedCount);
}
