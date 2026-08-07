import {
	View,
	Text,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	Image,
	Dimensions,
	Modal,
	TextInput,
	Platform,
	ActivityIndicator,
	Keyboard,
	Alert,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Svg, { Ellipse, Line, Polygon, Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
	collection, query, orderBy, onSnapshot,
	doc, getDoc, setDoc, deleteDoc, updateDoc, addDoc, increment, serverTimestamp,
} from "firebase/firestore";
import type { RoundDoc, CommentDoc } from "../firebase/types";

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;
const HOLE_SIZE = 26;

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
			<Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.6" fill="none" />
			<Path d={d} stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
		</Svg>
	);
}

function GolfFlagIcon({ color, size = 17 }: { color: string; size?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 2 24 24">
			<Ellipse cx="12" cy="20" rx="7" ry="2.5" stroke={color} strokeWidth="1.8" fill="none" />
			<Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
			<Polygon points="12,4 21,8 12,12" fill={color} />
		</Svg>
	);
}

function Avatar({
	initials,
	bg,
	color,
	size = 38,
	photoURL,
}: {
	initials: string;
	bg: string;
	color: string;
	size?: number;
	photoURL?: string | null;
}) {
	if (photoURL) {
		return <Image source={{ uri: photoURL }} style={[styles.avatar, { width: size, height: size }]} />;
	}
	return (
		<View style={[styles.avatar, { width: size, height: size, backgroundColor: bg }]}>
			<Text style={[styles.avatarText, { color, fontSize: size * 0.34 }]}>{initials}</Text>
		</View>
	);
}

