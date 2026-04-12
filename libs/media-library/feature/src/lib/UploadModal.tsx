import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Select, useApp } from '@creo/ui';
import {
  useCreateMediaTag,
  useMediaTags,
  useUploadMediaAsset,
} from '@creo/media-library-data-access';
import styles from './UploadModal.module.scss';

export interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  folderId?: string;
}

export function UploadModal({ open, onClose, folderId }: UploadModalProps) {
  const { t } = useTranslation();
  const { message } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const [tagSearch, setTagSearch] = useState('');

  const { data: tags } = useMediaTags();
  const { mutate: createTag } = useCreateMediaTag();
  const { mutate: upload, isPending } = useUploadMediaAsset();

  const reset = () => {
    setFile(null);
    setDisplayName('');
    setSelectedTagIds([]);
    setProgressPct(null);
    setTagSearch('');
  };

  const handleClose = () => {
    if (!isPending) {
      reset();
      onClose();
    }
  };

  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    e.target.value = '';
    setFile(selected);
    setDisplayName(selected.name);
  };

  const handleUpload = () => {
    if (!file) return;

    setProgressPct(0);
    upload(
      {
        file,
        onProgress: (pct) => setProgressPct(pct),
        displayName: displayName.trim() || undefined,
        folderId,
        tagIds: selectedTagIds.length ? selectedTagIds : undefined,
      },
      {
        onSuccess: () => {
          message.success(t('media.uploadSuccess'));
          reset();
          onClose();
        },
        onError: (err) => {
          setProgressPct(null);
          message.error(
            err instanceof Error ? err.message : t('media.uploadError'),
          );
        },
      },
    );
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !tagSearch.trim()) return;
    e.preventDefault();
    e.stopPropagation();
    const trimmed = tagSearch.trim();
    const existing = tags?.find(
      (tag) => tag.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) {
        setSelectedTagIds((prev) => [...prev, existing.id]);
      }
      setTagSearch('');
    } else {
      createTag(trimmed, {
        onSuccess: (newTag) => {
          setSelectedTagIds((prev) => [...prev, newTag.id]);
          setTagSearch('');
        },
      });
    }
  };

  const tagOptions = (tags ?? []).map((tag) => ({
    label: tag.name,
    value: tag.id,
  }));

  return (
    <Modal
      title={t('media.upload')}
      open={open}
      onCancel={handleClose}
      onOk={handleUpload}
      okText={t('media.upload')}
      okButtonProps={{ disabled: !file || isPending, loading: isPending }}
      destroyOnHidden
    >
      <div className={styles.content}>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*,image/*"
          hidden
          onChange={handleFileChange}
        />

        <div className={styles.fileSection}>
          <Button
            icon={<UploadOutlined />}
            onClick={handleFileSelect}
            disabled={isPending}
          >
            {file ? file.name : t('media.selectFile')}
          </Button>
          {file && (
            <span className={styles.fileSize}>
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          )}
        </div>

        {file && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>{t('media.fileName')}</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('media.tags')}</label>
              <Select
                mode="multiple"
                value={selectedTagIds}
                onChange={setSelectedTagIds}
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
                disabled={isPending}
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}

        {progressPct !== null && (
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPct}%` }}
            />
            <span className={styles.progressLabel}>{progressPct}%</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
