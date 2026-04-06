import { useState } from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@creo/auth-data-access';
import type { RegisterRequest } from '@creo/auth-data-access';
import styles from './RegisterPage.module.scss';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'uk', label: 'Українська' },
];

export function RegisterPage() {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: RegisterRequest) => {
    setLoading(true);
    try {
      await register(values);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { status?: number } })?.response?.status === 409
          ? t('auth.errors.emailTaken')
          : t('auth.errors.generic');
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>C</div>
        <h1 className={styles.title}>{t('auth.registerTitle')}</h1>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          initialValues={{ language: i18n.language }}
        >
          <Form.Item
            name="name"
            rules={[{ max: 100 }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('auth.namePlaceholder')}
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('auth.emailRequired') },
              { type: 'email', message: t('auth.emailInvalid') },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder={t('auth.emailPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: t('auth.passwordRequired') },
              { min: 8, message: t('auth.passwordMin') },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.passwordPlaceholder')}
            />
          </Form.Item>

          <Form.Item name="language" label={t('auth.language')}>
            <Select options={LANGUAGES} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('auth.register')}
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.footer}>
          {t('auth.hasAccount')}{' '}
          <Link to="/login">{t('auth.loginLink')}</Link>
        </div>
      </div>
    </div>
  );
}
