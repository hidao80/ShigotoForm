import Modal from 'bootstrap/js/dist/modal';
import { resumeModalHtml } from '../components/resume-modal.ts';
import { generateResumeHtml } from '../components/resume-preview.ts';
import { loadResume } from '../db.ts';
import { lazyLoadNotoFonts } from './lazy-assets.ts';
import { jsonToFormResume } from './resume-json.ts';

/**
 * 履歴書プレビュー用モーダルをbody直下に追加し、「履歴書を表示」ボタンのイベントを設定します。
 * @returns {void}
 * @throws なし
 */
export function setupPreviewModal() {
  // 履歴書プレビュー用モーダルHTMLをbody直下に追加
  document.body.insertAdjacentHTML('beforeend', resumeModalHtml());

  // 「履歴書を表示」ボタンイベント
  document.querySelector('#show-resume')?.addEventListener('click', async () => {
    // プレビュー使用前にフォントを確実に読み込み
    await lazyLoadNotoFonts();
    const resumeJson = await loadResume();
    if (!resumeJson) return;
    const data = jsonToFormResume(resumeJson);
    // フォント選択状態を取得
    const fontType =
      (document.querySelector('#resumeModal .modal-footer #font-select') as HTMLSelectElement)?.value ||
      (document.getElementById('font-select') as HTMLSelectElement)?.value ||
      'gothic';
    // 履歴書HTML生成
    const html = generateResumeHtml(data, fontType as 'gothic' | 'mincho');
    const content = document.querySelector('#resume-modal-content');
    if (content) {
      content.innerHTML = html;
    }
    // モーダル内font-selectイベントリスナーを付与
    const modalFontSelect = document.querySelector(
      '#resumeModal .modal-footer #font-select',
    ) as HTMLSelectElement | null;
    if (modalFontSelect) {
      modalFontSelect.addEventListener('change', () => {
        const preview = document.querySelector('#resume-modal-content .resume-preview') as HTMLElement | null;
        if (preview) {
          preview.classList.remove('font-gothic', 'font-mincho');
          if (modalFontSelect.value === 'gothic') {
            preview.classList.add('font-gothic');
          } else if (modalFontSelect.value === 'mincho') {
            preview.classList.add('font-mincho');
          }
        }
      });
    }
    // モーダル表示
    const modal = new Modal(document.querySelector('#resumeModal') as HTMLElement);
    modal.show();
  });
}

/**
 * フォント切替イベント（プレビュー内のフォントクラスを切り替え）を設定します。
 * @returns {void}
 * @throws なし
 */
export function setupFontSwitch() {
  const fontSelect = document.getElementById('font-select') as HTMLSelectElement | null;
  if (fontSelect) {
    fontSelect.addEventListener('change', () => {
      // プレビュー内のフォントクラスを切り替え
      const preview = document.querySelector('#resume-modal-content .resume-preview') as HTMLElement | null;
      if (preview) {
        preview.classList.remove('font-gothic', 'font-mincho');
        if (fontSelect.value === 'gothic') {
          preview.classList.add('font-gothic');
        } else if (fontSelect.value === 'mincho') {
          preview.classList.add('font-mincho');
        }
      }
    });
  }
}
