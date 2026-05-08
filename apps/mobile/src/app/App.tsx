import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@/store/rtk/store';
import { AppBootstrap } from './AppBootstrap';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#FDF2F3" />
          <AppBootstrap />
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
