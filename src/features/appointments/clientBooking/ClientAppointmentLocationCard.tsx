import type { DemoAppointmentRecord } from '../model/demoAppointments';

import { buildYandexMapWidgetUrl, buildYandexMapsRouteUrl } from '../model/demoAppointments';

import type { ClientBookingDetail } from './clientBookingDetailTypes';

import { ClientBookingSectionTitle } from './clientBookingDetailUi';

import {

  clientBookingGhostBtnClass,

  clientBookingPanel,

  clientBookingSecondaryBtnClass,

} from './clientBookingDetailTheme';

import { MasterAddressBlock } from '../../../pages/client/masterProfile/MasterAddressBlock';

import {

  clientBookingDetailToLocation,

  isClientBookingAddressRevealed,

} from './clientBookingLocation';



type Props = {

  detail: ClientBookingDetail;

  demoRow: DemoAppointmentRecord;

  mapTitle: string;

  onCopyAddress: () => void;

};



export function ClientAppointmentLocationCard({

  detail,

  demoRow,

  mapTitle,

  onCopyAddress,

}: Props) {

  const location = clientBookingDetailToLocation(detail);

  const revealed = isClientBookingAddressRevealed(detail.status);

  const showMap = Boolean(detail.address?.map_available && (detail.address?.line || demoRow.yandexMap));

  const hasAddressContent = Boolean(detail.address?.line || detail.address?.hint || detail.location_street);



  if (!showMap && !hasAddressContent) return null;



  return (

    <div className={`${clientBookingPanel} p-4 lg:p-5`}>

      <ClientBookingSectionTitle>{mapTitle}</ClientBookingSectionTitle>

      {showMap ? (

        <div className="mt-3 overflow-hidden rounded-[12px]">

          <iframe

            title="Карта"

            src={buildYandexMapWidgetUrl(demoRow)}

            className="block h-[min(160px,32dvh)] w-full border-0 lg:h-[160px]"

            loading="lazy"

          />

        </div>

      ) : null}



      <div className="mt-3">

        <MasterAddressBlock location={location} revealed={revealed} showRoute={false} />

      </div>



      {detail.address?.hint && !revealed ? (

        <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">{detail.address.hint}</p>

      ) : null}



      <div className="mt-3 flex flex-col gap-2 sm:flex-row">

        {showMap && revealed ? (

          <a

            href={buildYandexMapsRouteUrl(demoRow)}

            target="_blank"

            rel="noopener noreferrer"

            className={`${clientBookingSecondaryBtnClass} flex items-center justify-center sm:flex-1`}

          >

            Построить маршрут

          </a>

        ) : null}

        {detail.address?.line ? (

          <button type="button" className={`${clientBookingGhostBtnClass} sm:flex-1`} onClick={onCopyAddress}>

            Скопировать адрес

          </button>

        ) : null}

      </div>

    </div>

  );

}

