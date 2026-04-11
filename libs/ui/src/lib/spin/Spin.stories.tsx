import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spin } from './Spin';

const meta = {
  component: Spin,
  title: 'Components/Spin',
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
    },
    spinning: { control: 'boolean' },
  },
} satisfies Meta<typeof Spin>;

export default meta;
type Story = StoryObj<typeof Spin>;

export const Default: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <Spin size="small" />
      <Spin />
      <Spin size="large" />
    </div>
  ),
};

export const WithTip: Story = {
  args: {
    tip: 'Loading data...',
    size: 'large',
  },
  render: (args) => (
    <Spin {...args}>
      <div style={{ padding: 50, background: 'rgba(0,0,0,0.03)', borderRadius: 4 }}>
        Content is loading...
      </div>
    </Spin>
  ),
};
