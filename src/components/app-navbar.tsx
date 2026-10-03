import { Container, Navbar } from 'react-bootstrap';
import packageJson from '../../package.json';
import { lazyLoadIcons } from '../features/lazy-assets.ts';

interface AppNavbarProps {
  menuOpen: boolean;
  onHelp: () => void;
  onMenu: () => void;
}

/**
 * 上部ナビゲーションバー。
 */
export function AppNavbar({ menuOpen, onHelp, onMenu }: AppNavbarProps) {
  return (
    <Navbar expand="lg" fixed="top" className="px-3 py-2" role="navigation" aria-label="主要ナビゲーション">
      <Container fluid>
        <Navbar.Brand href="#app">
          <img
            src="./img/favicon32.webp"
            alt=""
            width="30"
            height="30"
            className="d-inline-block align-text-top me-2"
          />
          <ruby>
            ShigotoForm<rt>シゴトフォーム</rt>
          </ruby>
          <span className="fs-6 d-none d-md-block">&emsp;履歴書メーカー&emsp;</span>
          <span id="version-no" className="fs-6 d-none d-md-block">
            {packageJson.version}
          </span>
        </Navbar.Brand>
        {/* アイコンは初回操作（ホバー・フォーカス）で即時に読み込む（FOUT 軽減） */}
        <button
          type="button"
          className="btn p-0 border-0 bg-transparent shadow-none ms-auto me-3"
          id="help-modal-btn"
          aria-label="ヘルプ"
          aria-haspopup="dialog"
          onClick={onHelp}
          onPointerOver={lazyLoadIcons}
          onFocus={lazyLoadIcons}
        >
          <i className="fa-regular fa-circle-question" aria-hidden="true" />
        </button>
        <button
          className="navbar-toggler d-block"
          type="button"
          aria-controls="offcanvasNavbar"
          aria-label="メニュー"
          aria-expanded={menuOpen}
          onClick={onMenu}
        >
          <span className="navbar-toggler-icon" aria-hidden="true" />
        </button>
      </Container>
    </Navbar>
  );
}
