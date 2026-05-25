import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { AdminSheetFixedFooter } from '../shared/adminSheetFooterSlot';
import type {
  MasterCertificate,
  MasterDraft,
  MasterPortfolioItem,
  MasterSchedule,
} from '../../../features/profile/lib/demoMasterStorage';
import {
  buildWeeklyMasterSchedule,
  validateWeeklySchedule,
  WEEKDAY_LABELS_SHORT,
} from '../../../features/master/model/masterDraftStorage';
import { mergeScheduleTimeSelectOptions } from '../schedule/scheduleTimeSelectOptions';
import { validateMasterAddressForm } from '../../../features/profile/lib/masterAddressValidation';
import type { MasterVisitType } from '../../../features/profile/model/masterLocation';
import { masterVisitTypeLabel } from '../../../features/profile/model/masterLocation';
import { defaultMasterAvatarUrl } from '../../../features/master/model/masterDraftStorage';
import { BY } from 'country-flag-icons/react/1x1';
import {
  canAddContactChannel,
  contactRowsFromDraft,
  contactsToLegacyContactLine,
  validateContactValue,
  type ContactType,
  type MasterContactRow,
} from '../../../features/master-onboarding/model/masterContacts';
import {
  isOptionalBelarusPhoneValid,
  normalizeBelarusPhone,
  sanitizeBelarusPhoneInput,
} from '../../../features/master-onboarding/model/belarusPhone';
import { getMasterDisplayNameQualityError } from '../../../shared/lib/masterDisplayNamePolicy';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { uploadMasterHeroPhotoFromRemoteUrl } from '../../../features/admin/api/masterCabinetApi';
import { useTelegram } from '../../../shared/hooks/useTelegram';
import { MasterProfileContactsBlock } from '../../master-onboarding/MasterProfileContactsBlock';
import {
  OnboardingAddressMap,
  splitReferenceLabelToStreetBuilding,
  splitReferenceLabelToStreetBuildingLenient,
} from '../../master-onboarding/OnboardingAddressMap';
import {
  sheetCancelBtnClass,
  sheetDayClass,
  sheetFieldClass,
  sheetHintClass,
  sheetLabelClass,
  sheetOutlineBtnClass,
  sheetPinkPillBtnClass,
  sheetPrimaryBtnClass,
  sheetSectionTitleClass,
  sheetSegmentClass,
} from './adminProfileCabinetTheme';
import { AdminSheetFieldLabel } from '../shared/AdminFormFieldLabel';
import { CabinetIcon, type CabinetIconName } from './cabinetIcons';
import { ProfilePreviewImage } from './adminProfileMedia';

const VISIT_TYPES: MasterVisitType[] = ['studio', 'at_home'];

function newEntityId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type SheetSaveResult = void | Promise<void>;

const PORTFOLIO_TITLE_MAX = 300;
const PORTFOLIO_DESC_MAX = 5000;

function validatePortfolioFields(
  imageUrl: string,
  title: string,
  description: string,
  uploadingImage: boolean,
): Record<string, string> {
  const errs: Record<string, string> = {};
  const u = imageUrl.trim();

  if (uploadingImage) {
    errs.image = 'Дождитесь окончания загрузки фото';
  } else if (!u) {
    errs.image = 'Загрузите фото работы';
  } else if (u.startsWith('blob:')) {
    errs.image = 'Выберите фото снова или дождитесь загрузки';
  }

  const t = title.trim();
  if (t.length > PORTFOLIO_TITLE_MAX) errs.title = `Не больше ${PORTFOLIO_TITLE_MAX} символов`;
  if (t.length > 0 && t.length < 2) errs.title = 'От 2 символов или оставьте пустым';

  if (description.length > PORTFOLIO_DESC_MAX) errs.description = `Не больше ${PORTFOLIO_DESC_MAX} символов`;

  return errs;
}

/** Блок загрузки фото — как в «Редактировать профиль»: превью + кнопка в углу. */
function SheetImageUploadField({
  label,
  required = false,
  imageUrl,
  aspectClass = 'aspect-square',
  imageClass = 'h-full w-full object-cover',
  onFileChange,
  disabled = false,
  pickLabel = 'Загрузить фото',
  replaceLabel = 'Сменить',
  uploadErr,
  fieldError,
}: {
  label: string;
  required?: boolean;
  imageUrl: string;
  aspectClass?: string;
  imageClass?: string;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  pickLabel?: string;
  replaceLabel?: string;
  uploadErr?: string | null;
  fieldError?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasError = Boolean(uploadErr || fieldError);
  const preview = imageUrl.trim();

  return (
    <div className={hasError ? 'rounded-[12px] ring-2 ring-red-300/80' : undefined}>
      <AdminSheetFieldLabel required={required} className={`block ${sheetLabelClass}`}>
        {label}
      </AdminSheetFieldLabel>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFileChange}
        disabled={disabled}
      />
      <div className="relative mx-auto mt-1.5 w-full max-w-[320px]">
        <div className={`relative ${aspectClass} overflow-hidden rounded-[12px] bg-[#EBEBEB]`}>
          {preview ? (
            <img
              src={preview}
              alt=""
              className={`absolute inset-0 h-full w-full max-h-full max-w-full object-center ${imageClass}`}
              style={
                imageClass.includes('object-contain')
                  ? { objectFit: 'contain', objectPosition: 'center' }
                  : { objectFit: 'cover', objectPosition: 'center' }
              }
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#9CA3AF]">
              <CabinetIcon name="photo" size={40} />
            </div>
          )}
        </div>
        <div className="absolute bottom-2 right-2 flex max-w-[calc(100%-0.5rem)] flex-wrap justify-end gap-1.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className={sheetPinkPillBtnClass}
          >
            {disabled ? 'Загрузка…' : preview ? replaceLabel : pickLabel}
          </button>
        </div>
      </div>
      {uploadErr ? (
        <p className="mt-2 text-center text-[12px] font-medium text-red-600">{uploadErr}</p>
      ) : null}
      {fieldError ? (
        <p className="mt-2 text-center text-[12px] font-medium text-red-600">{fieldError}</p>
      ) : null}
    </div>
  );
}

