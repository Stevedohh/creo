import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  DeleteOutlined,
  FolderOutlined,
  FolderAddOutlined,
  SearchOutlined,
  UploadOutlined,
  YoutubeOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Button, Empty, Input, Spin, Tag, useApp } from '@creo/ui';
import {
  useCreateMediaFolder,
  useDeleteMediaAsset,
  useDeleteMediaFolder,
  useFolderBreadcrumbs,
  useMediaAssets,
  useMediaFolders,
  useRenameMediaFolder,
  type MediaAsset,
  type MediaFolder,
} from '@creo/media-library-data-access';
import { useIngestJobs, type IngestJob } from '@creo/video-ingest-data-access';
import { formatBytes, formatDuration } from './formatters';
import { UploadModal } from './UploadModal';
import { YoutubeIngestModal } from './YoutubeIngestModal';
import { AssetDetailDrawer } from './AssetDetailDrawer';
import { FolderModal } from './FolderModal';
import styles from './MediaLibraryPanel.module.scss';

export interface MediaLibraryPanelProps {
  onAssetClick?: (asset: MediaAsset) => void;
  compact?: boolean;
  folderId?: string;
  onFolderNavigate?: (folderId: string | undefined) => void;
}

export function MediaLibraryPanel({
  onAssetClick,
  compact,
  folderId,
  onFolderNavigate,
}: MediaLibraryPanelProps) {
  const { t } = useTranslation();
  const { message, modal } = useApp();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<MediaFolder | null>(null);

  const seenDoneJobIds = useRef<Set<string>>(new Set());

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: assets, isLoading: assetsLoading } = useMediaAssets(
    folderId,
    debouncedSearch || undefined,
  );
  const { data: folders, isLoading: foldersLoading } =
    useMediaFolders(folderId);
  const { data: breadcrumbs } = useFolderBreadcrumbs(folderId);
  const { data: ingestJobs } = useIngestJobs();

  const { mutate: createFolder } = useCreateMediaFolder();
  const { mutate: renameFolder } = useRenameMediaFolder();
  const { mutate: deleteFolder } = useDeleteMediaFolder();
  const { mutate: deleteAsset } = useDeleteMediaAsset();

  const activeIngestJobs = (ingestJobs ?? []).filter(
    (j) => j.status === 'queued' || j.status === 'running',
  );

  // Invalidate media cache when ingest jobs complete
  useEffect(() => {
    if (!ingestJobs) return;
    const newlyDone = ingestJobs.filter(
      (j) => j.status === 'done' && !seenDoneJobIds.current.has(j.id),
    );
    if (newlyDone.length === 0) return;
    for (const job of newlyDone) seenDoneJobIds.current.add(job.id);
    queryClient.invalidateQueries({ queryKey: ['media'] });
  }, [ingestJobs, queryClient]);

  const handleNavigate = useCallback(
    (id: string | undefined) => {
      onFolderNavigate?.(id);
    },
    [onFolderNavigate],
  );

  const handleNewFolder = () => setFolderModalOpen(true);

  const handleRenameFolder = (folder: MediaFolder) => setRenamingFolder(folder);

  const handleFolderSubmit = (name: string) => {
    if (renamingFolder) {
      renameFolder(
        { id: renamingFolder.id, name },
        {
          onSuccess: () => {
            setRenamingFolder(null);
          },
          onError: () => message.error(t('media.folderRenameError')),
        },
      );
    } else {
      createFolder(
        { name, parentId: folderId },
        {
          onSuccess: () => {
            setFolderModalOpen(false);
            message.success(t('media.folderCreated'));
          },
          onError: () => message.error(t('media.folderCreateError')),
        },
      );
    }
  };

  const handleDeleteFolder = (folder: MediaFolder) => {
    modal.confirm({
      title: t('media.deleteFolderConfirm'),
      onOk: () =>
        new Promise<void>((resolve, reject) => {
          deleteFolder(folder.id, {
            onSuccess: () => {
              message.success(t('media.folderDeleted'));
              resolve();
            },
            onError: (err: unknown) => {
              const msg =
                err && typeof err === 'object' && 'response' in err
                  ? ((err as { response?: { data?: { message?: string } } })
                      .response?.data?.message ?? t('media.folderDeleteError'))
                  : t('media.folderDeleteError');
              message.error(msg);
              reject();
            },
          });
        }),
    });
  };

  const handleDeleteAsset = (asset: MediaAsset) => {
    modal.confirm({
      title: t('media.deleteConfirm'),
      onOk: () =>
        new Promise<void>((resolve, reject) => {
          deleteAsset(asset.id, {
            onSuccess: () => {
              message.success(t('media.deleteSuccess'));
              if (selectedAsset?.id === asset.id) {
                setSelectedAsset(null);
                setDrawerOpen(false);
              }
              resolve();
            },
            onError: () => reject(),
          });
        }),
    });
  };

  const handleAssetClick = (asset: MediaAsset) => {
    setSelectedAsset(asset);
    setDrawerOpen(true);
    onAssetClick?.(asset);
  };

  const isLoading = assetsLoading || foldersLoading;

  // Build breadcrumb items
  const breadcrumbItems = [
    {
      title: (
        <a onClick={() => handleNavigate(undefined)}>
          {t('media.title')}
        </a>
      ),
    },
    ...(breadcrumbs ?? []).map((crumb) => ({
      title: (
        <a onClick={() => handleNavigate(crumb.id)}>
          {crumb.name}
        </a>
      ),
    })),
  ];

  return (
    <div className={`${styles.panel} ${compact ? styles.compact : ''}`}>
      <div className={styles.breadcrumbs}>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className={styles.toolbar}>
        <Input
          placeholder={t('media.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
          size={compact ? 'small' : 'middle'}
          className={styles.searchInput}
        />
        <div className={styles.actions}>
          <Button
            icon={<FolderAddOutlined />}
            onClick={handleNewFolder}
            size={compact ? 'small' : 'middle'}
          >
            {!compact && t('media.newFolder')}
          </Button>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadModalOpen(true)}
            size={compact ? 'small' : 'middle'}
          >
            {t('media.upload')}
          </Button>
          <Button
            icon={<YoutubeOutlined />}
            onClick={() => setYoutubeModalOpen(true)}
            size={compact ? 'small' : 'middle'}
          >
            {!compact && 'YouTube'}
          </Button>
        </div>
      </div>

      {activeIngestJobs.length > 0 && (
        <div className={styles.jobList}>
          {activeIngestJobs.map((job) => (
            <IngestJobRow key={job.id} job={job} />
          ))}
        </div>
      )}

      {isLoading ? (
        <div className={styles.loading}>
          <Spin />
        </div>
      ) : (
        <>
          {(folders ?? []).length > 0 && !debouncedSearch && (
            <div className={styles.foldersGrid}>
              {(folders ?? []).map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onClick={() => handleNavigate(folder.id)}
                  onRename={() => handleRenameFolder(folder)}
                  onDelete={() => handleDeleteFolder(folder)}
                />
              ))}
            </div>
          )}

          {(assets ?? []).length > 0 ? (
            <div className={styles.grid}>
              {(assets ?? []).map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onClick={() => handleAssetClick(asset)}
                  onDelete={() => handleDeleteAsset(asset)}
                  compact={compact}
                />
              ))}
            </div>
          ) : (
            !(folders ?? []).length && <Empty description={t('media.empty')} />
          )}
        </>
      )}

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folderId={folderId}
      />

      <YoutubeIngestModal
        open={youtubeModalOpen}
        onClose={() => setYoutubeModalOpen(false)}
      />

      <AssetDetailDrawer
        asset={selectedAsset}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedAsset(null);
        }}
      />

      <FolderModal
        open={folderModalOpen || !!renamingFolder}
        onClose={() => {
          setFolderModalOpen(false);
          setRenamingFolder(null);
        }}
        onSubmit={handleFolderSubmit}
        initialName={renamingFolder?.name}
      />
    </div>
  );
}

