import Modal from 'bootstrap/js/dist/modal';

/**
 * ヘルプボタンとメニュー内のヘルプボタンでモーダルを表示するイベントリスナーを追加します。
 * @returns {void}
 * @throws なし
 */
export function setupHelpButtons() {
  const helpBtn = document.getElementById('help-modal-btn');
  const helpInMenuBtn = document.getElementById('help-modal-in-menu-btn');
  if (helpBtn && helpInMenuBtn) {
    const func = () => {
      const modalEl = document.getElementById('helpModal');
      if (!modalEl) return;
      const modal = new Modal(modalEl, { backdrop: true });
      modal.show();
    };

    helpBtn.addEventListener('click', func);
    helpInMenuBtn.addEventListener('click', func);
  }
}
