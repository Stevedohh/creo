import { Breadcrumb as AntBreadcrumb } from 'antd';
import type { BreadcrumbProps as AntBreadcrumbProps } from 'antd';
import styles from './Breadcrumb.module.scss';

export type BreadcrumbProps = AntBreadcrumbProps;

export function Breadcrumb(props: BreadcrumbProps) {
  return <AntBreadcrumb {...props} className={`${styles.breadcrumb} ${props.className ?? ''}`} />;
}
