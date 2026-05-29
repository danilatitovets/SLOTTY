import { useCallback, useMemo, useState } from 'react';
import { AdminSheetFieldLabel } from '../admin/shared/AdminFormFieldLabel';
import {
  sheetCancelBtnClass,
  sheetFieldClass,
  sheetHintClass,
  sheetLabelClass,
  sheetPrimaryBtnClass,
} from '../admin/profile/adminProfileCabinetTheme';
import { OnboardingFormField } from './onboardingFormField';
import {
  formatEducationPeriod,
  newOnboardingEducationId,
  sortEducationItemsChronologically,
  type OnboardingEducationItem,
} from './onboardingEducation';

const dashedAddBtnMobile =
  'flex min-h-11 w-full items-center justify-center rounded-full border border-dashed border-neutral-300/80 bg-white/70 px-4 text-[14px] font-semibold text-neutral-800 transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

const dashedAddBtnCabinet =
  'flex min-h-11 w-full items-center justify-center rounded-[10px] border-2 border-dashed border-[#E29595]/55 bg-[#FFF9FB] px-4 text-[14px] font-semibold text-[#111827] transition hover:border-[#F47C8C]/75 hover:bg-[#FFF1F4] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50';

type Props = {
  items: OnboardingEducationItem[];
  onChange: (items: OnboardingEducationItem[]) => void;
  /** Стиль полей как в кабинете (шаг 6 на десктопе). */
  variant?: 'mobile' | 'cabinet';
  /** Без заголовка «Образование» — секция задана снаружи. */
  embedded?: boolean;
};

type FieldKey = 'title' | 'place' | 'startYear' | 'endYear';

function validateEducationForm(values: {
  title: string;
  place: string;
  startYear: string;
  endYear: string;
}): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  const title = values.title.trim();
  if (title.length < 2) {
    errors.title = 'Укажите специальность или программу (от 2 символов)';
  } else if (title.length > 200) {
    errors.title = 'Слишком длинное название';
  }
  if (values.place.trim().length > 200) {
    errors.place = 'Слишком длинное название учреждения';
  }
  for (const key of ['startYear', 'endYear'] as const) {
    const y = values[key].trim();
    if (!y) continue;
    if (!/^\d{4}$/.test(y)) {
      errors[key] = 'Год: четыре цифры, например 2020';
    }
  }
  return errors;
}

