import {
  AT_HOME_ENTRANCE_MAX,
  AT_HOME_INTERCOM_MAX,
  AT_HOME_ROOM_MAX,
} from '../../features/profile/lib/masterAddressValidation';
import type { MasterLocation, MasterVisitType } from '../../features/profile/model/masterLocation';
import { masterVisitTypeLabel } from '../../features/profile/model/masterLocation';
import { MasterAddressClientPreview } from '../../features/profile/components/MasterAddressClientPreview';
import { OnboardingAddressMap, type MapPickResult } from './OnboardingAddressMap';
import { BY } from 'country-flag-icons/react/1x1';
import {
  OnboardingFormField,
  onboardingEyebrowClass,
  onboardingFieldScrollClass,
  onboardingSectionLabelClass,
  onboardingSegmentBtnClass,
  onboardingSegmentWrapClass,
  onboardingStepTitleClass,
} from './onboardingFormField';

const VISIT_TYPES: MasterVisitType[] = ['studio', 'at_home'];

export type OnboardingStep4AddressProps = {
  city: string;
  visitType: MasterVisitType;
  onVisitTypeChange: (type: MasterVisitType) => void;

  salonName: string;
  onSalonNameChange: (value: string) => void;
  onSalonNameBlur: () => void;
  salonNameError?: string;

  street: string;
  onStreetChange: (value: string) => void;
  onStreetBlur: () => void;
  streetError?: string;
  coordsError?: string;

  lat?: number;
  lng?: number;
  pickedAddressSummary: string | null;
  addressPinnedToMap: boolean;
  mapScriptOk: boolean | null | undefined;
  onMapAvailabilityChange: (ok: boolean) => void;
  onMapPick: (result: MapPickResult) => void;
  onInvalidateAddressOnMap: () => void;

  floor: string;
  onFloorChange: (value: string) => void;
  onFloorBlur: () => void;
  floorError?: string;

  room: string;
  onRoomChange: (value: string) => void;
  onRoomBlur: () => void;
  roomError?: string;

  showExactAddressAfterBooking: boolean;
  onShowExactAddressAfterBookingChange: (afterBooking: boolean) => void;

  addressMoreOpen: boolean;
  onToggleAddressMore: () => void;

  houseDetail: string;
  onHouseDetailChange: (value: string) => void;
  onHouseDetailBlur: () => void;
  houseDetailError?: string;

  entrance: string;
  onEntranceChange: (value: string) => void;
  onEntranceBlur: () => void;
  entranceError?: string;

  intercom: string;
  onIntercomChange: (value: string) => void;
  onIntercomBlur: () => void;
  intercomError?: string;

  directions: string;
  onDirectionsChange: (value: string) => void;
  onDirectionsBlur: () => void;
  directionsError?: string;

  clientNote: string;
  onClientNoteChange: (value: string) => void;
  onClientNoteBlur: () => void;
  clientNoteError?: string;

  locationDraft: MasterLocation;
};

