import { Switch as AntSwitch } from 'antd';
import type { SwitchProps as AntSwitchProps } from 'antd';

export type SwitchProps = AntSwitchProps;

export function Switch(props: SwitchProps) {
  return <AntSwitch {...props} />;
}
