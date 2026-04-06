import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useTheme } from '@creo/ui';
import styles from './UserMenu.module.scss';

export interface UserMenuProps {
  firstName: string;
  lastName: string;
  onLogout?: () => void;
  onLanguageChange?: (lang: string) => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'uk', label: 'Українська' },
];

export function UserMenu({ firstName, lastName, onLogout, onLanguageChange }: UserMenuProps) {
  const { t, i18n } = useTranslation();
  const { mode, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button className={styles.trigger} onClick={() => setOpen(!open)}>
        <span className={styles.avatar}>{initials}</span>
        <span className={styles.name}>{firstName} {lastName}</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.section}>
            <div className={styles.sectionLabel}>
              <GlobalOutlined /> {t('userMenu.language')}
            </div>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                className={`${styles.item} ${i18n.language === lang.code ? styles.itemActive : ''}`}
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  onLanguageChange?.(lang.code);
                  setOpen(false);
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <div className={styles.divider} />

          <button className={styles.item} onClick={() => { toggleTheme(); setOpen(false); }}>
            {mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            {mode === 'dark' ? t('userMenu.lightTheme') : t('userMenu.darkTheme')}
          </button>

          <div className={styles.divider} />

          <button
            className={`${styles.item} ${styles.itemDanger}`}
            onClick={() => { onLogout?.(); setOpen(false); }}
          >
            <LogoutOutlined />
            {t('userMenu.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
