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

function formatFechaComentario(ts: any): string {
	if (!ts?.toDate) return 'ahora';
	return ts.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function CommentsSheet({ visible, roundId, count, onClose }: { visible: boolean; roundId: string; count: number; onClose: () => void }) {
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

	const abrirPerfil = (c: CommentDoc) => {
		navigation.navigate('PerfilUsuario', { viewUser: { name: c.authorName, initials: c.authorInitials, bg: COLORS.lime, color: '#0f0f0f' } });
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
						{comments.length > 0 ? comments.map(c => (
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
						)) : <Text style={styles.commentsEmpty}>Sin comentarios todavía. ¡Sé el primero!</Text>}
					</ScrollView>
					<View style={[styles.commentInput, { paddingBottom: kbHeight > 0 ? kbHeight + 12 : 12 + insets.bottom }]}>
						<View style={[styles.commentAvatar, { backgroundColor: COLORS.lime }]}>
							<Text style={[styles.commentAvatarText, { color: '#0f0f0f' }]}>{myInitials}</Text>
						</View>
						<TextInput
							ref={inputRef}
							style={styles.commentTextInput}
							placeholder="Comentar..."
							placeholderTextColor="#444"
							value={text}
							onChangeText={setText}
							editable={!sending}
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
}: {
	roundId: string;
	likes: number;
	comments: number;
}) {
	const { firebaseUser } = useAuth();
	const [isLiked, setIsLiked] = useState(false);
	const [busy, setBusy] = useState(false);
	const [showComments, setShowComments] = useState(false);

	useEffect(() => {
		if (!firebaseUser) return;
		getDoc(doc(db, 'rounds', roundId, 'likes', firebaseUser.uid)).then(snap => setIsLiked(snap.exists()));
	}, [roundId, firebaseUser?.uid]);

	const toggleLike = async () => {
		if (!firebaseUser || busy) return;
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


export default function FeedScreen() {
	const route = useRoute<any>();
	const navigation = useNavigation<any>();
	const { firebaseUser } = useAuth();
	const toastOpacity = useRef(new Animated.Value(0)).current;
	const [showToast, setShowToast] = useState(false);
	const [rounds, setRounds] = useState<RoundDoc[]>([]);
	const [hayNotifsSinLeer, setHayNotifsSinLeer] = useState(false);

	useEffect(() => {
		if (!firebaseUser) return;
		const q = query(collection(db, 'users', firebaseUser.uid, 'notifications'), where('read', '==', false), limit(1));
		return onSnapshot(q, snap => setHayNotifsSinLeer(!snap.empty));
	}, [firebaseUser?.uid]);

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

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
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
				<View style={styles.feed}>
					{rounds.length === 0
						? (
							<View style={styles.feedEmpty}>
								<Ionicons name="golf-outline" size={40} color={COLORS.dim} />
								<Text style={styles.feedEmptyTitle}>Todavía no hay vueltas</Text>
								<Text style={styles.feedEmptyText}>Cargá tu primera vuelta o seguí a tus amigos para ver las suyas acá.</Text>
							</View>
						)
						: rounds.map(r => <RoundCard key={r.id} round={r} />)
					}
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
	divider: {
		height: 0.5,
		backgroundColor: "#1e1e1e",
		marginHorizontal: 0,
		marginBottom: 12,
	},
	feed: { paddingBottom: 20 },
	feedEmpty: { alignItems: 'center', gap: 8, paddingTop: 80, paddingHorizontal: 40 },
	feedEmptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginTop: 4 },
	feedEmptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 19 },
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
