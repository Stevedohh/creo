import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dropdown,
  Progress,
  Space,
  Tag,
  Tooltip,
  message,
  type MenuProps,
} from 'antd';
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  CloseCircleOutlined,
  DownOutlined,
  ExportOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  QUALITY_PRESETS,
  useCancelRenderJob,
  useRenderJob,
  useStartDocumentRender,
  type QualityPreset,
  type StartDocumentRenderRequest,
} from '@creo/video-render-data-access';
import { SaveToMediaModal } from '@creo/media-library-feature';
import styles from './ExportButton.module.scss';

export interface ExportButtonProps {
  buildRequest: (preset: QualityPreset) => StartDocumentRenderRequest;
  disabled?: boolean;
  defaultSaveName?: string;
}

const prettyBytes = (bytes: number | null): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const ExportButton = ({
  buildRequest,
  disabled,
  defaultSaveName,
}: ExportButtonProps) => {
  const { t } = useTranslation();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [preset, setPreset] = useState<QualityPreset>(
    QUALITY_PRESETS.find((p) => p.id === 'standard') ?? QUALITY_PRESETS[0],
  );
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const startMutation = useStartDocumentRender();
  const cancelMutation = useCancelRenderJob();
  const { data: job } = useRenderJob(activeJobId);

  useEffect(() => {
    if (!job) return;
    if (job.status === 'succeeded') {
      messageApi.success(`Export ready · ${prettyBytes(job.resultBytes)}`);
    } else if (job.status === 'failed') {
      messageApi.error(`Export failed: ${job.errorMessage ?? 'unknown error'}`);
    } else if (job.status === 'canceled') {
      messageApi.info('Export canceled');
    }
  }, [job?.status, job?.errorMessage, job?.resultBytes, messageApi]);

  const handleStart = () => {
    const request = buildRequest(preset);
    startMutation.mutate(request, {
      onSuccess: (created) => {
        setActiveJobId(created.id);
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        messageApi.error(`Failed to start export: ${msg}`);
      },
    });
  };

  const handleCancel = () => {
    if (!activeJobId) return;
    cancelMutation.mutate(activeJobId);
  };

  const handleDownload = () => {
    if (!job?.downloadUrl) return;
    window.open(job.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      QUALITY_PRESETS.map((p) => ({
        key: p.id,
        label: (
          <div className={styles.menuItem}>
            <div className={styles.menuLabel}>{p.label}</div>
            <div className={styles.menuDescription}>{p.description}</div>
          </div>
        ),
      })),
    [],
  );

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    const next = QUALITY_PRESETS.find((p) => p.id === key);
    if (next) setPreset(next);
  };

  const isRunning =
    !!job && (job.status === 'queued' || job.status === 'running');
  const isSucceeded = job?.status === 'succeeded';

  return (
    <>
      {contextHolder}
      <Space.Compact className={styles.wrapper}>
        <Dropdown
          menu={{ items: menuItems, onClick: onMenuClick, selectedKeys: [preset.id] }}
          trigger={['click']}
        >
          <Button icon={<DownOutlined />}>
            <span className={styles.presetLabel}>{preset.label}</span>
          </Button>
        </Dropdown>

        {!isRunning && !isSucceeded && (
          <Tooltip title="Render a final video with Remotion on the server">
            <Button
              type="primary"
              icon={<ExportOutlined />}
              loading={startMutation.isPending}
              disabled={disabled}
              onClick={handleStart}
            >
              Export
            </Button>
          </Tooltip>
        )}

        {isRunning && (
          <>
            <Button icon={<LoadingOutlined />} type="primary" disabled>
              {job.status === 'queued' ? 'Queued' : `${Math.round(job.progress)}%`}
            </Button>
            <Tooltip title="Cancel render">
              <Button
                icon={<CloseCircleOutlined />}
                onClick={handleCancel}
                loading={cancelMutation.isPending}
                danger
              />
            </Tooltip>
          </>
        )}

        {isSucceeded && (
          <>
            <Button
              type="primary"
              icon={<CloudDownloadOutlined />}
              onClick={handleDownload}
            >
              Download
            </Button>
            <Tooltip title={t('media.saveToLibrary')}>
              <Button
                icon={<CloudUploadOutlined />}
                onClick={() => setSaveModalOpen(true)}
              >
                {t('media.saveToLibrary')}
              </Button>
            </Tooltip>
            <Button
              onClick={() => {
                setSaveModalOpen(false);
                setActiveJobId(null);
              }}
            >
              New export
            </Button>
          </>
        )}
      </Space.Compact>

      <SaveToMediaModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        renderJobId={activeJobId}
        defaultName={defaultSaveName}
      />

      {isRunning && (
        <div className={styles.progressBar}>
          <Progress
            percent={job?.progress ?? 0}
            status={job?.status === 'failed' ? 'exception' : 'active'}
            showInfo={false}
          />
          <Tag color="processing">
            {job.status === 'queued' ? 'Queued…' : 'Rendering…'}
          </Tag>
        </div>
      )}
    </>
  );
};

export type { RenderJobDto } from '@creo/video-render-data-access';
