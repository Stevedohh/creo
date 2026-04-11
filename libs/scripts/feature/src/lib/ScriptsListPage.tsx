import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Spin, Empty, Input, useApp } from '@creo/ui';
import type { TableColumnsType } from '@creo/ui';
import { PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined, SearchOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import { Button } from '@creo/ui';
import {
  useScripts,
  useCreateScript,
  useDeleteScript,
} from '@creo/scripts-data-access';
import type { Script } from '@creo/scripts-data-access';
import styles from './ScriptsListPage.module.scss';

export function ScriptsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: scripts, isLoading } = useScripts();
  const { mutate: create, isPending: isCreating } = useCreateScript();
  const { mutate: remove } = useDeleteScript();
  const { modal, message } = useApp();
  const [search, setSearch] = useState('');

  const filteredScripts = useMemo(() => {
    if (!scripts || !search.trim()) return scripts;
    const q = search.toLowerCase();
    return scripts.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      (s.country && s.country.toLowerCase().includes(q))
    );
  }, [scripts, search]);

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
    modal.confirm({
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
      title: '',
      key: 'actions',
      width: 50,
      align: 'center',
      render: (_: unknown, record: Script) => (
        <Dropdown
          menu={{
            items: [
              { key: 'edit', icon: <EditOutlined />, label: t('common.edit'), onClick: () => navigate(`/scripts/${record.id}`) },
              { key: 'delete', icon: <DeleteOutlined />, label: t('common.delete'), danger: true, onClick: () => handleDelete(record.id) },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
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
        <Input
          placeholder={t('scripts.search')}
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 360 }}
        />
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
          dataSource={filteredScripts}
          rowKey="id"
          columnSettings
          size="middle"
        />
      ) : (
        <Empty description={t('scripts.empty')} />
      )}
    </div>
  );
}
