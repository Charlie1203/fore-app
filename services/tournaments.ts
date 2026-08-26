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

/** true solo cuando TODAS las rondas tienen fecha cargada y todas ya pasaron — el cierre
 * "duro" por calendario. Se usa para distinguir ese cierre confirmado del cierre "blando"
 * por carga (todas las rondas ya tienen alguna tarjeta, pero podría faltar gente por jugar). */
export function finalizadoPorFecha(roundDates: (string | null)[]): boolean {
	const fechas = roundDates.filter((d): d is string => !!d).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
	if (fechas.length === 0) return false;
	const quedaRondaSinFecha = roundDates.some(d => !d);
	if (quedaRondaSinFecha) return false;
	const hoy = new Date();
	hoy.setHours(0, 0, 0, 0);
	return hoy > fechas[fechas.length - 1];
}

/** Deriva el estado del torneo para quien lo está mirando — no se guarda en el doc.
 * "Finalizado" es personal: aparece solo (a) si el torneo cerró por fecha de verdad
 * (aplica a todos por igual), o (b) si ESTE jugador ya cargó todas sus rondas, aunque al
 * resto le sigan faltando. Que "todas las rondas ya tengan alguna tarjeta" (de cualquiera)
 * ya no alcanza para cerrarlo para todo el mundo — eso fue justamente el bug: el creador
 * cargaba sus rondas y el torneo se veía "finalizado" para participantes que ni jugaron. */
export function estadoDeTorneo(roundDates: (string | null)[], roundsWithScores: number[] = [], misRoundsPlayed: number = 0): TorneoEstado {
	if (finalizadoPorFecha(roundDates)) return 'finalizado';

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

/** Cuántas rondas ya pasaron (incluye la de hoy), 1-indexed. Toma la mayor entre lo que
 * dicen las fechas y las rondas que ya tienen alguna tarjeta cargada. Solo tiene sentido
 * si el torneo está en curso. */
export function rondaActualDeTorneo(roundDates: (string | null)[], roundsWithScores: number[] = []): number {
	const hoy = new Date();
	hoy.setHours(0, 0, 0, 0);
	const fechas = roundDates.filter((d): d is string => !!d).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
	const pasadas = fechas.filter(f => f <= hoy).length;
	return Math.max(1, pasadas, roundsWithScores.length);
}