export function SheetFooter({
  onCancel,
  onSave,
  saveLabel = 'Сохранить',
  savingLabel = 'Сохранение…',
  saving = false,
}: {
  onCancel: () => void;
  onSave: () => SheetSaveResult;
  saveLabel?: string;
  savingLabel?: string;
  saving?: boolean;
}) {
  const submitLockRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const isSaving = saving || submitting;

  const handleSave = () => {
    if (isSaving || submitLockRef.current) return;

    const result = onSave();
    if (result != null && typeof (result as Promise<void>).then === 'function') {
      submitLockRef.current = true;
      setSubmitting(true);
      void (result as Promise<void>).finally(() => {
        submitLockRef.current = false;
        setSubmitting(false);
      });
      return;
    }

    submitLockRef.current = true;
    window.setTimeout(() => {
      submitLockRef.current = false;
    }, 400);
  };

  return (
    <AdminSheetFixedFooter>
      <div className="flex w-full gap-3">
        <button type="button" onClick={onCancel} disabled={isSaving} className={sheetCancelBtnClass}>
          Отмена
        </button>
        <button type="button" disabled={isSaving} onClick={handleSave} className={sheetPrimaryBtnClass}>
          {isSaving ? savingLabel : saveLabel}
        </button>
      </div>
    </AdminSheetFixedFooter>
  );
}

function hasAtLeastOneValidMessengerContact(rows: MasterContactRow[]): boolean {
  return rows.some((r) => r.value.trim() && validateContactValue(r.type, r.value) === null);
}

