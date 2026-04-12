import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, Modal } from '@creo/ui';

export interface FolderModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  initialName?: string;
  loading?: boolean;
}

export function FolderModal({
  open,
  onClose,
  onSubmit,
  initialName,
  loading,
}: FolderModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ name: initialName ?? '' });
    }
  }, [open, initialName, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSubmit(values.name.trim());
    });
  };

  return (
    <Modal
      title={initialName ? t('media.renameFolder') : t('media.newFolder')}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okButtonProps={{ loading }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={t('media.folderName')}
          rules={[
            { required: true, message: t('media.folderNameRequired') },
            { max: 255 },
          ]}
        >
          <Input
            placeholder={t('media.folderNamePlaceholder')}
            autoFocus
            onPressEnter={handleOk}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
