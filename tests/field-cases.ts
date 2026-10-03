/**
 * 入力欄の検証ケース（[id, 値, 不正か]）。
 * E2E は HTML の pattern 属性（patternMismatch）、unit は Zod スキーマで同じ表を検証し、両者の規則が乖離したら失敗させる。
 */
export const PATTERN_CASES: [id: string, value: string, invalid: boolean][] = [
  ['furigana-input', 'やまだ たろう', false],
  ['furigana-input', 'ゆーき', false],
  ['furigana-input', '山田', true],
  ['name-input', '山田 太郎', false],
  ['name-input', '  ', true],
  ['zip-code-input', '1000001', false],
  ['zip-code-input', '100-0001', false],
  ['zip-code-input', '12345', true],
  ['address1-input', '東京都千代田区', false],
  ['address1-input', ' ', true],
  ['tel1-input', '03-1234-5678', false],
  ['tel1-input', '09012345678', false],
  ['tel1-input', 'abc', true],
  ['tel2-input', '06-1234-5678', false],
  ['mail1-input', 'taro@example.com', false],
  ['mail1-input', 'x@', true],
];
