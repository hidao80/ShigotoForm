/**
 * アプリメニュー（offcanvas）のHTMLを生成します。
 * @returns {string} HTML文字列
 */
export function offcanvasMenuHtml(): string {
  return `
<div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasNavbar" aria-labelledby="offcanvasNavbarLabel" role="navigation" aria-label="アプリメニュー">
  <div class="offcanvas-header">
    <h2 class="offcanvas-title fs-5" id="offcanvasNavbarLabel">メニュー</h2>
    <button type="button" class="btn p-0 border-0 bg-transparent shadow-none ms-auto me-3" id="help-modal-in-menu-btn" aria-label="ヘルプ" aria-haspopup="dialog" aria-controls="helpModal">
      <i class="fa-regular fa-circle-question" aria-hidden="true"></i>
    </button>
    <button type="button" class="btn-close ms-0" data-bs-dismiss="offcanvas" aria-label="閉じる"></button>
  </div>
  <div class="offcanvas-body d-flex flex-column">
    <div class="mb-2">
      <a href="#" id="pwa-update-link" class="link-primary small">アプリのアップデート</a>
      <span id="pwa-update-status" class="text-muted small ms-2" role="status" aria-live="polite"></span>
    </div>
    <ul class="navbar-nav flex-grow-1">
      <li class="nav-item mb-5">
        <div class="form-check form-switch ms-auto">
          <input class="form-check-input" type="checkbox" id="theme-switch" data-bs-theme="light">
          <label class="form-check-label" for="theme-switch">ダークモード</label>
        </div>
      </li>
      <li class="nav-item mb-5">
        <button id="backup-button" class="btn btn-primary">エクスポート</button>
      </li>
      <li class="nav-item row mb-5">
        <div class="col-md-9">
          <button type="button" class="btn btn-outline-primary" id="upload-button">インポート</button>
        </div>
      </li>
      <li class="nav-item row mb-5">
        <div class="col-md-9">
          <button type="button" class="btn btn-success" id="show-resume" aria-haspopup="dialog" aria-controls="resumeModal" disabled>履歴書を表示</button>
        </div>
      </li>
      <li class="nav-item row mt-auto">
        <div class="col-md-9">
          <button type="button" class="btn btn-danger" id="delete-content" aria-haspopup="dialog" aria-controls="confirmDeleteModal">入力内容を削除</button>
        </div>
      </li>
    </ul>
  </div>
</div>
`;
}
