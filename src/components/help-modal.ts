/**
 * ヘルプモーダルのHTMLを生成します。
 * @returns {string} HTML文字列
 */
export function helpModalHtml(): string {
  return `
<div class="modal fade" id="helpModal" tabindex="-1" aria-labelledby="helpModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="helpModalLabel">ヘルプ</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button>
      </div>
      <div class="modal-body">
        <h6>入力方法</h6>
        <ol>
          <li><b>氏名</b>: 氏名を入力。ふりがなはある程度自動補完されます。</li>
          <li><b>生年月日</b>: カレンダーから選択またはYYYY/MM/DD形式で入力。</li>
          <li><b>住所</b>: 住所を入力。</li>
          <li><b>電話番号</b>: 半角数字で入力。</li>
          <li><b>メールアドレス</b>: 有効なメールアドレスの形式で入力。</li>
          <li><b>学歴・職歴</b>: 開始年月から修了年月と所属先名、役職や学科、備考をリスト形式で入力。追加・削除可。</li>
          <li><b>免許・資格</b>: 取得年月と内容をリスト形式で入力。取得なのか合格なのかを選択。追加・削除可。</li>
        </ol>
        <h6 class="mt-4">インポート・エクスポート</h6>
        <ul>
          <li>入力内容をJSONでエクスポート・インポート可能。</li>
          <li>右上のメニューから「エクスポート」「インポート」ボタンを利用。</li>
        </ul>
        <h6 class="mt-4">プレビュー</h6>
        <ul>
          <li>入力内容をA4サイズでプレビュー可能。</li>
          <li>ゴシック体・明朝体を選択可。</li>
          <li>「履歴書PDFをダウンロード」ボタンでPDF保存。</li>
        </ul>
        <h6 class="mt-4">アプリのアップデート</h6>
        <ul>
          <li>メニュー（≡）を開き、左上の「アプリのアップデート」をクリックすると最新版の確認・適用を行います。</li>
          <li>更新がある場合は「新しいバージョンがあります」と表示され、クリックで即時適用され自動的に再読み込みされます。</li>
          <li>更新がない場合は確認のみ行われます。</li>
          <li>オフライン時は更新確認ができません。オンラインにして再試行してください。</li>
        </ul>
      </div>
    </div>
  </div>
</div>
`;
}
