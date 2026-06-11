import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ADMIN_OVERVIEW_PATH } from '../../app/paths';
import { ADMIN_MAIN_NAV, isAdminNavItemActive, resolveAdminNavItemMeta } from './adminCabinetNav';

function loc(pathname: string, search = '') {
  return { pathname, search, hash: '', state: null, key: 'default' };
}

describe('ADMIN_MAIN_NAV', () => {
  it('includes Сегодня as the first main menu item', () => {
    assert.equal(ADMIN_MAIN_NAV[0]?.label, 'Сегодня');
    assert.equal(ADMIN_MAIN_NAV[0]?.to, ADMIN_OVERVIEW_PATH);
  });
});

describe('resolveAdminNavItemMeta', () => {
  it('returns descriptions for Клиенты and Отзывы', () => {
    const clients = ADMIN_MAIN_NAV.find((item) => item.label === 'Клиенты')!;
    const reviews = ADMIN_MAIN_NAV.find((item) => item.label === 'Отзывы')!;

    assert.match(resolveAdminNavItemMeta(clients)?.description ?? '', /клиент/i);
    assert.match(resolveAdminNavItemMeta(reviews)?.description ?? '', /отзыв/i);
  });
});

describe('isAdminNavItemActive', () => {
  const clients = ADMIN_MAIN_NAV.find((item) => item.label === 'Клиенты')!;
  const reviews = ADMIN_MAIN_NAV.find((item) => item.label === 'Отзывы')!;

  it('highlights only Клиенты on ?tab=clients', () => {
    const location = loc(ADMIN_OVERVIEW_PATH, '?tab=clients');
    assert.equal(isAdminNavItemActive(clients, location), true);
    assert.equal(isAdminNavItemActive(reviews, location), false);
  });

  it('highlights only Отзывы on ?tab=reputation', () => {
    const location = loc(ADMIN_OVERVIEW_PATH, '?tab=reputation');
    assert.equal(isAdminNavItemActive(clients, location), false);
    assert.equal(isAdminNavItemActive(reviews, location), true);
  });

  it('highlights only Сегодня on /admin/overview without tab', () => {
    const today = ADMIN_MAIN_NAV.find((item) => item.label === 'Сегодня')!;
    const location = loc(ADMIN_OVERVIEW_PATH);
    assert.equal(isAdminNavItemActive(today, location), true);
    assert.equal(isAdminNavItemActive(clients, location), false);
    assert.equal(isAdminNavItemActive(reviews, location), false);
  });
});
