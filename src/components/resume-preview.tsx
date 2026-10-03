import type { FormState } from '../models/resume-state.ts';

export type ResumeFontType = 'gothic' | 'mincho';

/**
 * 日付を「YYYY年MM月DD日」形式に変換します。
 * @param {string} dateStr - 日付文字列（YYYY-MM-DD / YYYY-MM）
 * @returns {string} フォーマット済み日付
 * @throws なし
 * @example
 * formatDate('1990-04-01'); // '1990年04月01日'
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m = '', d = ''] = dateStr.split(/-|\//);
  if (!y) return '';
  if (m && d) return `${y}年${m}月${d}日`;
  if (m) return `${y}年${m}月`;
  return `${y}年`;
}

/**
 * 郵便番号をハイフン付きの形式にフォーマットします。
 * @param {string} zip - フォーマットする郵便番号
 * @returns {string} フォーマットされた郵便番号
 * @throws なし
 * @example
 * formatZipCode('1000001'); // '100-0001'
 */
export function formatZipCode(zip: string): string {
  if (!zip) return '';
  // すでにハイフンが含まれていればそのまま
  if (zip.includes('-')) return zip;
  // 7桁以上の場合のみ4文字目にハイフンを挿入
  if (zip.length >= 7) return `${zip.slice(0, 3)}-${zip.slice(3)}`;
  return zip;
}

interface ResumePreviewProps {
  /** 行の id（key 用）を持つフォーム状態。fromResume() で Resume から作れる */
  data: FormState;
  fontType?: ResumeFontType;
}

/**
 * 履歴書の A4 プレビュー。値は JSX の文字列として描画される（タグとして解釈されない）。
 */
export function ResumePreview({ data, fontType = 'gothic' }: ResumePreviewProps) {
  const fontClass = fontType === 'mincho' ? 'font-mincho' : 'font-gothic';
  return (
    <div
      className={`resume-preview p-4 rounded shadow ${fontClass}`}
      style={{ width: '210mm', height: '297mm', margin: 'auto', boxSizing: 'border-box', position: 'relative' }}
    >
      <h1 className="mb-3">履歴書</h1>
      <table className="table table-bordered mb-4">
        <tbody>
          <tr>
            <th style={{ width: '140px' }}>ふりがな</th>
            <td>
              <ruby>
                {data.fullname}
                {data.fullnameKana ? <rt>{data.fullnameKana}</rt> : null}
              </ruby>
            </td>
            <th style={{ width: '140px' }}>生年月日</th>
            <td>{formatDate(data.birthday || '')}</td>
          </tr>
          <tr>
            <th>性別</th>
            <td>{data.sex}</td>
            <th>作成日</th>
            <td>{formatDate(data.createdAt || '')}</td>
          </tr>
          <tr>
            <th>郵便番号</th>
            <td>{formatZipCode(data.zipCode || '')}</td>
            <th>住所</th>
            <td>{data.address1}</td>
          </tr>
          <tr>
            <th>電話番号</th>
            <td>{data.tel1}</td>
            <th>メールアドレス</th>
            <td>{data.mail1}</td>
          </tr>
          <tr>
            <th>連絡先住所</th>
            <td>{data.address2}</td>
            <th>連絡先電話番号</th>
            <td>{data.tel2}</td>
          </tr>
        </tbody>
      </table>
      <h2 className="mt-4">学歴・職歴</h2>
      <ul>
        {(data.career || []).map((c) => (
          <li key={c.id}>
            {`${formatDate(c.start)} ～ ${c.end && c.end.trim() !== '' ? formatDate(c.end) : '現在'} ${c.name}`}
            {c.position ? ` / ${c.position}` : ''}{' '}
            {c.description ? <span style={{ marginLeft: '2em' }}>{c.description}</span> : null}
          </li>
        ))}
      </ul>
      <h2 className="mt-4">免許・資格</h2>
      <ul>
        {(data.license || []).map((l) => (
          <li key={l.id}>{`${formatDate(l.date)} ${l.name}${l.pass ? `　${l.pass}` : ''}`}</li>
        ))}
      </ul>
    </div>
  );
}