/** Основная информация + фото профиля (с API: файл после выбора уходит на сервер). */
export function SheetMainInfo({
  draft,
  onSave,
  onCancel,
  uploadHeroPhoto,
}: {
  draft: MasterDraft;
  onSave: (patch: Partial<MasterDraft>) => SheetSaveResult;
  onCancel: () => void;
  /** Если задано — после выбора файла изображение загружается на сервер, в профиль попадает https URL. */
  uploadHeroPhoto?: (imageDataUrl: string) => Promise<string>;
}) {
  const { telegramUserPhotoUrl } = useTelegram();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(draft.photoUrl ?? '');
  const [tgPhotoLoading, setTgPhotoLoading] = useState(false);
  const [name, setName] = useState(draft.name);
  const [phone, setPhone] = useState(draft.phone ?? '');
  const [clientContacts, setClientContacts] = useState<MasterContactRow[]>(() => contactRowsFromDraft(draft));
  const [description, setDescription] = useState(draft.description);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [photoUploadErr, setPhotoUploadErr] = useState<string | null>(null);

  useEffect(() => {
    setPhotoUrl(draft.photoUrl ?? '');
    setName(draft.name);
    setPhone(draft.phone ?? '');
    setClientContacts(contactRowsFromDraft(draft));
    setDescription(draft.description);
    setFieldErrors({});
    setSubmitAttempted(false);
    setPhotoUploadErr(null);
  }, [draft]);

  const onPhotoChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !file.type.startsWith('image/')) return;
      setPhotoUploadErr(null);
      const reader = new FileReader();
      reader.onload = () => {
        void (async () => {
          const r = reader.result;
          if (typeof r !== 'string') return;
          try {
            if (uploadHeroPhoto) {
              const url = await uploadHeroPhoto(r);
              setPhotoUrl(url);
            } else {
              setPhotoUrl(r);
            }
          } catch (err) {
            setPhotoUploadErr(err instanceof Error ? err.message : 'Не удалось загрузить фото');
          }
        })();
      };
      reader.readAsDataURL(file);
    },
    [uploadHeroPhoto],
  );

  const applyTelegramPhoto = useCallback(async () => {
    const tgUrl = telegramUserPhotoUrl?.trim();
    if (!tgUrl) return;
    setPhotoUploadErr(null);
    setTgPhotoLoading(true);
    try {
      if (uploadHeroPhoto) {
        const url = await uploadMasterHeroPhotoFromRemoteUrl(tgUrl);
        setPhotoUrl(url);
      } else {
        setPhotoUrl(tgUrl);
      }
    } catch (e) {
      setPhotoUploadErr(e instanceof Error ? e.message : 'Не удалось взять фото из Telegram');
    } finally {
      setTgPhotoLoading(false);
    }
  }, [telegramUserPhotoUrl, uploadHeroPhoto]);

  const preview = photoUrl.trim() || defaultMasterAvatarUrl(name || draft.name);

  const save = async () => {
    setSubmitAttempted(true);
    const errs: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName) errs.name = 'Укажите имя';
    else {
      const nameQuality = getMasterDisplayNameQualityError(trimmedName);
      if (nameQuality) errs.name = nameQuality;
    }
    if (phone.trim() && !isOptionalBelarusPhoneValid(phone)) {
      errs.phone = 'Укажите мобильный номер РБ (+375 …)';
    }
    const hasPhone = Boolean(normalizeBelarusPhone(phone));
    const hasMessenger = hasAtLeastOneValidMessengerContact(clientContacts);
    if (!hasPhone && !hasMessenger) {
      errs.contactReachability = 'Укажите телефон или хотя бы один мессенджер';
    } else if (!hasMessenger) {
      errs.contactReachability = 'Добавьте хотя бы один контакт (Telegram, Instagram и т.д.)';
    }
    for (const row of clientContacts) {
      if (!row.value.trim()) continue;
      const fmt = validateContactValue(row.type, row.value);
      if (fmt) errs[row.id] = fmt;
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    const contacts = clientContacts
      .filter((r) => r.value.trim())
      .map((r) => ({ type: r.type, value: r.value.trim() }));
    const contactLine = contactsToLegacyContactLine(contacts) ?? '';

    setSaving(true);
    setFieldErrors({});
    try {
      await onSave({
        name: trimmedName,
        phone: normalizeBelarusPhone(phone) ?? undefined,
        contact: contactLine,
        contacts,
        description: description.trim(),
        photoUrl: photoUrl.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onPhotoChange}
        />
        <div className="relative mx-auto w-full max-w-[320px]">
          <ProfilePreviewImage
            src={preview}
            alt=""
            aspectClass="aspect-[16/10]"
            onError={(ev) => {
              (ev.target as HTMLImageElement).src = defaultMasterAvatarUrl(name || 'Мастер');
            }}
          />
          <div className="absolute bottom-2 right-2 flex max-w-[calc(100%-0.5rem)] flex-wrap justify-end gap-1.5">
            {telegramUserPhotoUrl ? (
              <button
                type="button"
                disabled={tgPhotoLoading || saving}
                onClick={() => void applyTelegramPhoto()}
                className={sheetOutlineBtnClass}
              >
                {tgPhotoLoading ? 'Загрузка…' : 'Из Telegram'}
              </button>
            ) : null}
            <button
              type="button"
              disabled={saving}
              onClick={() => photoInputRef.current?.click()}
              className={sheetPinkPillBtnClass}
            >
              Сменить
            </button>
          </div>
        </div>
        {photoUploadErr ? (
          <p className="mt-2 text-center text-[12px] font-medium text-red-600">{photoUploadErr}</p>
        ) : null}
      </div>

      <label className="block">
          <AdminSheetFieldLabel required>Имя / название мастера</AdminSheetFieldLabel>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.name;
                return next;
              });
            }}
            className={sheetFieldClass}
          />
          {submitAttempted && fieldErrors.name ? (
            <p className="mt-1.5 text-[12px] font-medium text-red-600">{fieldErrors.name}</p>
          ) : null}
        </label>

        <label className="mt-4 block">
          <span className={`flex items-center gap-2 ${sheetLabelClass}`}>
            Телефон
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EBEBEB]"
              aria-hidden
            >
              <BY title="Беларусь" className="h-full w-full object-cover" />
            </span>
          </span>
          <input
            value={phone}
            onChange={(e) => {
              setPhone(sanitizeBelarusPhoneInput(e.target.value));
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.phone;
                delete next.contactReachability;
                return next;
              });
            }}
            className={sheetFieldClass}
            placeholder="+375 29 000-00-00"
            inputMode="tel"
            autoComplete="tel"
            maxLength={19}
          />
          {submitAttempted && fieldErrors.phone ? (
            <p className="mt-1.5 text-[12px] font-medium text-red-600">{fieldErrors.phone}</p>
          ) : null}
        </label>

        <div className="mt-4">
          <MasterProfileContactsBlock
            variant="catalog"
            rows={clientContacts}
            onAdd={(type: ContactType) => {
              if (!canAddContactChannel(clientContacts, type)) return;
              setClientContacts((prev) => [
                ...prev,
                { id: newEntityId(), type, value: '' },
              ]);
            }}
            onChange={(id, value) => {
              setClientContacts((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)));
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[id];
                delete next.contactReachability;
                return next;
              });
            }}
            onRemove={(id) => {
              setClientContacts((prev) => prev.filter((r) => r.id !== id));
            }}
            onBlurRow={() => {}}
            rowErrors={fieldErrors}
            showRowError={(id) => submitAttempted && Boolean(fieldErrors[id])}
          />
          {submitAttempted && fieldErrors.contactReachability ? (
            <p className="mt-2 rounded-[10px] bg-[#FFF4E8] px-3 py-2 text-[12px] font-semibold leading-snug text-[#B66A24]">
              {fieldErrors.contactReachability}
            </p>
          ) : null}
        </div>

        <label className="mt-4 block">
          <span className={sheetLabelClass}>О себе</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`${sheetFieldClass} resize-none leading-relaxed`}
          />
        </label>

      <SheetFooter onCancel={onCancel} onSave={save} saving={saving} />
    </div>
  );
}

