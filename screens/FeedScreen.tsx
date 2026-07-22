import {
	View,
	Text,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	Animated,
	Image,
	Dimensions,
	Modal,
	StatusBar,
	TextInput,
	Platform,
	ActivityIndicator,
	Keyboard,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import Svg, { Ellipse, Line, Polygon, Circle, Path } from "react-native-svg";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
	collection, query, where, orderBy, limit, onSnapshot,
	doc, getDoc, setDoc, deleteDoc, updateDoc, addDoc, increment, serverTimestamp,
} from "firebase/firestore";
import type { RoundDoc, CommentDoc } from "../firebase/types";

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;

function GolfBallIcon({ color, size = 16 }: { color: string; size?: number }) {
	const d = [
		"M 11,9.5 a 1.1,0.7 0 0,1 2.2,0",
		"M 14,9.5 a 1.1,0.7 0 0,1 2.2,0",
		"M 17,10 a 1.1,0.7 0 0,1 2.2,0",
		"M 9,12.5 a 1.1,0.7 0 0,1 2.2,0",
		"M 12,12.5 a 1.1,0.7 0 0,1 2.2,0",
		"M 15,12.5 a 1.1,0.7 0 0,1 2.2,0",
		"M 18,13 a 1.1,0.7 0 0,1 2.2,0",
		"M 8,15.5 a 1.1,0.7 0 0,1 2.2,0",
		"M 11,15.5 a 1.1,0.7 0 0,1 2.2,0",
		"M 14,15.5 a 1.1,0.7 0 0,1 2.2,0",
		"M 17,16 a 1.1,0.7 0 0,1 2.2,0",
		"M 8,18.5 a 1.1,0.7 0 0,1 2.2,0",
		"M 11,18.5 a 1.1,0.7 0 0,1 2.2,0",
		"M 14,18.5 a 1.1,0.7 0 0,1 2.2,0",
	].join(" ");
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24">
			<Circle
				cx="12"
				cy="12"
				r="10"
				stroke={color}
				strokeWidth="1.6"
				fill="none"
			/>
			<Path
				d={d}
				stroke={color}
				strokeWidth="1.3"
				fill="none"
				strokeLinecap="round"
			/>
		</Svg>
	);
}

function GolfFlagIcon({ color, size = 17 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 2 24 24">
			<Ellipse
				cx="12"
				cy="20"
				rx="7"
				ry="2.5"
				stroke={color}
				strokeWidth="1.8"
				fill="none"
			/>
			<Line
				x1="12"
				y1="20"
				x2="12"
				y2="4"
				stroke={color}
				strokeWidth="1.8"
				strokeLinecap="round"
			/>
			<Polygon points="12,4 21,8 12,12" fill={color} />
		</Svg>
	);
}

const COLORS = {
	bg: "#0f0f0f",
	card: "#1a1a1a",
	border: "#2a2a2a",
	lime: "#c8e03a",
	white: "#f0f0f0",
	muted: "#666",
	dim: "#444",
	red: "#e07070",
	dark2: "#242424",
};

