import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@creo/ui';
import { QueryProvider } from '@creo/shared';
import { AppLayout } from '@creo/shell';
import { AuthProvider, useAuth } from '@creo/auth-data-access';
import { LoginPage, RegisterPage, ProtectedRoute } from '@creo/auth-feature';
import { useTranslation } from 'react-i18next';
import {
  DashboardOutlined,
  AudioOutlined,
  BarChartOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { AppRouter, routes } from './app/router';
import './i18n/i18n';

function Shell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, updateLanguage } = useAuth();

  const currentRoute = routes.find((r) => r.path === location.pathname);

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: t('nav.home') },
    { key: '/voices', icon: <AudioOutlined />, label: t('nav.voices') },
    { key: '/analytics', icon: <BarChartOutlined />, label: t('nav.analytics') },
    { key: '/scripts', icon: <FileTextOutlined />, label: t('nav.scripts') },
  ];

  const displayUser = user
    ? {
        firstName: user.name?.split(' ')[0] ?? user.email.split('@')[0],
        lastName: user.name?.split(' ')[1] ?? '',
      }
    : undefined;

  return (
    <ProtectedRoute>
      <AppLayout
        menuItems={menuItems}
        selectedKeys={[location.pathname]}
        onMenuSelect={({ key }) => navigate(key)}
        user={displayUser}
        onLogout={logout}
        onLanguageChange={updateLanguage}
        title={currentRoute ? t(currentRoute.titleKey) : undefined}
        subtitle={currentRoute?.subtitleKey ? t(currentRoute.subtitleKey) : undefined}
      >
        <AppRouter />
      </AppLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Shell />} />
    </Routes>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <QueryProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryProvider>
  </StrictMode>
);
