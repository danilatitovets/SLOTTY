import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildExportArchiveEntries,
  buildMasterExportArchive,
  EXPORT_ARCHIVE_USER_FILES,
  sanitizeExportJson,
} from './dataExport.generator.js';
import {
  canUserDownloadExportJob,
  canUserRetryExportJob,
  isExportJobExpired,
} from './dataExport.service.js';
import type { MasterExportPayload } from './dataExport.types.js';
import AdmZip from 'adm-zip';

const samplePayload: MasterExportPayload = {
  masterId: '00000000-0000-0000-0000-000000000001',
  report: {
    masterName: 'Тест Мастер',
    exportDate: '04.06.2026, 12:00:00',
    plan: 'Lite',
    profileSummary: 'Тестовый профиль',
    servicesCount: 1,
    appointmentsCount: 1,
    clientsCount: 1,
    paymentsCount: 0,
    activeSettingsSummary: 'Telegram: Вкл',
    briefSummary: 'Краткая сводка экспорта',
  },
  appointments: [
    {
      date: '04.06.2026',
      time: '10:00',
      client: 'Анна',
      service: 'Стрижка',
      status: 'Подтверждена',
      price: '50',
      format: 'В салоне',
      comment: '',
      createdAt: '2026-06-01T10:00:00.000Z',
    },
  ],
  services: [
    {
      title: 'Стрижка',
      category: 'Парикмахер',
      price: '50 BYN',
      durationMinutes: 60,
      active: 'Да',
    },
  ],
  clients: [
    {
      name: 'Анна',
      phone: '+375291234567',
      email: '',
      telegram: '',
      bookingsCount: 1,
      cancellations: 0,
      noShows: 0,
    },
  ],
  payments: [],
  supportTickets: [],
  settings: [{ section: 'Уведомления', key: 'Telegram', value: 'Вкл' }],
  uploads: [],
  technicalJson: {
    masterId: '00000000-0000-0000-0000-000000000001',
    secretToken: 'must-be-stripped',
    nested: { jwt: 'hidden' },
  },
};

describe('sanitizeExportJson', () => {
  it('removes secret-like keys', () => {
    const out = sanitizeExportJson(samplePayload.technicalJson) as Record<string, unknown>;
    assert.equal('secretToken' in out, false);
    assert.equal('jwt' in (out.nested as Record<string, unknown>), false);
    assert.equal(out.masterId, samplePayload.masterId);
  });
});

describe('buildMasterExportArchive', () => {
  it('contains Excel files and Word report', async () => {
    const zipBuffer = await buildMasterExportArchive(samplePayload);
    const zip = new AdmZip(zipBuffer);
    const names = zip.getEntries().map((e) => e.entryName);
    for (const file of EXPORT_ARCHIVE_USER_FILES) {
      assert.ok(names.includes(file), `missing ${file}`);
    }
    assert.ok(names.includes('data.json'));
  });

  it('buildExportArchiveEntries includes xlsx buffers', async () => {
    const entries = await buildExportArchiveEntries(samplePayload);
    const names = entries.map((e) => e.name);
    assert.ok(names.some((n) => n.endsWith('.xlsx')));
    assert.ok(names.includes('Отчёт_кабинета_мастера.docx'));
  });
});

describe('data export access rules', () => {
  const job = {
    id: 'j1',
    userId: 'u1',
    masterProfileId: 'u1',
    status: 'ready' as const,
    format: 'zip' as const,
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    errorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('owner can download ready job', () => {
    assert.equal(canUserDownloadExportJob(job, 'u1'), true);
  });

  it('another user cannot download export', () => {
    assert.equal(canUserDownloadExportJob(job, 'u2'), false);
  });

  it('expired export cannot be downloaded', () => {
    const expired = {
      ...job,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    assert.equal(isExportJobExpired(expired), true);
    assert.equal(canUserDownloadExportJob(expired, 'u1'), false);
  });

  it('failed job can be retried by owner', () => {
    const failed = { ...job, status: 'failed' as const };
    assert.equal(canUserRetryExportJob(failed, 'u1'), true);
    assert.equal(canUserRetryExportJob(failed, 'u2'), false);
  });
});
