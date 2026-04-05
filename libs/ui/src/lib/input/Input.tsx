import { Input as AntInput } from 'antd';
import type { InputProps as AntInputProps } from 'antd';

export type InputProps = AntInputProps;

export function Input(props: InputProps) {
  return <AntInput {...props} />;
}

export const TextArea = AntInput.TextArea;
export const Search = AntInput.Search;
export const Password = AntInput.Password;
