import type { Career, License, Resume } from './Resume.ts';

/** 画面上の行を識別する安定した id を持たせた型（index を key にすると途中行の削除で入力欄が入れ替わるため） */
export type Keyed<T> = T & { id: string };

/** フォームの状態。Resume との違いは、職歴・資格の各行が id を持つ点だけ */
export interface FormState extends Omit<Resume, 'career' | 'license'> {
  career: Keyed<Career>[];
  license: Keyed<License>[];
}

/** 行以外の単一値の欄 */
export type ScalarField = Exclude<keyof Resume, 'career' | 'license'>;

export type ResumeAction =
  | { type: 'field'; field: ScalarField; value: string }
  | { type: 'add-career' }
  | { type: 'add-license' }
  | { type: 'update-career'; id: string; patch: Partial<Career> }
  | { type: 'update-license'; id: string; patch: Partial<License> }
  | { type: 'remove-career'; id: string }
  | { type: 'remove-license'; id: string }
  | { type: 'move-career'; activeId: string; overId: string }
  | { type: 'move-license'; activeId: string; overId: string }
  | { type: 'replace'; resume: Resume };

let rowSeq = 0;
const nextRowId = () => `row-${++rowSeq}`;

/**
 * activeId の行を overId の行の位置へ移します（間の行は 1 つずつずれる）。
 * どちらかの id が無い、または同じ行なら、元の配列をそのまま返します（再描画・保存を避ける）。
 */
const moveRow = <T extends { id: string }>(rows: T[], activeId: string, overId: string): T[] => {
  const from = rows.findIndex((row) => row.id === activeId);
  const to = rows.findIndex((row) => row.id === overId);
  if (from < 0 || to < 0 || from === to) return rows;
  const next = [...rows];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
};

const withIds = <T extends object>(rows: T[]): Keyed<T>[] => rows.map((row) => ({ ...row, id: nextRowId() }));

/**
 * Resume からフォーム状態を作ります（各行に id を付与）。
 * @param {Resume} resume - 履歴書データ
 * @returns {FormState} フォーム状態
 * @throws なし
 * @example
 * const state = fromResume(createEmptyResume());
 */
export function fromResume(resume: Resume): FormState {
  return {
    ...resume,
    career: withIds(resume.career),
    // 区分の選択肢は「合格」「取得」のみ。それ以外（空など）は「合格」として扱う
    license: withIds(resume.license.map((l) => ({ ...l, pass: l.pass === '取得' ? '取得' : '合格' }))),
  };
}

/**
 * フォーム状態から Resume を作ります。行の id は取り除きます（保存・エクスポートに id を混ぜないため）。
 * @param {FormState} state - フォーム状態
 * @returns {Resume} 履歴書データ
 * @throws なし
 * @example
 * const resume = toResume(state);
 */
export function toResume(state: FormState): Resume {
  return {
    ...state,
    career: state.career.map(({ start, end, name, position, description }) => ({
      start,
      end,
      name,
      position,
      description,
    })),
    license: state.license.map(({ date, name, pass }) => ({ date, name, pass })),
  };
}

/**
 * フォーム状態の更新（reducer）。
 * @param {FormState} state - 現在の状態
 * @param {ResumeAction} action - 更新内容
 * @returns {FormState} 新しい状態
 * @throws なし
 */
export function resumeReducer(state: FormState, action: ResumeAction): FormState {
  switch (action.type) {
    case 'field':
      // 値が同じなら同じ状態を返し、再描画を避ける
      return state[action.field] === action.value ? state : { ...state, [action.field]: action.value };
    case 'add-career':
      return {
        ...state,
        career: [...state.career, { id: nextRowId(), start: '', end: '', name: '', position: '', description: '' }],
      };
    case 'add-license':
      return { ...state, license: [...state.license, { id: nextRowId(), date: '', name: '', pass: '合格' }] };
    case 'update-career':
      return {
        ...state,
        career: state.career.map((row) => (row.id === action.id ? { ...row, ...action.patch } : row)),
      };
    case 'update-license':
      return {
        ...state,
        license: state.license.map((row) => (row.id === action.id ? { ...row, ...action.patch } : row)),
      };
    case 'remove-career':
      return { ...state, career: state.career.filter((row) => row.id !== action.id) };
    case 'remove-license':
      return { ...state, license: state.license.filter((row) => row.id !== action.id) };
    case 'move-career': {
      const career = moveRow(state.career, action.activeId, action.overId);
      return career === state.career ? state : { ...state, career };
    }
    case 'move-license': {
      const license = moveRow(state.license, action.activeId, action.overId);
      return license === state.license ? state : { ...state, license };
    }
    case 'replace':
      return fromResume(action.resume);
  }
}
