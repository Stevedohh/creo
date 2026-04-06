import type { ReactNode } from 'react';
import styles from './StatCard.module.scss';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: string; positive?: boolean };
}

export function StatCard({ label, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <div className={styles.value}>{value}</div>
      {(subtitle || trend) && (
        <div className={styles.footer}>
          {trend && (
            <span className={trend.positive ? styles.trendUp : styles.trendDown}>
              {trend.positive ? '▲' : '▼'} {trend.value}
            </span>
          )}
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
