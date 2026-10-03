/**
 * 上部ナビゲーションバーのHTMLを生成します。
 * @returns {string} HTML文字列
 */
export function navbarHtml(): string {
  return `
<nav class="navbar navbar-expand-lg px-3 py-2 fixed-top" role="navigation" aria-label="主要ナビゲーション">
  <div class="container-fluid">
    <a class="navbar-brand" href="#">
      <img src="./img/favicon32.webp" alt="" width="30" height="30" class="d-inline-block align-text-top me-2">
      <ruby>ShigotoForm<rt>シゴトフォーム</rt></ruby><span class="fs-6 d-none d-md-block">&emsp;履歴書メーカー&emsp;</span><span id="version-no" class="fs-6 d-none d-md-block"></span>
    </a>
    <button type="button" class="btn p-0 border-0 bg-transparent shadow-none ms-auto me-3" id="help-modal-btn" aria-label="ヘルプ" aria-haspopup="dialog" aria-controls="helpModal">
      <i class="fa-regular fa-circle-question" aria-hidden="true"></i>
    </button>
    <button class="navbar-toggler d-block" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar" aria-controls="offcanvasNavbar" aria-label="メニュー" aria-expanded="false">
      <span class="navbar-toggler-icon" aria-hidden="true"></span>
    </button>
  </div>
</nav>
`;
}
