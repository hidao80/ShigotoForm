import type { ReactNode } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import type { ScalarField } from '../models/resume-state.ts';

export interface ValidatedInputProps {
  id: string;
  name: string;
  field: ScalarField;
  value: string;
  type?: 'text' | 'tel' | 'email' | 'date';
  placeholder?: string;
  required?: boolean;
  pattern?: string;
  title?: string;
  autoComplete?: string;
  toolparamdescription: string;
  /** 検証エラーのメッセージ。あれば赤枠・メッセージ・aria 属性で表示する */
  error?: string;
  /** 入力欄の右側に付ける文言（付けると input-group になり、フィードバックはグループ末尾に置く） */
  addon?: ReactNode;
  onValue: (field: ScalarField, value: string, composing: boolean) => void;
  onCommit: (field: ScalarField, value: string) => void;
}

/**
 * 検証表示つきの入力欄。値は制御コンポーネントとして親の state で持つ。
 * フィードバックの DOM は、エラーがあるときだけ描画する（表示が変わるときだけ DOM が変わる）。
 */
export function ValidatedInput({
  id,
  name,
  field,
  value,
  error,
  addon,
  onValue,
  onCommit,
  ...inputProps
}: ValidatedInputProps) {
  const errorId = `${id}-error`;
  const control = (
    <Form.Control
      {...inputProps}
      id={id}
      name={name}
      value={value}
      isInvalid={Boolean(error)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      onChange={(e) => onValue(field, e.target.value, (e.nativeEvent as InputEvent).isComposing === true)}
      onBlur={(e) => onCommit(field, e.currentTarget.value)}
    />
  );
  const feedback = error ? (
    <div id={errorId} className="invalid-feedback">
      {error}
    </div>
  ) : null;

  if (!addon) {
    return (
      <>
        {control}
        {feedback}
      </>
    );
  }
  return (
    <InputGroup hasValidation>
      {control}
      <InputGroup.Text>{addon}</InputGroup.Text>
      {feedback}
    </InputGroup>
  );
}
