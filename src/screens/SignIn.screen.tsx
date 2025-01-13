import { Text, TouchableOpacity } from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import { ScreenProps } from "../types/screen.types";
import useSession, { Session } from "../store/session.store";
import useLanguageLabels from "../hooks/useLanguageLabels";
import Input from "../components/Input";
import { useState } from "react";

export default function SignInScreen(props: ScreenProps<'SignIn'>) {
  const setSession = useSession((state) => state.setSession);
  const sessionDataFromSate = useSession((state) => state.sessionData);

  const [username, setUsername] = useState('');
  const [passsword, setPassword] = useState('');

  const {
    SignInActionLabel,
    SignInLabel,
    SignUpActionLabel,
    UsernameLabel,
    PasswordLabel,
  } = useLanguageLabels();

  if (sessionDataFromSate) props.navigation.reset({
    index: 0,
    routes: [{ name: 'Dashboard' }]
  })

  const sessionData: Session = {
    token: 'm3iRYc4o0l1uj5qUFokZSOdk5H9PobhosxwU',
    username: 'ebalcacer',
    firstName: 'Enmanuel'
  }

  const handleSignIn = () => {
    setSession(sessionData)
    props.navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }]
    })
  }

  return <ScreenWrapper
    title={SignInLabel}
    gap={20}
  >
    <Input
      value={username}
      onChange={(v) => setUsername(v)}
      placeholder={UsernameLabel}
    />
    <Input
      type='password'
      value={passsword}
      onChange={(v) => setPassword(v)}
      placeholder={PasswordLabel}
    />
    <TouchableOpacity style={{ backgroundColor: '#272635', padding: 15, paddingHorizontal: 20, borderRadius: 15, marginTop: 50 }} onPress={handleSignIn}>
      <Text style={{ fontWeight: 'bold', color: '#E8E9F3' }}>{SignInActionLabel}</Text>
    </TouchableOpacity>
    <TouchableOpacity style={{ backgroundColor: '#E8E9F3', borderColor: '#272635', borderWidth: 2, padding: 15, paddingHorizontal: 20, borderRadius: 15 }} onPress={() => props.navigation.navigate('SignUp')}>
      <Text style={{ fontWeight: 'bold', color: '#272635' }}>{SignUpActionLabel}</Text>
    </TouchableOpacity>
  </ScreenWrapper>
}