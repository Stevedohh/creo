import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popover } from './Popover';
import { Button } from '../button/Button';

const meta = {
  component: Popover,
  title: 'Components/Popover',
  argTypes: {
    title: { control: 'text' },
    trigger: {
      control: 'select',
      options: ['hover', 'click', 'focus'],
    },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  args: {
    title: 'Popover Title',
    content: (
      <div>
        <p>Here is some helpful information.</p>
        <p>Hover over the button to see this popover.</p>
      </div>
    ),
    children: <Button type="primary">Hover Me</Button>,
  },
};

export const Trigger: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <Popover
        title="Hover Trigger"
        content="This popover appears on hover."
        trigger="hover"
      >
        <Button>Hover</Button>
      </Popover>
      <Popover
        title="Click Trigger"
        content="This popover appears on click."
        trigger="click"
      >
        <Button>Click</Button>
      </Popover>
      <Popover
        title="Focus Trigger"
        content="This popover appears on focus."
        trigger="focus"
      >
        <Button>Focus</Button>
      </Popover>
    </div>
  ),
};
