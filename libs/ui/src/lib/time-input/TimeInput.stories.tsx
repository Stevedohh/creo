import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimeInput } from './TimeInput';
import { useState } from 'react';
import { Text } from '../typography/Typography';

const meta = {
  component: TimeInput,
  title: 'Components/TimeInput',
  argTypes: {
    disabled: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
    },
  },
} satisfies Meta<typeof TimeInput>;

export default meta;
type Story = StoryObj<typeof TimeInput>;

export const Default: Story = {
  args: {},
};

export const WithValue: Story = {
  args: {
    value: '14:30',
  },
};

export const Disabled: Story = {
  args: {
    value: '09:00',
    disabled: true,
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 200 }}>
        <TimeInput value={value} onChange={setValue} />
        <Text type="secondary">Value: "{value}"</Text>
      </div>
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <TimeInput size="small" placeholder="Small" />
      <TimeInput size="middle" placeholder="Middle" />
      <TimeInput size="large" placeholder="Large" />
    </div>
  ),
};
