/**
 * HTML 文字列へ埋め込む値をエスケープします。
 * @param {string} [value] - エスケープする文字列
 * @returns {string} - エスケープ済み文字列（未指定は空文字）
 * @throws なし
 * @example
 * escapeHtml('"A" & <B>'); // &quot;A&quot; &amp; &lt;B&gt;
 */
export function escapeHtml(value?: string): string {
  return (value ?? '').replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