function HoleCell({ num, score, par }: { num: number; score: number; par: number }) {
	const diff = score - par;

	if (diff <= -2) {
		return (
			<View style={styles.holeWrap}>
				<Text style={styles.holeNum}>{num}</Text>
				<View style={[styles.holeOuter, { borderColor: COLORS.lime, backgroundColor: "#0a1a00" }]}>
					<View style={[styles.holeInner, { borderColor: COLORS.lime }]}>
						<Text style={[styles.holeScore, { color: COLORS.lime }]}>{score}</Text>
					</View>
				</View>
			</View>
		);
	}
	if (diff === -1) {
		return (
			<View style={styles.holeWrap}>
				<Text style={styles.holeNum}>{num}</Text>
				<View style={[styles.holeCircle, { borderColor: COLORS.lime, backgroundColor: "#1e2e0a" }]}>
					<Text style={[styles.holeScore, { color: COLORS.lime }]}>{score}</Text>
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
				<View style={[styles.holeSquare, { borderColor: COLORS.red, backgroundColor: "#2a1a1a" }]}>
					<Text style={[styles.holeScore, { color: COLORS.red }]}>{score}</Text>
				</View>
			</View>
		);
	}
	if (diff === 2) {
		return (
			<View style={styles.holeWrap}>
				<Text style={styles.holeNum}>{num}</Text>
				<View style={[styles.holeOuter, { borderColor: COLORS.red, backgroundColor: "#3a1010", borderRadius: 3 }]}>
					<View style={[styles.holeInner, { borderColor: COLORS.red, borderRadius: 2 }]}>
						<Text style={[styles.holeScore, { color: COLORS.red }]}>{score}</Text>
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

function Scorecard({ holes, score, vsPar }: { holes: { score: number; par: number }[]; score: number; vsPar: number }) {
	return (
		<View style={styles.scorecard}>
			<View style={styles.scHeader}>
				<Text style={styles.scLabel}>Frente · Vuelta</Text>
				<Text style={[styles.scTotal, { color: vsPar <= 0 ? COLORS.lime : COLORS.red }]}>
					{score} · {vsPar > 0 ? "+" : ""}{vsPar}
				</Text>
			</View>
			<View style={styles.holesRow}>
				{holes.slice(0, 9).map((h, i) => <HoleCell key={i} num={i + 1} score={h.score} par={h.par} />)}
			</View>
			<View style={[styles.holesRow, { marginBottom: 6 }]}>
				{holes.slice(9, 18).map((h, i) => <HoleCell key={i} num={i + 10} score={h.score} par={h.par} />)}
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
		navigation.navigate('PerfilUsuario', { viewUser: { uid: c.authorId, name: c.authorName, initials: c.authorInitials, bg: COLORS.lime, color: '#0f0f0f' } });
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
										<TouchableOpacity style={{ flexShrink: 1 }} onPress={() => abrirPerfil(c)}>
											<Text style={styles.commentAutor} numberOfLines={1}>{c.authorName}</Text>
										</TouchableOpacity>
										<Text style={styles.commentTiempo} numberOfLines={1}>{formatFechaComentario(c.createdAt)}</Text>
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

function CardFooter({ roundId, likes, comments }: { roundId: string; likes: number; comments: number }) {
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
		// Optimista: el ícono cambia al toque, no espera la ida y vuelta al servidor.
		// Si la escritura falla, se revierte en el catch.
		const wasLiked = isLiked;
		setIsLiked(!wasLiked);
		setBusy(true);
		const likeRef = doc(db, 'rounds', roundId, 'likes', firebaseUser.uid);
		const roundRef = doc(db, 'rounds', roundId);
		try {
			if (wasLiked) {
				await deleteDoc(likeRef);
				await updateDoc(roundRef, { likesCount: increment(-1) });
			} else {
				await setDoc(likeRef, { uid: firebaseUser.uid, createdAt: serverTimestamp() });
				await updateDoc(roundRef, { likesCount: increment(1) });
			}
		} catch {
			setIsLiked(wasLiked);
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
					{likes > 0 && <Text style={[styles.actionText, isLiked && { color: COLORS.lime }]}>{likes}</Text>}
				</TouchableOpacity>
				<TouchableOpacity style={styles.action} onPress={() => setShowComments(true)}>
					<GolfBallIcon color={COLORS.dim} size={16} />
					{comments > 0 && <Text style={styles.actionText}>{comments}</Text>}
				</TouchableOpacity>
			</View>
		</>
	);
}

function RoundStats({ holes, score, vsPar }: { holes: { score: number; par: number }[]; score: number; vsPar: number }) {
	const eagles = holes.filter((h) => h.score - h.par <= -2).length;
	const birdies = holes.filter((h) => h.score - h.par === -1).length;
	const pares = holes.filter((h) => h.score - h.par === 0).length;
	const bogeys = holes.filter((h) => h.score - h.par === 1).length;
	const doubles = holes.filter((h) => h.score - h.par >= 2).length;

	return (
		<View style={styles.summaryScores}>
			<View style={styles.summaryMain}>
				<Text style={styles.summaryBigScore}>{score}</Text>
				<View style={styles.summaryDivider} />
				<Text style={[styles.summaryVsPar, { color: vsPar <= 0 ? COLORS.lime : COLORS.red }]}>
					{vsPar === 0 ? "E" : `${vsPar > 0 ? "+" : ""}${vsPar}`}
				</Text>
			</View>
			<View style={styles.summaryStats}>
				<View style={styles.summaryItem}>
					<Text style={styles.summaryLbl}>Águilas</Text>
					<Text style={[styles.summaryVal, { color: COLORS.lime }]}>{eagles}</Text>
				</View>
				<View style={styles.summaryItem}>
					<Text style={styles.summaryLbl}>Birdies</Text>
					<Text style={[styles.summaryVal, { color: COLORS.lime }]}>{birdies}</Text>
				</View>
				<View style={styles.summaryItem}>
					<Text style={styles.summaryLbl}>Pares</Text>
					<Text style={styles.summaryVal}>{pares}</Text>
				</View>
				<View style={styles.summaryItem}>
					<Text style={styles.summaryLbl}>Bogeys</Text>
					<Text style={[styles.summaryVal, { color: COLORS.red }]}>{bogeys}</Text>
				</View>
				<View style={styles.summaryItem}>
					<Text style={styles.summaryLbl}>Doble+</Text>
					<Text style={[styles.summaryVal, { color: "#ff6060" }]}>{doubles}</Text>
				</View>
			</View>
		</View>
	);
}

function PhotoGrid({ photos, onPress }: { photos: string[]; onPress: (index: number) => void }) {
	// Altura del bloque siempre igual, sea 1 foto o varias — el ancho de cada
	// columna es lo que cambia (foto sola = ancho completo, 2 = mitad, etc).
	// A partir de la 4ta columna, esa se tapa con "+N" en vez de sumar más columnas.
	const maxVisible = 4;
	const hasOverlay = photos.length > 3;
	const visible = photos.slice(0, Math.min(photos.length, maxVisible));
	return (
		<View style={styles.photoGridRow}>
			{visible.map((uri, i) => {
				const isOverlayTile = hasOverlay && i === maxVisible - 1;
				return (
					<TouchableOpacity key={i} style={styles.photoGridTile} onPress={() => onPress(i)} activeOpacity={0.85}>
						<Image source={{ uri }} style={styles.photoGridImg} resizeMode="cover" />
						{isOverlayTile && (
							<View style={styles.photoGridOverlay}>
								<Text style={styles.photoGridOverlayNum}>+{photos.length - 3}</Text>
							</View>
						)}
					</TouchableOpacity>
				);
			})}
		</View>
	);
}

function PhotoLightbox({ visible, photos, initialIndex, onClose }: { visible: boolean; photos: string[]; initialIndex: number; onClose: () => void }) {
	if (!visible) return null;
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.lightboxOverlay}>
				<TouchableOpacity style={styles.lightboxClose} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
					<Ionicons name="close" size={28} color="#fff" />
				</TouchableOpacity>
				<ScrollView
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					contentOffset={{ x: initialIndex * SCREEN_W, y: 0 }}
				>
					{photos.map((uri, i) => (
						<Image key={i} source={{ uri }} style={{ width: SCREEN_W, height: SCREEN_H }} resizeMode="contain" />
					))}
				</ScrollView>
			</View>
		</Modal>
	);
}

function formatFechaRonda(ts: any): string {
	if (!ts?.toDate) return 'recién';
	return ts.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function PostMenu({ visible, anchor, onClose, onDelete, deleting }: {
	visible: boolean;
	anchor: { x: number; y: number; width: number; height: number } | null;
	onClose: () => void;
	onDelete: () => void;
	deleting: boolean;
}) {
	const cardWidth = 200;
	// Ancla la esquina superior derecha del menú al botón tocado, pegado justo debajo,
	// y lo desliza para adentro si se saldría de la pantalla por la derecha.
	const left = anchor ? Math.min(anchor.x + anchor.width - cardWidth, SCREEN_W - cardWidth - 12) : 0;
	const top = anchor ? anchor.y + anchor.height + 4 : 0;

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<TouchableOpacity style={styles.menuOverlayFree} activeOpacity={1} onPress={onClose}>
				<View style={[styles.menuCard, { position: 'absolute', top, left, width: cardWidth }]}>
					<TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onDelete(); }} disabled={deleting}>
						{deleting
							? <ActivityIndicator size="small" color={COLORS.red} />
							: <Ionicons name="trash-outline" size={17} color={COLORS.red} />
						}
						<Text style={[styles.menuItemText, { color: COLORS.red }]}>Eliminar publicación</Text>
					</TouchableOpacity>
				</View>
			</TouchableOpacity>
		</Modal>
	);
}

/** Tarjeta de una ronda — la misma en el feed y en cualquier perfil (propio o ajeno). */
export default function RoundCard({ round }: { round: RoundDoc }) {
	const navigation = useNavigation<any>();
	const { firebaseUser } = useAuth();
	const [expanded, setExpanded] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
	const [deleting, setDeleting] = useState(false);
	const dotsRef = useRef<View>(null);
	const hasPhotos = round.photos.length > 0;
	const esPropio = round.userId === firebaseUser?.uid;

	const openMenu = () => {
		dotsRef.current?.measureInWindow((x, y, width, height) => {
			setMenuAnchor({ x, y, width, height });
			setMenuOpen(true);
		});
	};

	const abrirPerfil = () => esPropio
		? navigation.navigate('Tabs', { screen: 'Perfil' })
		: navigation.navigate('PerfilUsuario', { viewUser: { uid: round.userId, name: round.authorName, initials: round.authorInitials, bg: COLORS.lime, color: '#0f0f0f' } });

	const onDelete = () => {
		Alert.alert('Eliminar publicación', '¿Seguro que querés eliminar esta vuelta? Esta acción no se puede deshacer.', [
			{ text: 'Cancelar', style: 'cancel' },
			{
				text: 'Eliminar', style: 'destructive', onPress: async () => {
					setDeleting(true);
					try {
						await deleteDoc(doc(db, 'rounds', round.id));
					} catch {
						Alert.alert('Error', 'No pudimos eliminar la publicación. Probá de nuevo.');
						setDeleting(false);
					}
				},
			},
		]);
	};

	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<TouchableOpacity style={styles.cardHeaderMain} onPress={abrirPerfil}>
					<Avatar initials={round.authorInitials} bg={COLORS.lime} color="#0f0f0f" photoURL={round.authorPhotoURL} />
					<View style={styles.cardMeta}>
						<Text style={styles.cardName} numberOfLines={1}>{round.authorName}</Text>
						<Text style={styles.cardCourse} numberOfLines={1}>{round.clubName}{round.courseName ? ` · ${round.courseName}` : ''}</Text>
						<Text style={styles.cardTime}>{formatFechaRonda(round.date)}</Text>
					</View>
				</TouchableOpacity>
				{esPropio && (
					<TouchableOpacity ref={dotsRef} onPress={openMenu} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
						<Text style={styles.dots}>···</Text>
					</TouchableOpacity>
				)}
			</View>
			<PostMenu visible={menuOpen} anchor={menuAnchor} onClose={() => setMenuOpen(false)} onDelete={onDelete} deleting={deleting} />

			<View style={styles.cardBody}>
				<RoundStats holes={round.holes} score={round.totalScore} vsPar={round.vsPar} />
				<TouchableOpacity style={styles.verTarjetaBtn} onPress={() => setExpanded(!expanded)}>
					<Text style={styles.verTarjetaBtnText}>{expanded ? 'Ocultar tarjeta' : 'Ver tarjeta'}</Text>
					<Ionicons name={expanded ? 'chevron-up' : 'chevron-forward'} size={14} color={COLORS.lime} />
				</TouchableOpacity>
				{expanded && <Scorecard holes={round.holes} score={round.totalScore} vsPar={round.vsPar} />}
			</View>

			{hasPhotos && (
				<>
					<PhotoGrid photos={round.photos} onPress={i => setLightboxIndex(i)} />
					<PhotoLightbox
						visible={lightboxIndex !== null}
						photos={round.photos}
						initialIndex={lightboxIndex ?? 0}
						onClose={() => setLightboxIndex(null)}
					/>
				</>
			)}

			<CardFooter roundId={round.id} likes={round.likesCount} comments={round.commentsCount} />
		</View>
	);
}

