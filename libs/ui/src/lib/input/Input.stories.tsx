import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input, TextArea, Search, Password } from './Input';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';

const meta = {
  component: Input,
  title: 'Components/Input',
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
    },
    disabled: { control: 'boolean' },
    allowClear: { control: 'boolean' },
    status: {
      control: 'select',
      options: ['', 'error', 'warning'],
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithPrefix: Story = {
  args: {
    placeholder: 'Username',
    prefix: <UserOutlined />,
  },
};

export const WithClear: Story = {
  args: {
    placeholder: 'Clearable input',
    allowClear: true,
    defaultValue: 'Some text',
  },
};

export const ErrorStatus: Story = {
  args: {
    placeholder: 'Error state',
    status: 'error',
  },
};

export const WarningStatus: Story = {
  args: {
    placeholder: 'Warning state',
    status: 'warning',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled',
    disabled: true,
    value: 'Cannot edit',
  },
};

export const PasswordInput: Story = {
  render: () => <Password placeholder="Enter password" prefix={<LockOutlined />} />,
};

export const SearchInput: Story = {
  render: () => <Search placeholder="Search..." enterButton style={{ maxWidth: 400 }} />,
};

export const TextAreaInput: Story = {
  render: () => <TextArea rows={4} placeholder="Enter multiline text..." />,
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <Input placeholder="Default input" />
      <Input placeholder="With icon" prefix={<UserOutlined />} />
      <Input placeholder="With clear" allowClear />
      <Password placeholder="Password" prefix={<LockOutlined />} />
      <Search placeholder="Search" enterButton />
      <Input placeholder="Email" prefix={<MailOutlined />} />
      <TextArea rows={3} placeholder="Text area..." />
      <Input placeholder="Error" status="error" />
      <Input placeholder="Disabled" disabled />
    </div>
  ),
};
