import { StatusBar } from 'react-native';
import { UserPreferencesProvider } from './src/providers/UserPreferences.provider';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <UserPreferencesProvider>
      <AppNavigator />
      <StatusBar barStyle={'default'} />
    </UserPreferencesProvider>
  );
}

export default App;