const STORIES_OTHERS = [
	{ initials: "PE", bg: "#333", color: "#aaa", name: "Pepe", photo: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800", seen: false },
	{ initials: "CA", bg: "#2a3a1a", color: "#c8e03a", name: "Carlitos", photo: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800", seen: false },
	{ initials: "MR", bg: "#3a2a1a", color: "#e0a03a", name: "Manu R.", photo: null, seen: false },
];

function StoryViewer({ stories, initialIndex, onClose }: { stories: typeof STORIES_OTHERS; initialIndex: number; onClose: () => void }) {
	const [index, setIndex] = useState(initialIndex);
	const story = stories[index];

	const goNext = () => {
		if (index < stories.length - 1) setIndex(i => i + 1);
		else onClose();
	};
	const goPrev = () => {
		if (index > 0) setIndex(i => i - 1);
	};

	if (!story) return null;

	return (
		<Modal visible animationType="fade" onRequestClose={onClose}>
			{/* Fondo negro con la hora/notch libres; la tarjeta de la historia va con margen y esquinas redondeadas, como Instagram */}
			<SafeAreaView style={styles.storyModal} edges={['top', 'bottom']}>
				<View style={styles.storyCard}>
					{story.photo
						? <Image source={{ uri: story.photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
						: <View style={[StyleSheet.absoluteFill, { backgroundColor: story.bg, alignItems: 'center', justifyContent: 'center' }]}>
							<Text style={{ fontSize: 64, fontWeight: '800', color: story.color }}>{story.initials}</Text>
						</View>
					}

					{/* Zonas de toque: derecha avanza, izquierda retrocede — como Instagram */}
					<View style={styles.storyTapZones} pointerEvents="box-none">
						<TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={goPrev} />
						<TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={goNext} />
					</View>

					<View style={[styles.storyOverlay, { paddingTop: 8 }]} pointerEvents="box-none">
						<View style={styles.storyBarRow}>
							{stories.map((_, i) => (
								<View key={i} style={styles.storyBarTrack}>
									<View style={[styles.storyBarFill, { width: i <= index ? '100%' : '0%' }]} />
								</View>
							))}
						</View>
						<View style={styles.storyHeader}>
							<View style={[styles.storyAvatarSmall, { backgroundColor: story.bg }]}>
								<Text style={[styles.storyAvatarText, { color: story.color }]}>{story.initials}</Text>
							</View>
							<Text style={styles.storyName}>{story.name}</Text>
							<TouchableOpacity onPress={onClose} style={{ marginLeft: 'auto', padding: 4 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
								<Ionicons name="close" size={26} color="#fff" />
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</SafeAreaView>
		</Modal>
	);
}

function Avatar({
	initials,
	bg,
	color,
	size = 38,
}: {
	initials: string;
	bg: string;
	color: string;
	size?: number;
}) {
	return (
		<View
			style={[
				styles.avatar,
				{ width: size, height: size, backgroundColor: bg },
			]}
		>
			<Text style={[styles.avatarText, { color, fontSize: size * 0.34 }]}>
				{initials}
			</Text>
		</View>
	);
}

function HoleCell({
	num,
	score,
	par,
}: {
	num: number;
	score: number;
	par: number;
}) {
	const diff = score - par;

	if (diff <= -2) {
		return (
			<View style={styles.holeWrap}>
				<Text style={styles.holeNum}>{num}</Text>
				<View
					style={[
						styles.holeOuter,
						{ borderColor: COLORS.lime, backgroundColor: "#0a1a00" },
					]}
				>
					<View style={[styles.holeInner, { borderColor: COLORS.lime }]}>
						<Text style={[styles.holeScore, { color: COLORS.lime }]}>
							{score}
						</Text>
					</View>
				</View>
			</View>
		);
	}
	if (diff === -1) {
		return (
			<View style={styles.holeWrap}>
				<Text style={styles.holeNum}>{num}</Text>
				<View
					style={[
						styles.holeCircle,
						{ borderColor: COLORS.lime, backgroundColor: "#1e2e0a" },
					]}
				>
					<Text style={[styles.holeScore, { color: COLORS.lime }]}>
						{score}
					</Text>
				</View>
			</View>
		);
	}
	if (diff === 0) {
		return (
			<View style={styles.holeWrap}>
				<Text style={styles.holeNum}>{num}</Text>
				<View style={[styles.holePlain, { backgroundColor: "#222" }]}>
					<Text style={[styles.holeScore, { color: COLORS.dim }]}>{score}</Text>
				</View>
			</View>
		);
	}
	if (diff === 1) {
		return (
			<View style={styles.holeWrap}>
				<Text style={styles.holeNum}>{num}</Text>
				<View
					style={[
						styles.holeSquare,
						{ borderColor: COLORS.red, backgroundColor: "#2a1a1a" },
					]}
				>
					<Text style={[styles.holeScore, { color: COLORS.red }]}>{score}</Text>
				</View>
			</View>
		);
	}
	if (diff === 2) {
		return (
			<View style={styles.holeWrap}>
				<Text style={styles.holeNum}>{num}</Text>
				<View
					style={[
						styles.holeOuter,
						{
							borderColor: COLORS.red,
							backgroundColor: "#3a1010",
							borderRadius: 3,
						},
					]}
				>
					<View
						style={[
							styles.holeInner,
							{ borderColor: COLORS.red, borderRadius: 2 },
						]}
					>
						<Text style={[styles.holeScore, { color: COLORS.red }]}>
							{score}
						</Text>
					</View>
				</View>
			</View>
		);
	}
	return (
		<View style={styles.holeWrap}>
			<Text style={styles.holeNum}>{num}</Text>
			<View style={[styles.holeTriangleWrap, { backgroundColor: "#3a0a0a" }]}>
				<Text style={[styles.holeScore, { color: "#ff6060" }]}>{score}</Text>
				<View style={styles.triangleTop} />
			</View>
		</View>
	);
}

function Scorecard({
	holes,
	score,
	vsPar,
}: {
	holes: { score: number; par: number }[];
	score: number;
	vsPar: number;
}) {
	const eagles = holes.filter((h) => h.score - h.par <= -2).length;
	const birdies = holes.filter((h) => h.score - h.par === -1).length;
	const pares = holes.filter((h) => h.score - h.par === 0).length;
	const bogeys = holes.filter((h) => h.score - h.par >= 1).length;
	return (
		<View style={styles.scorecard}>
			<View style={styles.scHeader}>
				<Text style={styles.scLabel}>Frente · Vuelta</Text>
				<Text
					style={[
						styles.scTotal,
						{ color: vsPar <= 0 ? COLORS.lime : COLORS.red },
					]}
				>
					{score} · {vsPar > 0 ? "+" : ""}
					{vsPar}
				</Text>
			</View>
			<View style={styles.holesRow}>
				{holes.slice(0, 9).map((h, i) => (
					<HoleCell key={i} num={i + 1} score={h.score} par={h.par} />
				))}
			</View>
			<View style={[styles.holesRow, { marginBottom: 6 }]}>
				{holes.slice(9, 18).map((h, i) => (
					<HoleCell key={i} num={i + 10} score={h.score} par={h.par} />
				))}
			</View>
			<View style={styles.scSummary}>
				{eagles > 0 && (
					<View style={styles.scItem}>
						<Text style={[styles.scVal, { color: COLORS.lime }]}>{eagles}</Text>
						<Text style={styles.scLbl}>Eagles</Text>
					</View>
				)}
				<View style={styles.scItem}>
					<Text style={[styles.scVal, { color: COLORS.lime }]}>{birdies}</Text>
					<Text style={styles.scLbl}>Birdies</Text>
				</View>
				<View style={styles.scItem}>
					<Text style={styles.scVal}>{pares}</Text>
					<Text style={styles.scLbl}>Pares</Text>
				</View>
				<View style={styles.scItem}>
					<Text style={[styles.scVal, { color: COLORS.red }]}>{bogeys}</Text>
					<Text style={styles.scLbl}>Bogeys</Text>
				</View>
				<View style={styles.scItem}>
					<Text
						style={[
							styles.scVal,
							{ color: vsPar <= 0 ? COLORS.lime : COLORS.red },
						]}
					>
						{vsPar > 0 ? "+" : ""}
						{vsPar}
					</Text>
					<Text style={styles.scLbl}>vs par</Text>
				</View>
			</View>
		</View>
	);
}

const MOCK_COMMENTS = [
	{ id: '1', autor: 'Pepe Noceti', initials: 'PE', bg: '#333', color: '#c8e03a', texto: 'Joya vuelta!', tiempo: 'hace 1 h' },
	{ id: '2', autor: 'Carlitos Laprida', initials: 'CA', bg: '#2a3a1a', color: '#c8e03a', texto: 'Crack, cuándo repetimos?', tiempo: 'hace 30 min' },
];

function formatFechaComentario(ts: any): string {
	if (!ts?.toDate) return 'ahora';
	return ts.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function CommentsSheet({ visible, roundId, count, onClose }: { visible: boolean; roundId?: string; count: number; onClose: () => void }) {
	const navigation = useNavigation<any>();
	const { firebaseUser, userDoc } = useAuth();
	const [text, setText] = useState('');
	const [comments, setComments] = useState<CommentDoc[]>([]);
	const [sending, setSending] = useState(false);
	const scrollRef = useRef<ScrollView>(null);
	const inputRef = useRef<TextInput>(null);
	const insets = useSafeAreaInsets();
	const [kbHeight, setKbHeight] = useState(0);

	const myInitials = (userDoc?.displayName ?? '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

	// Solo iOS: en Android el teclado ya resizea la ventana nativa, no hace falta compensar a mano.
	useEffect(() => {
		if (Platform.OS !== 'ios') return;
		const showSub = Keyboard.addListener('keyboardWillShow', e => setKbHeight(e.endCoordinates.height));
		const hideSub = Keyboard.addListener('keyboardWillHide', () => setKbHeight(0));
		return () => { showSub.remove(); hideSub.remove(); };
	}, []);

	useEffect(() => {
		if (!visible || !roundId) return;
		const q = query(collection(db, 'rounds', roundId, 'comments'), orderBy('createdAt', 'asc'));
		const unsubscribe = onSnapshot(q, snap => setComments(snap.docs.map(d => ({ ...d.data(), id: d.id }) as CommentDoc)));
		return unsubscribe;
	}, [visible, roundId]);

	const abrirPerfil = (c: typeof MOCK_COMMENTS[0] | CommentDoc) => {
		const name = 'autor' in c ? c.autor : c.authorName;
		const initials = 'autor' in c ? c.initials : c.authorInitials;
		const bg = 'autor' in c ? c.bg : COLORS.lime;
		const color = 'autor' in c ? c.color : '#0f0f0f';
		navigation.navigate('PerfilUsuario', { viewUser: { name, initials, bg, color } });
	};

	const enviar = async () => {
		const value = text.trim();
		if (!value || !roundId || !firebaseUser || sending) return;
		setSending(true);
		setText('');
		try {
			const authorName = userDoc?.displayName ?? 'Vos';
			const authorInitials = authorName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
			await addDoc(collection(db, 'rounds', roundId, 'comments'), {
				authorId: firebaseUser.uid,
				authorName,
				authorInitials,
				authorAvatarColor: '#0f0f0f',
				text: value,
				createdAt: serverTimestamp(),
			});
			await updateDoc(doc(db, 'rounds', roundId), { commentsCount: increment(1) });
		} catch {
			setText(value); // se perdió el envío, se lo devolvemos para que no lo pierda
		} finally {
			setSending(false);
		}
	};

	return (
		<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
			<View style={{ flex: 1, justifyContent: 'flex-end' }}>
				<TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
				<View style={styles.commentsSheet}>
					<View style={styles.commentsHandle} />
					<View style={styles.commentsHeader}>
						<Text style={styles.commentsTitle}>{count} {count === 1 ? 'comentario' : 'comentarios'}</Text>
						<TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
							<Ionicons name="close" size={20} color={COLORS.muted} />
						</TouchableOpacity>
					</View>
					<ScrollView
						ref={scrollRef}
						style={{ flex: 1 }}
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps="handled"
						onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
					>
						{roundId ? (
							comments.length > 0 ? comments.map(c => (
								<View key={c.id} style={styles.commentRow}>
									<TouchableOpacity onPress={() => abrirPerfil(c)}>
										<View style={[styles.commentAvatar, { backgroundColor: COLORS.lime }]}>
											<Text style={[styles.commentAvatarText, { color: '#0f0f0f' }]}>{c.authorInitials}</Text>
										</View>
									</TouchableOpacity>
									<View style={styles.commentBubble}>
										<View style={styles.commentMeta}>
											<TouchableOpacity onPress={() => abrirPerfil(c)}>
												<Text style={styles.commentAutor}>{c.authorName}</Text>
											</TouchableOpacity>
											<Text style={styles.commentTiempo}>{formatFechaComentario(c.createdAt)}</Text>
										</View>
										<Text style={styles.commentTexto}>{c.text}</Text>
									</View>
								</View>
							)) : <Text style={styles.commentsEmpty}>Sin comentarios todavía. ¡Sé el primero!</Text>
						) : (
							MOCK_COMMENTS.map(c => (
								<View key={c.id} style={styles.commentRow}>
									<TouchableOpacity onPress={() => abrirPerfil(c)}>
										<View style={[styles.commentAvatar, { backgroundColor: c.bg }]}>
											<Text style={[styles.commentAvatarText, { color: c.color }]}>{c.initials}</Text>
										</View>
									</TouchableOpacity>
									<View style={styles.commentBubble}>
										<View style={styles.commentMeta}>
											<TouchableOpacity onPress={() => abrirPerfil(c)}>
												<Text style={styles.commentAutor}>{c.autor}</Text>
											</TouchableOpacity>
											<Text style={styles.commentTiempo}>{c.tiempo}</Text>
										</View>
										<Text style={styles.commentTexto}>{c.texto}</Text>
									</View>
								</View>
							))
						)}
					</ScrollView>
					<View style={[styles.commentInput, { paddingBottom: kbHeight > 0 ? kbHeight + 12 : 12 + insets.bottom }]}>
						<View style={[styles.commentAvatar, { backgroundColor: COLORS.lime }]}>
							<Text style={[styles.commentAvatarText, { color: '#0f0f0f' }]}>{myInitials}</Text>
						</View>
						<TextInput
							ref={inputRef}
							style={styles.commentTextInput}
							placeholder={roundId ? 'Comentar...' : 'Comentar (demo)'}
							placeholderTextColor="#444"
							value={text}
							onChangeText={setText}
							editable={!!roundId && !sending}
							returnKeyType="send"
							onSubmitEditing={enviar}
						/>
						{sending
							? <ActivityIndicator size="small" color={COLORS.lime} />
							: text.length > 0 && (
								<TouchableOpacity onPress={enviar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
									<Ionicons name="send" size={18} color={COLORS.lime} />
								</TouchableOpacity>
							)
						}
					</View>
				</View>
			</View>
		</Modal>
	);
}

function CardFooter({
	roundId,
	likes,
	comments,
	liked = false,
}: {
	roundId?: string;
	likes: number;
	comments: number;
	liked?: boolean;
}) {
	const { firebaseUser } = useAuth();
	const [isLiked, setIsLiked] = useState(liked);
	const [busy, setBusy] = useState(false);
	const [showComments, setShowComments] = useState(false);

	useEffect(() => {
		if (!roundId || !firebaseUser) return;
		getDoc(doc(db, 'rounds', roundId, 'likes', firebaseUser.uid)).then(snap => setIsLiked(snap.exists()));
	}, [roundId, firebaseUser?.uid]);

	const toggleLike = async () => {
		if (!roundId || !firebaseUser) { setIsLiked(l => !l); return; }
		if (busy) return;
		setBusy(true);
		const likeRef = doc(db, 'rounds', roundId, 'likes', firebaseUser.uid);
		const roundRef = doc(db, 'rounds', roundId);
		try {
			if (isLiked) {
				await deleteDoc(likeRef);
				await updateDoc(roundRef, { likesCount: increment(-1) });
				setIsLiked(false);
			} else {
				await setDoc(likeRef, { uid: firebaseUser.uid, createdAt: serverTimestamp() });
				await updateDoc(roundRef, { likesCount: increment(1) });
				setIsLiked(true);
			}
		} catch {
			// noop — el estado visual vuelve a quedar como estaba en el próximo render
		} finally {
			setBusy(false);
		}
	};

	return (
		<>
			<CommentsSheet visible={showComments} roundId={roundId} count={comments} onClose={() => setShowComments(false)} />
			<View style={styles.cardFooter}>
				<TouchableOpacity style={styles.action} onPress={toggleLike} disabled={busy}>
					<GolfFlagIcon color={isLiked ? COLORS.lime : COLORS.dim} size={17} />
					<Text style={[styles.actionText, isLiked && { color: COLORS.lime }]}>{likes}</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.action} onPress={() => setShowComments(true)}>
					<GolfBallIcon color={COLORS.dim} size={16} />
					<Text style={styles.actionText}>{comments}</Text>
				</TouchableOpacity>
			</View>
		</>
	);
}

function HcpCard() {
	const navigation = useNavigation<any>();
	const abrirPerfil = () => navigation.navigate('PerfilUsuario', { viewUser: { name: 'Pepe Noceti', initials: 'PE', bg: '#333', color: COLORS.lime } });
	return (
		<View style={styles.card}>
			<TouchableOpacity style={styles.cardHeader} onPress={abrirPerfil}>
				<Avatar initials="PE" bg="#333" color={COLORS.lime} />
				<View style={styles.cardMeta}>
					<Text style={styles.cardName}>Pepe Noceti</Text>
					<Text style={styles.cardTime}>hace 2 horas</Text>
				</View>
				<Text style={styles.dots}>···</Text>
			</TouchableOpacity>
			<View style={styles.cardBody}>
				<View style={styles.hcpRow}>
					<View style={styles.hcpBadge}>
						<Text style={styles.hcpNum}>7.3</Text>
						<Text style={styles.hcpLabel}>HCP</Text>
					</View>
					<View style={{ flex: 1 }}>
						<Text style={styles.bodyText}>
							<Text style={styles.bold}>Pepe</Text> bajó su handicap a{" "}
							<Text style={styles.bold}>7.3</Text> — mejor marca personal
						</Text>
						<Text style={styles.trend}>▼ −0.8 pts este mes</Text>
					</View>
				</View>
			</View>
			<CardFooter likes={14} comments={3} liked />
		</View>
	);
}

function RoundSummary({
	holes,
	score,
	vsPar,
	onExpand,
}: {
	holes: { score: number; par: number }[];
	score: number;
	vsPar: number;
	onExpand: () => void;
}) {
	const eagles = holes.filter((h) => h.score - h.par <= -2).length;
	const birdies = holes.filter((h) => h.score - h.par === -1).length;
	const pares = holes.filter((h) => h.score - h.par === 0).length;
	const bogeys = holes.filter((h) => h.score - h.par === 1).length;
	const doubles = holes.filter((h) => h.score - h.par >= 2).length;

	return (
		<View style={styles.summaryBox}>
			<View style={styles.summaryScores}>
				<View style={styles.summaryMain}>
					<Text style={styles.summaryBigScore}>{score}</Text>
					<Text
						style={[
							styles.summaryVsPar,
							{ color: vsPar <= 0 ? COLORS.lime : COLORS.red },
						]}
					>
						{vsPar > 0 ? "+" : ""}
						{vsPar}
					</Text>
				</View>
				<View style={styles.summaryStats}>
					{eagles > 0 && (
						<View style={styles.summaryItem}>
							<Text style={[styles.summaryVal, { color: COLORS.lime }]}>
								{eagles}
							</Text>
							<Text style={styles.summaryLbl}>Eagles</Text>
						</View>
					)}
					<View style={styles.summaryItem}>
						<Text style={[styles.summaryVal, { color: COLORS.lime }]}>
							{birdies}
						</Text>
						<Text style={styles.summaryLbl}>Birdies</Text>
					</View>
					<View style={styles.summaryItem}>
						<Text style={styles.summaryVal}>{pares}</Text>
						<Text style={styles.summaryLbl}>Pares</Text>
					</View>
					<View style={styles.summaryItem}>
						<Text style={[styles.summaryVal, { color: COLORS.red }]}>
							{bogeys}
						</Text>
						<Text style={styles.summaryLbl}>Bogeys</Text>
					</View>
					{doubles > 0 && (
						<View style={styles.summaryItem}>
							<Text style={[styles.summaryVal, { color: "#ff6060" }]}>
								{doubles}
							</Text>
							<Text style={styles.summaryLbl}>Dobles+</Text>
						</View>
					)}
				</View>
			</View>
			<TouchableOpacity style={styles.expandBtn} onPress={onExpand}>
				<Text style={styles.expandBtnText}>Ver tarjeta</Text>
				<Ionicons name="chevron-down" size={13} color={COLORS.lime} />
			</TouchableOpacity>
		</View>
	);
}

function PhotoCarousel({ photos }: { photos: string[] }) {
	const [index, setIndex] = useState(0);
	return (
		<View>
			<ScrollView
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onMomentumScrollEnd={e => {
					setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
				}}
			>
				{photos.map((uri, i) => (
					<Image
						key={i}
						source={{ uri }}
						style={{ width: SCREEN_W, height: SCREEN_W * 0.65 }}
						resizeMode="cover"
					/>
				))}
			</ScrollView>
			{photos.length > 1 && (
				<View style={styles.photoDots}>
					{photos.map((_, i) => (
						<View key={i} style={[styles.photoDot, i === index && styles.photoDotActive]} />
					))}
				</View>
			)}
		</View>
	);
}

function formatFechaRonda(ts: any): string {
	if (!ts?.toDate) return 'recién';
	return ts.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function RoundCard({ round }: { round: RoundDoc }) {
	const navigation = useNavigation<any>();
	const { firebaseUser } = useAuth();
	const [expanded, setExpanded] = useState(false);
	const hasPhotos = round.photos.length > 0;
	const esPropio = round.userId === firebaseUser?.uid;

	const abrirPerfil = () => esPropio
		? navigation.navigate('Tabs', { screen: 'Perfil' })
		: navigation.navigate('PerfilUsuario', { viewUser: { name: round.authorName, initials: round.authorInitials, bg: COLORS.lime, color: '#0f0f0f' } });

	return (
		<View style={styles.card}>
			<TouchableOpacity style={styles.cardHeader} onPress={abrirPerfil}>
				<Avatar initials={round.authorInitials} bg={COLORS.lime} color="#0f0f0f" />
				<View style={styles.cardMeta}>
					<Text style={styles.cardName}>{round.authorName}</Text>
					<Text style={styles.cardCourse}>📍 {round.clubName}{round.courseName ? ` · ${round.courseName}` : ''}</Text>
					<Text style={styles.cardTime}>{formatFechaRonda(round.date)}</Text>
				</View>
				<Text style={styles.dots}>···</Text>
			</TouchableOpacity>

			{hasPhotos ? (
				<>
					<PhotoCarousel photos={round.photos} />
					<View style={styles.cardBody}>
						<View style={styles.photoScoreRow}>
							<View style={styles.photoScoreMain}>
								<Text style={styles.photoScore}>{round.totalScore}</Text>
								<Text style={[styles.photoVsPar, { color: round.vsPar <= 0 ? COLORS.lime : COLORS.red }]}>
									{round.vsPar > 0 ? '+' : ''}{round.vsPar}
								</Text>
							</View>
							<TouchableOpacity style={styles.verTarjetaBtn} onPress={() => setExpanded(!expanded)}>
								<Text style={styles.verTarjetaBtnText}>{expanded ? 'Ocultar' : 'Ver tarjeta'}</Text>
								<Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={COLORS.lime} />
							</TouchableOpacity>
						</View>
						{expanded && <Scorecard holes={round.holes} score={round.totalScore} vsPar={round.vsPar} />}
					</View>
				</>
			) : (
				<View style={styles.cardBody}>
					{expanded ? (
						<>
							<Scorecard holes={round.holes} score={round.totalScore} vsPar={round.vsPar} />
							<TouchableOpacity style={styles.collapseBtn} onPress={() => setExpanded(false)}>
								<Text style={styles.expandBtnText}>Ocultar tarjeta</Text>
								<Ionicons name="chevron-up" size={13} color={COLORS.lime} />
							</TouchableOpacity>
						</>
					) : (
						<RoundSummary holes={round.holes} score={round.totalScore} vsPar={round.vsPar} onExpand={() => setExpanded(true)} />
					)}
				</View>
			)}

			<CardFooter roundId={round.id} likes={round.likesCount} comments={round.commentsCount} />
		</View>
	);
}

function MilestoneCard() {
	const navigation = useNavigation<any>();
	const abrirPerfil = () => navigation.navigate('PerfilUsuario', { viewUser: { name: 'Carlitos Laprida', initials: 'CA', bg: '#2a3a1a', color: COLORS.lime } });
	return (
		<View style={styles.card}>
			<TouchableOpacity style={styles.cardHeader} onPress={abrirPerfil}>
				<Avatar initials="CA" bg="#2a3a1a" color={COLORS.lime} />
				<View style={styles.cardMeta}>
					<Text style={styles.cardName}>Carlitos Laprida</Text>
					<Text style={styles.cardTime}>ayer</Text>
				</View>
				<Text style={styles.dots}>···</Text>
			</TouchableOpacity>
			<View style={styles.cardBody}>
				<View style={styles.milestone}>
					<View style={styles.milestoneIcon}>
						<Text style={{ fontSize: 24 }}>🏆</Text>
					</View>
					<View style={{ flex: 1 }}>
						<Text style={[styles.bold, { color: COLORS.white, fontSize: 14 }]}>
							Primer eagle de su carrera
						</Text>
						<Text style={[styles.cardTime, { marginTop: 2 }]}>
							Hoyo 7 · Martindale CC
						</Text>
					</View>
				</View>
			</View>
			<CardFooter likes={21} comments={7} />
		</View>
	);
}


export default function FeedScreen() {
	const route = useRoute<any>();
	const navigation = useNavigation<any>();
	const { firebaseUser } = useAuth();
	const toastOpacity = useRef(new Animated.Value(0)).current;
	const [showToast, setShowToast] = useState(false);
	const [myStory, setMyStory] = useState<string | null>(null);
	const [viewingIndex, setViewingIndex] = useState<number | null>(null);
	const [seenStories, setSeenStories] = useState<Set<string>>(new Set());
	const [rounds, setRounds] = useState<RoundDoc[]>([]);
	const [hayNotifsSinLeer, setHayNotifsSinLeer] = useState(false);

	useEffect(() => {
		if (!firebaseUser) return;
		const q = query(collection(db, 'users', firebaseUser.uid, 'notifications'), where('read', '==', false), limit(1));
		return onSnapshot(q, snap => setHayNotifsSinLeer(!snap.empty));
	}, [firebaseUser?.uid]);

	const storiesConNombre = STORIES_OTHERS.filter(s => s.photo);
	const combinedStories = myStory
		? [{ initials: 'JN', bg: COLORS.lime, color: '#0f0f0f', name: 'Tu historia', photo: myStory, seen: false }, ...storiesConNombre]
		: storiesConNombre;

	useEffect(() => {
		// Feed de rondas públicas — todavía sin filtrar por a quién seguís, eso llega cuando conectemos follows.
		const q = query(collection(db, 'rounds'), where('visibility', '==', 'public'), orderBy('date', 'desc'), limit(20));
		const unsubscribe = onSnapshot(q, snap => {
			setRounds(snap.docs.map(d => d.data() as RoundDoc));
		});
		return unsubscribe;
	}, []);

	useEffect(() => {
		if (!route.params?.showSuccess) return;
		setShowToast(true);
		Animated.sequence([
			Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
			Animated.delay(2000),
			Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
		]).start(() => setShowToast(false));
	}, [route.params?.showSuccess]);

	const addMyStory = async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		const options = { quality: 0.8 as const };
		let result;
		if (status === 'granted') {
			result = await ImagePicker.launchCameraAsync(options);
		} else {
			result = await ImagePicker.launchImageLibraryAsync({ ...options, mediaTypes: ImagePicker.MediaTypeOptions.Images });
		}
		if (!result.canceled) setMyStory(result.assets[0].uri);
	};

	const openStoryAt = (idx: number) => {
		const s = combinedStories[idx];
		if (s) setSeenStories(prev => new Set(prev).add(s.name));
		setViewingIndex(idx);
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			{viewingIndex !== null && (
				<StoryViewer stories={combinedStories} initialIndex={viewingIndex} onClose={() => setViewingIndex(null)} />
			)}

			<View style={styles.header}>
				<Text style={styles.logo}>
					FORE<Text style={{ color: COLORS.lime }}>!</Text>
				</Text>
				<View style={{ flexDirection: "row", gap: 18 }}>
					<TouchableOpacity onPress={() => navigation.navigate('GlobalSearch')}>
						<Ionicons name="search-outline" size={22} color={COLORS.white} />
					</TouchableOpacity>
					<TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
						<Ionicons name="notifications-outline" size={22} color={COLORS.white} />
						{hayNotifsSinLeer && <View style={styles.notifDot} />}
					</TouchableOpacity>
				</View>
			</View>
			<ScrollView showsVerticalScrollIndicator={false}>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesRow} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 12 }}>
					{/* Vos */}
					<TouchableOpacity style={styles.storyItem} onPress={myStory ? () => openStoryAt(0) : addMyStory}>
						<View style={[styles.storyRing, { borderColor: myStory ? COLORS.lime : '#333' }]}>
							<Avatar initials="JN" bg={COLORS.lime} color="#0f0f0f" size={42} />
							{!myStory && (
								<View style={styles.storyPlus}>
									<Text style={styles.storyPlusText}>+</Text>
								</View>
							)}
						</View>
						<Text style={styles.storyLabel}>Vos</Text>
					</TouchableOpacity>

					{/* Otros */}
					{storiesConNombre.map((s, i) => (
						<TouchableOpacity key={i} style={styles.storyItem} onPress={() => openStoryAt(combinedStories.indexOf(s))}>
							<View style={[styles.storyRing, { borderColor: seenStories.has(s.name) ? '#444' : COLORS.lime }]}>
								<Avatar initials={s.initials} bg={s.bg} color={s.color} size={42} />
							</View>
							<Text style={styles.storyLabel}>{s.name}</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
				<View style={styles.divider} />
				<View style={styles.feed}>
					<HcpCard />
					{rounds.map(r => <RoundCard key={r.id} round={r} />)}
					<MilestoneCard />
				</View>
			</ScrollView>
			{showToast && (
				<Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
					<Text style={styles.toastEmoji}>🏌️</Text>
					<View>
						<Text style={styles.toastTitle}>¡Vuelta publicada!</Text>
						<Text style={styles.toastSub}>Ya aparece en el feed</Text>
					</View>
				</Animated.View>
			)}
</SafeAreaView>
	);
}

const HOLE_SIZE = 26;

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: COLORS.bg },
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 18,
		paddingTop: 10,
		paddingVertical: 10,
	},
	logo: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
	notifDot: { position: 'absolute', top: -1, right: -1, width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.lime, borderWidth: 1.5, borderColor: COLORS.bg },
	headerIcon: { fontSize: 20 },
	storiesRow: {},
	storyItem: { alignItems: "center", marginRight: 12, gap: 4 },
	storyRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, alignItems: "center", justifyContent: "center" },
	storyLabel: { fontSize: 10, color: COLORS.muted },
	storyPlus: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.lime, borderWidth: 1.5, borderColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
	storyPlusText: { fontSize: 13, fontWeight: '800', color: '#0f0f0f', lineHeight: 16 },
	storyModal: { flex: 1, backgroundColor: '#000' },
	storyCard: { flex: 1, marginTop: 16, marginBottom: 28, marginHorizontal: 8, borderRadius: 22, overflow: 'hidden', backgroundColor: '#111' },
	storyTapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
	storyOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
	storyBarRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 12 },
	storyBarTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
	storyBarFill: { height: '100%', backgroundColor: COLORS.lime },
	storyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
	storyAvatarSmall: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
	storyAvatarText: { fontSize: 12, fontWeight: '800' },
	storyName: { fontSize: 14, fontWeight: '700', color: '#fff' },
	divider: {
		height: 0.5,
		backgroundColor: "#1e1e1e",
		marginHorizontal: 0,
		marginBottom: 12,
	},
	feed: { paddingBottom: 20 },
	card: {
		backgroundColor: COLORS.bg,
		borderBottomWidth: 8,
		borderBottomColor: '#1a1a1a',
		paddingBottom: 4,
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 10,
	},
	avatar: { borderRadius: 999, alignItems: "center", justifyContent: "center" },
	avatarText: { fontWeight: "700" },
	cardMeta: { flex: 1 },
	cardName: { fontSize: 14, fontWeight: "700", color: COLORS.white },
	cardCourse: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
	cardTime: { fontSize: 11, color: COLORS.dim, marginTop: 1 },
	dots: { fontSize: 18, color: COLORS.dim },
	cardBody: { paddingHorizontal: 16, paddingBottom: 12 },
	commentsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
	commentsSheet: { backgroundColor: '#161616', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: SCREEN_H * 0.65 },
	commentsHandle: { width: 36, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
	commentsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
	commentsTitle: { fontSize: 15, fontWeight: '700', color: '#f0f0f0' },
	commentsEmpty: { color: COLORS.muted, fontSize: 13, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
	commentRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: '#1e1e1e' },
	commentAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
	commentAvatarText: { fontSize: 10, fontWeight: '700' },
	commentBubble: { flex: 1, backgroundColor: '#1e1e1e', borderRadius: 12, padding: 10 },
	commentMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
	commentAutor: { fontSize: 13, fontWeight: '700', color: '#f0f0f0' },
	commentTiempo: { fontSize: 11, color: '#444' },
	commentTexto: { fontSize: 13, color: '#ddd', lineHeight: 18 },
	commentInput: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: '#1e1e1e' },
	commentTextInput: { flex: 1, backgroundColor: '#1e1e1e', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: '#f0f0f0' },
	cardFooter: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderTopWidth: 0.5,
		borderTopColor: '#1e1e1e',
	},
	action: { flexDirection: "row", alignItems: "center", gap: 5 },
	actionText: { fontSize: 12, color: COLORS.dim },
	hcpRow: { flexDirection: "row", alignItems: "center", gap: 12 },
	hcpBadge: {
		width: 56,
		height: 56,
		borderRadius: 12,
		backgroundColor: COLORS.lime,
		alignItems: "center",
		justifyContent: "center",
	},
	hcpNum: { fontSize: 20, fontWeight: "800", color: "#0f0f0f", lineHeight: 22 },
	hcpLabel: {
		fontSize: 8,
		fontWeight: "700",
		color: "#3a5010",
		textTransform: "uppercase",
		letterSpacing: 0.4,
	},
	bodyText: { fontSize: 13, color: "#ccc", lineHeight: 18 },
	bold: { fontWeight: "700", color: "#fff" },
	trend: { fontSize: 11, color: COLORS.lime, fontWeight: "700", marginTop: 3 },
	courseBadge: {
		backgroundColor: COLORS.dark2,
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 4,
		marginBottom: 8,
		alignSelf: "flex-start",
	},
	courseText: { fontSize: 11, color: COLORS.muted },
	scorecard: { backgroundColor: "#141414", borderRadius: 10, padding: 8 },
	scHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 6,
	},
	scLabel: {
		fontSize: 10,
		color: COLORS.muted,
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	scTotal: { fontSize: 13, fontWeight: "700" },
	holesRow: { flexDirection: "row", gap: 2, marginBottom: 3 },
	scSummary: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingTop: 7,
		borderTopWidth: 0.5,
		borderTopColor: "#222",
	},
	scItem: { alignItems: "center" },
	scVal: { fontSize: 16, fontWeight: "700", color: COLORS.white },
	scLbl: {
		fontSize: 9,
		color: COLORS.muted,
		textTransform: "uppercase",
		letterSpacing: 0.4,
	},
	milestone: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		backgroundColor: "#141414",
		borderRadius: 10,
		padding: 10,
	},
	milestoneIcon: {
		width: 44,
		height: 44,
		borderRadius: 10,
		backgroundColor: "#1e2e0a",
		borderWidth: 0.5,
		borderColor: COLORS.lime,
		alignItems: "center",
		justifyContent: "center",
	},

	summaryBox: {
		backgroundColor: "#141414",
		borderRadius: 10,
		padding: 10,
		gap: 10,
	},
	summaryScores: { flexDirection: "row", alignItems: "center", gap: 12 },
	summaryMain: {
		alignItems: "center",
		paddingRight: 12,
		borderRightWidth: 0.5,
		borderRightColor: "#2a2a2a",
	},
	summaryBigScore: {
		fontSize: 32,
		fontWeight: "800",
		color: COLORS.white,
		lineHeight: 34,
	},
	summaryVsPar: { fontSize: 13, fontWeight: "700", marginTop: 2 },
	summaryStats: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 8 },
	summaryItem: { alignItems: "center", minWidth: 40 },
	summaryVal: { fontSize: 18, fontWeight: "800", color: COLORS.white },
	summaryLbl: {
		fontSize: 9,
		color: COLORS.muted,
		textTransform: "uppercase",
		letterSpacing: 0.4,
		marginTop: 1,
	},
	expandBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
		paddingTop: 8,
		borderTopWidth: 0.5,
		borderTopColor: "#2a2a2a",
	},
	collapseBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
		marginTop: 8,
	},
	expandBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.lime },

	toast: {
		position: "absolute",
		bottom: 24,
		left: 18,
		right: 18,
		backgroundColor: "#1e2e0a",
		borderWidth: 1,
		borderColor: COLORS.lime,
		borderRadius: 16,
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	toastEmoji: { fontSize: 36 },
	toastTitle: { fontSize: 16, fontWeight: "800", color: COLORS.white },
	toastSub: { fontSize: 12, color: COLORS.lime, marginTop: 2 },

	holeWrap: { flex: 1, alignItems: "center", gap: 2 },
	holeNum: { fontSize: 7, color: COLORS.dim },
	holeScore: { fontSize: 9, fontWeight: "700" },
	holeCircle: {
		width: HOLE_SIZE,
		height: HOLE_SIZE,
		borderRadius: HOLE_SIZE / 2,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
	},
	holePlain: {
		width: HOLE_SIZE,
		height: HOLE_SIZE,
		borderRadius: 4,
		alignItems: "center",
		justifyContent: "center",
	},
	holeSquare: {
		width: HOLE_SIZE,
		height: HOLE_SIZE,
		borderRadius: 3,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
	},
	holeOuter: {
		width: HOLE_SIZE + 4,
		height: HOLE_SIZE + 4,
		borderRadius: (HOLE_SIZE + 4) / 2,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
	},
	holeInner: {
		width: HOLE_SIZE - 4,
		height: HOLE_SIZE - 4,
		borderRadius: (HOLE_SIZE - 4) / 2,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
	},
	photoDots: { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingTop: 8 },
	photoDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.dim },
	photoDotActive: { backgroundColor: COLORS.lime, width: 14 },
	photoScoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
	photoScoreMain: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
	photoScore: { fontSize: 28, fontWeight: '800', color: COLORS.white },
	photoVsPar: { fontSize: 14, fontWeight: '700' },
	verTarjetaBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 0.5, borderColor: COLORS.lime, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
	verTarjetaBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.lime },

	holeTriangleWrap: {
		width: HOLE_SIZE,
		height: HOLE_SIZE,
		borderRadius: 4,
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
	},
	triangleTop: {
		position: "absolute",
		top: -1,
		left: "50%",
		marginLeft: -4,
		width: 0,
		height: 0,
		borderLeftWidth: 4,
		borderRightWidth: 4,
		borderBottomWidth: 5,
		borderLeftColor: "transparent",
		borderRightColor: "transparent",
		borderBottomColor: "#ff6060",
	},
});
