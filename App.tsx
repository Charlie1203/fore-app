import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";

import FeedScreen from "./screens/FeedScreen";
import UploadScreen from "./screens/UploadScreen";
import SearchScreen from "./screens/SearchScreen";
import ProfileScreen from "./screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
	Inicio: "home",
	Cargar: "card",
	Grupos: "people",
	Perfil: "person",
};

export default function App() {
	return (
		<SafeAreaProvider>
		<NavigationContainer>
			<StatusBar style="light" />
			<Tab.Navigator
				screenOptions={({ route }) => ({
					headerShown: false,
					headerLargeTitle: false,
					tabBarStyle: {
						backgroundColor: "#111",
						borderTopColor: "#222",
						borderTopWidth: 0.5,
						paddingBottom: 20,
						paddingTop: 8,
						height: 70,
					},
					tabBarActiveTintColor: "#c8e03a",
					tabBarInactiveTintColor: "#444",
					tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
					tabBarIcon: ({ color, focused }) => (
						<Ionicons
							name={
								focused
									? ICONS[route.name]
									: (`${ICONS[route.name]}-outline` as any)
							}
							size={22}
							color={color}
						/>
					),
				})}
			>
				<Tab.Screen name="Inicio" component={FeedScreen} />
				<Tab.Screen name="Cargar" component={UploadScreen} />
				<Tab.Screen name="Grupos" component={SearchScreen} />
				<Tab.Screen name="Perfil" component={ProfileScreen} />
			</Tab.Navigator>
		</NavigationContainer>
		</SafeAreaProvider>
	);
}
