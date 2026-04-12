import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Empty, Input, Spin } from '@creo/ui';
import { Tag } from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloudSyncOutlined,
} from '@ant-design/icons';
import { useProject, useUpdateProject } from '@creo/projects-data-access';
import {
  useEditorStore,
  timelineToEditorDocument,
} from '@creo/video-player-data-access';
import {
  ExportButton,
  type ExportButtonProps,
} from '@creo/video-render-feature';
import { EditorLayout } from '@creo/video-player-feature';
import styles from './ProjectEditorPage.module.scss';

export function ProjectEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, isError } = useProject(id ?? '');
  const { mutate: updateProject } = useUpdateProject();

  const doc = useEditorStore((s) => s.doc);
  const isSaving = useEditorStore((s) => s.isSaving);
  const lastSavedAt = useEditorStore((s) => s.lastSavedAt);
  const replaceDocument = useEditorStore((s) => s.replaceDocument);
  const setProjectId = useEditorStore((s) => s.setProjectId);
  const setLastSavedAt = useEditorStore((s) => s.setLastSavedAt);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  useEffect(() => {
    if (!project) return;
    setProjectId(project.id);
    const editorDoc = timelineToEditorDocument(project.timeline, project.title);
    replaceDocument(editorDoc);
    setLastSavedAt(new Date(project.updatedAt));
    setTitleValue(project.title);
    return () => {
      setProjectId(null);
      setLastSavedAt(null);
    };
  }, [project?.id]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (id && titleValue !== project?.title) {
      updateProject({ id, data: { title: titleValue } });
    }
  };

  const hasAnyClip = doc.tracks.some((t) => t.clips.length > 0);

  const buildExportRequest = useCallback<ExportButtonProps['buildRequest']>(
    (preset) => ({
      document: doc as unknown as Record<string, unknown>,
      exportSettings: preset.settings,
      name: doc.name,
    }),
    [doc],
  );

  if (isLoading || !id) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className={styles.loading}>
        <Empty description="Project not found">
          <Button type="primary" onClick={() => navigate('/projects')}>
            Back to projects
          </Button>
        </Empty>
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
          Projects
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
            <h3
              className={styles.title}
              onClick={() => setIsEditingTitle(true)}
            >
              {titleValue || 'Untitled Project'}
            </h3>
          )}
        </div>

        <div className={styles.headerRight}>
          {isSaving ? (
            <Tag icon={<CloudSyncOutlined spin />} color="processing">Saving...</Tag>
          ) : lastSavedAt ? (
            <Tag icon={<CheckOutlined />} color="success">Saved</Tag>
          ) : null}
          <ExportButton buildRequest={buildExportRequest} disabled={!hasAnyClip} />
        </div>
      </div>

      <EditorLayout />
    </div>
  );
}
