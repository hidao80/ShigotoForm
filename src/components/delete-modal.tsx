import { Button, Modal } from 'react-bootstrap';

interface DeleteModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
}

/**
 * 入力内容の削除確認モーダル。
 */
export function DeleteModal({ show, onHide, onConfirm }: DeleteModalProps) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      id="confirmDeleteModal"
      aria-labelledby="confirmDeleteModalLabel"
      aria-describedby="confirmDeleteModalBody"
    >
      <Modal.Header closeButton closeLabel="閉じる">
        <Modal.Title as="h2" className="fs-5" id="confirmDeleteModalLabel">
          入力内容の削除
        </Modal.Title>
      </Modal.Header>
      <Modal.Body id="confirmDeleteModalBody">入力内容を削除します。よろしいですか？</Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" onClick={onHide}>
          キャンセル
        </Button>
        <Button type="button" variant="danger" id="confirm-delete" onClick={onConfirm}>
          削除
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
