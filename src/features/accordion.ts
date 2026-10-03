/**
 * アコーディオンの初期表示用クラス（sf-accordion-initial）を、最初の開閉で外します（resume.css 参照）。
 * @returns {void}
 * @throws なし
 */
export function setupAccordionInitialState() {
  document
    .getElementById('collapseOne')
    ?.addEventListener(
      'show.bs.collapse',
      () => document.querySelector('.sf-accordion-initial')?.classList.remove('sf-accordion-initial'),
      { once: true },
    );
}
