import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import FeedScreen from "./screens/FeedScreen";
import UploadScreen from "./screens/UploadScreen";
import SearchScreen from "./screens/SearchScreen";
import ProfileScreen from "./screens/ProfileScreen";
import RankingScreen from "./screens/RankingScreen";

const Tab = createBottomTabNavigator();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Inicio: "home",
  Grupos: "people",
  Ranking: "trophy",
  Perfil: "person",
};

function GolfBallTabIcon({ color }: { color: string }) {
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
    <View style={{
      width: 58, height: 58, borderRadius: 29,
      backgroundColor: "#c8e03a",
      alignItems: "center", justifyContent: "center",
      marginBottom: 8,
    }}>
      <Svg width={26} height={26} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="10" stroke="#0f0f0f" strokeWidth="1.6" fill="none" />
        <Path d={d} stroke="#0f0f0f" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "#111",
              borderTopColor: "#222",
              borderTopWidth: 0.5,
              paddingBottom: 20,
              paddingTop: 8,
              height: 80,
            },
            tabBarActiveTintColor: "#c8e03a",
            tabBarInactiveTintColor: "#444",
            tabBarShowLabel: false,
            tabBarIcon: ({ color, focused }) => {
              if (route.name === "Cargar") return <GolfBallTabIcon color={color} />;
              return (
                <Ionicons
                  name={focused ? ICONS[route.name] : (`${ICONS[route.name]}-outline` as any)}
                  size={22}
                  color={color}
                />
              );
            },
          })}
        >
          <Tab.Screen name="Inicio" component={FeedScreen} />
          <Tab.Screen name="Ranking" component={RankingScreen} />
          <Tab.Screen name="Cargar" component={UploadScreen} />
          <Tab.Screen name="Grupos" component={SearchScreen} />
          <Tab.Screen name="Perfil" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
