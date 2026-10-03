import type { Resume } from '../models/Resume.ts';
import { escapeHtml } from './escape-html.ts';

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
                ${escapeHtml(data.fullname)}
                ${data.fullnameKana ? `<rt>${escapeHtml(data.fullnameKana)}</rt>` : ''}
              </ruby>
            </td>
            <th style="width:140px;">生年月日</th>
            <td>${escapeHtml(formatDate(data.birthday || ''))}</td>
          </tr>
          <tr>
            <th>性別</th>
            <td>${escapeHtml(data.sex)}</td>
            <th>作成日</th>
            <td>${escapeHtml(formatDate(data.createdAt || ''))}</td>
          </tr>
          <tr>
            <th>郵便番号</th>
            <td>${escapeHtml(formatZipCode(data.zipCode || ''))}</td>
            <th>住所</th>
            <td>${escapeHtml(data.address1)}</td>
          </tr>
          <tr>
            <th>電話番号</th>
            <td>${escapeHtml(data.tel1)}</td>
            <th>メールアドレス</th>
            <td>${escapeHtml(data.mail1)}</td>
          </tr>
          <tr>
            <th>連絡先住所</th>
            <td>${escapeHtml(data.address2)}</td>
            <th>連絡先電話番号</th>
            <td>${escapeHtml(data.tel2)}</td>
          </tr>
        </tbody>
      </table>
      <h2 class="mt-4">学歴・職歴</h2>
      <ul>
        ${(data.career || [])
          .map(
            (c) =>
              `<li>
            ${escapeHtml(formatDate(c.start))} ～ ${c.end && c.end.trim() !== '' ? escapeHtml(formatDate(c.end)) : '現在'} ${escapeHtml(c.name)} 
            ${c.position ? ` / ${escapeHtml(c.position)}` : ''} 
            ${c.description ? `<span style="margin-left:2em;">${escapeHtml(c.description)}</span>` : ''}
          </li>`,
          )
          .join('')}
      </ul>
      <h2 class="mt-4">免許・資格</h2>
      <ul>
        ${(data.license || []).map((l) => `<li>${escapeHtml(formatDate(l.date))} ${escapeHtml(l.name)}${l.pass ? `　${escapeHtml(l.pass)}` : ''}</li>`).join('')}
      </ul>
    </div>
  `;
}
