import type { Timestamp } from 'firebase/firestore';

// users/{uid}
export interface UserDoc {
	uid: string;
	username: string; // lowercase, único, sin '@'
	displayName: string;
	email: string;
	photoURL: string | null;
	matricula: string | null; // matrícula de la asociación de golf — el handicap se sincroniza a partir de esto
	handicap: number | null; // no se edita a mano: se vincula automáticamente a partir de la matrícula
	club: string | null;
	clubId: string | null;
	bio: string | null;
	followersCount: number;
	followingCount: number;
	roundsCount: number;
	bestScore: number | null;
	provider: 'password' | 'google' | 'apple';
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

// usernames/{usernameLower} — lock de unicidad, create-only. Lectura pública sin auth
// a propósito: hace falta poder resolver @usuario -> email ANTES de loguearse.
export interface UsernameDoc {
	uid: string;
	email: string;
}

// users/{uid}/notifications/{notifId}
export interface NotificationDoc {
	id: string;
	type: 'group_added' | 'tournament_added'; // se amplía a medida que aparezcan más eventos
	icon: string; // nombre de Ionicons
	text: string;
	read: boolean;
	createdAt: Timestamp;
}

// follows/{followerUid}_{followingUid}
// A propósito sin nombre/initials desnormalizados: FollowListScreen busca el
// UserDoc real de cada uid, así nunca muestra un nombre viejo si alguien lo cambia.
export interface FollowDoc {
	followerUid: string;
	followingUid: string;
	createdAt: Timestamp;
}

// rounds/{roundId}
export interface HoleResult {
	number: number;
	score: number;
	par: number;
}

export interface RoundDoc {
	id: string;
	userId: string;
	authorName: string; // denormalizado para no tener que leer el user doc al armar el feed
	authorInitials: string;
	authorPhotoURL: string | null;
	courseId: string | null;
	courseName: string;
	clubName: string;
	date: Timestamp;
	holes: HoleResult[]; // 18 elementos
	totalScore: number;
	totalPar: number;
	vsPar: number;
	eagles: number;
	birdies: number;
	pars: number;
	bogeys: number;
	doublesPlus: number;
	photos: string[];
	visibility: 'public' | 'friends' | 'private';
	likesCount: number;
	commentsCount: number;
	tournamentIds: string[]; // torneos a los que el jugador vinculó esta ronda al publicarla
	createdAt: Timestamp;
}

// posts/{postId} — feed principal (home)
export type PostKind = 'round' | 'hcp_drop' | 'milestone';

export interface PostDoc {
	id: string;
	authorId: string;
	authorName: string;
	authorInitials: string;
	authorAvatarColor: string;
	kind: PostKind;
	roundId: string | null;
	hcpFrom: number | null;
	hcpTo: number | null;
	milestoneTitle: string | null;
	milestoneIcon: string | null;
	courseName: string | null;
	likesCount: number;
	commentsCount: number;
	createdAt: Timestamp;
}

// {rounds|posts|groups/{groupId}/posts}/{parentId}/comments/{commentId}
export interface CommentDoc {
	id: string;
	authorId: string;
	authorName: string;
	authorInitials: string;
	authorAvatarColor: string;
	authorPhotoURL: string | null;
	text: string;
	createdAt: Timestamp;
}

// stories/{storyId}
export interface StoryDoc {
	id: string;
	userId: string;
	userName: string;
	userInitials: string;
	photoURL: string;
	createdAt: Timestamp;
	expiresAt: Timestamp;
}

// clubs/{clubId}
export interface ClubDoc {
	id: string;
	name: string;
	courses: string[];
}

// groups/{groupId}
export interface GroupDoc {
	id: string;
	name: string;
	type: 'club' | 'privado';
	photoURL: string | null;
	membersCount: number;
	memberUids: string[]; // denormalizado para consultar "mis grupos" con array-contains
	createdBy: string;
	createdAt: Timestamp;
	lastActivityAt: Timestamp;
}

// groups/{groupId}/members/{uid}
export interface GroupMemberDoc {
	uid: string;
	displayName: string;
	photoURL: string | null;
	handicap: number | null;
	role: 'admin' | 'member';
	joinedAt: Timestamp;
}

// groups/{groupId}/posts/{postId}
export type GroupPostKind = 'texto' | 'fotos' | 'sistema' | 'venta' | 'evento';

export interface GroupPostDoc {
	id: string;
	authorId: string;
	authorName: string;
	authorInitials: string;
	authorPhotoURL: string | null;
	kind: GroupPostKind;
	text: string | null;
	photos: string[] | null;
	price: string | null;
	eventDate: Timestamp | null;
	eventLocation: string | null;
	attendeesCount: number | null;
	pinned: boolean;
	likesCount: number;
	commentsCount: number;
	createdAt: Timestamp;
}

// groups/{groupId}/posts/{postId}/attendees/{uid}
export interface AttendeeDoc {
	uid: string;
	displayName: string;
	respondedAt: Timestamp;
}

// tournaments/{tournamentId}
// El estado (próximo/en curso/finalizado) y la ronda actual se derivan de roundDates,
// roundsWithScores y finalizedManually, no se guardan — así nunca quedan desincronizados.
// "Finalizado" es personal: cada participante lo ve cuando cargó todas sus rondas, o
// cuando el admin cierra el torneo entero con finalizedManually.
export type TournamentModality = 'Stroke Play' | 'Stableford' | 'Match Play';

export interface TournamentDoc {
	id: string;
	name: string;
	modality: TournamentModality;
	groupId: string | null; // null = torneo libre/abierto
	groupName: string | null;
	createdBy: string;
	createdByName: string;
	roundDates: (string | null)[]; // ISO yyyy-mm-dd, null = "a definir"
	participantUids: string[]; // denormalizado para poder consultar "mis torneos" con array-contains
	participantsCount: number;
	roundsWithScores: number[]; // índices (0-based) de rondas que ya tienen al menos una tarjeta de algún participante
	finalizedManually: boolean; // el admin cerró el torneo a mano — finalizado para todos, jugaron o no
	createdAt: Timestamp;
}

// Copia liviana de una tarjeta, guardada dentro del participante para poder mostrar el
// detalle de la ronda (y armar la clasificación por ronda) sin tener que leer la colección
// rounds desde el torneo — esa lectura chocaría con la regla de seguridad de rounds en queries de lista.
export interface TournamentRoundScore {
	roundIndex: number; // 0-based, posición dentro de roundDates
	totalScore: number;
	totalPar: number;
	vsPar: number;
	holes: HoleResult[];
	courseName: string;
	clubName: string;
	date: Timestamp;
}

// tournaments/{tournamentId}/participants/{uid}
export interface TournamentParticipantDoc {
	uid: string;
	displayName: string;
	initials: string;
	photoURL: string | null;
	handicap: number | null;
	roundsPlayed: number; // cuántas rondas de este jugador se vincularon al torneo
	vsParTotal: number; // suma del vsPar de esas rondas — la clasificación se ordena por esto
	roundScores: Record<string, TournamentRoundScore>; // clave = roundIndex como string (los mapas de Firestore piden claves string)
	joinedAt: Timestamp;
}

// achievements/{achievementId}
export interface AchievementDoc {
	id: string;
	userId: string;
	icon: string;
	title: string;
	subtitle: string;
	date: Timestamp;
	createdAt: Timestamp;
}
