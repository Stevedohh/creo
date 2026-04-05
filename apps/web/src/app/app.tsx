import { useTranslation } from 'react-i18next';
import { Button, Input, Title, Text } from '@org/ui';
import styles from './app.module.scss';

export function App() {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <Title level={2}>{t('app.title')}</Title>
      <Text type="secondary">{t('app.subtitle')}</Text>
      <div className={styles.actions}>
        <Input placeholder={t('app.inputPlaceholder')} />
        <Button type="primary">{t('app.submit')}</Button>
      </div>
    </div>
  );
}

export default App;
