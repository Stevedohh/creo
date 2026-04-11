import { MediaLibraryPanel } from './MediaLibraryPanel';
import styles from './MediaLibraryPage.module.scss';

export function MediaLibraryPage() {
  return (
    <div className={styles.page}>
      <MediaLibraryPanel />
    </div>
  );
}
