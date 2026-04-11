import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { SearchOutlined, DownloadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const meta = {
  component: Button,
  title: 'Components/Button',
  argTypes: {
    type: {
      control: 'select',
      options: ['primary', 'default', 'dashed', 'text', 'link'],
    },
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
    },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    danger: { control: 'boolean' },
    block: { control: 'boolean' },
    shape: {
      control: 'select',
      options: ['default', 'circle', 'round'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    type: 'primary',
    children: 'Primary Button',
  },
};

export const Default: Story = {
  args: {
    children: 'Default Button',
  },
};

export const Dashed: Story = {
  args: {
    type: 'dashed',
    children: 'Dashed Button',
  },
};

export const TextButton: Story = {
  args: {
    type: 'text',
    children: 'Text Button',
  },
};

export const LinkButton: Story = {
  args: {
    type: 'link',
    children: 'Link Button',
  },
};

export const Danger: Story = {
  args: {
    type: 'primary',
    danger: true,
    children: 'Delete',
    icon: <DeleteOutlined />,
  },
};

export const Loading: Story = {
  args: {
    type: 'primary',
    loading: true,
    children: 'Loading',
  },
};

export const WithIcon: Story = {
  args: {
    type: 'primary',
    icon: <SearchOutlined />,
    children: 'Search',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button type="primary" size="small">Small</Button>
      <Button type="primary" size="middle">Middle</Button>
      <Button type="primary" size="large">Large</Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button type="primary">Primary</Button>
        <Button>Default</Button>
        <Button type="dashed">Dashed</Button>
        <Button type="text">Text</Button>
        <Button type="link">Link</Button>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button type="primary" icon={<PlusOutlined />}>Create</Button>
        <Button icon={<DownloadOutlined />}>Download</Button>
        <Button type="primary" danger icon={<DeleteOutlined />}>Delete</Button>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button type="primary" disabled>Disabled</Button>
        <Button disabled>Disabled</Button>
        <Button type="primary" loading>Loading</Button>
      </div>
    </div>
  ),
};
