import { Tag as AntTag } from 'antd';
import type { TagProps as AntTagProps } from 'antd';

export type TagProps = AntTagProps;

export function Tag(props: TagProps) {
  return <AntTag {...props} />;
}
