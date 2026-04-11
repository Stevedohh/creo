import { Input as AntInput } from 'antd';
import type { InputProps as AntInputProps } from 'antd';

export type InputProps = AntInputProps;

export const Input = Object.assign(
  (props: InputProps) => <AntInput {...props} />,
  {
    TextArea: AntInput.TextArea,
    Search: AntInput.Search,
    Password: AntInput.Password,
  }
);

export const TextArea = AntInput.TextArea;
export const Search = AntInput.Search;
export const Password = AntInput.Password;
