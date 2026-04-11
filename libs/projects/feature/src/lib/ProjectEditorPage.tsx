import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOutlined, CheckOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, Input, Spin, useApp } from '@creo/ui';
import { useProject, useUpdateProject } from '@creo/projects-data-access';
import {
  TwickStudioHost,
  type ExportHandle,
  type SaveStatus,
} from './TwickStudioHost';
import styles from './ProjectEditorPage.module.scss';

export function ProjectEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: project, isLoading } = useProject(id ?? '');
  const { mutate: update } = useUpdateProject();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const exportHandleRef = useRef<ExportHandle | null>(null);
  const { message } = useApp();

  useEffect(() => {
    if (project) setTitleValue(project.title);
  }, [project]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (id && titleValue && titleValue !== project?.title) {
      update({ id, data: { title: titleValue } });
    }
  };

  const handleExport = async () => {
    if (!exportHandleRef.current) {
      message.error(t('editor.exportNotReady'));
      return;
    }
    setExportProgress(0);
    try {
      const result = await exportHandleRef.current.export((pct) =>
        setExportProgress(Math.round(pct)),
      );
      if (!result.ok || !result.blob) {
        message.error(result.message ?? t('editor.exportFailed'));
        return;
      }
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename ?? 'export.webm';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      message.success(t('editor.exportDone'));
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('editor.exportFailed'));
    } finally {
      setExportProgress(null);
    }
  };

  if (isLoading || !project || !id) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/projects')}
        >
          {t('projects.backToList')}
        </Button>

        <div className={styles.titleArea}>
          {isEditingTitle ? (
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleBlur}
              onPressEnter={handleTitleBlur}
              autoFocus
              className={styles.titleInput}
            />
          ) : (
            <h2
              className={styles.title}
              onClick={() => setIsEditingTitle(true)}
            >
              {titleValue}
            </h2>
          )}
        </div>

        <div className={styles.headerRight}>
          {saveStatus === 'saving' && (
            <span className={styles.saveStatus}>{t('editor.saving')}</span>
          )}
          {saveStatus === 'saved' && (
            <span className={styles.saveStatusDone}>
              <CheckOutlined /> {t('editor.saved')}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className={styles.saveStatusError}>{t('editor.saveError')}</span>
          )}
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exportProgress !== null}
          >
            {exportProgress !== null
              ? `${t('editor.exporting')} ${exportProgress}%`
              : t('editor.export')}
          </Button>
        </div>
      </div>

      <div className={styles.studio}>
        <TwickStudioHost
          projectId={id}
          initialTimeline={project.timeline}
          onStatusChange={setSaveStatus}
          exportHandleRef={exportHandleRef}
        />
      </div>
    </div>
  );
}
