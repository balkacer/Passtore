import { Text, TextInput, TouchableOpacity } from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import { ScreenProps } from "../types/screen.types";
import useLanguageLabels from "../hooks/useLanguageLabels";
import Input from "../components/Input";

export default function SignUpScreen(props: ScreenProps<'SignUp'>) {
  const {
    SignUpLabel,
    SignUpActionLabel,
    SignInActionLabel,
    UsernameLabel,
    PasswordLabel,
    ConfirmPasswordLabel,
    FirstNameLabel,
    LastNameLabel,
  } = useLanguageLabels()

  const handleSignUp = () => {
    props.navigation.reset({
      index: 0,
      routes: [{ name: 'SignIn' }]
    })
  }

  const handleSignIn = () => {
    if (props.navigation.canGoBack()) {
      props.navigation.goBack()
    } else {
      props.navigation.navigate('SignIn')
    }
  }

  return <ScreenWrapper
    title={SignUpLabel}
    goBack={props.navigation.canGoBack() ? props.navigation.goBack : undefined}
    gap={20}
  >
    <Input placeholder={FirstNameLabel} />
    <Input placeholder={LastNameLabel} />
    <Input placeholder={UsernameLabel} />
    <Input type="password" placeholder={PasswordLabel} />
    <Input type="password" placeholder={ConfirmPasswordLabel} />
    <TouchableOpacity
      style={{
        backgroundColor: '#272635',
        padding: 15,
        paddingHorizontal: 20,
        borderRadius: 15,
        marginTop: 50
      }}
      onPress={handleSignUp}
    >
      <Text style={{ fontWeight: 'bold', color: '#E8E9F3' }}>{SignUpActionLabel}</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={{
        backgroundColor: '#E8E9F3',
        borderColor: '#272635',
        borderWidth: 2,
        padding: 15,
        paddingHorizontal: 20,
        borderRadius: 15
      }}
      onPress={handleSignIn}
    >
      <Text style={{ fontWeight: 'bold', color: '#272635' }}>{SignInActionLabel}</Text>
    </TouchableOpacity>
  </ScreenWrapper>
}