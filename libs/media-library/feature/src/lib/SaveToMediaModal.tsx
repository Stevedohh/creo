import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Modal, Select, useApp } from '@creo/ui';
import {
  useCreateAssetFromRender,
  useCreateMediaTag,
  useMediaTags,
} from '@creo/media-library-data-access';
import { FolderTreeSelect } from './FolderTreeSelect';
import styles from './SaveToMediaModal.module.scss';

export interface SaveToMediaModalProps {
  open: boolean;
  onClose: () => void;
  renderJobId: string | null;
  defaultName?: string;
  defaultFolderId?: string;
}

export function SaveToMediaModal({
  open,
  onClose,
  renderJobId,
  defaultName,
  defaultFolderId,
}: SaveToMediaModalProps) {
  const { t } = useTranslation();
  const { message } = useApp();

  const [displayName, setDisplayName] = useState('');
  const [folderId, setFolderId] = useState<string | undefined>(undefined);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');

  const { data: tags } = useMediaTags();
  const { mutate: createTag } = useCreateMediaTag();
  const { mutate: save, isPending } = useCreateAssetFromRender();

  useEffect(() => {
    if (open) {
      setDisplayName(defaultName ?? '');
      setFolderId(defaultFolderId);
      setSelectedTagIds([]);
      setTagSearch('');
    }
  }, [open, defaultName, defaultFolderId]);

  const handleClose = () => {
    if (!isPending) onClose();
  };

  const handleSave = () => {
    if (!renderJobId) return;
    save(
      {
        renderJobId,
        folderId,
        displayName: displayName.trim() || undefined,
        tagIds: selectedTagIds.length ? selectedTagIds : undefined,
      },
      {
        onSuccess: () => {
          message.success(t('media.saveToLibrarySuccess'));
          onClose();
        },
        onError: (err) => {
          message.error(
            err instanceof Error ? err.message : t('media.saveToLibraryError'),
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
      title={t('media.saveToLibraryTitle')}
      open={open}
      onCancel={handleClose}
      onOk={handleSave}
      okText={t('media.saveToLibrary')}
      okButtonProps={{ disabled: !renderJobId || isPending, loading: isPending }}
      destroyOnHidden
    >
      <div className={styles.content}>
        <div className={styles.field}>
          <label className={styles.label}>{t('media.fileName')}</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isPending}
            placeholder={defaultName}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('media.folder')}</label>
          <FolderTreeSelect
            value={folderId}
            onChange={setFolderId}
            placeholder={t('media.folderPlaceholder')}
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
      </div>
    </Modal>
  );
}
