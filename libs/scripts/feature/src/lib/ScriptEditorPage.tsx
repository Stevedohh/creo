import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spin, Select, Rate } from 'antd';
import { Input as AntInput } from 'antd';
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';
import { Button } from '@creo/ui';
import { useScript, useUpdateScript } from '@creo/scripts-data-access';
import { ScriptEditor } from './ScriptEditor';
import styles from './ScriptEditorPage.module.scss';

const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'UA', label: 'Ukraine' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'BR', label: 'Brazil' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'IN', label: 'India' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'PL', label: 'Poland' },
  { value: 'TR', label: 'Turkey' },
];

export function ScriptEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: script, isLoading } = useScript(id!);
  const { mutate: update } = useUpdateScript();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (script) {
      setTitleValue(script.title);
      setWordCount(script.wordCount);
    }
  }, [script]);

  const debouncedSave = useCallback(
    (content: string) => {
      if (!id) return;
      setSaveStatus('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        update(
          { id, data: { content } },
          {
            onSuccess: () => setSaveStatus('saved'),
            onError: () => setSaveStatus('idle'),
          },
        );
      }, 500);
    },
    [id, update],
  );

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (id && titleValue !== script?.title) {
      update({ id, data: { title: titleValue } });
    }
  };

  const handleCountryChange = (country: string) => {
    if (id) update({ id, data: { country } });
  };

  const handleRatingChange = (rating: number) => {
    if (id) update({ id, data: { rating } });
  };

  if (isLoading || !script) {
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
          onClick={() => navigate('/scripts')}
        >
          {t('scripts.backToList')}
        </Button>

        <div className={styles.titleArea}>
          {isEditingTitle ? (
            <AntInput
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
            <span className={styles.saveStatus}>{t('scripts.editor.saving')}</span>
          )}
          {saveStatus === 'saved' && (
            <span className={styles.saveStatusDone}>
              <CheckOutlined /> {t('scripts.editor.saved')}
            </span>
          )}
        </div>
      </div>

      <div className={styles.metaBar}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>{t('scripts.columns.country')}:</span>
          <Select
            value={script.country || undefined}
            onChange={handleCountryChange}
            options={COUNTRY_OPTIONS}
            placeholder={t('scripts.fields.countryPlaceholder')}
            size="small"
            className={styles.countrySelect}
            showSearch
            allowClear
          />
        </div>

        <div className={styles.metaSep} />

        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>{t('scripts.columns.rating')}:</span>
          <Rate value={script.rating} onChange={handleRatingChange} />
        </div>

        <div className={styles.metaSep} />

        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>{t('scripts.columns.wordCount')}:</span>
          <span className={styles.metaValue}>{wordCount}</span>
        </div>
      </div>

      <ScriptEditor
        scriptId={id!}
        content={script.content}
        onUpdate={debouncedSave}
        onWordCountChange={setWordCount}
      />
    </div>
  );
}
