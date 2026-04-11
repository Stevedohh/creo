import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TableColumnsType } from './Table';
import { Tag, Dropdown } from 'antd';
import {
  MailOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  MoreOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

// ── Mock data ─────────────────────────────────────

interface Campaign {
  key: string;
  name: string;
  status: 'sent' | 'draft' | 'scheduled' | 'failed';
  recipients: string;
  delivered: number;
  opens: number;
  clicks: number;
  updated: string;
  labels: string[];
}

const campaignData: Campaign[] = [
  { key: '1', name: 'SmokeTest | PMTA+V4 | Custom...', status: 'sent', recipients: '1smoke_s', delivered: 246, opens: 0.8, clicks: 0.4, updated: '09 Apr 2026, 12:56', labels: [] },
  { key: '2', name: 'SmokeTest + V6 | Custo...', status: 'sent', recipients: '1smoke_s', delivered: 251, opens: 0.4, clicks: 0.4, updated: '09 Apr 2026, 12:56', labels: [] },
  { key: '3', name: 'HALON+V4 | Custom...', status: 'sent', recipients: '1smoke_s', delivered: 269, opens: 9.7, clicks: 0.7, updated: '09 Apr 2026, 12:55', labels: [] },
  { key: '4', name: 'HALON + V6 | Custo...', status: 'sent', recipients: '1smoke_s', delivered: 269, opens: 9.3, clicks: 0.4, updated: '09 Apr 2026, 12:55', labels: [] },
  { key: '5', name: 'Product Launch Campaign', status: 'scheduled', recipients: 'main_list', delivered: 0, opens: 0, clicks: 0, updated: '08 Apr 2026, 09:30', labels: ['marketing'] },
  { key: '6', name: 'Newsletter March 2026', status: 'draft', recipients: 'newsletter', delivered: 0, opens: 0, clicks: 0, updated: '07 Apr 2026, 14:20', labels: ['newsletter'] },
  { key: '7', name: 'Abandoned Cart Recovery', status: 'sent', recipients: 'cart_users', delivered: 1420, opens: 24.3, clicks: 8.1, updated: '06 Apr 2026, 11:00', labels: ['automation'] },
  { key: '8', name: 'Welcome Series - Step 1', status: 'sent', recipients: 'new_signups', delivered: 890, opens: 45.2, clicks: 12.8, updated: '05 Apr 2026, 16:45', labels: ['onboarding'] },
];

const statusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
  sent: { color: '#2fbc5b', icon: <CheckCircleFilled style={{ color: '#2fbc5b' }} />, text: 'Sent' },
  draft: { color: 'rgba(233, 240, 245, 0.45)', icon: <ClockCircleOutlined style={{ color: 'rgba(233, 240, 245, 0.45)' }} />, text: 'Draft' },
  scheduled: { color: '#319cfc', icon: <ClockCircleOutlined style={{ color: '#319cfc' }} />, text: 'Scheduled' },
  failed: { color: '#f22a36', icon: <CheckCircleFilled style={{ color: '#f22a36' }} />, text: 'Failed' },
};

const actionMenu = {
  items: [
    { key: 'edit', icon: <EditOutlined />, label: 'Edit' },
    { key: 'duplicate', icon: <CopyOutlined />, label: 'Duplicate' },
    { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true },
  ],
};

const columns: TableColumnsType<Campaign> = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    width: 280,
    sorter: (a, b) => a.name.localeCompare(b.name),
    render: (text: string) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MailOutlined style={{ color: 'rgba(233, 240, 245, 0.45)', fontSize: 16 }} />
        <span style={{ color: '#319cfc', fontWeight: 500, cursor: 'pointer' }}>{text}</span>
      </span>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    filters: [
      { text: 'Sent', value: 'sent' },
      { text: 'Draft', value: 'draft' },
      { text: 'Scheduled', value: 'scheduled' },
    ],
    onFilter: (value, record) => record.status === value,
    render: (status: string) => {
      const cfg = statusConfig[status];
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {cfg.icon}
          <span>{cfg.text}</span>
        </span>
      );
    },
  },
  {
    title: 'Recipients',
    dataIndex: 'recipients',
    key: 'recipients',
    width: 130,
    render: (text: string) => (
      <span style={{ color: '#319cfc', cursor: 'pointer' }}>{text}</span>
    ),
  },
  {
    title: 'Delivered',
    dataIndex: 'delivered',
    key: 'delivered',
    width: 100,
    align: 'center',
    sorter: (a, b) => a.delivered - b.delivered,
    render: (val: number) => val || '—',
  },
  {
    title: 'Opens',
    dataIndex: 'opens',
    key: 'opens',
    width: 90,
    align: 'center',
    sorter: (a, b) => a.opens - b.opens,
    render: (val: number) => val ? <span>{val} <span style={{ color: 'rgba(233, 240, 245, 0.45)' }}>%</span></span> : '—',
  },
  {
    title: 'Clicks',
    dataIndex: 'clicks',
    key: 'clicks',
    width: 90,
    align: 'center',
    sorter: (a, b) => a.clicks - b.clicks,
    render: (val: number) => val ? <span>{val} <span style={{ color: 'rgba(233, 240, 245, 0.45)' }}>%</span></span> : '—',
  },
  {
    title: 'Updated',
    dataIndex: 'updated',
    key: 'updated',
    width: 170,
    sorter: (a, b) => a.updated.localeCompare(b.updated),
  },
  {
    title: 'Labels',
    dataIndex: 'labels',
    key: 'labels',
    width: 120,
    render: (labels: string[]) =>
      labels.map((l) => <Tag key={l} style={{ borderRadius: 12 }}>{l}</Tag>),
  },
  {
    title: '',
    key: 'actions',
    width: 50,
    align: 'center',
    render: () => (
      <Dropdown menu={actionMenu} trigger={['click']}>
        <MoreOutlined style={{ cursor: 'pointer', fontSize: 16 }} />
      </Dropdown>
    ),
  },
];

// ── Meta ──────────────────────────────────────────

const meta = {
  component: Table,
  title: 'Components/Table',
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof Table>;

// ── Stories ───────────────────────────────────────

export const Default: Story = {
  render: () => (
    <Table<Campaign>
      columns={columns}
      dataSource={campaignData}
      pagination={false}
      rowSelection={{ type: 'checkbox' }}
      size="middle"
    />
  ),
};

export const ResizableColumns: Story = {
  name: 'Resizable Columns',
  render: () => (
    <Table<Campaign>
      columns={columns}
      dataSource={campaignData}
      pagination={false}
      rowSelection={{ type: 'checkbox' }}
      resizableColumns
      size="middle"
    />
  ),
};

export const WithColumnSettings: Story = {
  name: 'Column Settings',
  render: () => (
    <Table<Campaign>
      columns={columns}
      dataSource={campaignData}
      pagination={false}
      rowSelection={{ type: 'checkbox' }}
      columnSettings
      size="middle"
    />
  ),
};

export const FullFeatured: Story = {
  name: 'Full Featured',
  render: () => (
    <Table<Campaign>
      columns={columns}
      dataSource={campaignData}
      rowSelection={{ type: 'checkbox' }}
      resizableColumns
      columnSettings
      size="middle"
      pagination={{ pageSize: 5 }}
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <Table<Campaign>
      columns={columns}
      dataSource={[]}
      loading
      pagination={false}
      size="middle"
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <Table<Campaign>
      columns={columns}
      dataSource={[]}
      pagination={false}
      size="middle"
    />
  ),
};
