import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import App from './app';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';

const VoicesPage = lazy(() =>
  import('@creo/voice-clone-feature').then((m) => ({ default: m.VoicesPage }))
);

const ScriptsListPage = lazy(() =>
  import('@creo/scripts-feature').then((m) => ({ default: m.ScriptsListPage }))
);

const ScriptEditorPage = lazy(() =>
  import('@creo/scripts-feature').then((m) => ({ default: m.ScriptEditorPage }))
);

const ProjectsListPage = lazy(() =>
  import('@creo/projects-feature').then((m) => ({ default: m.ProjectsListPage }))
);

const ProjectEditorPage = lazy(() =>
  import('@creo/projects-feature').then((m) => ({ default: m.ProjectEditorPage }))
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
  { path: '/scripts', titleKey: 'scripts.title', subtitleKey: 'scripts.subtitle', element: <ScriptsListPage /> },
  { path: '/scripts/:id', titleKey: 'scripts.editorTitle', element: <ScriptEditorPage /> },
  { path: '/projects', titleKey: 'projects.title', subtitleKey: 'projects.subtitle', element: <ProjectsListPage /> },
  { path: '/projects/:id', titleKey: 'projects.editorTitle', element: <ProjectEditorPage /> },
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