export function SheetExperience({
  draft,
  onSave,
  onCancel,
}: {
  draft: MasterDraft;
  onSave: (experience: string) => SheetSaveResult;
  onCancel: () => void;
}) {
  const [experience, setExperience] = useState(draft.experience ?? '');
  useEffect(() => {
    setExperience(draft.experience ?? '');
  }, [draft]);

  const save = () => {
    onSave(experience.trim());
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className={sheetLabelClass}>Опыт работы</span>
        <textarea
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          rows={6}
          placeholder="Например: Работаю мастером с 2021 года, специализируюсь на аппаратном маникюре."
          className={sheetFieldClass}
        />
      </label>
      <SheetFooter onCancel={onCancel} onSave={save} />
    </div>
  );
}

/** В кабинете город зафиксирован (MVP по Беларуси). */
const MASTER_CABINET_CITY = 'Минск';

function SheetFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[12px] font-medium text-red-600">{message}</p>;
}

function SheetAddressSectionTitle({ children }: { children: ReactNode }) {
  return <p className={`block ${sheetSectionTitleClass}`}>{children}</p>;
}

export function SheetAddress({
  draft,
  onSave,
  onCancel,
}: {
  draft: MasterDraft;
  onSave: (location: MasterDraft['location']) => SheetSaveResult;
  onCancel: () => void;
}) {
  const loc = draft.location;

  /** Не синхронизировать форму при каждом новом объекте draft — иначе сбрасывается смена «На дому» ↔ «Салон». */
  const locationSyncFingerprint = useMemo(() => {
    const l = draft.location;
    return [
      l.visitType,
      l.street,
      l.building,
      l.buildingDetail ?? '',
      l.salonName ?? '',
      l.entrance ?? '',
      l.floor ?? '',
      l.room ?? '',
      l.intercom ?? '',
      l.landmark ?? '',
      l.directions ?? '',
      l.clientNote ?? '',
      l.lat ?? '',
      l.lng ?? '',
      l.showExactAddressAfterBooking === true ? '1' : '0',
    ].join('\x1e');
  }, [draft.location]);

  const [visitType, setVisitType] = useState<MasterVisitType>(loc.visitType);
  const [street, setStreet] = useState(loc.street);
  const [building, setBuilding] = useState(loc.building);
  const [salonName, setSalonName] = useState(loc.salonName?.trim() ?? '');
  const [buildingDetail, setBuildingDetail] = useState(loc.buildingDetail?.trim() ?? '');
  const [showExactAddressAfterBooking, setShowExactAddressAfterBooking] = useState(
    loc.showExactAddressAfterBooking === true,
  );
  const [entrance, setEntrance] = useState(loc.entrance ?? '');
  const [floor, setFloor] = useState(loc.floor ?? '');
  const [room, setRoom] = useState(loc.room ?? '');
  const [intercom, setIntercom] = useState(loc.intercom ?? '');
  const [landmark, setLandmark] = useState(loc.landmark ?? '');
  const [directions, setDirections] = useState(loc.directions ?? '');
  const [clientNote, setClientNote] = useState(loc.clientNote ?? '');
  const [lat, setLat] = useState<number | undefined>(loc.lat);
  const [lng, setLng] = useState<number | undefined>(loc.lng);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [mapScriptOk, setMapScriptOk] = useState(false);
  const [addressPinnedToMap, setAddressPinnedToMap] = useState(
    () =>
      typeof loc.lat === 'number' &&
      Number.isFinite(loc.lat) &&
      typeof loc.lng === 'number' &&
      Number.isFinite(loc.lng),
  );

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  useEffect(() => {
    const l = draft.location;
    setVisitType(l.visitType);
    setStreet(l.street);
    setBuilding(l.building);
    setSalonName(l.salonName?.trim() ?? '');
    setBuildingDetail(l.buildingDetail?.trim() ?? '');
    setShowExactAddressAfterBooking(l.showExactAddressAfterBooking === true);
    setEntrance(l.entrance ?? '');
    setFloor(l.floor ?? '');
    setRoom(l.room ?? '');
    setIntercom(l.intercom ?? '');
    setLandmark(l.landmark ?? '');
    setDirections(l.directions ?? '');
    setClientNote(l.clientNote ?? '');
    setLat(l.lat);
    setLng(l.lng);
    setFieldErrors({});
    setSubmitAttempted(false);
    setAddressPinnedToMap(
      typeof l.lat === 'number' &&
        Number.isFinite(l.lat) &&
        typeof l.lng === 'number' &&
        Number.isFinite(l.lng),
    );
  }, [locationSyncFingerprint]);

  const onStreetLineChange = useCallback(
    (value: string) => {
      setAddressPinnedToMap(false);
      clearFieldError('street');
      clearFieldError('coords');
      if (value === '') {
        setStreet('');
        setBuilding('б/н');
        return;
      }
      const { street: s, building: b } = splitReferenceLabelToStreetBuildingLenient(value);
      setStreet(s);
      setBuilding(b);
    },
    [clearFieldError],
  );

  const showErr = (key: string) => (submitAttempted ? fieldErrors[key] : undefined);

  const save = () => {
    setSubmitAttempted(true);
    const errs = validateMasterAddressForm(
      {
        visitType,
        street,
        salonName,
        buildingDetail,
        entrance,
        floor,
        room,
        intercom,
        landmark,
        directions,
        clientNote,
        lat,
        lng,
      },
      { mapScriptOk, addressPinnedToMap },
    );
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSave({
      ...draft.location,
      visitType,
      city: MASTER_CABINET_CITY,
      street: street.trim(),
      building: building.trim() || 'б/н',
      salonName: !isHome ? salonName.trim() || undefined : undefined,
      buildingDetail: isHome ? buildingDetail.trim() || undefined : undefined,
      district: undefined,
      showExactAddressAfterBooking: isHome ? showExactAddressAfterBooking === true : false,
      entrance: entrance.trim() || undefined,
      floor: floor.trim() || undefined,
      room: room.trim() || undefined,
      intercom: intercom.trim() || undefined,
      landmark: landmark.trim() || undefined,
      directions: directions.trim() || undefined,
      clientNote: clientNote.trim() || undefined,
      ...(typeof lat === 'number' &&
      Number.isFinite(lat) &&
      typeof lng === 'number' &&
      Number.isFinite(lng)
        ? { lat, lng }
        : { lat: undefined, lng: undefined }),
    });
  };

  const roomLabel = visitType === 'at_home' ? 'Квартира / офис' : 'Кабинет';
  const visitTypeIconName = (vt: MasterVisitType): CabinetIconName => (vt === 'at_home' ? 'home' : 'building');
  const isHome = visitType === 'at_home';

  const addressFieldLabel = `block ${sheetLabelClass}`;

  return (
    <div className="space-y-5">
      <div>
        <AdminSheetFieldLabel className={addressFieldLabel}>Тип приёма</AdminSheetFieldLabel>
        <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-[10px] bg-[#F5F5F5] p-1.5">
          {VISIT_TYPES.map((vt) => (
            <button
              key={vt}
              type="button"
              onClick={() => {
                setVisitType(vt);
                setFieldErrors({});
                setSubmitAttempted(false);
              }}
              className={`flex min-h-11 items-center justify-center gap-1.5 ${sheetSegmentClass(visitType === vt)}`}
            >
              <span className={visitType === vt ? 'text-white' : 'text-[#F47C8C]'}>
                <CabinetIcon name={visitTypeIconName(vt)} size={16} />
              </span>
              <span>{masterVisitTypeLabel(vt)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-[12px] bg-[#EBEBEB] px-4 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#FFF1F4] text-[#F47C8C]">
          <CabinetIcon name="map-pin" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={sheetLabelClass}>Город</p>
          <p className="mt-0.5 text-[15px] font-semibold text-[#111827]">{MASTER_CABINET_CITY}</p>
        </div>
      </div>

      {visitType === 'studio' ? (
        <label className="block">
          <AdminSheetFieldLabel required className={addressFieldLabel}>
            Название салона или студии
          </AdminSheetFieldLabel>
          <input
            value={salonName}
            onChange={(e) => {
              setSalonName(e.target.value);
              clearFieldError('salonName');
            }}
            className={sheetFieldClass}
            placeholder="Например, Nail Studio"
          />
          <SheetFieldError message={showErr('salonName')} />
        </label>
      ) : null}

      <div className="space-y-1.5 overflow-visible">
        <AdminSheetFieldLabel required className={addressFieldLabel}>
          Адрес на карте
        </AdminSheetFieldLabel>
        {visitType === 'studio' ? (
          <p className={sheetHintClass}>Метка у входа в салон — так проще найти вас на месте.</p>
        ) : null}
        <div className="overflow-hidden rounded-[12px]">
          <OnboardingAddressMap
            key={`${visitType}-${draft.masterId ?? 'local'}-${locationSyncFingerprint}`}
            city={MASTER_CABINET_CITY}
            visitType={visitType}
            street={street}
            onStreetChange={onStreetLineChange}
            inputLabel="Адрес"
            inputPlaceholder="Начните вводить — подсказки под полем. Точку можно уточнить на карте."
            inputClassName={sheetFieldClass}
            suppressSuggestUntilFocus
            initialLat={lat ?? null}
            initialLng={lng ?? null}
            inputError={showErr('street')}
            coordsError={showErr('coords')}
            onMapAvailabilityChange={setMapScriptOk}
            onPick={(res) => {
              const { street: s, building: b } = splitReferenceLabelToStreetBuilding(res.addressLine);
              setStreet(s);
              setBuilding(b);
              setLat(res.lat);
              setLng(res.lng);
              setAddressPinnedToMap(true);
              clearFieldError('street');
              clearFieldError('coords');
            }}
          />
        </div>
      </div>

      {visitType === 'at_home' ? (
        <div>
          <AdminSheetFieldLabel className={addressFieldLabel}>Адрес в каталоге до записи</AdminSheetFieldLabel>

          <div
            className="mt-1.5 grid grid-cols-2 gap-2 rounded-[10px] bg-[#F5F5F5] p-1.5"
            role="radiogroup"
            aria-label="Когда показывать полный адрес"
          >
            <button
              type="button"
              role="radio"
              aria-checked={!showExactAddressAfterBooking}
              onClick={() => setShowExactAddressAfterBooking(false)}
              className={sheetSegmentClass(!showExactAddressAfterBooking)}
            >
              Видно сразу
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={showExactAddressAfterBooking}
              onClick={() => setShowExactAddressAfterBooking(true)}
              className={sheetSegmentClass(showExactAddressAfterBooking)}
            >
              Только после записи
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <div>
          <SheetAddressSectionTitle>Как найти вас</SheetAddressSectionTitle>
          {visitType === 'at_home' && showExactAddressAfterBooking ? (
            <p className={`mt-1 ${sheetHintClass}`}>
              Эти поля клиент увидит только после подтверждения записи.
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visitType === 'at_home' ? (
            <label className="block sm:col-span-2">
              <AdminSheetFieldLabel className={addressFieldLabel}>Корпус / строение</AdminSheetFieldLabel>
              <input
                value={buildingDetail}
                onChange={(e) => {
                  setBuildingDetail(e.target.value);
                  clearFieldError('buildingDetail');
                }}
                className={sheetFieldClass}
                placeholder="При необходимости"
              />
              <SheetFieldError message={showErr('buildingDetail')} />
            </label>
          ) : null}

          <label className="block">
            <AdminSheetFieldLabel required={isHome} className={addressFieldLabel}>
              Вход / подъезд
            </AdminSheetFieldLabel>
            <input
              value={entrance}
              onChange={(e) => {
                setEntrance(e.target.value);
                clearFieldError('entrance');
              }}
              className={sheetFieldClass}
              placeholder="Например, 2"
            />
            <SheetFieldError message={showErr('entrance')} />
          </label>

          <label className="block">
            <AdminSheetFieldLabel required={isHome} className={addressFieldLabel}>
              Этаж
            </AdminSheetFieldLabel>
            <input
              value={floor}
              onChange={(e) => {
                setFloor(e.target.value);
                clearFieldError('floor');
              }}
              className={sheetFieldClass}
              placeholder="Например, 5"
            />
            <SheetFieldError message={showErr('floor')} />
          </label>

          <label className="block">
            <AdminSheetFieldLabel required={isHome} className={addressFieldLabel}>
              {roomLabel}
            </AdminSheetFieldLabel>
            <input
              value={room}
              onChange={(e) => {
                setRoom(e.target.value);
                clearFieldError('room');
              }}
              className={sheetFieldClass}
              placeholder={visitType === 'at_home' ? 'Например, 42' : 'Например, 3'}
            />
            <SheetFieldError message={showErr('room')} />
          </label>

          <label className="block">
            <AdminSheetFieldLabel required={isHome} className={addressFieldLabel}>
              Домофон / ресепшен
            </AdminSheetFieldLabel>
            <input
              value={intercom}
              onChange={(e) => {
                setIntercom(e.target.value);
                clearFieldError('intercom');
              }}
              className={sheetFieldClass}
              placeholder="Код или «на ресепшене»"
            />
            <SheetFieldError message={showErr('intercom')} />
          </label>

          <label className="block sm:col-span-2">
            <AdminSheetFieldLabel className={addressFieldLabel}>Ориентир</AdminSheetFieldLabel>
            <input
              value={landmark}
              onChange={(e) => {
                setLandmark(e.target.value);
                clearFieldError('landmark');
              }}
              className={sheetFieldClass}
              placeholder="Рядом с метро, ТЦ…"
            />
            <SheetFieldError message={showErr('landmark')} />
          </label>

          <label className="block sm:col-span-2">
            <AdminSheetFieldLabel className={addressFieldLabel}>Как пройти</AdminSheetFieldLabel>
            <textarea
              value={directions}
              onChange={(e) => {
                setDirections(e.target.value);
                clearFieldError('directions');
              }}
              rows={3}
              className={`${sheetFieldClass} resize-none leading-relaxed`}
              placeholder="От метро налево, второй подъезд…"
            />
            <SheetFieldError message={showErr('directions')} />
          </label>

          <label className="block sm:col-span-2">
            <AdminSheetFieldLabel className={addressFieldLabel}>Комментарий для клиента</AdminSheetFieldLabel>
            <textarea
              value={clientNote}
              onChange={(e) => {
                setClientNote(e.target.value);
                clearFieldError('clientNote');
              }}
              rows={2}
              className={`${sheetFieldClass} resize-none leading-relaxed`}
              placeholder="Например: домофон не работает — позвоните заранее"
            />
            <SheetFieldError message={showErr('clientNote')} />
          </label>
        </div>
      </div>

      <SheetFooter onCancel={onCancel} onSave={save} />
    </div>
  );
}

export function SheetSchedule({
  draft,
  onSave,
  onCancel,
}: {
  draft: MasterDraft;
  onSave: (schedule: MasterSchedule) => SheetSaveResult;
  onCancel: () => void;
}) {
  const [workDays, setWorkDays] = useState<number[]>(() => [...draft.schedule.workDays]);
  const [startTime, setStartTime] = useState(draft.schedule.startTime);
  const [endTime, setEndTime] = useState(draft.schedule.endTime);
  const [error, setError] = useState<string | null>(null);

  const timeSelectOptions = useMemo(
    () => mergeScheduleTimeSelectOptions(startTime, endTime),
    [startTime, endTime],
  );

  useEffect(() => {
    setWorkDays([...draft.schedule.workDays]);
    setStartTime(draft.schedule.startTime);
    setEndTime(draft.schedule.endTime);
    setError(null);
  }, [draft.schedule]);

  const toggleDay = (day: number) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
    setError(null);
  };

  const save = () => {
    const validation = validateWeeklySchedule(workDays, startTime, endTime);
    if (validation) {
      setError(validation);
      return;
    }
    onSave(buildWeeklyMasterSchedule(workDays, startTime, endTime));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className={sheetLabelClass}>Рабочие дни</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAY_LABELS_SHORT.map((label, day) => {
            const on = workDays.includes(day);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(day)}
                className={sheetDayClass(on)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={sheetLabelClass}>С</span>
          <SlottySelect
            className="mt-1.5 w-full"
            value={startTime}
            onChange={(value) => {
              setStartTime(value);
              setError(null);
            }}
            options={timeSelectOptions}
            aria-label="Время начала"
          />
        </label>
        <label className="block">
          <span className={sheetLabelClass}>До</span>
          <SlottySelect
            className="mt-1.5 w-full"
            value={endTime}
            onChange={(value) => {
              setEndTime(value);
              setError(null);
            }}
            options={timeSelectOptions}
            aria-label="Время окончания"
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-3 py-2 text-[14px] font-medium text-red-700">{error}</p>
      ) : null}

      <SheetFooter onCancel={onCancel} onSave={save} />
    </div>
  );
}

export function SheetCertificate({
  draft,
  certificateId,
  onSave,
  onCancel,
  uploadImage,
}: {
  draft: MasterDraft;
  certificateId: string | null;
  onSave: (list: MasterCertificate[]) => SheetSaveResult;
  onCancel: () => void;
  uploadImage?: (file: File) => Promise<string>;
}) {
  const list = draft.certificates ?? [];
  const existing = certificateId ? list.find((c) => c.id === certificateId) : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [issuer, setIssuer] = useState(existing?.issuer ?? '');
  const [year, setYear] = useState(existing?.year ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  useEffect(() => {
    const ex = certificateId ? (draft.certificates ?? []).find((c) => c.id === certificateId) : undefined;
    setTitle(ex?.title ?? '');
    setIssuer(ex?.issuer ?? '');
    setYear(ex?.year ?? '');
    setDescription(ex?.description ?? '');
    setImageUrl(ex?.imageUrl ?? '');
    setUploadErr(null);
  }, [certificateId, draft]);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setUploadErr(null);

    if (uploadImage) {
      const preview = URL.createObjectURL(file);
      const rollbackUrl =
        (certificateId ? (draft.certificates ?? []).find((c) => c.id === certificateId) : undefined)?.imageUrl ?? '';
      setImageUrl(preview);
      setUploadingImage(true);
      void uploadImage(file)
        .then((url) => {
          URL.revokeObjectURL(preview);
          setImageUrl(url);
        })
        .catch((err: unknown) => {
          URL.revokeObjectURL(preview);
          setImageUrl(rollbackUrl);
          setUploadErr(err instanceof Error ? err.message : 'Не удалось загрузить фото');
        })
        .finally(() => setUploadingImage(false));
      return;
    }

    const preview = URL.createObjectURL(file);
    setImageUrl(preview);
    const reader = new FileReader();
    reader.onload = () => {
      URL.revokeObjectURL(preview);
      const r = reader.result;
      if (typeof r === 'string') setImageUrl(r);
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    const trimmedTitle = title.trim();
    const trimmedIssuer = issuer.trim();
    if (!trimmedTitle || !trimmedIssuer || uploadingImage) return;
    const id = certificateId ?? newEntityId();
    const nextItem: MasterCertificate = {
      id,
      title: trimmedTitle,
      issuer: trimmedIssuer,
      year: year.trim() || undefined,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    };
    const nextList = certificateId
      ? list.map((c) => (c.id === certificateId ? nextItem : c))
      : [...list, nextItem];
    return onSave(nextList);
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <AdminSheetFieldLabel required>Название сертификата</AdminSheetFieldLabel>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={sheetFieldClass} />
      </label>
      <label className="block">
        <AdminSheetFieldLabel required>Школа / организация</AdminSheetFieldLabel>
        <input value={issuer} onChange={(e) => setIssuer(e.target.value)} className={sheetFieldClass} />
      </label>
      <label className="block">
        <span className={sheetLabelClass}>Год</span>
        <input value={year} onChange={(e) => setYear(e.target.value)} className={sheetFieldClass} placeholder="2024" />
      </label>
      <label className="block">
        <span className={sheetLabelClass}>Описание</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={sheetFieldClass} />
      </label>

      <SheetImageUploadField
        label="Фото сертификата"
        imageUrl={imageUrl}
        aspectClass="aspect-[4/3]"
        imageClass="h-full w-full object-contain p-2"
        onFileChange={onFile}
        disabled={uploadingImage}
        pickLabel="Загрузить фото"
        replaceLabel="Сменить"
        uploadErr={uploadErr}
      />

      <SheetFooter
        onCancel={onCancel}
        onSave={save}
        saving={uploadingImage}
        savingLabel="Загрузка фото…"
      />
    </div>
  );
}

export function SheetPortfolio({
  draft,
  itemId,
  onSave,
  onCancel,
  uploadImage,
}: {
  draft: MasterDraft;
  itemId: string | null;
  onSave: (list: MasterPortfolioItem[]) => SheetSaveResult;
  onCancel: () => void;
  uploadImage?: (file: File) => Promise<string>;
}) {
  const list = draft.portfolio ?? [];
  const existing = itemId ? list.find((p) => p.id === itemId) : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const ex = itemId ? (draft.portfolio ?? []).find((p) => p.id === itemId) : undefined;
    setTitle(ex?.title ?? '');
    setDescription(ex?.description ?? '');
    setImageUrl(ex?.imageUrl ?? '');
    setUploadErr(null);
    setFieldErrors({});
  }, [draft, itemId]);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setUploadErr(null);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    if (uploadImage) {
      const preview = URL.createObjectURL(file);
      setImageUrl(preview);
      setUploadingImage(true);
      const prevHttps = (itemId ? (draft.portfolio ?? []).find((p) => p.id === itemId) : undefined)?.imageUrl ?? '';
      void uploadImage(file)
        .then((url) => {
          URL.revokeObjectURL(preview);
          setImageUrl(url);
        })
        .catch((err: unknown) => {
          URL.revokeObjectURL(preview);
          setImageUrl(prevHttps);
          setUploadErr(err instanceof Error ? err.message : 'Не удалось загрузить фото');
        })
        .finally(() => setUploadingImage(false));
      return;
    }

    const preview = URL.createObjectURL(file);
    setImageUrl(preview);
    const reader = new FileReader();
    reader.onload = () => {
      URL.revokeObjectURL(preview);
      const r = reader.result;
      if (typeof r === 'string') setImageUrl(r);
    };
    reader.readAsDataURL(file);
  };

  const save = (): SheetSaveResult => {
    const errs = validatePortfolioFields(imageUrl, title, description, uploadingImage);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    const id = itemId ?? newEntityId();
    const nextItem: MasterPortfolioItem = {
      id,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim(),
    };
    const nextList = itemId ? list.map((p) => (p.id === itemId ? nextItem : p)) : [...list, nextItem];
    return onSave(nextList);
  };

  return (
    <div className="space-y-4">
      <SheetImageUploadField
        label="Фото работы"
        required
        imageUrl={imageUrl}
        onFileChange={onFile}
        disabled={uploadingImage}
        pickLabel="Загрузить фото"
        replaceLabel="Сменить"
        uploadErr={uploadErr}
        fieldError={fieldErrors.image}
      />

      <label className="block">
        <span className={`flex items-baseline justify-between gap-2 ${sheetLabelClass}`}>
          <span>Название</span>
          <span className="text-[11px] font-medium tabular-nums text-neutral-400">
            {title.length}/{PORTFOLIO_TITLE_MAX}
          </span>
        </span>
        <input
          value={title}
          maxLength={PORTFOLIO_TITLE_MAX}
          onChange={(e) => {
            setTitle(e.target.value);
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.title;
              return next;
            });
          }}
          className={fieldErrors.title ? `${sheetFieldClass} ring-2 ring-red-300/80` : sheetFieldClass}
        />
        {fieldErrors.title ? <p className="mt-1.5 text-[12px] font-medium text-red-600">{fieldErrors.title}</p> : null}
      </label>

      <label className="block">
        <span className={`flex items-baseline justify-between gap-2 ${sheetLabelClass}`}>
          <span>Описание</span>
          <span className="text-[11px] font-medium tabular-nums text-neutral-400">
            {description.length}/{PORTFOLIO_DESC_MAX}
          </span>
        </span>
        <textarea
          value={description}
          maxLength={PORTFOLIO_DESC_MAX}
          onChange={(e) => {
            setDescription(e.target.value);
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.description;
              return next;
            });
          }}
          rows={3}
          className={fieldErrors.description ? `${sheetFieldClass} ring-2 ring-red-300/80` : sheetFieldClass}
        />
        {fieldErrors.description ? (
          <p className="mt-1.5 text-[12px] font-medium text-red-600">{fieldErrors.description}</p>
        ) : null}
      </label>

      <SheetFooter
        onCancel={onCancel}
        onSave={save}
        saving={uploadingImage}
        savingLabel="Загрузка фото…"
      />
    </div>
  );
}

export function SheetDeleteConfirm({
  text,
  onBack,
  onDelete,
  deleteLabel = 'Удалить',
}: {
  text: string;
  onBack: () => void;
  onDelete: () => SheetSaveResult;
  deleteLabel?: string;
}) {
  const submitLockRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = () => {
    if (submitting || submitLockRef.current) return;
    const result = onDelete();
    if (result != null && typeof (result as Promise<void>).then === 'function') {
      submitLockRef.current = true;
      setSubmitting(true);
      void (result as Promise<void>).finally(() => {
        submitLockRef.current = false;
        setSubmitting(false);
      });
      return;
    }
    submitLockRef.current = true;
    window.setTimeout(() => {
      submitLockRef.current = false;
    }, 400);
  };

  return (
    <div className="space-y-4">
      <p className="text-[15px] leading-relaxed text-[#6B7280]">{text}</p>
      <AdminSheetFixedFooter>
        <div className="flex w-full gap-3">
          <button type="button" onClick={onBack} disabled={submitting} className={sheetCancelBtnClass}>
            Назад
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleDelete}
            className="flex min-h-11 flex-1 items-center justify-center rounded-[10px] bg-red-500 px-4 text-[15px] font-semibold text-white transition hover:bg-red-600 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? 'Удаление…' : deleteLabel}
          </button>
        </div>
      </AdminSheetFixedFooter>
    </div>
  );
}
