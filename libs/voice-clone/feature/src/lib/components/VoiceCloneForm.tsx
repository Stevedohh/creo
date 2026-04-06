import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { Button, Input, Form, TimeInput } from '@creo/ui';
import { useCloneVoice } from '@creo/voice-clone-data-access';
import type { CloneVoiceRequest } from '@creo/voice-clone-data-access';
import styles from './VoiceCloneForm.module.scss';

interface VoiceCloneFormProps {
  onSuccess?: () => void;
}

export function VoiceCloneForm({ onSuccess }: VoiceCloneFormProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { mutate, isPending } = useCloneVoice();

  const handleSubmit = (values: CloneVoiceRequest) => {
    mutate(values, {
      onSuccess: () => {
        message.success(t('voices.success'));
        form.resetFields();
        onSuccess?.();
      },
      onError: (error) => {
        const errorMessage =
          error instanceof Error ? error.message : t('voices.error');
        message.error(errorMessage);
      },
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      className={styles.form}
    >
      <Form.Item
        name="youtubeUrl"
        label={t('voices.form.youtubeUrl')}
        rules={[
          { required: true, message: t('voices.form.youtubeUrl') },
          { type: 'url', message: 'Please enter a valid URL' },
        ]}
      >
        <Input placeholder={t('voices.form.youtubeUrlPlaceholder')} />
      </Form.Item>

      <Form.Item
        name="voiceName"
        label={t('voices.form.voiceName')}
        rules={[
          { required: true, message: t('voices.form.voiceName') },
          { max: 100 },
        ]}
      >
        <Input placeholder={t('voices.form.voiceNamePlaceholder')} />
      </Form.Item>

      <div className={styles.timeRow}>
        <Form.Item
          name="startTime"
          label={t('voices.form.startTime')}
          rules={[
            { required: true, message: t('voices.form.startTime') },
            { pattern: /^\d{2}:\d{2}$/, message: 'MM:SS' },
          ]}
          className={styles.timeField}
        >
          <TimeInput />
        </Form.Item>

        <Form.Item
          name="endTime"
          label={t('voices.form.endTime')}
          rules={[
            { required: true, message: t('voices.form.endTime') },
            { pattern: /^\d{2}:\d{2}$/, message: 'MM:SS' },
          ]}
          className={styles.timeField}
        >
          <TimeInput />
        </Form.Item>
      </div>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isPending} block>
          {isPending ? t('voices.form.submitting') : t('voices.form.submit')}
        </Button>
      </Form.Item>
    </Form>
  );
}
