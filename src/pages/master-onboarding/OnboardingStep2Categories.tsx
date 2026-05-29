import { useMemo, type ReactNode } from 'react';
import type { CSSProperties } from 'react';
import type { ServiceCategoryDto } from '../../features/master-onboarding/api/becomeMasterApi';
import { getServiceTemplatesForCategoryCode } from '../../constants/serviceTemplates';
import { LoadingVideo } from '../../shared/ui/LoadingVideo';
import {
  CATEGORY_CARD_ICONS,
  CATEGORY_HINTS,
  getCategoryPlanTheme,
  type CategoryPlanTheme,
} from './onboardingCategoryPlanTheme';
import { onboardingEyebrowClass, onboardingStepTitleClass } from './onboardingFormField';

function CategoryCheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M5 10.5 8.2 13.7 15 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryTitleOverlay({ title }: { title: string }) {
  return (
    <div className="relative z-10 flex flex-col justify-end lg:justify-center">
      <h1 className="break-words text-balance text-[32px] font-semibold leading-[1.02] tracking-normal text-white sm:text-[38px] lg:text-[44px] xl:text-[52px]">
        {title}
      </h1>
    </div>
  );
}

function CategoryPlanBackground({
  theme,
  children,
}: {
  theme: CategoryPlanTheme;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] lg:min-h-[440px] lg:rounded-[20px] xl:min-h-[480px]">
      <img
        key={theme.planPhoto}
        src={theme.planPhoto}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500"
        decoding="async"
      />
      <div className="absolute inset-0" style={{ background: theme.heroGradient }} aria-hidden />
      <div
        className="absolute inset-0 opacity-30 mix-blend-soft-light"
        style={{ backgroundColor: theme.accent }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/40 to-black/30" aria-hidden />

      <div className="relative flex min-h-[420px] flex-col justify-center p-4 sm:min-h-[460px] sm:p-5 lg:grid lg:min-h-[440px] lg:grid-cols-[minmax(0,34%)_minmax(0,1fr)] lg:items-center lg:gap-8 lg:p-6 xl:min-h-[480px] xl:gap-10 xl:p-7">
        {children}
      </div>
    </div>
  );
}

