import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal } from './Modal';
import { Button } from '../button/Button';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const meta = {
  component: Modal,
  title: 'Components/Modal',
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
    centered: { control: 'boolean' },
    closable: { control: 'boolean' },
    maskClosable: { control: 'boolean' },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button type="primary" onClick={() => setOpen(true)}>
          Open Modal
        </Button>
        <Modal
          title="Basic Modal"
          open={open}
          onOk={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        >
          <p>This is a basic modal dialog.</p>
          <p>Click OK or Cancel to close it.</p>
        </Modal>
      </>
    );
  },
};

export const WithFooter: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button type="primary" onClick={() => setOpen(true)}>
          Open Modal with Footer
        </Button>
        <Modal
          title="Custom Footer"
          open={open}
          onCancel={() => setOpen(false)}
          footer={[
            <Button key="back" onClick={() => setOpen(false)}>
              Return
            </Button>,
            <Button key="submit" type="primary" onClick={() => setOpen(false)}>
              Submit
            </Button>,
            <Button key="delete" type="primary" danger onClick={() => setOpen(false)}>
              Delete
            </Button>,
          ]}
        >
          <p>This modal has a custom footer with multiple actions.</p>
        </Modal>
      </>
    );
  },
};

export const Confirm: Story = {
  render: () => {
    const showConfirm = () => {
      Modal.confirm({
        title: 'Do you want to delete this item?',
        icon: <ExclamationCircleOutlined />,
        content: 'This action cannot be undone.',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk() {
          console.log('Confirmed');
        },
        onCancel() {
          console.log('Cancelled');
        },
      });
    };

    return (
      <Button type="primary" danger onClick={showConfirm}>
        Delete Item
      </Button>
    );
  },
};
