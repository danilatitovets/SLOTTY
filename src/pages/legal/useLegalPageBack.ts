import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HUB_PATH } from '../../app/paths';

export type LegalReturnState = {
  returnTo?: string;
};

/** Куда вернуться со страницы документа: явный returnTo → history.back → главная. */
export function useLegalPageBack() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as LegalReturnState | null)?.returnTo?.trim();

  const goBack = useCallback(() => {
    if (returnTo?.startsWith('/')) {
      navigate(returnTo);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(HUB_PATH);
  }, [navigate, returnTo]);

  const backLabel =
    returnTo?.startsWith('/') || window.history.length > 1 ? 'Назад' : 'На главную';

  return { goBack, backLabel };
}

/** state для Link на юридические страницы — чтобы «Назад» вернул на экран записи и т.п. */
export function legalReturnState(returnTo: string): LegalReturnState {
  return { returnTo };
}
