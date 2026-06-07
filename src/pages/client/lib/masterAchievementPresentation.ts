import type { IconType } from 'react-icons';
import {
  HiChatBubbleLeftRight,
  HiSparkles,
  HiStar,
  HiTrophy,
} from 'react-icons/hi2';
import { MASTER_ACHIEVEMENT_ART } from './masterAchievementAssets';
import type { MasterTopAchievementKind } from './resolveMasterTopRankStatus';

export type MasterAchievementVisual = {
  Icon: IconType;
  artSrc: string;
  cardClass: string;
  metaClass: string;
};

export const MASTER_ACHIEVEMENT_VISUALS: Record<MasterTopAchievementKind, MasterAchievementVisual> = {
  week: {
    Icon: HiTrophy,
    artSrc: MASTER_ACHIEVEMENT_ART.week,
    cardClass: 'bg-gradient-to-br from-[#FFFBEB] via-[#FFF7ED] to-[#FFE8A3]/80',
    metaClass: 'text-[#92400E]',
  },
  month: {
    Icon: HiStar,
    artSrc: MASTER_ACHIEVEMENT_ART.month,
    cardClass: 'bg-gradient-to-br from-[#FFFBF5] via-[#FFF4E6] to-[#FDE68A]/50',
    metaClass: 'text-[#92400E]',
  },
  rating: {
    Icon: HiStar,
    artSrc: MASTER_ACHIEVEMENT_ART.rating,
    cardClass: 'bg-gradient-to-br from-[#FFFBFB] via-[#FFF1F4] to-[#FCE7F3]/70',
    metaClass: 'text-[#9D174D]',
  },
  reviews: {
    Icon: HiChatBubbleLeftRight,
    artSrc: MASTER_ACHIEVEMENT_ART.reviews,
    cardClass: 'bg-gradient-to-br from-[#FFF1F4] via-[#FFE8F0] to-[#FFD6E8]/75',
    metaClass: 'text-[#9D174D]',
  },
  new: {
    Icon: HiSparkles,
    artSrc: MASTER_ACHIEVEMENT_ART.new,
    cardClass: 'bg-gradient-to-br from-[#FFF7ED] via-[#FFEDD5] to-[#FED7AA]/65',
    metaClass: 'text-[#9A3412]',
  },
};
