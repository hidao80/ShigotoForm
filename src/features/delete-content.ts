import Modal from 'bootstrap/js/dist/modal';
import Offcanvas from 'bootstrap/js/dist/offcanvas';
import { showToast } from '../components/toast.ts';
import { clearResume } from '../db.ts';
import { createEmptyResume } from '../models/Resume';
import { loadToForm } from '../resume.ts';
import { refreshFormValidation } from './form-validation.ts';

/**
 * 入力内容の削除（確認モーダル経由）のイベントリスナーを追加します。
 * @returns {void}
 * @throws なし
 */
export function setupDeleteContent() {
  document.querySelector('#delete-content')?.addEventListener('click', () => {
    const modalEl = document.getElementById('confirmDeleteModal');
    if (!modalEl) return;
    // メニュー(offcanvas)のフォーカストラップがモーダルを操作不能にしないよう先に閉じる
    const menuEl = document.getElementById('offcanvasNavbar');
    if (menuEl) Offcanvas.getInstance(menuEl)?.hide();
    Modal.getOrCreateInstance(modalEl).show();
  });
  document.querySelector('#confirm-delete')?.addEventListener('click', async () => {
    await clearResume();
    loadToForm(createEmptyResume());
    refreshFormValidation();
    const ageDisplay = document.querySelector('#age-display');
    if (ageDisplay) ageDisplay.textContent = ' ';
    const modalEl = document.getElementById('confirmDeleteModal');
    if (modalEl) Modal.getInstance(modalEl)?.hide();
    showToast('入力内容を削除しました。', 'success', 2500);
  });
}
