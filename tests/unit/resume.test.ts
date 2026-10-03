import { beforeEach, describe, expect, test } from 'vitest';
import { createEmptyResume } from '../../src/models/Resume.ts';
import { addHistoryEventListener, addLicenseEventListener, loadToForm, saveFromForm } from '../../src/resume.ts';
import { sample } from './fixtures.ts';

const FIELD_IDS = [
  'created-at',
  'name-input',
  'furigana-input',
  'birthdate-input',
  'sex-input',
  'zip-code-input',
  'address1-input',
  'address2-input',
  'tel1-input',
  'tel2-input',
  'mail1-input',
];

const mountForm = () => {
  document.body.innerHTML = `
    <form>
      ${FIELD_IDS.map((id) => `<input id="${id}" name="${id}">`).join('')}
      <div id="career-history"></div>
      <button id="add-career-history" type="button">+</button>
      <div id="license-history"></div>
      <button id="add-license-history" type="button">+</button>
    </form>`;
  addHistoryEventListener();
  addLicenseEventListener();
};

beforeEach(mountForm);

describe('loadToForm / saveFromForm', () => {
  test('往復で内容が保持される', () => {
    loadToForm(sample());
    expect(saveFromForm()).toEqual({ ...sample(), mail2: '' });
  });

  test('読み込みのたびに既存行を置き換える', () => {
    loadToForm(sample());
    loadToForm({ ...createEmptyResume(), career: [sample().career[0]] });
    expect(document.querySelectorAll('#career-history .card')).toHaveLength(1);
    expect(document.querySelectorAll('#license-history .card')).toHaveLength(0);
  });

  test('免許・資格の区分が未指定なら「合格」になる', () => {
    loadToForm({ ...createEmptyResume(), license: [{ date: '', name: 'X', pass: '' }] });
    expect(saveFromForm().license[0].pass).toBe('合格');
  });
});

describe('行の追加・削除', () => {
  test('「＋」ボタンで学歴・職歴 / 免許・資格の行が増える', () => {
    (document.querySelector('#add-career-history') as HTMLButtonElement).click();
    (document.querySelector('#add-license-history') as HTMLButtonElement).click();
    (document.querySelector('#add-license-history') as HTMLButtonElement).click();
    expect(document.querySelectorAll('#career-history .card')).toHaveLength(1);
    expect(document.querySelectorAll('#license-history .card')).toHaveLength(2);
  });

  test('削除ボタンで該当行だけ消える', () => {
    loadToForm(sample());
    (document.querySelector('#career-history .remove-row') as HTMLButtonElement).click();
    const rows = document.querySelectorAll('#career-history .card');
    expect(rows).toHaveLength(1);
    expect((rows[0].querySelector('input[name="name"]') as HTMLInputElement).value).toBe('ACME');
  });

  test('行の入力はイベントを bubbles で通知する', () => {
    loadToForm(sample());
    const row = document.querySelector('#career-history .card') as HTMLElement;
    let called = 0;
    row.addEventListener('career-row-updated', () => called++);
    row.querySelector('input[name="name"]')?.dispatchEvent(new Event('input'));
    expect(called).toBe(1);
  });
});

describe('アクセシビリティ / WebMCP 属性', () => {
  test('行内の全 input / select / button にアクセシブルネームがある', () => {
    loadToForm(sample());
    const controls = document.querySelectorAll('#career-history, #license-history');
    for (const container of controls) {
      for (const el of container.querySelectorAll('input, select, button')) {
        expect(el.getAttribute('aria-label'), el.outerHTML).toBeTruthy();
      }
    }
  });

  test('行内の name 付き入力は toolparamdescription を持つ', () => {
    loadToForm(sample());
    for (const el of document.querySelectorAll('#career-history [name], #license-history [name]')) {
      expect(el.getAttribute('toolparamdescription'), el.outerHTML).toBeTruthy();
    }
  });

  test('各行は role="group" で装飾の「～」は読み上げ対象外', () => {
    loadToForm(sample());
    for (const body of document.querySelectorAll('.card-body')) {
      expect(body.getAttribute('role')).toBe('group');
    }
    expect(document.querySelector('#career-history span')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('値のエスケープ', () => {
  const nasty = `"><img src=x onerror=alert(1)> & '`;

  test('引用符を含む値でも行の入力値が壊れず往復で保持される', () => {
    const data = {
      ...createEmptyResume(),
      career: [{ start: '', end: '', name: nasty, position: nasty, description: nasty }],
      license: [{ date: '', name: nasty, pass: '合格' }],
    };
    loadToForm(data);
    expect(document.querySelector('img')).toBeNull();
    expect(saveFromForm().career[0]).toMatchObject({ name: nasty, position: nasty, description: nasty });
    expect(saveFromForm().license[0].name).toBe(nasty);
  });
});
