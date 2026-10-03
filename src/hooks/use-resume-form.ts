import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { loadResume, saveResume } from '../db.ts';
import { calculateAge } from '../features/age-display.ts';
import { formResumeToJson, jsonToFormResume } from '../features/resume-json.ts';
import { createEmptyResume, type Resume } from '../models/Resume.ts';
import {
  type FieldError,
  type FieldErrors,
  RESUME_FORM_FIELDS,
  type ResumeFormField,
  toFieldErrors,
  validateField,
  validateFilledFields,
  validateResumeForm,
} from '../models/resume-form-schema.ts';
import { fromResume, type ResumeAction, resumeReducer, type ScalarField, toResume } from '../models/resume-state.ts';

const isValidatedField = (field: ScalarField): field is ResumeFormField =>
  (RESUME_FORM_FIELDS as string[]).includes(field);

const withFieldError = (errors: FieldErrors, field: ResumeFormField, message: string | null): FieldErrors => {
  if ((errors[field] ?? null) === message) return errors;
  const { [field]: _removed, ...rest } = errors;
  return message === null ? rest : { ...rest, [field]: message };
};

/**
 * 履歴書フォームの状態管理。IndexedDB からの復元、ユーザー編集の自動保存、入力検証の表示状態を扱う。
 * - 自動保存はユーザー編集（edit / setField / commit 系）の後だけ行う。復元・インポート・削除による差し替え（replace）では保存しない
 * - 復元が終わる（loaded）まで保存しないため、空の初期状態で保存済みデータを上書きしない
 * @returns フォーム状態・操作・検証結果
 * @throws なし
 */
export function useResumeForm() {
  const [state, dispatch] = useReducer(resumeReducer, undefined, () => fromResume(createEmptyResume()));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loaded, setLoaded] = useState(false);
  const dirty = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const resume = useMemo(() => toResume(state), [state]);

  // IndexedDB から復元
  useEffect(() => {
    let cancelled = false;
    loadResume().then((json) => {
      if (cancelled) return;
      if (json) {
        const restored = jsonToFormResume(json);
        dispatch({ type: 'replace', resume: restored });
        setErrors(validateFilledFields(restored));
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 自動保存（ユーザー編集の後のみ）
  useEffect(() => {
    if (!loaded || !dirty.current) return;
    dirty.current = false;
    const json = formResumeToJson(resume);
    json.age = Number(calculateAge(resume.birthday)) || 0;
    saveResume(json);
  }, [loaded, resume]);

  /** ユーザー編集として状態を更新する（自動保存の対象） */
  const edit = useCallback((action: ResumeAction) => {
    dirty.current = true;
    dispatch(action);
  }, []);

  /**
   * 単一値の欄を更新する。エラー表示中の欄は入力のたびに再検証して即時に解除する
   * （IME 変換中は再検証しない。正しい欄は入力途中で赤くしない）。
   */
  const setField = useCallback(
    (field: ScalarField, value: string, composing = false) => {
      // 値が変わらない書き込みは編集とみなさない（再描画・保存しない）。
      // （プログラムによる同じ値の書き込みや、値の変わらない再通知で、再描画・保存が起きないようにする）
      if (stateRef.current[field] !== value) edit({ type: 'field', field, value });
      if (composing || !isValidatedField(field)) return;
      setErrors((prev) => (prev[field] ? withFieldError(prev, field, validateField(field, value)) : prev));
    },
    [edit],
  );

  /** 欄の値を確定（離脱・change）したときに検証して表示する */
  const commitField = useCallback((field: ScalarField, value: string) => {
    if (isValidatedField(field)) setErrors((prev) => withFieldError(prev, field, validateField(field, value)));
  }, []);

  /** 全欄を検証して表示へ反映し、不正な欄（画面上の並び順）を返す */
  const validateAll = useCallback((): FieldError[] => {
    const found = validateResumeForm(resume);
    setErrors(toFieldErrors(found));
    return found;
  }, [resume]);

  /** 復元・インポート・削除など、プログラムによる差し替え（自動保存しない）。入力済みの不正値だけ表示する */
  const replace = useCallback((next: Resume) => {
    dirty.current = false;
    dispatch({ type: 'replace', resume: next });
    setErrors(validateFilledFields(next));
  }, []);

  return { state, resume, loaded, errors, edit, setField, commitField, validateAll, replace };
}
