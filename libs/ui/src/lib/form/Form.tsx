import { Form as AntForm } from 'antd';

export type FormProps = React.ComponentProps<typeof AntForm>;
export type FormItemProps = React.ComponentProps<typeof AntForm.Item>;

export const Form = Object.assign(
  (props: FormProps) => <AntForm {...props} />,
  {
    Item: AntForm.Item,
    useForm: AntForm.useForm,
    useWatch: AntForm.useWatch,
  }
);
