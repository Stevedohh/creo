import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Empty, Input, Spin, Table, useApp } from '@creo/ui';
import type { TableColumnsType } from '@creo/ui';
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
} from '@creo/projects-data-access';
import type { Project } from '@creo/projects-data-access';
import styles from './ProjectsListPage.module.scss';

export function ProjectsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();
  const { mutate: create, isPending: isCreating } = useCreateProject();
  const { mutate: remove } = useDeleteProject();
  const { modal, message } = useApp();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!projects || !search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q),
    );
  }, [projects, search]);

  const handleCreate = () => {
    create(
      { title: t('projects.untitled') },
      {
        onSuccess: (project) => navigate(`/projects/${project.id}`),
        onError: () => message.error(t('projects.createError')),
      },
    );
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: t('projects.deleteConfirm'),
      onOk: () =>
        new Promise<void>((resolve, reject) => {
          remove(id, {
            onSuccess: () => {
              message.success(t('projects.deleteSuccess'));
              resolve();
            },
            onError: () => reject(),
          });
        }),
    });
  };

  const columns: TableColumnsType<Project> = [
    {
      title: t('projects.columns.name'),
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Project) => (
        <a
          className={styles.titleLink}
          onClick={() => navigate(`/projects/${record.id}`)}
        >
          {title}
        </a>
      ),
    },
    {
      title: t('projects.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: Project['status']) => t(`projects.status.${status}`),
    },
    {
      title: t('projects.columns.updatedAt'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 200,
      render: (value: string) => new Date(value).toLocaleString(),
      sorter: (a: Project, b: Project) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      align: 'center',
      render: (_: unknown, record: Project) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: t('common.edit'),
                onClick: () => navigate(`/projects/${record.id}`),
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: t('common.delete'),
                danger: true,
                onClick: () => handleDelete(record.id),
              },
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
          placeholder={t('projects.search')}
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
          {t('projects.newProject')}
        </Button>
      </div>

      {projects?.length ? (
        <Table<Project>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          size="middle"
        />
      ) : (
        <Empty description={t('projects.empty')} />
      )}
    </div>
  );
}
