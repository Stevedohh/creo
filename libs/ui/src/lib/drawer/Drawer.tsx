import { Drawer as AntDrawer } from 'antd';
import type { DrawerProps as AntDrawerProps } from 'antd';

export type DrawerProps = AntDrawerProps;

export function Drawer(props: DrawerProps) {
  return <AntDrawer {...props} />;
}
