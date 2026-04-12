import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeleteOutlined } from '@ant-design/icons';
import { Player } from '@remotion/player';
import { AbsoluteFill, OffthreadVideo } from 'remotion';
import { Drawer, Input, Select, WaveformPlayer, useApp } from '@creo/ui';
import {
  useCreateMediaTag,
  useDeleteMediaTag,
  useMediaTags,
  useUpdateMediaAsset,
  type MediaAsset,
} from '@creo/media-library-data-access';
import { formatBytes, formatDuration } from './formatters';
import styles from './AssetDetailDrawer.module.scss';

export interface AssetDetailDrawerProps {
  asset: MediaAsset | null;
  open: boolean;
  onClose: () => void;
}

export function AssetDetailDrawer({
  asset,
  open,
  onClose,
}: AssetDetailDrawerProps) {
  const { t } = useTranslation();
  const { message } = useApp();
  const { data: allTags } = useMediaTags();
  const { mutate: createTag } = useCreateMediaTag();
  const { mutate: deleteTag } = useDeleteMediaTag();
  const { mutate: updateAsset } = useUpdateMediaAsset();

  const [editName, setEditName] = useState('');
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');

  useEffect(() => {
    if (asset) {
      setEditName(asset.originalName ?? '');
      setEditTagIds((asset.tags ?? []).map((t) => t.id));
    }
  }, [asset]);

  const handleSaveName = () => {
    if (!asset) return;
    const trimmed = editName.trim();
    if (trimmed && trimmed !== asset.originalName) {
      updateAsset(
        { id: asset.id, data: { name: trimmed } },
        {
          onSuccess: () => message.success(t('media.saved')),
          onError: () => message.error(t('media.saveError')),
        },
      );
    }
  };

  const handleTagsChange = (newTagIds: string[]) => {
    if (!asset) return;
    setEditTagIds(newTagIds);
    updateAsset(
      { id: asset.id, data: { tagIds: newTagIds } },
      {
        onError: () => message.error(t('media.saveError')),
      },
    );
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !tagSearch.trim()) return;
    e.preventDefault();
    e.stopPropagation();
    const trimmed = tagSearch.trim();
    const existing = allTags?.find(
      (tag) => tag.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      if (!editTagIds.includes(existing.id)) {
        handleTagsChange([...editTagIds, existing.id]);
      }
      setTagSearch('');
    } else {
      createTag(trimmed, {
        onSuccess: (newTag) => {
          handleTagsChange([...editTagIds, newTag.id]);
          setTagSearch('');
        },
      });
    }
  };

  const handleDeleteTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    deleteTag(tagId, {
      onSuccess: () => {
        setEditTagIds((prev) => prev.filter((id) => id !== tagId));
      },
    });
  };

  const tagOptions = (allTags ?? []).map((tag) => ({
    label: tag.name,
    value: tag.id,
  }));

  const videoFps = 30;
  const videoDurationInFrames = useMemo(
    () => Math.max(1, Math.round(((asset?.durationMs ?? 0) / 1000) * videoFps)),
    [asset?.durationMs],
  );

  if (!asset) return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <Drawer
      title={t('media.assetDetails')}
      open={open}
      onClose={onClose}
      width={400}
      destroyOnClose
    >
      <div className={styles.content}>
        <div className={styles.preview}>
          {asset.kind === 'video' && asset.url ? (
            <Player
              component={SimpleVideo}
              inputProps={{ src: asset.url }}
              durationInFrames={videoDurationInFrames}
              fps={videoFps}
              compositionWidth={asset.width ?? 1920}
              compositionHeight={asset.height ?? 1080}
              controls
              loop
              style={{ width: '100%' }}
            />
          ) : asset.kind === 'audio' && asset.url ? (
            <WaveformPlayer src={asset.url} />
          ) : asset.kind === 'image' && asset.url ? (
            <img
              src={asset.url}
              alt={asset.originalName ?? ''}
              className={styles.imagePreview}
            />
          ) : (
            <div className={styles.noPreview}>
              {asset.kind.toUpperCase()}
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('media.fileName')}</label>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onPressEnter={handleSaveName}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('media.tags')}</label>
          <Select
            mode="multiple"
            value={editTagIds}
            onChange={handleTagsChange}
            options={tagOptions}
            placeholder={t('media.tagsPlaceholder')}
            searchValue={tagSearch}
            onSearch={setTagSearch}
            onInputKeyDown={handleTagInputKeyDown}
            filterOption={(input, option) =>
              (option?.label as string)
                ?.toLowerCase()
                .includes(input.toLowerCase()) ?? false
            }
            optionRender={(option) => (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{option.label}</span>
                <DeleteOutlined
                  style={{ fontSize: 12, color: 'var(--creo-color-text-secondary)' }}
                  onClick={(e) => handleDeleteTag(option.value as string, e)}
                />
              </div>
            )}
            style={{ width: '100%' }}
          />
        </div>

        <div className={styles.metaSection}>
          <label className={styles.label}>{t('media.details')}</label>
          <div className={styles.metaGrid}>
            <div className={styles.metaKey}>{t('media.kind')}</div>
            <div className={styles.metaValue}>{asset.kind}</div>

            <div className={styles.metaKey}>{t('media.size')}</div>
            <div className={styles.metaValue}>
              {formatBytes(asset.storageBytes)}
            </div>

            {asset.durationMs != null && asset.durationMs > 0 && (
              <>
                <div className={styles.metaKey}>{t('media.duration')}</div>
                <div className={styles.metaValue}>
                  {formatDuration(asset.durationMs)}
                </div>
              </>
            )}

            {asset.width != null && asset.height != null && (
              <>
                <div className={styles.metaKey}>{t('media.dimensions')}</div>
                <div className={styles.metaValue}>
                  {asset.width} × {asset.height}
                </div>
              </>
            )}

            {asset.mimeType && (
              <>
                <div className={styles.metaKey}>{t('media.mimeType')}</div>
                <div className={styles.metaValue}>{asset.mimeType}</div>
              </>
            )}

            <div className={styles.metaKey}>{t('media.source')}</div>
            <div className={styles.metaValue}>{asset.source}</div>

            <div className={styles.metaKey}>{t('media.createdAt')}</div>
            <div className={styles.metaValue}>
              {formatDate(asset.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

function SimpleVideo({ src }: { src: string }) {
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={src}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </AbsoluteFill>
  );
}
