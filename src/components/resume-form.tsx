import { type ReactNode, useEffect, useRef } from 'react';
import { Accordion, Button } from 'react-bootstrap';
import { calculateAge } from '../features/age-display.ts';
import { useAutoKana } from '../hooks/use-autokana.ts';
import type { useResumeForm } from '../hooks/use-resume-form.ts';
import { FIELD_PATTERNS, type ResumeFormField } from '../models/resume-form-schema.ts';
import { CareerRow } from './career-row.tsx';
import { FIELD_IDS } from './field-ids.ts';
import { LicenseRow } from './license-row.tsx';
import { ValidatedInput } from './validated-input.tsx';

const FIELD_BY_ID = new Map(Object.entries(FIELD_IDS).map(([field, id]) => [id, field as ResumeFormField]));

interface FormRowProps {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}

function FormRow({ id, label, required, children }: FormRowProps) {
  return (
    <div className="row mb-3">
      <label htmlFor={id} className={`col-md-3 col-form-label-sm text-right${required ? ' required' : ''}`}>
        {label}
      </label>
      <div className="col-md-9">{children}</div>
    </div>
  );
}

interface ResumeFormProps {
  form: ReturnType<typeof useResumeForm>;
  /** 「現住所以外に連絡を希望する場合のみ記入」の開閉 */
  contactOpen: boolean;
  onContactToggle: (open: boolean) => void;
  /** 連絡先の展開アニメーション完了（フォーカス移動の待ち合わせ用） */
  onContactEntered: () => void;
}

/**
 * 履歴書入力フォーム（main 領域）。
 */
