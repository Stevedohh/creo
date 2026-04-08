import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Rate, Modal, Spin, Empty, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button } from '@creo/ui';
import {
  useScripts,
  useCreateScript,
  useUpdateScript,
  useDeleteScript,
} from '@creo/scripts-data-access';
import type { Script } from '@creo/scripts-data-access';
import styles from './ScriptsListPage.module.scss';

export function ScriptsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: scripts, isLoading } = useScripts();
  const { mutate: create, isPending: isCreating } = useCreateScript();
  const { mutate: update } = useUpdateScript();
  const { mutate: remove } = useDeleteScript();

  const handleCreate = () => {
    create(
      { title: 'Untitled', country: 'US' },
      {
        onSuccess: (script) => navigate(`/scripts/${script.id}`),
        onError: () => message.error(t('scripts.createError')),
      },
    );
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: t('scripts.deleteConfirm'),
      onOk: () =>
        new Promise<void>((resolve, reject) => {
          remove(id, {
            onSuccess: () => {
              message.success(t('scripts.deleteSuccess'));
              resolve();
            },
            onError: () => reject(),
          });
        }),
    });
  };

  const handleRatingChange = (id: string, rating: number) => {
    update({ id, data: { rating } });
  };

  const columns: TableColumnsType<Script> = [
    {
      title: t('scripts.columns.name'),
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Script) => (
        <a
          className={styles.titleLink}
          onClick={() => navigate(`/scripts/${record.id}`)}
        >
          {title}
        </a>
      ),
    },
    {
      title: t('scripts.columns.country'),
      dataIndex: 'country',
      key: 'country',
      width: 150,
      render: (country: string | null) => country || '—',
    },
    {
      title: t('scripts.columns.wordCount'),
      dataIndex: 'wordCount',
      key: 'wordCount',
      width: 120,
      sorter: (a: Script, b: Script) => a.wordCount - b.wordCount,
    },
    {
      title: t('scripts.columns.rating'),
      dataIndex: 'rating',
      key: 'rating',
      width: 200,
      render: (rating: number, record: Script) => (
        <Rate
          value={rating}
          onChange={(value) => handleRatingChange(record.id, value)}
        />
      ),
    },
    {
      title: t('scripts.columns.actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Script) => (
        <div className={styles.actions}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/scripts/${record.id}`)}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          loading={isCreating}
        >
          {t('scripts.newScript')}
        </Button>
      </div>

      {scripts?.length ? (
        <Table<Script>
          columns={columns}
          dataSource={scripts}
          rowKey="id"
          pagination={false}
          className={styles.table}
        />
      ) : (
        <Empty description={t('scripts.empty')} />
      )}
    </div>
  );
}
