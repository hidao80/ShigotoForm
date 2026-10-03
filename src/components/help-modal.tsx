import { Modal } from 'react-bootstrap';

interface HelpModalProps {
  show: boolean;
  onHide: () => void;
}

/**
 * ヘルプモーダル。
 */
export function HelpModal({ show, onHide }: HelpModalProps) {
  return (
    <Modal show={show} onHide={onHide} size="xl" centered id="helpModal" aria-labelledby="helpModalLabel">
      <Modal.Header closeButton closeLabel="閉じる">
        <Modal.Title as="h2" className="fs-5" id="helpModalLabel">
          ヘルプ
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h3 className="h6">入力方法</h3>
        <ol>
          <li>
            <b>氏名</b>: 氏名を入力。ふりがなはある程度自動補完されます。
          </li>
          <li>
            <b>生年月日</b>: カレンダーから選択またはYYYY/MM/DD形式で入力。
          </li>
          <li>
            <b>住所</b>: 住所を入力。
          </li>
          <li>
            <b>電話番号</b>: 半角数字で入力。
          </li>
          <li>
            <b>メールアドレス</b>: 有効なメールアドレスの形式で入力。
          </li>
          <li>
            <b>学歴・職歴</b>: 開始年月から修了年月と所属先名、役職や学科、備考をリスト形式で入力。追加・削除可。
          </li>
          <li>
            <b>免許・資格</b>: 取得年月と内容をリスト形式で入力。取得なのか合格なのかを選択。追加・削除可。
          </li>
        </ol>
        <h3 className="h6 mt-4">インポート・エクスポート</h3>
        <ul>
          <li>入力内容をJSONでエクスポート・インポート可能。</li>
          <li>右上のメニューから「エクスポート」「インポート」ボタンを利用。</li>
        </ul>
        <h3 className="h6 mt-4">プレビュー</h3>
        <ul>
          <li>入力内容をA4サイズでプレビュー可能。</li>
          <li>ゴシック体・明朝体を選択可。</li>
          <li>「履歴書PDFをダウンロード」ボタンでPDF保存。</li>
        </ul>
        <h3 className="h6 mt-4">アプリのアップデート</h3>
        <ul>
          <li>メニュー（≡）を開き、左上の「アプリのアップデート」をクリックすると最新版の確認・適用を行います。</li>
          <li>
            更新がある場合は「新しいバージョンがあります」と表示され、クリックで即時適用され自動的に再読み込みされます。
          </li>
          <li>更新がない場合は確認のみ行われます。</li>
          <li>オフライン時は更新確認ができません。オンラインにして再試行してください。</li>
        </ul>
      </Modal.Body>
    </Modal>
  );
}
