import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form } from './Form';
import { Input } from '../input/Input';
import { Button } from '../button/Button';
import { TimeInput } from '../time-input/TimeInput';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const meta = {
  component: Form,
  title: 'Components/Form',
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof Form>;

export const LoginForm: Story = {
  render: () => (
    <Form
      layout="vertical"
      style={{ maxWidth: 400 }}
      onFinish={(values) => console.log('Form values:', values)}
    >
      <Form.Item
        label="Username"
        name="username"
        rules={[{ required: true, message: 'Please enter username' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Username" />
      </Form.Item>
      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: 'Please enter password' }]}
      >
        <Input prefix={<LockOutlined />} placeholder="Password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Log In
        </Button>
      </Form.Item>
    </Form>
  ),
};

export const HorizontalLayout: Story = {
  render: () => (
    <Form
      layout="horizontal"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      style={{ maxWidth: 500 }}
    >
      <Form.Item label="Name" name="name">
        <Input placeholder="Your name" />
      </Form.Item>
      <Form.Item label="Email" name="email">
        <Input placeholder="Email address" />
      </Form.Item>
      <Form.Item label="Start Time" name="startTime">
        <TimeInput />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 6 }}>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Form.Item>
    </Form>
  ),
};

export const Validation: Story = {
  render: () => (
    <Form layout="vertical" style={{ maxWidth: 400 }}>
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'Email is required' },
          { type: 'email', message: 'Invalid email format' },
        ]}
      >
        <Input placeholder="email@example.com" />
      </Form.Item>
      <Form.Item
        label="Password"
        name="password"
        rules={[
          { required: true, message: 'Password is required' },
          { min: 8, message: 'Must be at least 8 characters' },
        ]}
      >
        <Input placeholder="Min 8 characters" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">Validate</Button>
      </Form.Item>
    </Form>
  ),
};
