import {
	View,
	Text,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	Animated,
	Image,
	Dimensions,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import Svg, { Ellipse, Line, Polygon, Circle, Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_W = Dimensions.get("window").width;

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

const stories = [
	{
		initials: "JN",
		bg: "#c8e03a",
		color: "#0f0f0f",
		name: "Vos",
		active: true,
	},
	{ initials: "PE", bg: "#333", color: "#aaa", name: "Pepe", active: false },
	{
		initials: "CA",
		bg: "#2a3a1a",
		color: "#c8e03a",
		name: "Carlitos",
		active: true,
	},
	{
		initials: "MR",
		bg: "#3a2a1a",
		color: "#e0a03a",
		name: "Manu R.",
		active: false,
	},
];

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

function CardFooter({
	likes,
	comments,
	liked = false,
}: {
	likes: number;
	comments: number;
	liked?: boolean;
}) {
	return (
		<View style={styles.cardFooter}>
			<TouchableOpacity style={styles.action}>
				<GolfFlagIcon color={liked ? COLORS.lime : COLORS.dim} size={17} />
				<Text style={[styles.actionText, liked && { color: COLORS.lime }]}>
					{likes}
				</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.action}>
				<GolfBallIcon color={COLORS.dim} size={16} />
				<Text style={styles.actionText}>{comments}</Text>
			</TouchableOpacity>
			<View style={{ flex: 1 }} />
			<TouchableOpacity>
				<Ionicons name="repeat-outline" size={19} color={COLORS.dim} />
			</TouchableOpacity>
		</View>
	);
}

function HcpCard() {
	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<Avatar initials="PE" bg="#333" color={COLORS.lime} />
				<View style={styles.cardMeta}>
					<Text style={styles.cardName}>Pepe Noceti</Text>
					<Text style={styles.cardTime}>hace 2 horas</Text>
				</View>
				<Text style={styles.dots}>···</Text>
			</View>
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

const JUAN_HOLES = [
	{ score: 4, par: 4 },
	{ score: 2, par: 4 },
	{ score: 5, par: 5 },
	{ score: 3, par: 3 },
	{ score: 6, par: 4 },
	{ score: 4, par: 4 },
	{ score: 4, par: 4 },
	{ score: 3, par: 3 },
	{ score: 4, par: 4 },
	{ score: 4, par: 4 },
	{ score: 4, par: 4 },
	{ score: 5, par: 4 },
	{ score: 4, par: 4 },
	{ score: 3, par: 3 },
	{ score: 4, par: 4 },
	{ score: 5, par: 5 },
	{ score: 3, par: 4 },
	{ score: 4, par: 4 },
];

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

function RoundCard({ photos = [] }: { photos?: string[] }) {
	const [expanded, setExpanded] = useState(false);
	const score = JUAN_HOLES.reduce((a, h) => a + h.score, 0);
	const totalPar = JUAN_HOLES.reduce((a, h) => a + h.par, 0);
	const vsPar = score - totalPar;
	const hasPhotos = photos.length > 0;

	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<Avatar initials="JN" bg={COLORS.lime} color="#0f0f0f" />
				<View style={styles.cardMeta}>
					<Text style={styles.cardName}>Juan Noceti</Text>
					<Text style={styles.cardTime}>hace 5 horas</Text>
				</View>
				<Text style={styles.dots}>···</Text>
			</View>

			{hasPhotos ? (
				<>
					<PhotoCarousel photos={photos} />
					<View style={styles.cardBody}>
						<View style={styles.courseBadge}>
							<Text style={styles.courseText}>📍 Haras Santa María · 18 hoyos</Text>
						</View>
						<View style={styles.photoScoreRow}>
							<View style={styles.photoScoreMain}>
								<Text style={styles.photoScore}>{score}</Text>
								<Text style={[styles.photoVsPar, { color: vsPar <= 0 ? COLORS.lime : COLORS.red }]}>
									{vsPar > 0 ? '+' : ''}{vsPar}
								</Text>
							</View>
							<TouchableOpacity style={styles.verTarjetaBtn} onPress={() => setExpanded(!expanded)}>
								<Text style={styles.verTarjetaBtnText}>{expanded ? 'Ocultar' : 'Ver tarjeta'}</Text>
								<Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={COLORS.lime} />
							</TouchableOpacity>
						</View>
						{expanded && <Scorecard holes={JUAN_HOLES} score={score} vsPar={vsPar} />}
					</View>
				</>
			) : (
				<View style={styles.cardBody}>
					<View style={styles.courseBadge}>
						<Text style={styles.courseText}>📍 Haras Santa María · 18 hoyos</Text>
					</View>
					{expanded ? (
						<>
							<Scorecard holes={JUAN_HOLES} score={score} vsPar={vsPar} />
							<TouchableOpacity style={styles.collapseBtn} onPress={() => setExpanded(false)}>
								<Text style={styles.expandBtnText}>Ocultar tarjeta</Text>
								<Ionicons name="chevron-up" size={13} color={COLORS.lime} />
							</TouchableOpacity>
						</>
					) : (
						<RoundSummary holes={JUAN_HOLES} score={score} vsPar={vsPar} onExpand={() => setExpanded(true)} />
					)}
				</View>
			)}

			<CardFooter likes={8} comments={2} />
		</View>
	);
}

function MilestoneCard() {
	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<Avatar initials="CA" bg="#2a3a1a" color={COLORS.lime} />
				<View style={styles.cardMeta}>
					<Text style={styles.cardName}>Carlitos Laprida</Text>
					<Text style={styles.cardTime}>ayer</Text>
				</View>
				<Text style={styles.dots}>···</Text>
			</View>
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

const MOCK_PHOTOS = [
	'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800',
	'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800',
];

export default function FeedScreen() {
	const route = useRoute<any>();
	const toastOpacity = useRef(new Animated.Value(0)).current;
	const [showToast, setShowToast] = useState(false);
	const [newPostPhotos, setNewPostPhotos] = useState<string[]>([]);

	useEffect(() => {
		if (!route.params?.showSuccess) return;
		setNewPostPhotos(route.params?.photos ?? []);
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
					<Ionicons name="search-outline" size={22} color={COLORS.white} />
					<Ionicons name="notifications-outline" size={22} color={COLORS.white} />
				</View>
			</View>
			<ScrollView showsVerticalScrollIndicator={false}>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stories}>
					{stories.map((s, i) => (
						<View key={i} style={styles.storyItem}>
							<View style={[styles.storyRing, { borderColor: s.active ? COLORS.lime : "#333" }]}>
								<Avatar initials={s.initials} bg={s.bg} color={s.color} size={42} />
							</View>
							<Text style={styles.storyName}>{s.name}</Text>
						</View>
					))}
				</ScrollView>
				<View style={styles.divider} />
				<View style={styles.feed}>
					<HcpCard />
					{newPostPhotos.length > 0
						? <RoundCard photos={newPostPhotos} />
						: <RoundCard />
					}
					<RoundCard photos={MOCK_PHOTOS} />
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
	headerIcon: { fontSize: 20 },
	stories: { paddingHorizontal: 14, paddingBottom: 12 },
	storyItem: { alignItems: "center", marginRight: 12, gap: 4 },
	storyRing: {
		width: 50,
		height: 50,
		borderRadius: 25,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
	},
	storyName: { fontSize: 10, color: COLORS.muted },
	divider: {
		height: 0.5,
		backgroundColor: "#1e1e1e",
		marginHorizontal: 0,
		marginBottom: 12,
	},
	feed: { paddingBottom: 20 },
	card: {
		backgroundColor: COLORS.bg,
		borderBottomWidth: 0.5,
		borderBottomColor: '#1e1e1e',
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
	cardTime: { fontSize: 11, color: COLORS.muted },
	dots: { fontSize: 18, color: COLORS.dim },
	cardBody: { paddingHorizontal: 16, paddingBottom: 12 },
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
