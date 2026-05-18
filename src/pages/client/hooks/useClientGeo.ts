import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'slotty_client_geo_v1';

type GeoState = {
  lat: number;
  lng: number;
  label: string;
};

function readStored(): GeoState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as GeoState;
    if (typeof j.lat === 'number' && typeof j.lng === 'number') return j;
  } catch {
    /* ignore */
  }
  return null;
}

export function useClientGeo() {
  const [geo, setGeo] = useState<GeoState | null>(() => readStored());
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  const cityLabel = geo?.label ?? 'Минск';
  const hasGeo = geo != null;

  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) {
      setDenied(true);
      return;
    }
    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: GeoState = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Рядом с вами',
        };
        setGeo(next);
        setDenied(false);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        setRequesting(false);
      },
      () => {
        setDenied(true);
        setRequesting(false);
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 },
    );
  }, []);

  const clearGeo = useCallback(() => {
    setGeo(null);
    setDenied(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!geo) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(geo));
    } catch {
      /* ignore */
    }
  }, [geo]);

  return {
    geo,
    hasGeo,
    cityLabel,
    requesting,
    denied,
    requestGeo,
    clearGeo,
    userLat: geo?.lat ?? null,
    userLng: geo?.lng ?? null,
  };
}