export function OnboardingStep4Address(props: OnboardingStep4AddressProps) {
  const {
    city,
    visitType,
    onVisitTypeChange,
    salonName,
    onSalonNameChange,
    onSalonNameBlur,
    salonNameError,
    street,
    onStreetChange,
    onStreetBlur,
    streetError,
    coordsError,
    lat,
    lng,
    pickedAddressSummary,
    addressPinnedToMap,
    mapScriptOk,
    onMapAvailabilityChange,
    onMapPick,
    onInvalidateAddressOnMap,
    floor,
    onFloorChange,
    onFloorBlur,
    floorError,
    room,
    onRoomChange,
    onRoomBlur,
    roomError,
    showExactAddressAfterBooking,
    onShowExactAddressAfterBookingChange,
    addressMoreOpen,
    onToggleAddressMore,
    houseDetail,
    onHouseDetailChange,
    onHouseDetailBlur,
    houseDetailError,
    entrance,
    onEntranceChange,
    onEntranceBlur,
    entranceError,
    intercom,
    onIntercomChange,
    onIntercomBlur,
    intercomError,
    directions,
    onDirectionsChange,
    onDirectionsBlur,
    directionsError,
    clientNote,
    onClientNoteChange,
    onClientNoteBlur,
    clientNoteError,
    locationDraft,
  } = props;

  const intro = (
    <>
      <p className={onboardingEyebrowClass}>Адрес</p>
      <h1 className={onboardingStepTitleClass}>Место приёма</h1>  
      <div className="mt-3 lg:mt-4">
        <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-[13px] font-semibold text-[#111827] ring-1 ring-[#FDE8ED] lg:bg-[#F1EFEF] lg:px-3.5 lg:py-2 lg:text-[14px] lg:ring-[#EAECEF]">
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-white shadow-[0_1px_4px_rgba(17,17,17,0.08)]"
            title="Беларусь"
            aria-hidden
          >
            <BY title="Беларусь" className="h-full w-full object-cover" />
          </span>
          <span className="text-[#6B7280] font-medium">Город</span>
          <span className="truncate">{city}</span>
        </span>
      </div>
    </>
  );

  const mapBlock = (
    <div
      data-onboarding-field="street"
      className={`overflow-visible rounded-[26px] bg-[#F1EFEF] p-3 lg:rounded-[12px] lg:bg-[#EBEBEB] lg:p-3 ${onboardingFieldScrollClass}`}
    >
      <OnboardingAddressMap
        city={city}
        visitType={visitType}
        street={street}
        addressCommitted={
          addressPinnedToMap ||
          (lat != null &&
            lng != null &&
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            street.trim().length >= 3)
        }
        onStreetChange={(value) => {
          onInvalidateAddressOnMap();
          onStreetChange(value);
        }}
        onStreetResolved={onStreetChange}
        inputLabel={visitType === 'studio' ? 'Адрес салона *' : 'Адрес приёма *'}
        inputPlaceholder="Введите улицу и дом"
        inputError={streetError}
        onInputBlur={onStreetBlur}
        initialLat={lat ?? null}
        initialLng={lng ?? null}
        addressSummary={pickedAddressSummary}
        coordsError={coordsError}
        onMapAvailabilityChange={onMapAvailabilityChange}
        onPick={onMapPick}
      />
    </div>
  );

  const form = (
    <div className="flex flex-col gap-5 lg:gap-5">
      <div data-onboarding-field="visitType">
        <p className={onboardingSectionLabelClass}>Формат</p>
        <div className={onboardingSegmentWrapClass} role="group" aria-label="Формат приёма">
          {VISIT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onVisitTypeChange(type)}
              className={onboardingSegmentBtnClass(visitType === type)}
            >
              {masterVisitTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {visitType === 'studio' ? (
        <>
          <OnboardingFormField
            fieldId="salonName"
            label="Название салона или студии"
            required
            value={salonName}
            onChange={onSalonNameChange}
            onBlur={onSalonNameBlur}
            placeholder="Например, Beauty Studio"
            error={salonNameError}
            maxLength={120}
          />
          {mapBlock}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-3">
            <OnboardingFormField
              fieldId="floor"
              label="Этаж"
              value={floor}
              onChange={onFloorChange}
              onBlur={onFloorBlur}
              placeholder="3"
              error={floorError}
              maxLength={40}
            />
            <OnboardingFormField
              fieldId="room"
              label="Кабинет"
              value={room}
              onChange={onRoomChange}
              onBlur={onRoomBlur}
              placeholder="312"
              error={roomError}
              maxLength={80}
            />
          </div>
        </>
      ) : (
        <>
          {mapBlock}
          <div>
            <p className="text-[13px] font-semibold text-neutral-500 lg:font-medium lg:text-[#6B7280]">
              Детали адреса для клиентов
            </p>
            <p className="mt-1 text-[12px] leading-snug text-neutral-400 lg:text-[13px] lg:text-[#6B7280]">
              Улица из поля выше видна всем. Подъезд, этаж, квартира и домофон — в дополнительных деталях ниже.
            </p>
            <div
              className={`${onboardingSegmentWrapClass} mt-2`}
              role="radiogroup"
              aria-label="Когда показывать детали адреса"
            >
              <button
                type="button"
                role="radio"
                aria-checked={!showExactAddressAfterBooking}
                onClick={() => onShowExactAddressAfterBookingChange(false)}
                className={onboardingSegmentBtnClass(!showExactAddressAfterBooking)}
              >
                Видно сразу
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={showExactAddressAfterBooking}
                onClick={() => onShowExactAddressAfterBookingChange(true)}
                className={onboardingSegmentBtnClass(showExactAddressAfterBooking)}
              >
                После записи
              </button>
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleAddressMore();
        }}
        aria-expanded={addressMoreOpen}
        className="flex w-full items-center gap-3 rounded-[22px] bg-[#F1EFEF] px-4 py-3.5 text-left transition hover:bg-[#E9E6E6] active:scale-[0.99] lg:rounded-[10px] lg:bg-[#EBEBEB] lg:hover:bg-[#E4E4E4]"
      >
        <span className="min-w-0 flex-1 text-[14px] font-semibold leading-none tracking-normal text-neutral-900 lg:text-[15px]">
          Дополнительные детали
        </span>
        <span
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center text-neutral-400 transition-transform duration-200 ease-out ${
            addressMoreOpen ? 'rotate-45' : ''
          }`}
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="block">
            <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      {addressMoreOpen ? (
        <div
          data-onboarding-field="address-more"
          className="space-y-4 rounded-[22px] border border-neutral-200/80 bg-white/60 px-3 py-3 sm:px-4 lg:space-y-3 lg:rounded-[12px] lg:border-0 lg:bg-[#EBEBEB]/50 lg:px-4 lg:py-4"
        >
          {visitType === 'at_home' ? (
            <OnboardingFormField
              fieldId="houseDetail"
              label="Корпус / строение"
              value={houseDetail}
              onChange={onHouseDetailChange}
              onBlur={onHouseDetailBlur}
              placeholder="При необходимости"
              error={houseDetailError}
              maxLength={120}
            />
          ) : null}

          {visitType === 'at_home' ? (
            <OnboardingFormField
              fieldId="entrance"
              label="Подъезд *"
              required
              value={entrance}
              onChange={onEntranceChange}
              onBlur={onEntranceBlur}
              placeholder="2"
              error={entranceError}
              maxLength={AT_HOME_ENTRANCE_MAX}
            />
          ) : null}

          {visitType === 'at_home' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-3">
              <OnboardingFormField
                fieldId="floor"
                label="Этаж *"
                required
                value={floor}
                onChange={onFloorChange}
                onBlur={onFloorBlur}
                placeholder="3"
                inputMode="numeric"
                error={floorError}
                maxLength={3}
              />
              <OnboardingFormField
                fieldId="room"
                label="Квартира *"
                required
                value={room}
                onChange={onRoomChange}
                onBlur={onRoomBlur}
                placeholder="45"
                error={roomError}
                maxLength={AT_HOME_ROOM_MAX}
              />
            </div>
          ) : null}

          <OnboardingFormField
            fieldId="intercom"
            label={visitType === 'at_home' ? 'Код домофона *' : 'Код домофона'}
            required={visitType === 'at_home'}
            value={intercom}
            onChange={onIntercomChange}
            onBlur={onIntercomBlur}
            placeholder="12В"
            error={intercomError}
            maxLength={visitType === 'at_home' ? AT_HOME_INTERCOM_MAX : 80}
          />

          <OnboardingFormField
            fieldId="directions"
            label="Как пройти"
            value={directions}
            onChange={onDirectionsChange}
            onBlur={onDirectionsBlur}
            placeholder="Главный вход, направо"
            multiline
            error={directionsError}
            maxLength={2000}
          />

          <OnboardingFormField
            fieldId="clientNote"
            label="Комментарий для клиента"
            value={clientNote}
            onChange={onClientNoteChange}
            onBlur={onClientNoteBlur}
            placeholder="Например, приходите за 5 минут"
            multiline
            error={clientNoteError}
            maxLength={2000}
          />
        </div>
      ) : null}

      {mapScriptOk === false ? (
        <p className="text-[12px] leading-snug text-neutral-500 lg:text-[13px]">
          Карта не загрузилась — сохраните адрес текстом. Координаты не обязательны.
        </p>
      ) : null}
    </div>
  );

  const preview = <MasterAddressClientPreview location={locationDraft} />;

  return (
    <div className="w-full min-w-0 lg:grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)] xl:gap-12">
      <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
        {intro}
        <div className="mt-5 hidden lg:block">{preview}</div>
      </div>

      <div className="mt-4 min-w-0 lg:mt-0">
        <div className="rounded-[24px] bg-[#f6f7fb] p-4 shadow-[0_4px_16px_rgba(17,24,39,0.04)] max-lg:rounded-none max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none lg:p-5">
          {form}
        </div>
        <div className="mt-5 lg:hidden">{preview}</div>
      </div>
    </div>
  );
}
