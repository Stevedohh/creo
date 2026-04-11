import type { Meta, StoryObj } from '@storybook/react-vite';
import { Empty } from './Empty';
import { Button } from '../button/Button';

const meta = {
  component: Empty,
  title: 'Components/Empty',
  argTypes: {
    description: { control: 'text' },
  },
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof Empty>;

export const Default: Story = {
  args: {},
};

export const WithDescription: Story = {
  args: {
    description: 'No scripts found',
    children: (
      <Button type="primary">Create Script</Button>
    ),
  },
};

export const Simple: Story = {
  args: {
    image: Empty.PRESENTED_IMAGE_SIMPLE,
    description: 'No data available',
  },
};
