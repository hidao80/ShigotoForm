/**
 * Bootstrap 5 カスタムイベントの型拡張
 * HTMLElement.addEventListener() でイベント名をリテラル型として扱えるようにする
 */
interface HTMLElementEventMap {
  // Offcanvas
  'show.bs.offcanvas': Event;
  'shown.bs.offcanvas': Event;
  'hide.bs.offcanvas': Event;
  'hidden.bs.offcanvas': Event;

  // Modal
  'show.bs.modal': Event;
  'shown.bs.modal': Event;
  'hide.bs.modal': Event;
  'hidden.bs.modal': Event;

  // Collapse
  'show.bs.collapse': Event;
  'shown.bs.collapse': Event;
  'hide.bs.collapse': Event;
  'hidden.bs.collapse': Event;

  // Dropdown
  'show.bs.dropdown': Event;
  'shown.bs.dropdown': Event;
  'hide.bs.dropdown': Event;
  'hidden.bs.dropdown': Event;

  // Tab
  'show.bs.tab': Event;
  'shown.bs.tab': Event;
  'hide.bs.tab': Event;
  'hidden.bs.tab': Event;

  // Toast
  'show.bs.toast': Event;
  'shown.bs.toast': Event;
  'hide.bs.toast': Event;
  'hidden.bs.toast': Event;
}
