import { useLocation } from 'react-router-dom';
import { resolveSeoMeta } from './seoConfig';
import { SeoHead } from './SeoHead';

/** Applies route-based SEO meta on navigation (invisible to users). */
export function SeoRouteManager() {
  const { pathname } = useLocation();
  const meta = resolveSeoMeta(pathname);
  return <SeoHead meta={meta} />;
}
