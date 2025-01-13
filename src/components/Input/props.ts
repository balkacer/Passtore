export type InputProps = {
  placeholder?: string;
  onChange?: (value: string) => void;
  value?: string;
  type?: "text" | "password"
  transform?: "capitalize" | "uppercase" | "cWords" | "raw"
}