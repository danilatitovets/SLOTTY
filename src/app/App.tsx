import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { SeoRouteManager } from '../shared/seo/SeoRouteManager';
import { AppProviders } from './providers';
import { AppRoutes } from './router';

export function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppProviders>
          <SeoRouteManager />
          <AppRoutes />
        </AppProviders>
      </BrowserRouter>
    </HelmetProvider>
  );
}
