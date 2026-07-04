import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';
import * as WebBrowser from 'expo-web-browser';
import App from './App';

WebBrowser.maybeCompleteAuthSession();
enableScreens(false);
registerRootComponent(App);
