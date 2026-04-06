import type { ReactNode } from 'react';
import styles from './ContentCard.module.scss';

export interface ContentCardProps {
  title?: string;
  children: ReactNode;
  extra?: ReactNode;
  className?: string;
  variant?: 'default' | 'accent';
}

export function ContentCard({ title, children, extra, className, variant = 'default' }: ContentCardProps) {
  return (
    <div className={`${styles.card} ${styles[variant]} ${className ?? ''}`}>
      {(title || extra) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {extra && <div className={styles.extra}>{extra}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
