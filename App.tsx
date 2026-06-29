import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';

import FeedScreen from './screens/FeedScreen';
import UploadScreen from './screens/UploadScreen';
import StatsScreen from './screens/StatsScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const icon = (label: string, focused: boolean) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>
    {label === 'Feed' ? '🏠' : label === 'Cargar' ? '➕' : label === 'Stats' ? '📊' : '👤'}
  </Text>
);

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          headerLargeTitle: false,
          tabBarStyle: {
            backgroundColor: '#111',
            borderTopColor: '#222',
            borderTopWidth: 0.5,
            paddingBottom: 20,
            paddingTop: 8,
            height: 70,
          },
          tabBarActiveTintColor: '#c8e03a',
          tabBarInactiveTintColor: '#444',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        }}
      >
        <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarIcon: ({ focused }) => icon('Feed', focused) }} />
        <Tab.Screen name="Cargar" component={UploadScreen} options={{ tabBarIcon: ({ focused }) => icon('Cargar', focused) }} />
        <Tab.Screen name="Stats" component={StatsScreen} options={{ tabBarIcon: ({ focused }) => icon('Stats', focused) }} />
        <Tab.Screen name="Perfil" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => icon('Perfil', focused) }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
