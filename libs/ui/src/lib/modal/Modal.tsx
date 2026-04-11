import { Modal as AntModal } from 'antd';
import type { ModalProps as AntModalProps } from 'antd';

export type ModalProps = AntModalProps;

export function Modal(props: ModalProps) {
  return <AntModal {...props} />;
}

Modal.confirm = AntModal.confirm;
Modal.info = AntModal.info;
Modal.success = AntModal.success;
Modal.error = AntModal.error;
Modal.warning = AntModal.warning;
Modal.destroyAll = AntModal.destroyAll;
