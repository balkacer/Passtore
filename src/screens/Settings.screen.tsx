import { Text, TouchableOpacity, View } from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import { ScreenProps } from "../types/screen.types";
import { useUserPreferences } from "../providers/UserPreferences.provider";
import useLanguageLabels from "../hooks/useLanguageLabels";
import useSession from "../store/session.store";

export default function SettingsScreen(props: ScreenProps<'Settings'>) {
  const { changeLanguage, language } = useUserPreferences()
  const logOut = useSession((state) => state.clearSession);

  const {
    ChangeLanguageLabel,
    LogOutLabel,
    SettingsLabel
  } = useLanguageLabels()

  const handleLogOut = () => {
    logOut();
    props.navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
  }

  return <ScreenWrapper
    title={SettingsLabel}
    gap={20}
  >
    <TouchableOpacity style={{ backgroundColor: 'black', padding: 20, paddingHorizontal: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }} onPress={() => changeLanguage(language === 'en' ? 'es' : 'en')}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>{ChangeLanguageLabel}</Text>
    </TouchableOpacity>
    <TouchableOpacity style={{ backgroundColor: 'black', padding: 20, paddingHorizontal: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }} onPress={handleLogOut}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>{LogOutLabel}</Text>
    </TouchableOpacity>
  </ScreenWrapper>
}