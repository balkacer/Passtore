import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScreenParams } from '../types/screen.types';
import TabBarNavigator from './TabBarNavigator';
import { SignIn, SignUp } from '../screens';

const Stack = createNativeStackNavigator<ScreenParams>();

const MainNavigator = () => (
  <Stack.Navigator
    initialRouteName="Dashboard"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Dashboard" component={TabBarNavigator} />
    <Stack.Screen name='SignIn' component={SignIn} />
    <Stack.Screen name='SignUp' component={SignUp} />
  </Stack.Navigator>
);

export default MainNavigator;