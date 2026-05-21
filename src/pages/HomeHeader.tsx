import { SlottyHeader } from '../shared/layout/SlottyHeader/SlottyHeader';

/** @deprecated Используйте `SlottyHeader` напрямую. Оставлено для совместимости импортов. */
export type HomeHeaderProps = {
  isDemoMaster?: boolean;
  onProfileTab?: (tab: 'appointments' | 'favorites') => void | Promise<void>;
};

export function HomeHeader(_props?: HomeHeaderProps) {
  return <SlottyHeader variant="landing" />;
}
