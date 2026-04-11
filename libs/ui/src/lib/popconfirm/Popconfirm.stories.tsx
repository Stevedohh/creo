import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popconfirm } from './Popconfirm';
import { Button } from '../button/Button';
import { QuestionCircleOutlined } from '@ant-design/icons';

const meta = {
  component: Popconfirm,
  title: 'Components/Popconfirm',
  argTypes: {
    title: { control: 'text' },
    okText: { control: 'text' },
    cancelText: { control: 'text' },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
    },
  },
} satisfies Meta<typeof Popconfirm>;

export default meta;
type Story = StoryObj<typeof Popconfirm>;

export const Default: Story = {
  args: {
    title: 'Delete this item?',
    description: 'This action cannot be undone.',
    okText: 'Yes',
    cancelText: 'No',
    okType: 'danger',
    icon: <QuestionCircleOutlined style={{ color: 'red' }} />,
    onConfirm: () => console.log('Confirmed'),
    onCancel: () => console.log('Cancelled'),
    children: (
      <Button type="primary" danger>
        Delete
      </Button>
    ),
  },
};
