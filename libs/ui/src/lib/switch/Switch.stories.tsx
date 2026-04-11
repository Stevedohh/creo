import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from './Switch';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

const meta = {
  component: Switch,
  title: 'Components/Switch',
  argTypes: {
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['small', 'default'],
    },
    defaultChecked: { control: 'boolean' },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {
    defaultChecked: true,
  },
};

export const WithLabels: Story = {
  args: {
    checkedChildren: <CheckOutlined />,
    unCheckedChildren: <CloseOutlined />,
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <Switch disabled />
      <Switch disabled defaultChecked />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Switch size="small" defaultChecked />
      <Switch defaultChecked />
    </div>
  ),
};
