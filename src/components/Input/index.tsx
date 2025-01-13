import { useMemo } from "react";
import { InputProps } from "./props";
import { STextInput } from "./styled";
import InputTransformer from "../../utils/inputTransformer.enum";

export default function Input(props: InputProps) {
  const { type = 'text', transform = 'raw', onChange, value = '', placeholder = '' } = props;

  const Component = useMemo(() => {
    return {
      'text': STextInput,
      'password': STextInput
    }[type]
  }, [type])

  const handleOnChange = (value: string) => {
    onChange && onChange(value)
  }

  return (
    <Component
      autoCapitalize={InputTransformer[transform]}
      secureTextEntry={type === 'password'}
      onChangeText={handleOnChange}
      value={value}
      placeholder={placeholder}
      placeholderTextColor={"#A6A6A8"}
    />
  );
}