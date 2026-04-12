import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MediaLibraryPanel } from './MediaLibraryPanel';
import styles from './MediaLibraryPage.module.scss';

export function MediaLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get('folder') || undefined;

  const handleFolderNavigate = useCallback(
    (id: string | undefined) => {
      if (id) {
        setSearchParams({ folder: id });
      } else {
        setSearchParams({});
      }
    },
    [setSearchParams],
  );

  return (
    <div className={styles.page}>
      <MediaLibraryPanel
        folderId={folderId}
        onFolderNavigate={handleFolderNavigate}
      />
    </div>
  );
}
