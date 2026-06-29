import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FORE!</Text>
      <Text style={styles.sub}>Your game. Your story.</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#c8e03a',
    letterSpacing: -1,
  },
  sub: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    letterSpacing: 1,
  },
});
