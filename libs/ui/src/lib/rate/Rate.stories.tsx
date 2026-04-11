import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Rate } from './Rate';

const meta = {
  component: Rate,
  title: 'Components/Rate',
  argTypes: {
    count: { control: 'number' },
    disabled: { control: 'boolean' },
    allowHalf: { control: 'boolean' },
    allowClear: { control: 'boolean' },
    defaultValue: { control: 'number' },
  },
} satisfies Meta<typeof Rate>;

export default meta;
type Story = StoryObj<typeof Rate>;

export const Default: Story = {
  args: {
    defaultValue: 3,
  },
};

export const HalfStars: Story = {
  args: {
    allowHalf: true,
    defaultValue: 2.5,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 4,
  },
};

export const WithCount: Story = {
  render: () => {
    const [value, setValue] = useState(3);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Rate value={value} onChange={setValue} />
        <span>{value} star{value !== 1 ? 's' : ''}</span>
      </div>
    );
  },
};
