import { Pressable, Text, View } from 'react-native';
import { ScreenWrapperProps } from './props';
import { Container, Wrapper, Main } from './styled';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Icon from 'react-native-vector-icons/Entypo';

export default function ScreenWrapper(props: ScreenWrapperProps) {
  const { children, scrollDisabled = false, title, goBack, gap = 0 } = props;

  return (
    <Wrapper>
      <Container>
        <KeyboardAwareScrollView scrollEnabled={!scrollDisabled}>
          <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {goBack && <Pressable onPress={goBack}><Icon name='chevron-left' size={28} color={"#272635"} /></Pressable>}
            {title && <Text style={{ fontWeight: 'bold', color: "#272635", fontSize: 28 }}>{title}</Text>}
          </View>
          <Main style={{ gap }}>
            {children}
          </Main>
        </KeyboardAwareScrollView>
      </Container>
    </Wrapper>
  );
}