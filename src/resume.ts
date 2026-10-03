import { createCareerRow } from './components/career-row.ts';
import { createLicenseRow } from './components/license-row.ts';
import type { Career, License, Resume } from './models/Resume.ts';

/**
 * 指定した要素に対して、変更や入力イベントのリスナーを追加します。
 * @param {HTMLElement} el - イベントを追加する要素
 * @param {() => void} handler - イベント発生時に呼び出されるハンドラ関数
 * @returns {void}
 * @throws なし
 */
function addSaveListeners(el: HTMLElement, handler: () => void) {
  for (const type of ['change', 'input']) {
    el.removeEventListener(type, handler as EventListener);
    el.addEventListener(type, handler as EventListener);
  }
}

/**
 * 学歴・職歴の追加ボタンにイベントリスナーを追加します。
 * @returns {void}
 * @throws なし
 * @example
 * addHistoryEventListener();
 */
export function addHistoryEventListener() {
  const btn = document.querySelector('#add-career-history');
  if (btn) {
    btn.addEventListener('click', () => {
      const container = document.querySelector('#career-history');
      if (container) {
        const div = createCareerRow();
        container.appendChild(div);
        attachCareerRowListeners(div);
      }
    });
  }
}

/**
 * 免許・資格の追加ボタンにイベントリスナーを追加します。
 * @returns {void}
 * @throws なし
 * @example
 * addLicenseEventListener();
 */
export function addLicenseEventListener() {
  const btn = document.querySelector('#add-license-history');
  if (btn) {
    btn.addEventListener('click', () => {
      const container = document.querySelector('#license-history');
      if (container) {
        const div = createLicenseRow();
        container.appendChild(div);
        attachLicenseRowListeners(div);
      }
    });
  }
}

/**
 * 学歴・職歴の行にイベントリスナーを追加します。
 * @param {HTMLElement} div - 学歴・職歴の行のHTML要素
 * @returns {void}
 * @throws なし
 * @example
 * attachCareerRowListeners(div);
 */
function attachCareerRowListeners(div: HTMLElement) {
  const handler = () => {
    const event = new Event('career-row-updated', { bubbles: true });
    div.dispatchEvent(event);
  };
  for (const name of ['start', 'end', 'name', 'position', 'description']) {
    const input = div.querySelector(`[name="${name}"]`);
    if (input) addSaveListeners(input as HTMLElement, handler);
  }
  const removeBtn = div.querySelector('.remove-row');
  if (removeBtn) removeBtn.addEventListener('click', () => div.remove());
}

/**
 * 免許・資格の行にイベントリスナーを追加します。
 * @param {HTMLElement} div - 免許・資格の行のHTML要素
 * @returns {void}
 * @throws なし
 * @example
 * attachLicenseRowListeners(div);
 */
function attachLicenseRowListeners(div: HTMLElement) {
  const handler = () => {
    const event = new Event('license-row-updated', { bubbles: true });
    div.dispatchEvent(event);
  };
  for (const name of ['endDate', 'name', 'status-select']) {
    const input = div.querySelector(`[name="${name}"], .${name}`);
    if (input) addSaveListeners(input as HTMLElement, handler);
  }
  const removeBtn = div.querySelector('.remove-row');
  if (removeBtn) removeBtn.addEventListener('click', () => div.remove());
}

/**
 * フォームからResumeデータを生成します。
 * @returns {Resume} - 生成されたResumeオブジェクト
 * @throws なし
 * @example
 * const resume = saveFromForm();
 */
export function saveFromForm(): Resume {
  const getValue = (selector: string) => (document.querySelector(selector) as HTMLInputElement)?.value || '';

  const career: Career[] = Array.from(document.querySelectorAll('#career-history .card') || []).map((card) => {
    const startInput = card.querySelector('input[name="start"]') as HTMLInputElement;
    const endInput = card.querySelector('input[name="end"]') as HTMLInputElement;
    const nameInput = card.querySelector('input[name="name"]') as HTMLInputElement;
    const positionInput = card.querySelector('input[name="position"]') as HTMLInputElement;
    const descriptionInput = card.querySelector('input[name="description"]') as HTMLInputElement;
    return {
      start: startInput?.value || '',
      end: endInput?.value || '',
      name: nameInput?.value || '',
      position: positionInput?.value || '',
      description: descriptionInput?.value || '',
    };
  });

  const license: License[] = Array.from(document.querySelectorAll('#license-history .card') || []).map((card) => {
    const endDateInput = card.querySelector('input[name="endDate"]') as HTMLInputElement;
    const nameInput = card.querySelector('input[name="name"]') as HTMLInputElement;
    const statusSelect = card.querySelector('.status-select') as HTMLSelectElement;
    return {
      date: endDateInput?.value || '',
      name: nameInput?.value || '',
      pass: statusSelect?.value || '合格',
    };
  });

  return {
    createdAt: getValue('#created-at'),
    fullname: getValue('#name-input'),
    fullnameKana: getValue('#furigana-input'),
    birthday: getValue('#birthdate-input'),
    sex: getValue('#sex-input'),
    zipCode: getValue('#zip-code-input'),
    address1: getValue('#address1-input'),
    address2: getValue('#address2-input'),
    tel1: getValue('#tel1-input'),
    tel2: getValue('#tel2-input'),
    mail1: getValue('#mail1-input'),
    mail2: getValue('#mail2-input'),
    career,
    license,
  };
}

/**
 * フォームにResumeデータをロードします。
 * @param {Resume} resume - ロードするResumeオブジェクト
 * @returns {void}
 * @throws なし
 * @example
 * loadToForm(resume);
 */
export function loadToForm(resume: Resume) {
  const setValue = (selector: string, value: string) => {
    const el = document.querySelector(selector) as HTMLInputElement;
    if (el) el.value = value || '';
  };
  setValue('#created-at', resume.createdAt);
  setValue('#name-input', resume.fullname);
  setValue('#furigana-input', resume.fullnameKana);
  setValue('#birthdate-input', resume.birthday);
  setValue('#sex-input', resume.sex);
  setValue('#zip-code-input', resume.zipCode);
  setValue('#address1-input', resume.address1);
  setValue('#address2-input', resume.address2);
  setValue('#tel1-input', resume.tel1);
  setValue('#tel2-input', resume.tel2);
  setValue('#mail1-input', resume.mail1);

  // 学歴・職歴
  const careerContainer = document.querySelector('#career-history');
  if (careerContainer) {
    careerContainer.innerHTML = '';
    for (const item of resume.career || []) {
      const div = createCareerRow(item);
      careerContainer.appendChild(div);
      attachCareerRowListeners(div);
    }
  }
  // 免許・資格
  const licenseContainer = document.querySelector('#license-history');
  if (licenseContainer) {
    licenseContainer.innerHTML = '';
    for (const item of resume.license || []) {
      const div = createLicenseRow(item);
      licenseContainer.appendChild(div);
      attachLicenseRowListeners(div);
    }
  }
}