export function OnboardingEducationBlock({
  items,
  onChange,
  variant = 'mobile',
  embedded = false,
}: Props) {
  const isCabinet = variant === 'cabinet';
  const sortedItems = useMemo(() => sortEducationItemsChronologically(items), [items]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const errors = useMemo(
    () => validateEducationForm({ title, place, startYear, endYear }),
    [title, place, startYear, endYear],
  );

  const showFieldError = (key: FieldKey) => Boolean(touched[key] && errors[key]);

  const resetForm = useCallback(() => {
    setTitle('');
    setPlace('');
    setStartYear('');
    setEndYear('');
    setDescription('');
    setEditingId(null);
    setTouched({});
    setFieldErrors({});
    setFormVisible(false);
  }, []);

  const openAdd = () => {
    resetForm();
    setFormVisible(true);
  };

  const startEdit = (item: OnboardingEducationItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setPlace(item.place);
    setStartYear(item.startYear ?? '');
    setEndYear(item.endYear ?? '');
    setDescription(item.description ?? '');
    setTouched({});
    setFieldErrors({});
    setFormVisible(true);
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
  };

  const submitForm = () => {
    const nextErrors = validateEducationForm({ title, place, startYear, endYear });
    setTouched({ title: true, place: true, startYear: true, endYear: true });
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const payload: OnboardingEducationItem = {
      id: editingId ?? newOnboardingEducationId(),
      title: title.trim(),
      place: place.trim(),
      startYear: startYear.trim() || undefined,
      endYear: endYear.trim() || undefined,
      description: description.trim() || undefined,
    };

    if (editingId) {
      onChange(items.map((item) => (item.id === editingId ? payload : item)));
    } else {
      onChange([...items, payload]);
    }
    resetForm();
  };

  const formWrapClass = isCabinet
    ? 'mt-4 space-y-4 border-t border-dashed border-[#E5E7EB] pt-4'
    : 'space-y-3.5 rounded-[22px] bg-white/80 px-3 py-3.5 sm:px-4';

  const primaryBtnClass = isCabinet
    ? `${sheetPrimaryBtnClass} sm:flex-1`
    : 'flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#E29595] text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(226,149,149,0.22)] transition active:scale-[0.98]';

  const cancelBtnClass = isCabinet
    ? `${sheetCancelBtnClass} sm:shrink-0`
    : 'flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-700 transition active:scale-[0.98]';

  const listItemClass = isCabinet
    ? 'rounded-[10px] bg-white p-3 ring-1 ring-[#EEEEEE]'
    : 'rounded-[22px] bg-white px-3 py-3 shadow-[0_6px_18px_rgba(17,17,17,0.04)]';

  const editLinkClass = isCabinet
    ? 'text-[#F47C8C] underline-offset-2 hover:underline'
    : 'text-[#E29595] underline-offset-2 hover:underline';

  return (
    <div className={embedded ? 'space-y-3' : 'space-y-3 border-t border-white/50 pt-4'}>
      {!embedded ? (
        <div>
          <p className="text-[15px] font-semibold text-neutral-900">Образование</p>
          <p className="mt-1 text-[13px] leading-snug text-neutral-500">
            Необязательно — колледж, вуз или курсы повышения квалификации
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={openAdd}
        disabled={formVisible && !editingId}
        className={isCabinet ? dashedAddBtnCabinet : dashedAddBtnMobile}
      >
        + Добавить образование
      </button>

      {formVisible ? (
        <div className={formWrapClass}>
          {isCabinet ? (
            <>
              <label className="block" data-onboarding-field="education-title">
                <AdminSheetFieldLabel required className={sheetLabelClass}>
                  Специальность или программа
                </AdminSheetFieldLabel>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                  className={sheetFieldClass}
                  placeholder="Например, Массажист"
                  maxLength={200}
                />
                {showFieldError('title') ? (
                  <p className="mt-1.5 text-[12px] font-medium text-red-600">
                    {fieldErrors.title ?? errors.title}
                  </p>
                ) : null}
              </label>
              <label className="block">
                <AdminSheetFieldLabel className={sheetLabelClass}>Учебное заведение</AdminSheetFieldLabel>
                <input
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, place: true }))}
                  className={sheetFieldClass}
                  placeholder="Например, Медицинский колледж"
                  maxLength={200}
                />
                {showFieldError('place') ? (
                  <p className="mt-1.5 text-[12px] font-medium text-red-600">
                    {fieldErrors.place ?? errors.place}
                  </p>
                ) : null}
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <AdminSheetFieldLabel className={sheetLabelClass}>Год начала</AdminSheetFieldLabel>
                  <input
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, startYear: true }))}
                    inputMode="numeric"
                    className={sheetFieldClass}
                    placeholder="2018"
                    maxLength={4}
                  />
                  {showFieldError('startYear') ? (
                    <p className="mt-1.5 text-[12px] font-medium text-red-600">
                      {fieldErrors.startYear ?? errors.startYear}
                    </p>
                  ) : null}
                </label>
                <label className="block">
                  <AdminSheetFieldLabel className={sheetLabelClass}>Год окончания</AdminSheetFieldLabel>
                  <input
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, endYear: true }))}
                    inputMode="numeric"
                    className={sheetFieldClass}
                    placeholder="2022"
                    maxLength={4}
                  />
                  {showFieldError('endYear') ? (
                    <p className="mt-1.5 text-[12px] font-medium text-red-600">
                      {fieldErrors.endYear ?? errors.endYear}
                    </p>
                  ) : null}
                </label>
              </div>
              <label className="block" data-onboarding-field="education-comment">
                <AdminSheetFieldLabel className={sheetLabelClass}>Комментарий</AdminSheetFieldLabel>
                <p className={`mt-1 ${sheetHintClass}`}>Необязательно — уточните программу или специализацию</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className={`${sheetFieldClass} resize-none leading-relaxed`}
                  placeholder="Например, диплом с отличием"
                />
              </label>
            </>
          ) : (
            <>
              <OnboardingFormField
                label="Специальность или программа"
                value={title}
                onChange={setTitle}
                onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                placeholder="Например, Массажист"
                error={showFieldError('title') ? fieldErrors.title ?? errors.title : undefined}
                maxLength={200}
              />
              <OnboardingFormField
                label="Учебное заведение"
                value={place}
                onChange={setPlace}
                onBlur={() => setTouched((t) => ({ ...t, place: true }))}
                placeholder="Например, Медицинский колледж"
                error={showFieldError('place') ? fieldErrors.place ?? errors.place : undefined}
                maxLength={200}
              />
              <div className="grid grid-cols-2 gap-3">
                <OnboardingFormField
                  label="Год начала"
                  value={startYear}
                  onChange={setStartYear}
                  onBlur={() => setTouched((t) => ({ ...t, startYear: true }))}
                  placeholder="2018"
                  inputMode="numeric"
                  error={showFieldError('startYear') ? fieldErrors.startYear ?? errors.startYear : undefined}
                  maxLength={4}
                />
                <OnboardingFormField
                  label="Год окончания"
                  value={endYear}
                  onChange={setEndYear}
                  onBlur={() => setTouched((t) => ({ ...t, endYear: true }))}
                  placeholder="2022"
                  inputMode="numeric"
                  error={showFieldError('endYear') ? fieldErrors.endYear ?? errors.endYear : undefined}
                  maxLength={4}
                />
              </div>
              <OnboardingFormField
                fieldId="education-comment"
                label="Комментарий"
                value={description}
                onChange={setDescription}
                placeholder="По желанию — специализация или программа"
                multiline
                maxLength={500}
              />
            </>
          )}
          <div className={`flex flex-col gap-2 ${isCabinet ? 'sm:flex-row' : 'pt-1 sm:flex-row sm:gap-3'}`}>
            <button type="button" onClick={submitForm} className={primaryBtnClass}>
              {editingId ? 'Сохранить' : 'Добавить'}
            </button>
            <button type="button" onClick={resetForm} className={cancelBtnClass}>
              Отмена
            </button>
          </div>
        </div>
      ) : null}

      {items.length === 0 && !formVisible && !embedded ? (
        <p className="rounded-[18px] bg-white/60 px-3 py-2.5 text-center text-[13px] font-medium leading-snug text-neutral-500">
          Можно добавить позже в кабинете
        </p>
      ) : null}

      {sortedItems.length > 0 ? (
        <ul className={`space-y-2.5 ${isCabinet ? 'mt-4 border-t border-dashed border-[#E5E7EB] pt-4' : ''}`}>
          {sortedItems.map((item) => {
            const period = formatEducationPeriod(item.startYear, item.endYear);
            const meta = [item.place.trim(), period].filter(Boolean).join(' · ');
            return (
              <li
                key={item.id}
                className={`${listItemClass} ${
                  editingId === item.id
                    ? isCabinet
                      ? 'ring-2 ring-[#F47C8C]/40'
                      : 'ring-2 ring-[#E29595]/45'
                    : ''
                }`}
              >
                <p
                  className={
                    isCabinet
                      ? 'text-[14px] font-semibold leading-snug text-[#111827]'
                      : 'break-words text-[16px] font-semibold tracking-normal text-neutral-950'
                  }
                >
                  {item.title}
                </p>
                {meta ? (
                  <p
                    className={
                      isCabinet
                        ? 'mt-0.5 text-[12px] font-medium text-[#6B7280]'
                        : 'mt-0.5 text-[13px] font-medium text-neutral-500'
                    }
                  >
                    {meta}
                  </p>
                ) : null}
                {item.description ? (
                  <p
                    className={
                      isCabinet
                        ? 'mt-1 line-clamp-2 text-[12px] leading-snug text-[#6B7280]'
                        : 'mt-1.5 line-clamp-2 text-[13px] leading-snug text-neutral-500'
                    }
                  >
                    {item.description}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-semibold sm:text-[13px]">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className={editLinkClass}
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-neutral-500 underline-offset-2 hover:underline"
                  >
                    Удалить
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
