import {
	View,
	Text,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	Animated,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import type { RoundDoc, FollowDoc } from "../firebase/types";
import RoundCard from "../components/RoundCard";

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

export default function FeedScreen() {
	const route = useRoute<any>();
	const navigation = useNavigation<any>();
	const { firebaseUser } = useAuth();
	const toastOpacity = useRef(new Animated.Value(0)).current;
	const [showToast, setShowToast] = useState(false);
	const [rounds, setRounds] = useState<RoundDoc[]>([]);
	const [hayNotifsSinLeer, setHayNotifsSinLeer] = useState(false);
	const [followingIds, setFollowingIds] = useState<string[]>([]);
	const [followingLoaded, setFollowingLoaded] = useState(false);

	useEffect(() => {
		if (!firebaseUser) return;
		const q = query(collection(db, 'users', firebaseUser.uid, 'notifications'), where('read', '==', false), limit(1));
		return onSnapshot(q, snap => setHayNotifsSinLeer(!snap.empty));
	}, [firebaseUser?.uid]);

	// A quién sigue el usuario — determina qué rondas entran en el feed.
	useEffect(() => {
		if (!firebaseUser) return;
		const q = query(collection(db, 'follows'), where('followerUid', '==', firebaseUser.uid));
		return onSnapshot(q, snap => {
			setFollowingIds(snap.docs.map(d => (d.data() as FollowDoc).followingUid));
			setFollowingLoaded(true);
		});
	}, [firebaseUser?.uid]);

	useEffect(() => {
		if (!firebaseUser || !followingLoaded) return;
		// Siempre incluye las propias, aunque no te sigas a vos mismo. Firestore permite hasta 30 valores en "in".
		const ids = Array.from(new Set([firebaseUser.uid, ...followingIds])).slice(0, 30);
		const q = query(
			collection(db, 'rounds'),
			where('visibility', '==', 'public'),
			where('userId', 'in', ids),
			orderBy('date', 'desc'),
			limit(20),
		);
		const unsubscribe = onSnapshot(q, snap => {
			setRounds(snap.docs.map(d => d.data() as RoundDoc));
		});
		return unsubscribe;
	}, [firebaseUser?.uid, followingLoaded, followingIds.join(',')]);

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
	feed: { paddingBottom: 20 },
	feedEmpty: { alignItems: 'center', gap: 8, paddingTop: 80, paddingHorizontal: 40 },
	feedEmptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginTop: 4 },
	feedEmptyText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 19 },
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
});