export function ResumeForm({ form, contactOpen, onContactToggle, onContactEntered }: ResumeFormProps) {
  const { state, errors, setField, commitField, edit } = form;
  const formRef = useRef<HTMLFormElement>(null);
  // アコーディオンの初期表示用クラス（resume.css 参照）は、最初の開閉で外す
  const initialAccordion = useRef(true);
  if (contactOpen) initialAccordion.current = false;

  useAutoKana(FIELD_IDS.fullname, state.fullnameKana, (value) => setField('fullnameKana', value));

  // React の onChange は input イベントに対応するため、値の確定（change）は form への委譲リスナーで検証する
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const onChangeEvent = (e: Event) => {
      const target = e.target;
      const field = target instanceof HTMLInputElement ? FIELD_BY_ID.get(target.id) : undefined;
      if (field) commitField(field, (target as HTMLInputElement).value);
    };
    el.addEventListener('change', onChangeEvent);
    return () => el.removeEventListener('change', onChangeEvent);
  }, [commitField]);

  const common = { onValue: setField, onCommit: commitField };

  return (
    <main className="main-content" id="main" tabIndex={-1}>
      <h1 className="" id="resume-form-title">
        履歴書
      </h1>
      <form
        ref={formRef}
        aria-labelledby="resume-form-title"
        toolname="fill-resume-basic-info"
        tooldescription="履歴書の入力項目（年月日・ふりがな・氏名・生年月日・性別・郵便番号・住所・電話番号・メールアドレス・連絡先住所・連絡先電話番号、および学歴・職歴と免許・資格）を入力する。学歴・職歴と免許・資格は、画面に追加済みの行のみ入力できる。"
        onSubmit={(e) => e.preventDefault()}
      >
        <FormRow id="created-at" label="年月日入力欄" required>
          <ValidatedInput
            {...common}
            id="created-at"
            name="createdAt"
            field="createdAt"
            type="date"
            required
            autoComplete="off"
            toolparamdescription="履歴書の作成日（入力年月日）。YYYY-MM-DD形式"
            value={state.createdAt}
            error={errors.createdAt}
            addon="現在"
          />
        </FormRow>
        <FormRow id="furigana-input" label="ふりがな" required>
          <ValidatedInput
            {...common}
            id="furigana-input"
            name="fullname-kana"
            field="fullnameKana"
            type="text"
            pattern={FIELD_PATTERNS.furigana}
            placeholder="ふりがなを入力してください"
            required
            autoComplete="off"
            toolparamdescription="氏名のふりがな。ひらがなで入力する（例: やまだ たろう）"
            value={state.fullnameKana}
            error={errors.fullnameKana}
          />
        </FormRow>
        <FormRow id="name-input" label="氏名" required>
          <ValidatedInput
            {...common}
            id="name-input"
            name="fullname"
            field="fullname"
            type="text"
            pattern={FIELD_PATTERNS.notBlank}
            placeholder="氏名を入力してください"
            required
            autoComplete="name"
            toolparamdescription="氏名（例: 山田 太郎）"
            value={state.fullname}
            error={errors.fullname}
          />
        </FormRow>
        <FormRow id="birthdate-input" label="生年月日" required>
          <ValidatedInput
            {...common}
            id="birthdate-input"
            name="birthday"
            field="birthday"
            type="date"
            required
            autoComplete="bday"
            toolparamdescription="生年月日。YYYY-MM-DD形式。満年齢は自動計算される"
            value={state.birthday}
            error={errors.birthday}
            addon={
              <>
                （満{' '}
                <span id="age-display" role="status" aria-live="polite">
                  {calculateAge(state.birthday) || ' '}
                </span>{' '}
                歳）
              </>
            }
          />
        </FormRow>
        <FormRow id="sex-input" label="性別">
          <ValidatedInput
            {...common}
            id="sex-input"
            name="sex"
            field="sex"
            type="text"
            placeholder="性別を入力してください（空欄可）"
            toolparamdescription="性別。自由記述で空欄可"
            value={state.sex}
          />
        </FormRow>
        <FormRow id="zip-code-input" label="郵便番号" required>
          <ValidatedInput
            {...common}
            id="zip-code-input"
            name="zip-code"
            field="zipCode"
            type="text"
            pattern={FIELD_PATTERNS.zipCode}
            placeholder="郵便番号を入力してください"
            required
            title="7桁の数字を入力してください（ハイフン可）"
            autoComplete="postal-code"
            toolparamdescription="郵便番号。半角数字7桁（ハイフンの有無は問わない。例: 1000001）"
            value={state.zipCode}
            error={errors.zipCode}
          />
        </FormRow>
        <FormRow id="address1-input" label="住所" required>
          <ValidatedInput
            {...common}
            id="address1-input"
            name="address1"
            field="address1"
            type="text"
            pattern={FIELD_PATTERNS.notBlank}
            placeholder="住所を入力してください"
            required
            autoComplete="street-address"
            toolparamdescription="現住所（都道府県から番地・建物名まで）"
            value={state.address1}
            error={errors.address1}
          />
        </FormRow>
        <FormRow id="tel1-input" label="電話番号">
          <ValidatedInput
            {...common}
            id="tel1-input"
            name="tel1"
            field="tel1"
            type="tel"
            pattern={FIELD_PATTERNS.tel}
            placeholder="電話番号を入力してください"
            autoComplete="tel"
            toolparamdescription="電話番号。半角数字（例: 03-1234-5678）"
            value={state.tel1}
            error={errors.tel1}
          />
        </FormRow>
        <FormRow id="mail1-input" label="メールアドレス">
          <ValidatedInput
            {...common}
            id="mail1-input"
            name="mail1"
            field="mail1"
            type="email"
            pattern={FIELD_PATTERNS.mail}
            placeholder="メールアドレスを入力してください"
            title="有効なメールアドレスを入力してください"
            autoComplete="email"
            toolparamdescription="メールアドレス（例: taro@example.com）"
            value={state.mail1}
            error={errors.mail1}
          />
        </FormRow>
        <Accordion
          className="mb-3"
          id="accordionExample"
          activeKey={contactOpen ? '0' : null}
          onSelect={(key) => onContactToggle(key === '0')}
        >
          <Accordion.Item eventKey="0">
            <h2 className="accordion-header" id="headingOne">
              <Accordion.Button
                className={initialAccordion.current ? 'sf-accordion-initial' : undefined}
                aria-controls="collapseOne"
              >
                現住所以外に連絡を希望する場合のみ記入
              </Accordion.Button>
            </h2>
            <Accordion.Collapse eventKey="0" id="collapseOne" aria-labelledby="headingOne" onEntered={onContactEntered}>
              <div className="accordion-body">
                <FormRow id="address2-input" label="住所">
                  <ValidatedInput
                    {...common}
                    id="address2-input"
                    name="address2"
                    field="address2"
                    type="text"
                    placeholder="住所を入力してください"
                    autoComplete="address-line2"
                    toolparamdescription="現住所以外に連絡を希望する場合のみ、その連絡先住所。不要なら空欄"
                    value={state.address2}
                  />
                </FormRow>
                <FormRow id="tel2-input" label="電話番号">
                  <ValidatedInput
                    {...common}
                    id="tel2-input"
                    name="tel2"
                    field="tel2"
                    type="tel"
                    pattern={FIELD_PATTERNS.tel}
                    placeholder="電話番号を入力してください"
                    autoComplete="tel"
                    toolparamdescription="現住所以外に連絡を希望する場合のみ、その連絡先電話番号。不要なら空欄"
                    value={state.tel2}
                    error={errors.tel2}
                  />
                </FormRow>
              </div>
            </Accordion.Collapse>
          </Accordion.Item>
        </Accordion>
        <div className="row">
          <h2 className="mt-5" id="career-history-title">
            学歴・職歴
          </h2>
          <div className="col-md">
            <fieldset id="career-history" aria-labelledby="career-history-title">
              {state.career.map((row) => (
                <CareerRow
                  key={row.id}
                  row={row}
                  onChange={(patch) => edit({ type: 'update-career', id: row.id, patch })}
                  onRemove={() => edit({ type: 'remove-career', id: row.id })}
                />
              ))}
            </fieldset>
            <Button
              id="add-career-history"
              type="button"
              variant="primary"
              className="mt-2"
              aria-label="学歴・職歴を追加"
              aria-controls="career-history"
              onClick={() => edit({ type: 'add-career' })}
            >
              ＋
            </Button>
          </div>
        </div>
        <div className="row">
          <h2 className="mt-5" id="license-history-title">
            免許・資格
          </h2>
          <div className="col-md">
            <fieldset id="license-history" aria-labelledby="license-history-title">
              {state.license.map((row) => (
                <LicenseRow
                  key={row.id}
                  row={row}
                  onChange={(patch) => edit({ type: 'update-license', id: row.id, patch })}
                  onRemove={() => edit({ type: 'remove-license', id: row.id })}
                />
              ))}
            </fieldset>
            <Button
              id="add-license-history"
              type="button"
              variant="primary"
              className="mt-2"
              aria-label="免許・資格を追加"
              aria-controls="license-history"
              onClick={() => edit({ type: 'add-license' })}
            >
              ＋
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
