import { Outlet } from 'react-router-dom';
import { ClientBottomNav } from './components/ClientBottomNav';
import { ClientHeader } from './components/ClientHeader';
import type { ClientOutletContext } from './clientOutletContext';
import { useClientGeo } from './hooks/useClientGeo';

export function ClientLayout() {
  const { cityLabel, hasGeo, requestGeo, userLat, userLng } = useClientGeo();

  const outletContext: ClientOutletContext = {
    clientShell: true,
    cityLabel,
    requestGeo,
    hasGeo,
    userLat,
    userLng,
  };

  return (
    <div className="min-h-dvh bg-white text-neutral-900">
      <ClientHeader cityLabel={cityLabel} onCityClick={hasGeo ? undefined : requestGeo} />
      <Outlet context={outletContext} />
      <ClientBottomNav />
    </div>
  );
}
