import { Popconfirm as AntPopconfirm } from 'antd';
import type { PopconfirmProps as AntPopconfirmProps } from 'antd';

export type PopconfirmProps = AntPopconfirmProps;

export function Popconfirm(props: PopconfirmProps) {
  return <AntPopconfirm {...props} />;
}
