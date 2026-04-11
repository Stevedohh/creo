import { useState } from 'react';
import { Switch } from '@creo/ui';
import type { MenuProps } from 'antd';
import { SunOutlined, MoonOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useTheme, Title, Text } from '@creo/ui';
import { UserMenu } from '../user-menu';
import type { UserMenuProps } from '../user-menu';
import styles from './AppLayout.module.scss';

export interface AppLayoutProps {
  children: React.ReactNode;
  menuItems: MenuProps['items'];
  selectedKeys?: string[];
  onMenuSelect?: MenuProps['onSelect'];
  user?: Pick<UserMenuProps, 'firstName' | 'lastName'>;
  onLogout?: () => void;
  onLanguageChange?: (lang: string) => void;
  title?: string;
  subtitle?: string;
}

export function AppLayout({
  children,
  menuItems,
  selectedKeys,
  onMenuSelect,
  user,
  onLogout,
  onLanguageChange,
  title,
  subtitle,
}: AppLayoutProps) {
  const { mode, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.layout}>
      <div className={styles.siderWrapper}>
        <aside className={`${styles.sider} ${collapsed ? styles.collapsed : ''}`}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>C</span>
            <span className={styles.logoText}>Creo</span>
          </div>

          <nav className={styles.nav}>
            {menuItems?.map((item: any) => {
              const isSelected = selectedKeys?.includes(item.key);
              return (
                <button
                  key={item.key}
                  className={`${styles.navItem} ${isSelected ? styles.navItemActive : ''}`}
                  onClick={() => onMenuSelect?.({ key: item.key } as any)}
                >
                  <span className={`${styles.navIcon} ${isSelected ? styles.navIconActive : ''}`}>
                    {item.icon}
                  </span>
                  <span className={styles.navLabel}>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className={styles.footer}>
            <div className={styles.themeToggle}>
              <MoonOutlined className={styles.themeToggleIcon} />
              <Switch
                checked={mode === 'light'}
                onChange={toggleTheme}
                size="small"
              />
              <SunOutlined className={styles.themeToggleIcon} />
            </div>
          </div>
        </aside>

        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <RightOutlined /> : <LeftOutlined />}
        </button>
      </div>

      <main className={`${styles.content} ${collapsed ? styles.contentCollapsed : ''}`}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            {title && <Title level={2} className={styles.headerTitle}>{title}</Title>}
            {subtitle && <Text type="secondary">{subtitle}</Text>}
          </div>
          <div className={styles.headerRight}>
            {user && (
              <UserMenu
                firstName={user.firstName}
                lastName={user.lastName}
                onLogout={onLogout}
                onLanguageChange={onLanguageChange}
              />
            )}
          </div>
        </header>
        <div className={styles.contentInner}>{children}</div>
      </main>
    </div>
  );
}
