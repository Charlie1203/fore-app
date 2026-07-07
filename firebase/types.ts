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

// usernames/{usernameLower} — lock de unicidad, create-only
export interface UsernameDoc {
	uid: string;
}

// follows/{followerUid}_{followingUid}
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
	createdBy: string;
	createdAt: Timestamp;
	lastActivityAt: Timestamp;
}

// groups/{groupId}/members/{uid}
export interface GroupMemberDoc {
	uid: string;
	displayName: string;
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
export type TournamentModality = 'Stroke Play' | 'Stableford' | 'Match Play' | 'Better Ball' | 'Scramble';
export type TournamentStatus = 'próximo' | 'en curso' | 'finalizado';

export interface TournamentDoc {
	id: string;
	name: string;
	modality: TournamentModality;
	status: TournamentStatus;
	groupId: string | null; // null = torneo libre/abierto
	roundsTotal: number;
	currentRound: number | null;
	date: Timestamp;
	createdBy: string;
	createdAt: Timestamp;
}

// tournaments/{tournamentId}/participants/{uid}
export interface TournamentParticipantDoc {
	uid: string;
	displayName: string;
	handicap: number;
	joinedAt: Timestamp;
}

// tournaments/{tournamentId}/leaderboard/{uid}
export interface TournamentLeaderboardDoc {
	uid: string;
	displayName: string;
	position: number;
	score: number;
	diff: number;
	updatedAt: Timestamp;
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
