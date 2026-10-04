import { Button, CloseButton, Form, Offcanvas } from 'react-bootstrap';
import { lazyLoadIcons } from '../features/lazy-assets.ts';

interface AppMenuProps {
  show: boolean;
  /** 閉じたときに、開いたボタンへフォーカスを戻すか */
  restoreFocus: boolean;
  onHide: () => void;
  /** メニューが完全に閉じた（フォーカスのトラップが解除された）とき */
  onExited: () => void;
  /** 「履歴書を表示」を使えるか（保存データの復元が終わるまで無効） */
  ready: boolean;
  dark: boolean;
  onThemeChange: (dark: boolean) => void;
  /** アプリ更新の状態表示 */
  updateStatus: string;
  onUpdate: () => void;
  onHelp: () => void;
  onExport: () => void;
  onImport: () => void;
  onShowResume: () => void;
  onDelete: () => void;
}

/**
 * アプリメニュー（offcanvas）。閉じていても DOM に残す（renderStaticNode）。
 */
export function AppMenu({
  show,
  restoreFocus,
  onHide,
  onExited,
  ready,
  dark,
  onThemeChange,
  updateStatus,
  onUpdate,
  onHelp,
  onExport,
  onImport,
  onShowResume,
  onDelete,
}: AppMenuProps) {
  return (
    <Offcanvas
      show={show}
      restoreFocus={restoreFocus}
      onHide={onHide}
      onShow={lazyLoadIcons}
      onExited={onExited}
      placement="end"
      renderStaticNode
      tabIndex={-1}
      id="offcanvasNavbar"
      aria-labelledby="offcanvasNavbarLabel"
    >
      <Offcanvas.Header>
        <Offcanvas.Title as="h2" className="fs-5" id="offcanvasNavbarLabel">
          メニュー
        </Offcanvas.Title>
        <button
          type="button"
          className="btn p-0 border-0 bg-transparent shadow-none ms-auto me-3"
          id="help-modal-in-menu-btn"
          aria-label="ヘルプ"
          aria-haspopup="dialog"
          onClick={onHelp}
          onPointerOver={lazyLoadIcons}
          onFocus={lazyLoadIcons}
        >
          <i className="fa-regular fa-circle-question" aria-hidden="true" />
        </button>
        <CloseButton className="ms-0" aria-label="閉じる" onClick={onHide} />
      </Offcanvas.Header>
      <Offcanvas.Body className="d-flex flex-column">
        <div className="mb-2">
          <button type="button" id="pwa-update-link" className="btn btn-link link-primary small p-0" onClick={onUpdate}>
            アプリのアップデート
          </button>
          <output id="pwa-update-status" className="text-muted small ms-2">
            {updateStatus}
          </output>
        </div>
        <ul className="navbar-nav flex-grow-1">
          <li className="nav-item mb-5">
            <Form.Check
              type="switch"
              id="theme-switch"
              className="ms-auto"
              label="ダークモード"
              data-bs-theme="light"
              checked={dark}
              onChange={(e) => onThemeChange(e.target.checked)}
            />
          </li>
          <li className="nav-item mb-5">
            <Button id="backup-button" variant="primary" onClick={onExport}>
              エクスポート
            </Button>
          </li>
          <li className="nav-item row mb-5">
            <div className="col-md-9">
              <Button type="button" variant="outline-primary" id="upload-button" onClick={onImport}>
                インポート
              </Button>
            </div>
          </li>
          <li className="nav-item row mb-5">
            <div className="col-md-9">
              <Button
                type="button"
                variant="success"
                id="show-resume"
                aria-haspopup="dialog"
                disabled={!ready}
                onClick={onShowResume}
              >
                履歴書を表示
              </Button>
            </div>
          </li>
          <li className="nav-item row mt-auto">
            <div className="col-md-9">
              <Button type="button" variant="danger" id="delete-content" aria-haspopup="dialog" onClick={onDelete}>
                入力内容を削除
              </Button>
            </div>
          </li>
        </ul>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
