import { Empty as AntEmpty } from 'antd';
import type { EmptyProps as AntEmptyProps } from 'antd';

export type EmptyProps = AntEmptyProps;

export function Empty(props: EmptyProps) {
  return <AntEmpty {...props} />;
}

Empty.PRESENTED_IMAGE_DEFAULT = AntEmpty.PRESENTED_IMAGE_DEFAULT;
Empty.PRESENTED_IMAGE_SIMPLE = AntEmpty.PRESENTED_IMAGE_SIMPLE;
