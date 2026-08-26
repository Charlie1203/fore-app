import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, serverTimestamp, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { TournamentModality, UserDoc, HoleResult } from '../firebase/types';

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
		roundsWithScores: [],
		finalizedManually: false,
		createdAt: serverTimestamp(),
	});
	await setDoc(doc(db, 'tournaments', ref.id, 'participants', user.uid), {
		uid: user.uid,
		displayName: user.displayName,
		initials: initialsOf(user.displayName),
		photoURL: user.photoURL ?? null,
		handicap: user.handicap ?? null,
		roundsPlayed: 0,
		vsParTotal: 0,
		roundScores: {},
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
		photoURL: user.photoURL ?? null,
		handicap: user.handicap ?? null,
		roundsPlayed: 0,
		vsParTotal: 0,
		roundScores: {},
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
	participant: Pick<UserDoc, 'uid' | 'displayName' | 'handicap' | 'photoURL'>,
	addedByName: string,
): Promise<void> {
	await setDoc(doc(db, 'tournaments', tournamentId, 'participants', participant.uid), {
		uid: participant.uid,
		displayName: participant.displayName,
		initials: initialsOf(participant.displayName),
		photoURL: participant.photoURL ?? null,
		handicap: participant.handicap ?? null,
		roundsPlayed: 0,
		vsParTotal: 0,
		roundScores: {},
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

/** El admin cierra el torneo a mano: queda "finalizado" para todos los participantes,
 * hayan cargado sus rondas o no. Es la única forma de finalizar un torneo aparte de que
 * cada jugador cargue todas las suyas (ver estadoDeTorneo). */
export async function finalizeTournament(tournamentId: string): Promise<void> {
	await updateDoc(doc(db, 'tournaments', tournamentId), { finalizedManually: true });
}

export interface TorneoRondaSeleccion {
	tournamentId: string;
	roundIndex: number; // 0-based, posición dentro de roundDates
}

export interface TorneoScorecard {
	totalScore: number;
	totalPar: number;
	vsPar: number;
	holes: HoleResult[];
	courseName: string;
	clubName: string;
}

/** Se llama al publicar una vuelta vinculada a una o más rondas de torneo: agrega el
 * índice de ronda a roundsWithScores del torneo (señal que usa estadoDeTorneo — cuenta
 * rondas *distintas* con algún dato, no cuántas veces se cargó algo) y suma al
 * roundsPlayed/vsParTotal del propio participante, guardando además una copia liviana
 * de la tarjeta en roundScores[roundIndex] — así se puede armar la clasificación por
 * ronda y mostrar el detalle de cada tarjeta sin leer la colección rounds desde el torneo. */
export async function linkRoundToTournaments(selecciones: TorneoRondaSeleccion[], uid: string, scorecard: TorneoScorecard): Promise<void> {
	await Promise.all(selecciones.map(({ tournamentId, roundIndex }) => Promise.all([
		updateDoc(doc(db, 'tournaments', tournamentId), { roundsWithScores: arrayUnion(roundIndex) }),
		updateDoc(doc(db, 'tournaments', tournamentId, 'participants', uid), {
			roundsPlayed: increment(1),
			vsParTotal: increment(scorecard.vsPar),
			[`roundScores.${roundIndex}`]: { roundIndex, ...scorecard, date: serverTimestamp() },
		}),
	])));
}

export type TorneoEstado = 'próximo' | 'en curso' | 'finalizado';

/** Deriva el estado del torneo para quien lo está mirando — no se guarda en el doc.
 * "Finalizado" es siempre alguna de estas dos cosas, nunca una fecha: (a) ESTE jugador ya
 * cargó todas sus rondas (aunque al resto le falten — cada uno ve su propio progreso), o
 * (b) el admin cerró el torneo entero a mano (finalizedManually). Las fechas de roundDates
 * solo se usan para decidir si todavía no arrancó ("próximo"), nunca para cerrarlo solas —
 * ese fue el bug: alguien cargaba sus rondas y el torneo se veía "finalizado" para todos. */
export function estadoDeTorneo(roundDates: (string | null)[], roundsWithScores: number[] = [], misRoundsPlayed: number = 0, finalizedManually: boolean = false): TorneoEstado {
	if (finalizedManually) return 'finalizado';

	const total = roundDates.length;
	if (total > 0 && misRoundsPlayed >= total) return 'finalizado';

	const empezoPorCarga = roundsWithScores.length > 0;
	const fechas = roundDates.filter((d): d is string => !!d).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
	if (fechas.length === 0) return empezoPorCarga ? 'en curso' : 'próximo';

	const hoy = new Date();
	hoy.setHours(0, 0, 0, 0);
	const primera = fechas[0];
	if (hoy < primera) return empezoPorCarga ? 'en curso' : 'próximo';

	return 'en curso';
}

/** Cuántas rondas propias ya se cargaron, para mostrar "Ronda X de Y" — es personal,
 * como estadoDeTorneo: no mira lo que cargaron los demás participantes. */
export function rondaActualDeTorneo(roundDates: (string | null)[], misRoundsPlayed: number = 0): number {
	const total = roundDates.length || 1;
	return Math.min(misRoundsPlayed, total);
}
