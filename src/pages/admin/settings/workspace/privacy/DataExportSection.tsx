import { useCallback, useEffect, useMemo, useState } from 'react';
import { HiArrowDownTray, HiArrowPath, HiCheckCircle, HiDocumentText } from 'react-icons/hi2';
import { useAuth } from '../../../../../features/auth/AuthProvider';
import { getApiBaseUrl } from '../../../../../shared/api/backendClient';
import {
  SettingsCabinetFeatureCard,
  SettingsCabinetSectionTitle,
  SettingsCabinetStatusPill,
  settingsCabinetOutlineBtn,
  settingsCabinetPrimaryBtn,
} from '../settingsCabinetUi';
import {
  downloadDataExportArchive,
  fetchDataExportCapabilities,
  fetchDataExportJobs,
  isDataExportApiAvailable,
  requestDataExportArchive,
  retryDataExportJob,
} from './dataExportApi';
import {
  canDownloadDataExport,
  canRequestDataExport,
  canRetryDataExport,
  DATA_EXPORT_CONTENTS,
  DATA_EXPORT_SECTION,
  dataExportStatusMessage,
  resolveDataExportUiState,
} from './dataExportConstants';
import { downloadPersonalDataWordReport } from './personalDataWordExport';

export function DataExportSection() {
  const { profile } = useAuth();
  const hasApi = Boolean(getApiBaseUrl());
  const apiConfigured = isDataExportApiAvailable();

  const [backendReady, setBackendReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [wordBusy, setWordBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordError, setWordError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<
    Array<{
      id: string;
      status: string;
      expiresAt: string | null;
      errorMessage: string | null;
      createdAt: string;
    }>
  >([]);

  const latestJob = jobs[0] ?? null;

  const uiState = useMemo(
    () => resolveDataExportUiState(apiConfigured && backendReady, latestJob),
    [apiConfigured, backendReady, latestJob],
  );

  const statusMessage = dataExportStatusMessage(uiState);
  const archiveAvailable = uiState !== 'unavailable';

  const refresh = useCallback(async () => {
    if (!apiConfigured) {
      setLoading(false);
      setBackendReady(false);
      return;
    }
    try {
      const caps = await fetchDataExportCapabilities();
      setBackendReady(caps.available);
      if (caps.available) {
        const list = await fetchDataExportJobs();
        setJobs(list);
      } else {
        setJobs([]);
      }
      setError(null);
    } catch (e) {
      setBackendReady(false);
      setError(e instanceof Error ? e.message : 'Не удалось загрузить статус экспорта');
    } finally {
      setLoading(false);
    }
  }, [apiConfigured]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (uiState !== 'pending' && uiState !== 'processing') return undefined;
    const timer = window.setInterval(() => {
      void refresh();
    }, 12_000);
    return () => window.clearInterval(timer);
  }, [uiState, refresh]);

  const handleWordDownload = async () => {
    if (!profile) {
      setWordError('Войдите в аккаунт, чтобы скачать отчёт');
      return;
    }
    if (!hasApi) {
      setWordError('Экспорт доступен при подключении к серверу SLOTTY');
      return;
    }
    setWordBusy(true);
    setWordError(null);
    try {
      await downloadPersonalDataWordReport(profile);
    } catch (e) {
      setWordError(e instanceof Error ? e.message : 'Не удалось сформировать отчёт');
    } finally {
      setWordBusy(false);
    }
  };

  const handleRequest = async () => {
    setBusy(true);
    setError(null);
    try {
      await requestDataExportArchive();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось запросить архив');
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!latestJob) return;
    setBusy(true);
    setError(null);
    try {
      await downloadDataExportArchive(latestJob.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось скачать архив');
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = async () => {
    if (!latestJob) return;
    setBusy(true);
    setError(null);
    try {
      await retryDataExportJob(latestJob.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось повторить экспорт');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <SettingsCabinetSectionTitle
        title={DATA_EXPORT_SECTION.title}
        description={DATA_EXPORT_SECTION.description}
      />

      <SettingsCabinetFeatureCard
        icon={<HiDocumentText className="h-5 w-5" aria-hidden />}
        title={DATA_EXPORT_SECTION.wordTitle}
        subtitle={DATA_EXPORT_SECTION.wordSubtitle}
        accent
        trailing={
          <button
            type="button"
            disabled={wordBusy || !hasApi || !profile}
            onClick={() => void handleWordDownload()}
            className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[12px] px-3.5 py-2 text-[13px] font-bold sm:min-h-10 sm:px-4 sm:text-[14px] ${settingsCabinetPrimaryBtn}`}
          >
            <HiArrowDownTray className="h-4 w-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">{wordBusy ? '…' : DATA_EXPORT_SECTION.wordButton}</span>
          </button>
        }
      >
        {wordError ? <p className="text-[13px] text-[#B91C1C]">{wordError}</p> : null}
      </SettingsCabinetFeatureCard>

      <div className="mt-4">
        <SettingsCabinetFeatureCard
          icon={<HiArrowDownTray className="h-5 w-5" aria-hidden />}
          title={DATA_EXPORT_SECTION.archiveTitle}
          subtitle={DATA_EXPORT_SECTION.archiveSubtitle}
          badge={
            !archiveAvailable ? (
              <SettingsCabinetStatusPill tone="pink">{DATA_EXPORT_SECTION.soonBadge}</SettingsCabinetStatusPill>
            ) : uiState === 'ready' ? (
              <SettingsCabinetStatusPill tone="success">
                <HiCheckCircle className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                Готово
              </SettingsCabinetStatusPill>
            ) : null
          }
        >
          {archiveAvailable && statusMessage ? (
            <p className="mb-3 text-[13px] leading-relaxed text-[#6B7280]">{statusMessage}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {canRequestDataExport(uiState) ? (
              <button
                type="button"
                disabled={busy || loading}
                onClick={() => void handleRequest()}
                className={`${settingsCabinetOutlineBtn} w-full sm:w-auto`}
              >
                {DATA_EXPORT_SECTION.requestButton}
              </button>
            ) : null}

            {canDownloadDataExport(uiState) ? (
              <button
                type="button"
                disabled={busy || loading}
                onClick={() => void handleDownload()}
                className={`${settingsCabinetPrimaryBtn} w-full sm:w-auto`}
              >
                {DATA_EXPORT_SECTION.downloadButton}
              </button>
            ) : null}

            {canRetryDataExport(uiState) ? (
              <button
                type="button"
                disabled={busy || loading}
                onClick={() => void handleRetry()}
                className={`${settingsCabinetOutlineBtn} inline-flex items-center gap-2 w-full sm:w-auto`}
              >
                <HiArrowPath className="h-4 w-4" aria-hidden />
                {DATA_EXPORT_SECTION.retryButton}
              </button>
            ) : null}

            {!archiveAvailable ? (
              <button
                type="button"
                disabled
                className={`${settingsCabinetOutlineBtn} w-full cursor-not-allowed opacity-50 sm:w-auto`}
              >
                {DATA_EXPORT_SECTION.requestButton}
              </button>
            ) : null}
          </div>

          {error ? <p className="mt-3 text-[13px] text-[#B91C1C]">{error}</p> : null}
        </SettingsCabinetFeatureCard>
      </div>

      <div className="mt-4 rounded-[16px] bg-white p-4 sm:p-5">
        <p className="text-[14px] font-bold text-[#111827]">{DATA_EXPORT_SECTION.contentsTitle}</p>
        <ul className="mt-3 space-y-2">
          {DATA_EXPORT_CONTENTS.map((item) => (
            <li
              key={item.label}
              className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-[#F3F4F6] pb-2 last:border-0 last:pb-0"
            >
              <span className="text-[14px] text-[#111827]">{item.label}</span>
              <span className="text-[13px] text-[#6B7280]">{item.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
