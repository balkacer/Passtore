import { Text, TouchableOpacity } from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import { useState } from "react";
import { ScreenProps } from "../types/screen.types";
import useLanguageLabels from "../hooks/useLanguageLabels";
import useSession from "../store/session.store";

export default function HomeScreen(props: ScreenProps<'Home'>) {
  const [count, setCount] = useState(0)
  const sessionData = useSession((state) => state.sessionData);
  const {
    CountLabel,
    HelloLabel
  } = useLanguageLabels();

  if (!sessionData) props.navigation.reset({
    index: 0,
    routes: [{ name: 'SignIn' }]
  })

  return <ScreenWrapper
    title={`${HelloLabel}, ${sessionData?.firstName} \t\t\t\t${count}`}
    gap={20}
  >
    <TouchableOpacity style={{ backgroundColor: 'black', padding: 20, paddingHorizontal: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }} onPress={() => setCount(prev => prev + 1)}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{CountLabel}</Text>
    </TouchableOpacity>
  </ScreenWrapper>
}