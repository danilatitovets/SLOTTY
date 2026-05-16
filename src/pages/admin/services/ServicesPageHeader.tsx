import { ServicesTabIntro } from './ServicesTabIntro';
import type { ServicesTabId } from './servicesTypes';

type Props = {
  activeTab: ServicesTabId;
};

export function ServicesPageHeader({ activeTab }: Props) {
  return <ServicesTabIntro tab={activeTab} />;
}