function CategoryServicesMarquee({ categoryCode }: { categoryCode: string }) {
  const labels = useMemo(() => {
    const titles = getServiceTemplatesForCategoryCode(categoryCode).map((item) => item.title);
    return titles.length > 0 ? titles : [];
  }, [categoryCode]);

  if (labels.length === 0) return null;

  const track = [...labels, ...labels];

  return (
    <div
      className="relative z-10 mt-4 w-full min-w-0 overflow-hidden border-t border-white/20 pt-3 sm:pt-3.5 lg:col-span-2 lg:mt-5 lg:pt-4"
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black/50 to-transparent sm:w-14" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black/50 to-transparent sm:w-14" />

      <div
        key={categoryCode}
        className="flex w-max items-center gap-5 px-4 motion-reduce:animate-none animate-services-marquee-left sm:gap-6 sm:px-5"
      >
        {[...track, ...track].map((title, index) => (
          <span
            key={`${title}-${index}`}
            className="inline-flex shrink-0 items-center gap-5 text-[14px] font-semibold tracking-normal text-white/95 sm:gap-6 sm:text-[15px]"
          >
            <span>{title}</span>
            <span className="text-white/45" aria-hidden>
              •
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function DefaultIntro({ categoriesError }: { categoriesError: string | null }) {
  return (
    <>
      <p className={onboardingEyebrowClass}>Категория</p>
      <h1 className={onboardingStepTitleClass}>Чем вы занимаетесь?</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-neutral-500 lg:text-[16px]">
        Выберите раздел каталога — фон подстроится под вашу специализацию.
      </p>

      {categoriesError ? (
        <p className="mt-4 rounded-[18px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
          {categoriesError}
        </p>
      ) : null}
    </>
  );
}

export type OnboardingStep2CategoriesProps = {
  categories: ServiceCategoryDto[];
  categoriesReady: boolean;
  categoriesError: string | null;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
};

export function OnboardingStep2Categories({
  categories,
  categoriesReady,
  categoriesError,
  selectedCategoryId,
  onSelectCategory,
}: OnboardingStep2CategoriesProps) {
  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const selectedCategory = useMemo(
    () => sorted.find((item) => item.id === selectedCategoryId) ?? null,
    [sorted, selectedCategoryId],
  );

  const theme = getCategoryPlanTheme(selectedCategory?.code);
  const hasCategorySelection = selectedCategoryId != null;

  const shellStyle = useMemo((): CSSProperties | undefined => {
    if (!theme) return undefined;
    return {
      ['--cat-accent' as string]: theme.accent,
      ['--cat-accent-soft' as string]: theme.accentSoft,
    };
  }, [theme]);

  const list = !categoriesReady ? (
    <div className="flex justify-center py-8 lg:py-12">
      <LoadingVideo label="Загрузка категорий…" />
    </div>
  ) : sorted.length === 0 ? (
    <p className="py-8 text-center text-[15px] text-neutral-500 lg:text-left">Категории не найдены. Обратитесь в поддержку.</p>
  ) : (
    <div
      data-onboarding-field="category"
      className="grid scroll-mt-28 grid-cols-1 gap-2 transition-shadow duration-300 data-[onboarding-highlight]:shadow-[0_0_0_3px_rgba(226,149,149,0.35)] sm:gap-2.5 lg:grid-cols-2 lg:items-start lg:gap-2.5 lg:scroll-mt-32"
    >
      {sorted.map((item, index) => {
        const active = selectedCategoryId === item.id;
        const itemTheme = getCategoryPlanTheme(item.code);
        const imageSrc = CATEGORY_CARD_ICONS[item.code];
        const hint = CATEGORY_HINTS[item.code] ?? '';
        const accent = itemTheme?.accent ?? '#E29595';

        const chipBg = active
          ? '#FFFFFF'
          : hasCategorySelection && theme
            ? 'rgba(255,255,255,0.72)'
            : '#E4E4E7';

        const ringClass = active
          ? 'ring-2 ring-[#E29595]/90'
          : hasCategorySelection
            ? 'ring-0'
            : 'ring-1 ring-neutral-300/80';

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelectCategory(item.id)}
            className={`flex min-h-[5rem] w-full items-center gap-3.5 rounded-[18px] px-4 py-4 text-left backdrop-blur-sm transition duration-300 sm:min-h-[5.25rem] sm:gap-4 sm:px-4 sm:py-4 lg:min-h-[5.75rem] active:scale-[0.99] ${ringClass}`}
            style={{ backgroundColor: chipBg }}
          >
            <span
              className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full sm:h-[3.75rem] sm:w-[3.75rem] lg:h-[3.25rem] lg:w-[3.25rem] ${
                active
                  ? 'bg-white ring-2 ring-[#F9D0D6]'
                  : hasCategorySelection
                    ? 'bg-white ring-1 ring-white/80'
                    : 'bg-neutral-100 ring-1 ring-neutral-300/70'
              }`}
              aria-hidden
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt=""
                  width={112}
                  height={112}
                  loading={index < 4 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                  className={`h-full w-full object-cover object-center transition duration-300 ${
                    hasCategorySelection ? '' : 'opacity-55 grayscale'
                  }`}
                />
              ) : (
                <span className="text-[13px] font-semibold text-neutral-400" aria-hidden>
                  {item.name.slice(0, 1)}
                </span>
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span
                className={`block text-[16px] font-semibold leading-snug tracking-normal sm:text-[17px] ${
                  hasCategorySelection ? 'text-neutral-950' : 'text-neutral-600'
                }`}
              >
                {item.name}
              </span>
              {hint ? (
                <span
                  className={`mt-0.5 block text-[13px] leading-snug ${
                    hasCategorySelection ? 'text-neutral-600' : 'text-neutral-500'
                  }`}
                >
                  {hint}
                </span>
              ) : null}
            </span>

            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition duration-300 sm:h-9 sm:w-9 ${
                active
                  ? 'text-white'
                  : hasCategorySelection
                    ? 'bg-white/90 text-transparent'
                    : 'bg-neutral-300 text-transparent'
              }`}
              style={active ? { backgroundColor: accent } : undefined}
              aria-hidden
            >
              <CategoryCheckIcon />
            </span>
          </button>
        );
      })}
    </div>
  );

  const listPanel = (
    <div className="relative z-10 flex w-full min-w-0 flex-col justify-center">
      {categoriesError ? (
        <p className="mb-3 rounded-[18px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
          {categoriesError}
        </p>
      ) : null}
      {list}
    </div>
  );

  if (theme && selectedCategory) {
    return (
      <div className="w-full min-w-0 transition-colors duration-500" style={shellStyle}>
        <CategoryPlanBackground theme={theme}>
          <CategoryTitleOverlay title={selectedCategory.name} />
          <div className="relative z-10 mt-5 w-full min-w-0 lg:mt-0">{listPanel}</div>
          <CategoryServicesMarquee categoryCode={selectedCategory.code} />
        </CategoryPlanBackground>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className="lg:grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)] xl:gap-10">
        <div className="min-w-0 lg:sticky lg:top-6">
          <DefaultIntro categoriesError={categoriesError} />
        </div>
        <div className="mt-4 min-w-0 lg:mt-0">
          <p className="mb-3 text-[15px] font-semibold text-neutral-950 lg:hidden">Чем вы занимаетесь?</p>
          {listPanel}
        </div>
      </div>
    </div>
  );
}
