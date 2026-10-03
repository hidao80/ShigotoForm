import Offcanvas from 'bootstrap/js/dist/offcanvas';
import { formatToastList, showToast } from '../components/toast.ts';
import {
  RESUME_FORM_FIELDS,
  type ResumeFormField,
  validateField,
  validateResumeForm,
} from '../models/resume-form-schema.ts';
import { saveFromForm } from '../resume.ts';

// 検証対象の欄と入力要素 id の対応
const FIELD_IDS: Record<ResumeFormField, string> = {
  createdAt: 'created-at',
  fullnameKana: 'furigana-input',
  fullname: 'name-input',
  birthday: 'birthdate-input',
  zipCode: 'zip-code-input',
  address1: 'address1-input',
  tel1: 'tel1-input',
  mail1: 'mail1-input',
  tel2: 'tel2-input',
};
const FIELD_BY_ID = new Map(RESUME_FORM_FIELDS.map((field) => [FIELD_IDS[field], field]));

const getInput = (field: ResumeFormField) => document.getElementById(FIELD_IDS[field]) as HTMLInputElement | null;

/**
 * 入力欄にエラー表示（Bootstrap の is-invalid / invalid-feedback、aria-invalid / aria-describedby）を反映します。
 * 表示が変わらない場合は DOM を書き換えません。
 * @param {HTMLInputElement} input - 対象の入力欄
 * @param {string | null} message - エラーメッセージ。正しければ null
 * @returns {void}
 * @throws なし
 */
function setFieldError(input: HTMLInputElement, message: string | null) {
  const errorId = `${input.id}-error`;
  const wasInvalid = input.classList.contains('is-invalid');
  if (message === null) {
    if (!wasInvalid) return;
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    const rest = (input.getAttribute('aria-describedby') ?? '').replace(errorId, '').trim();
    if (rest) input.setAttribute('aria-describedby', rest);
    else input.removeAttribute('aria-describedby');
    return;
  }
  let feedback = document.getElementById(errorId);
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.id = errorId;
    feedback.className = 'invalid-feedback';
    const group = input.parentElement?.classList.contains('input-group') ? input.parentElement : null;
    if (group) {
      // input-group 内ではフィードバックを同じグループの末尾に置く
      group.classList.add('has-validation');
      group.append(feedback);
    } else {
      input.after(feedback);
    }
  }
  if (feedback.textContent !== message) feedback.textContent = message;
  if (wasInvalid) return;
  input.classList.add('is-invalid');
  input.setAttribute('aria-invalid', 'true');
  const describedBy = input.getAttribute('aria-describedby') ?? '';
  input.setAttribute('aria-describedby', `${describedBy} ${errorId}`.trim());
}

/**
 * 1 つの欄を検証して表示へ反映します。氏名の変更はふりがな（自動入力）にも影響するため併せて再検証します。
 * @param {HTMLInputElement} input - 対象の入力欄
 * @param {ResumeFormField} field - 欄
 * @returns {void}
 * @throws なし
 */
function checkField(input: HTMLInputElement, field: ResumeFormField) {
  setFieldError(input, validateField(field, input.value));
  if (field === 'fullname') recheckKana();
}

/**
 * 表示中のふりがなエラーを現在の値で再検証します（氏名からの自動入力はイベントを発火しないため）。
 * @returns {void}
 * @throws なし
 */
function recheckKana() {
  const kana = getInput('fullnameKana');
  if (kana?.classList.contains('is-invalid')) setFieldError(kana, validateField('fullnameKana', kana.value));
}

/**
 * 全欄の表示を現在の値に合わせ直します（復元・インポート・削除後に使用）。
 * 空欄は未入力として扱い、必須エラーは出さずに表示を消します。
 * @returns {void}
 * @throws なし
 */
export function refreshFormValidation() {
  for (const field of RESUME_FORM_FIELDS) {
    const input = getInput(field);
    if (!input) continue;
    setFieldError(input, input.value === '' ? null : validateField(field, input.value));
  }
}

/**
 * 入力中の検証表示を設定します。リスナーは form への委譲のみで、欄ごとの登録や動的行への付与は不要です。
 * - 離脱（focusout）・確定（change）時に検証して表示
 * - すでにエラー表示中の欄は入力のたびに再検証して即時に解除（IME 変換中は除く。入力途中の誤表示を避ける）
 * @returns {void}
 * @throws なし
 */
export function setupFormValidation() {
  const form = document.querySelector('form');
  if (!form) return;

  const onCommit = (e: Event) => {
    const field = e.target instanceof HTMLInputElement ? FIELD_BY_ID.get(e.target.id) : undefined;
    if (field) checkField(e.target as HTMLInputElement, field);
  };
  form.addEventListener('focusout', onCommit);
  form.addEventListener('change', onCommit);
  form.addEventListener('input', (e) => {
    if ((e as InputEvent).isComposing) return;
    const input = e.target;
    if (!(input instanceof HTMLInputElement)) return;
    const field = FIELD_BY_ID.get(input.id);
    if (!field) return;
    if (input.classList.contains('is-invalid')) checkField(input, field);
    else if (field === 'fullname') recheckKana();
  });

  refreshFormValidation();
}

/**
 * 最初に不正な欄へフォーカスします。メニュー（offcanvas）が開いていれば閉じてから、
 * 折りたたみ内の欄なら展開してからフォーカスします。
 * @param {HTMLInputElement} input - フォーカスする欄
 * @returns {void}
 * @throws なし
 */
function focusInput(input: HTMLInputElement) {
  const focus = () => {
    const panel = input.closest<HTMLElement>('.accordion-collapse');
    if (panel && !panel.classList.contains('show')) {
      panel.addEventListener('shown.bs.collapse', () => input.focus(), { once: true });
      document.querySelector<HTMLElement>(`[data-bs-target="#${panel.id}"]`)?.click();
      return;
    }
    input.focus();
  };
  // メニュー(offcanvas)のフォーカストラップが欄へのフォーカスを奪うため、閉じ終わってから行う
  const menu = document.getElementById('offcanvasNavbar');
  if (menu?.classList.contains('show')) {
    menu.addEventListener('hidden.bs.offcanvas', focus, { once: true });
    Offcanvas.getInstance(menu)?.hide();
  } else {
    focus();
  }
}

/**
 * 現在のフォーム内容を検証し、全欄へエラー表示を反映します。不正があれば警告トーストを出します。
 * @param {{ header: string; focus: boolean }} options - header: トーストの見出し、focus: 最初の不正な欄へフォーカスするか
 * @returns {boolean} すべて正しければ true
 * @throws なし
 * @example
 * if (!validateFormWithWarning({ header: '入力内容に誤りがあります。', focus: true })) return;
 */
export function validateFormWithWarning({ header, focus }: { header: string; focus: boolean }): boolean {
  const errors = validateResumeForm(saveFromForm());
  const messages = new Map(errors.map((e) => [e.field, e.message]));
  for (const field of RESUME_FORM_FIELDS) {
    const input = getInput(field);
    if (input) setFieldError(input, messages.get(field) ?? null);
  }
  if (!errors.length) return true;
  const first = errors[0] && getInput(errors[0].field);
  showToast(
    formatToastList(
      header,
      errors.map((e) => e.message),
    ),
    'warn',
    8000,
  );
  if (focus && first) focusInput(first);
  return false;
}
