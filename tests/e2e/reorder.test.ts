import { beforeAll, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { formResumeToJson } from '../../src/features/resume-json.ts';
import { sample } from '../unit/fixtures.ts';
import { mountAppWith } from './mount-app.ts';

const seed = formResumeToJson(sample());

/** 一覧（#career-history / #license-history）の各行の「名前」欄の値（画面上の並び順） */
const names = (list: string) =>
  [...document.querySelectorAll<HTMLInputElement>(`#${list} input[name="name"]`)].map((el) => el.value);
const handles = (list: string) => [...document.querySelectorAll<HTMLButtonElement>(`#${list} .drag-handle`)];

beforeAll(() => mountAppWith(seed));

/** ドラッグ中、持ち上げた行に場所を譲って別の行が上へずれているか（移動先が確定した目印。キーボード操作はページのスクロールを伴うため） */
const moved = (list: string) =>
  [...document.querySelectorAll<HTMLElement>(`#${list} .card`)].some((card) =>
    /translate3d\(0px, -[1-9]/.test(card.style.transform),
  );
const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
const center = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
};

/**
 * マウス操作（pointerdown → 少しずつ pointermove → pointerup）でハンドルを別のハンドルの位置へ運ぶ。
 * dnd-kit は移動のたびに描画を待って移動先を判定するため、途中経過を何フレームかに分けて送る。
 */
async function drag(from: Element, to: Element) {
  const init = { bubbles: true, isPrimary: true, pointerId: 1, pointerType: 'mouse', button: 0 };
  const start = center(from);
  const end = center(to);
  from.dispatchEvent(new PointerEvent('pointerdown', { ...init, ...start, buttons: 1 }));
  for (let i = 1; i <= 10; i++) {
    const at = {
      clientX: start.clientX + ((end.clientX - start.clientX) * i) / 10,
      clientY: start.clientY + ((end.clientY - start.clientY) * i) / 10,
    };
    document.dispatchEvent(new PointerEvent('pointermove', { ...init, ...at, buttons: 1 }));
    await frame();
  }
  document.dispatchEvent(new PointerEvent('pointerup', { ...init, ...end, buttons: 0 }));
}

describe('学歴・職歴 / 免許・資格の並べ替え', () => {
  test('各行の右端にハンドルがあり、名前（aria-label）で一覧と項目が分かる', () => {
    for (const [list, label] of [
      ['career-history', '学歴・職歴'],
      ['license-history', '免許・資格'],
    ] as const) {
      expect(handles(list)).toHaveLength(2);
      for (const row of document.querySelectorAll(`#${list} .card-body`)) {
        // ハンドルは行の最後の要素（右端）
        const last = row.lastElementChild?.querySelector('.drag-handle');
        expect(last?.getAttribute('aria-label')).toBe(`${label}の項目を並べ替え`);
      }
    }
  });

  test('キーボードで並べ替えると、画面の順序と保存データの順序が変わり、ハンドルにフォーカスが残る', async () => {
    const before = names('career-history');
    expect(before).toHaveLength(2);
    const [first] = handles('career-history');
    first?.focus();
    await userEvent.keyboard('{ }'); // つかむ
    await vi.waitFor(() => expect(first?.getAttribute('aria-pressed')).toBe('true'));
    await userEvent.keyboard('{ArrowDown}');
    await vi.waitFor(() => expect(moved('career-history')).toBe(true)); // 移動先が決まるまで待つ
    await userEvent.keyboard('{ }'); // 確定
    await vi.waitFor(() => expect(names('career-history')).toEqual([...before].reverse()));
    expect(names('license-history')).toEqual(sample().license.map((l) => l.name));
    expect(document.activeElement?.classList.contains('drag-handle')).toBe(true);
    const { loadResume } = await import('../../src/db.ts');
    await vi.waitFor(async () =>
      expect((await loadResume())?.resume.career.map((c) => c.name)).toEqual([...before].reverse()),
    );
  });

  test('Esc で取り消すと順序は変わらない', async () => {
    const before = names('career-history');
    const [first] = handles('career-history');
    first?.focus();
    await userEvent.keyboard('{ }');
    await vi.waitFor(() => expect(first?.getAttribute('aria-pressed')).toBe('true'));
    await userEvent.keyboard('{ArrowDown}');
    await vi.waitFor(() => expect(moved('career-history')).toBe(true));
    await userEvent.keyboard('{Escape}');
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(names('career-history')).toEqual(before);
  });

  test('マウスのドラッグ＆ドロップで並べ替えられ、保存データの順序も変わる', async () => {
    const before = names('license-history');
    expect(before).toHaveLength(2);
    const [from, to] = handles('license-history') as [HTMLButtonElement, HTMLButtonElement];
    await drag(from, to);
    await vi.waitFor(() => expect(names('license-history')).toEqual([...before].reverse()));
    const { loadResume } = await import('../../src/db.ts');
    await vi.waitFor(async () =>
      expect((await loadResume())?.resume.license.map((l) => l.name)).toEqual([...before].reverse()),
    );
  });

  test('ハンドルをクリックしただけでは順序は変わらない', async () => {
    const before = names('career-history');
    const [first] = handles('career-history');
    await userEvent.click(first as HTMLButtonElement);
    expect(names('career-history')).toEqual(before);
  });
});
