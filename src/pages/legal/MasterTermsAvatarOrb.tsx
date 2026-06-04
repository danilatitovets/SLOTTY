import { useEffect, useMemo, useState, type CSSProperties, type FC } from 'react';
import { fetchMasterCabinet } from '../../features/admin/api/masterCabinetApi';
import { useAuth } from '../../features/auth/AuthProvider';
import {
  masterCardAvatarColor,
  masterCardInitials,
} from '../../features/masters/lib/masterListingPortrait';
import { getStoredMasterDraft } from '../../features/profile/lib/demoMasterStorage';
import { accountAvatarUrl } from '../../features/profile/lib/profileDisplayAvatar';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import { resolveAccountOrCabinetPortraitUrl } from '../admin/profile/adminProfilePortrait';

const ORB_PARTICLES: Array<{ tx: string; ty: string; delay: string; color: string; size: number }> = [
  { tx: '-76px', ty: '-44px', delay: '0s', color: '#ff8fa3', size: 12 },
  { tx: '78px', ty: '-38px', delay: '0.35s', color: '#f47c8c', size: 10 },
  { tx: '-68px', ty: '52px', delay: '0.7s', color: '#ffc2cd', size: 11 },
  { tx: '72px', ty: '48px', delay: '1.05s', color: '#ff5f7a', size: 13 },
  { tx: '0px', ty: '-82px', delay: '1.4s', color: '#fda4af', size: 9 },
  { tx: '-88px', ty: '6px', delay: '1.75s', color: '#f9a8b4', size: 10 },
  { tx: '86px', ty: '4px', delay: '2.1s', color: '#fb7185', size: 11 },
  { tx: '4px', ty: '80px', delay: '2.45s', color: '#ff8fa3', size: 12 },
];

export const MasterTermsAvatarOrb: FC = () => {
  const { profile, isAuthenticated } = useAuth();
  const [masterPhotoUrl, setMasterPhotoUrl] = useState<string | null>(null);
  const [masterName, setMasterName] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !profile?.hasMasterProfile) return;

    const draft = getStoredMasterDraft();
    if (draft?.photoUrl) setMasterPhotoUrl(draft.photoUrl);
    if (draft?.name?.trim()) setMasterName(draft.name.trim());

    let cancelled = false;
    void fetchMasterCabinet()
      .then((cabinet) => {
        if (cancelled) return;
        setMasterPhotoUrl(cabinet.profile.photoUrl ?? draft?.photoUrl ?? null);
        setMasterName(cabinet.profile.displayName?.trim() || draft?.name?.trim() || null);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, profile?.hasMasterProfile]);

  const displayName = useMemo(() => {
    const fromMaster = masterName?.trim();
    if (fromMaster) return fromMaster;
    const fromProfile = profile?.full_name?.trim();
    if (fromProfile) return fromProfile;
    return 'Мастер';
  }, [masterName, profile?.full_name]);

  const portraitSrc = useMemo(
    () => resolveAccountOrCabinetPortraitUrl(profile, masterPhotoUrl),
    [profile, masterPhotoUrl],
  );

  const fallbackAccountSrc = accountAvatarUrl(profile);
  const src = portraitSrc || fallbackAccountSrc;

  return (
    <div
      className="relative mx-auto mb-2 flex h-[148px] w-[148px] items-center justify-center sm:h-[160px] sm:w-[160px]"
      aria-hidden
    >
      {ORB_PARTICLES.map((orb, index) => (
        <span
          key={index}
          className="master-terms-orb-particle pointer-events-none absolute left-1/2 top-1/2 rounded-full"
          style={
            {
              width: orb.size,
              height: orb.size,
              marginLeft: -orb.size / 2,
              marginTop: -orb.size / 2,
              backgroundColor: orb.color,
              '--orb-tx': orb.tx,
              '--orb-ty': orb.ty,
              animationDelay: orb.delay,
            } as CSSProperties
          }
        />
      ))}

      <div className="relative z-10 flex h-[96px] w-[96px] items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_8px_32px_rgba(244,124,140,0.28)] ring-4 ring-white sm:h-[104px] sm:w-[104px]">
        {src ? (
          <ImageReveal src={src} alt="" className="h-full w-full object-cover" loading="eager" />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center text-[32px] font-bold text-white sm:text-[36px]"
            style={{ backgroundColor: masterCardAvatarColor(displayName) }}
          >
            {masterCardInitials(displayName)}
          </span>
        )}
      </div>
    </div>
  );
};
