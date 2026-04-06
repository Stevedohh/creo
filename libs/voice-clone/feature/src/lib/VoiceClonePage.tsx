import { VoiceCloneForm } from './components/VoiceCloneForm';
import styles from './VoiceClonePage.module.scss';

export function VoiceClonePage() {
  return (
    <div className={styles.page}>
      <div className={styles.formWrapper}>
        <VoiceCloneForm />
      </div>
    </div>
  );
}
