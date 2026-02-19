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
 * 学歴・職歴の1行生成
 * @param {Career} [item] - 初期値として設定するCareerオブジェクト
 * @returns {HTMLDivElement} - 生成された行のHTML要素
 * @throws なし
 * @example
 * const row = createCareerRow({ ... });
 */
function createCareerRow(item?: Career): HTMLDivElement {
  const div = document.createElement('div');
  div.className = 'card mb-2';
  div.innerHTML = `
    <div class="card-body row align-items-center flex-nowrap">
      <div class="col-auto d-flex align-items-center gap-1" style="min-width:264px;">
        <input type="month" class="form-control" name="start" placeholder="開始年月" value="${item?.start || ''}" style="width:120px;" />
        <span>～</span>
        <input type="month" class="form-control" name="end" placeholder="終了年月" value="${item?.end || ''}" style="width:120px;" />
      </div>
      <div class="col px-0">
        <input type="text" class="form-control" name="name" placeholder="会社・学校名" value="${item?.name || ''}" />
      </div>
      <div class="col px-0">
        <input type="text" class="form-control" name="position" placeholder="役職・学科" value="${item?.position || ''}" />
      </div>
      <div class="col px-0">
        <input type="text" class="form-control" name="description" placeholder="説明" value="${item?.description || ''}" />
      </div>
      <div class="col-auto ps-1">
        <button type="button" class="btn btn-danger btn-sm remove-row">削除</button>
      </div>
    </div>
  `;
  return div;
}

/**
 * 免許・資格の1行生成
 * @param {License} [item] - 初期値として設定するLicenseオブジェクト
 * @returns {HTMLDivElement} - 生成された行のHTML要素
 * @throws なし
 * @example
 * const row = createLicenseRow({ ... });
 */
function createLicenseRow(item?: License): HTMLDivElement {
  const div = document.createElement('div');
  div.className = 'card mb-2';
  div.innerHTML = `
    <div class="card-body row align-items-center">
      <div class="col-auto" style="min-width:120px;">
        <input type="month" class="form-control" name="endDate" placeholder="年月" value="${item?.date || ''}" />
      </div>
      <div class="col px-0">
        <input type="text" class="form-control" name="name" placeholder="内容" value="${item?.name || ''}" />
      </div>
      <div class="col-auto ps-1 d-flex gap-1 align-items-center">
        <select class="form-select form-select-sm status-select" style="width:auto;min-width:70px;">
          <option value="合格"${item?.pass === '合格' || !item?.pass ? ' selected' : ''}>合格</option>
          <option value="取得"${item?.pass === '取得' ? ' selected' : ''}>取得</option>
        </select>
        <button type="button" class="btn btn-danger btn-sm remove-row">削除</button>
      </div>
    </div>
  `;
  return div;
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
 * 履歴書データをHTML形式で生成します。
 * @param {Resume} data - 履歴書のデータ
 * @param {'gothic' | 'mincho'} [fontType='gothic'] - 使用するフォントの種類
 * @returns {string} - 生成されたHTML文字列
 * @throws なし
 * @example
 * const html = generateResumeHtml(data, 'mincho');
 */
export function generateResumeHtml(data: Resume, fontType: 'gothic' | 'mincho' = 'gothic'): string {
  const fontClass = fontType === 'mincho' ? 'font-mincho' : 'font-gothic';
  /**
   * 日付を「YYYY年MM月DD日」形式に変換します。
   * @param {string} dateStr - 日付文字列
   * @returns {string} - フォーマット済み日付
   * @throws なし
   */
  function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    // YYYY-MM-DD or YYYY-MM
    const [y, m = '', d = ''] = dateStr.split(/-|\//);
    if (!y) return '';
    if (m && d) return `${y}年${m}月${d}日`;
    if (m) return `${y}年${m}月`;
    return `${y}年`;
  }

  /**
   * 郵便番号をハイフン付きの形式にフォーマットします。
   * @param {string} zip - フォーマットする郵便番号
   * @returns {string} - フォーマットされた郵便番号
   * @throws なし
   */
  function formatZipCode(zip: string): string {
    if (!zip) return '';
    // すでにハイフンが含まれていればそのまま
    if (zip.includes('-')) return zip;
    // 7桁以上の場合のみ4文字目にハイフンを挿入
    if (zip.length >= 7) return `${zip.slice(0, 3)}-${zip.slice(3)}`;
    return zip;
  }

  return `
    <div class="resume-preview p-4 rounded shadow ${fontClass}" style="width:210mm; height:297mm; margin:auto; box-sizing:border-box; position:relative;">
      <h1 class="mb-3">履歴書</h1>
      <table class="table table-bordered mb-4">
        <tbody>
          <tr>
            <th style="width:140px;">ふりがな</th>
            <td>
              <ruby>
                ${data.fullname || ''}
                ${data.fullnameKana ? `<rt>${data.fullnameKana}</rt>` : ''}
              </ruby>
            </td>
            <th style="width:140px;">生年月日</th>
            <td>${formatDate(data.birthday || '')}</td>
          </tr>
          <tr>
            <th>性別</th>
            <td>${data.sex || ''}</td>
            <th>作成日</th>
            <td>${formatDate(data.createdAt || '')}</td>
          </tr>
          <tr>
            <th>郵便番号</th>
            <td>${formatZipCode(data.zipCode || '')}</td>
            <th>住所</th>
            <td>${data.address1 || ''}</td>
          </tr>
          <tr>
            <th>電話番号</th>
            <td>${data.tel1 || ''}</td>
            <th>メールアドレス</th>
            <td>${data.mail1 || ''}</td>
          </tr>
          <tr>
            <th>連絡先住所</th>
            <td>${data.address2 || ''}</td>
            <th>連絡先電話番号</th>
            <td>${data.tel2 || ''}</td>
          </tr>
        </tbody>
      </table>
      <h2 class="mt-4">学歴・職歴</h2>
      <ul>
        ${(data.career || [])
          .map(
            (c) =>
              `<li>
            ${formatDate(c.start)} ～ ${c.end && c.end.trim() !== '' ? formatDate(c.end) : '現在'} ${c.name} 
            ${c.position ? ` / ${c.position}` : ''} 
            ${c.description ? `<span style="margin-left:2em;">${c.description}</span>` : ''}
          </li>`,
          )
          .join('')}
      </ul>
      <h2 class="mt-4">免許・資格</h2>
      <ul>
        ${(data.license || []).map((l) => `<li>${formatDate(l.date)} ${l.name}${l.pass ? `　${l.pass}` : ''}</li>`).join('')}
      </ul>
    </div>
  `;
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