/* ─── Sub-components ─── */

interface FolderCardProps {
  folder: MediaFolder;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function FolderCard({ folder, onClick, onRename, onDelete }: FolderCardProps) {
  return (
    <div className={styles.folderCard} onClick={onClick}>
      <FolderOutlined className={styles.folderIcon} />
      <span className={styles.folderName} title={folder.name}>
        {folder.name}
      </span>
      <div className={styles.folderActions}>
        <button
          className={styles.folderActionBtn}
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          title="Rename"
        >
          ✎
        </button>
        <button
          className={styles.folderActionBtn}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete"
        >
          <DeleteOutlined />
        </button>
      </div>
    </div>
  );
}

interface AssetCardProps {
  asset: MediaAsset;
  onClick: () => void;
  onDelete: () => void;
  compact?: boolean;
}

function AssetCard({ asset, onClick, onDelete, compact }: AssetCardProps) {
  const { t } = useTranslation();
  const isUploading = asset.status === 'uploading';
  const isFailed = asset.status === 'failed';

  return (
    <div
      className={`${styles.card} ${compact ? styles.cardCompact : ''}`}
      data-status={asset.status}
    >
      <div className={styles.thumb} onClick={onClick}>
        {asset.kind === 'video' && asset.url ? (
          <video src={asset.url} muted playsInline preload="metadata" />
        ) : asset.kind === 'image' && asset.url ? (
          <img src={asset.url} alt={asset.originalName ?? ''} />
        ) : (
          <div className={styles.placeholder}>{asset.kind.toUpperCase()}</div>
        )}
        {isUploading && (
          <div className={styles.overlay}>{t('media.statusUploading')}</div>
        )}
        {isFailed && (
          <div className={styles.overlayError}>{t('media.statusFailed')}</div>
        )}
      </div>
      <div className={styles.meta}>
        <div className={styles.name} title={asset.originalName ?? ''}>
          {asset.originalName ?? asset.id.slice(0, 8)}
        </div>
        <div className={styles.sub}>
          {formatDuration(asset.durationMs)} · {formatBytes(asset.storageBytes)}
        </div>
        {(asset.tags ?? []).length > 0 && (
          <div className={styles.tagList}>
            {(asset.tags ?? []).map((tag) => (
              <Tag key={tag.id} className={styles.assetTag}>
                {tag.name}
              </Tag>
            ))}
          </div>
        )}
      </div>
      <button
        className={styles.deleteBtn}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label={t('common.delete')}
      >
        <DeleteOutlined />
      </button>
    </div>
  );
}

interface IngestJobRowProps {
  job: IngestJob;
}

function IngestJobRow({ job }: IngestJobRowProps) {
  const { t } = useTranslation();
  const label =
    job.title ??
    job.sourceUrl.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40);
  const statusLabel =
    job.status === 'queued'
      ? t('media.ingestStatusQueued')
      : job.status === 'running'
        ? `${t('media.ingestStatusRunning')} ${job.progress}%`
        : job.status === 'done'
          ? t('media.ingestStatusDone')
          : t('media.ingestStatusFailed');
  return (
    <div className={styles.jobRow} data-status={job.status}>
      <div className={styles.jobInfo}>
        <div className={styles.jobLabel} title={job.sourceUrl}>
          {label}
        </div>
        <div className={styles.jobStatus}>{statusLabel}</div>
      </div>
      <div className={styles.jobProgress}>
        <div
          className={styles.jobProgressFill}
          style={{ width: `${Math.max(5, job.progress)}%` }}
        />
      </div>
    </div>
  );
}
