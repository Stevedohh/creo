import { Spin as AntSpin } from 'antd';
import type { SpinProps as AntSpinProps } from 'antd';

export type SpinProps = AntSpinProps;

export function Spin(props: SpinProps) {
  return <AntSpin {...props} />;
}
