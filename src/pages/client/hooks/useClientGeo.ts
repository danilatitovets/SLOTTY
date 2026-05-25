import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../features/auth/AuthProvider';
import { nominatimSearchMinsk } from '../../../shared/lib/nominatimMinsk';

const STORAGE_KEY = 'slotty_client_geo_v1';
const PROFILE_GEO_KEY = 'slotty_client_profile_geo_v1';

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

function readProfileGeoForAddress(address: string): GeoState | null {
  try {
    const raw = localStorage.getItem(PROFILE_GEO_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as GeoState & { addressKey?: string };
    if (j.addressKey !== address.toLowerCase()) return null;
    if (typeof j.lat === 'number' && typeof j.lng === 'number') return j;
  } catch {
    /* ignore */
  }
  return null;
}

export function useClientGeo() {
  const { profile, isAuthenticated } = useAuth();
  const [geo, setGeo] = useState<GeoState | null>(() => readStored());
  const [profileGeo, setProfileGeo] = useState<GeoState | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  const activeGeo = geo ?? profileGeo;
  const cityLabel = activeGeo?.label ?? 'Минск';
  const hasGeo = activeGeo != null;

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

  /** Если GPS нет — геокодируем адрес из профиля клиента (Минск). */
  useEffect(() => {
    if (geo) return;
    const address = profile?.address?.trim();
    if (!address || !isAuthenticated) return;

    const cached = readProfileGeoForAddress(address);
    if (cached) {
      setProfileGeo(cached);
      return;
    }

    const ac = new AbortController();
    void (async () => {
      try {
        const hits = await nominatimSearchMinsk('Минск', address, ac.signal);
        const hit = hits[0];
        if (!hit || ac.signal.aborted) return;
        const lat = Number.parseFloat(hit.lat);
        const lng = Number.parseFloat(hit.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        const next: GeoState = { lat, lng, label: 'По адресу из профиля' };
        setProfileGeo(next);
        try {
          localStorage.setItem(PROFILE_GEO_KEY, JSON.stringify({ ...next, addressKey: address.toLowerCase() }));
        } catch {
          /* ignore */
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      ac.abort();
    };
  }, [geo, isAuthenticated, profile?.address]);

  return {
    geo: activeGeo,
    hasGeo,
    cityLabel,
    requesting,
    denied,
    requestGeo,
    clearGeo,
    userLat: activeGeo?.lat ?? null,
    userLng: activeGeo?.lng ?? null,
  };
}
