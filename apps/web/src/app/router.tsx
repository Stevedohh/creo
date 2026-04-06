import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import App from './app';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { ScriptsPage } from './pages/scripts/ScriptsPage';

const VoicesPage = lazy(() =>
  import('@creo/voice-clone-feature').then((m) => ({ default: m.VoicesPage }))
);

export interface RouteConfig {
  path: string;
  titleKey: string;
  subtitleKey?: string;
  element: React.ReactNode;
}

export const routes: RouteConfig[] = [
  { path: '/', titleKey: 'dashboard.title', subtitleKey: 'dashboard.subtitle', element: <App /> },
  { path: '/voices', titleKey: 'voices.title', subtitleKey: 'voices.subtitle', element: <VoicesPage /> },
  { path: '/analytics', titleKey: 'analytics.title', subtitleKey: 'analytics.subtitle', element: <AnalyticsPage /> },
  { path: '/scripts', titleKey: 'scripts.title', subtitleKey: 'scripts.subtitle', element: <ScriptsPage /> },
];

export function AppRouter() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </Suspense>
  );
}