const styles = StyleSheet.create({
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
	cardHeaderMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0 },
	avatar: { borderRadius: 999, alignItems: "center", justifyContent: "center" },
	avatarText: { fontWeight: "700" },
	cardMeta: { flex: 1, minWidth: 0 },
	cardName: { fontSize: 14, fontWeight: "700", color: COLORS.white },
	cardCourse: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
	cardTime: { fontSize: 11, color: COLORS.dim, marginTop: 1 },
	dots: { fontSize: 18, color: COLORS.dim, paddingHorizontal: 4 },
	menuOverlayFree: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
	menuCard: { backgroundColor: '#1e1e1e', borderRadius: 12, borderWidth: 0.5, borderColor: '#2a2a2a', overflow: 'hidden', minWidth: 180 },
	menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13 },
	menuItemText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
	cardBody: { paddingHorizontal: 16, paddingBottom: 12 },
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
	commentTiempo: { fontSize: 11, color: '#444', marginLeft: 6 },
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
	scorecard: { backgroundColor: "#141414", borderRadius: 10, padding: 8, marginTop: 10 },
	scHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
	scLabel: { fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 },
	scTotal: { fontSize: 13, fontWeight: "700" },
	holesRow: { flexDirection: "row", gap: 2, marginBottom: 3 },

	summaryScores: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	summaryMain: { flexDirection: "row", alignItems: "center", gap: 10 },
	summaryBigScore: { fontSize: 32, fontWeight: "800", color: COLORS.white, lineHeight: 34 },
	summaryDivider: { width: 1, height: 22, backgroundColor: "#333" },
	summaryVsPar: { fontSize: 15, fontWeight: "700" },
	summaryStats: { flexDirection: "row", gap: 14 },
	summaryItem: { alignItems: "center" },
	summaryVal: { fontSize: 16, fontWeight: "800", color: COLORS.white, marginTop: 2 },
	summaryLbl: { fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4 },

	holeWrap: { flex: 1, alignItems: "center", gap: 2 },
	holeNum: { fontSize: 7, color: COLORS.dim },
	holeScore: { fontSize: 9, fontWeight: "700" },
	holeCircle: { width: HOLE_SIZE, height: HOLE_SIZE, borderRadius: HOLE_SIZE / 2, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
	holePlain: { width: HOLE_SIZE, height: HOLE_SIZE, borderRadius: 4, alignItems: "center", justifyContent: "center" },
	holeSquare: { width: HOLE_SIZE, height: HOLE_SIZE, borderRadius: 3, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
	holeOuter: { width: HOLE_SIZE + 4, height: HOLE_SIZE + 4, borderRadius: (HOLE_SIZE + 4) / 2, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
	holeInner: { width: HOLE_SIZE - 4, height: HOLE_SIZE - 4, borderRadius: (HOLE_SIZE - 4) / 2, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
	holeTriangleWrap: { width: HOLE_SIZE, height: HOLE_SIZE, borderRadius: 4, alignItems: "center", justifyContent: "center", position: "relative" },
	triangleTop: {
		position: "absolute", top: -1, left: "50%", marginLeft: -4,
		width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 5,
		borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "#ff6060",
	},

	verTarjetaBtn: {
		flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
		borderWidth: 1, borderColor: COLORS.lime, borderRadius: 10,
		paddingHorizontal: 14, paddingVertical: 10, marginTop: 12,
	},
	verTarjetaBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.lime },
	// Altura fija del bloque de fotos — no depende de cuántas fotos tenga la ronda.
	photoGridRow: { flexDirection: 'row', gap: 2, height: SCREEN_W * 0.5, marginTop: 10, backgroundColor: '#141414' },
	photoGridTile: { flex: 1 },
	photoGridImg: { width: '100%', height: '100%' },
	photoGridOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
	photoGridOverlayNum: { fontSize: 22, fontWeight: '800', color: COLORS.white },
	lightboxOverlay: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
	lightboxClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
});
