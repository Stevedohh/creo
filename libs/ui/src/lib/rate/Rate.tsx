import { Rate as AntRate } from 'antd';
import type { RateProps as AntRateProps } from 'antd';

export type RateProps = AntRateProps;

export function Rate(props: RateProps) {
  return <AntRate {...props} />;
}
