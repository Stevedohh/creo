import { Popover as AntPopover } from 'antd';
import type { PopoverProps as AntPopoverProps } from 'antd';

export type PopoverProps = AntPopoverProps;

export function Popover(props: PopoverProps) {
  return <AntPopover {...props} />;
}
