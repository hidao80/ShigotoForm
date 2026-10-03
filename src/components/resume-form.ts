/**
 * 履歴書入力フォーム（main領域）のHTMLを生成します。
 * @returns {string} HTML文字列
 */
export function resumeFormHtml(): string {
  return `
  <div class="main-content" id="main" role="main" tabindex="-1">
    <h1 class="" id="resume-form-title">履歴書</h1>
    <form aria-labelledby="resume-form-title"
      toolname="fill-resume-basic-info"
      tooldescription="履歴書の入力項目（年月日・ふりがな・氏名・生年月日・性別・郵便番号・住所・電話番号・メールアドレス・連絡先住所・連絡先電話番号、および学歴・職歴と免許・資格）を入力する。学歴・職歴と免許・資格は、画面に追加済みの行のみ入力できる。">
      <div class="row mb-3">
        <label for="created-at" class="col-md-3 col-form-label-sm text-right required">年月日入力欄</label>
        <div class="col-md-9">
          <div class="input-group">
            <input type="date" class="form-control" id="created-at" name="createdAt" required autocomplete="off" toolparamdescription="履歴書の作成日（入力年月日）。YYYY-MM-DD形式">
            <div class="input-group-text">現在</div>
          </div>
        </div>
      </div>
      <div class="row mb-3">
        <label for="furigana-input" class="col-md-3 col-form-label-sm text-right required">ふりがな</label>
        <div class="col-md-9">
          <input type="text" class="form-control" id="furigana-input" name="fullname-kana" pattern="(?=.*?[\u3041-\u309F])[\u3041-\u309F\u30FC\\s]*" placeholder="ふりがなを入力してください" required autocomplete="off" toolparamdescription="氏名のふりがな。ひらがなで入力する（例: やまだ たろう）">
        </div>
      </div>
      <div class="row mb-3">
        <label for="name-input" class="col-md-3 col-form-label-sm text-right required">氏名</label>
        <div class="col-md-9">
          <input type="text" class="form-control" id="name-input" name="fullname" pattern=".*\\S+.*" placeholder="氏名を入力してください" required autocomplete="name" toolparamdescription="氏名（例: 山田 太郎）">
        </div>
      </div>
      <div class="row mb-3">
        <label for="birthdate-input" class="col-md-3 col-form-label-sm text-right required">生年月日</label>
        <div class="col-md-9">
          <div class="input-group">
            <input type="date" class="form-control" id="birthdate-input" name="birthday" required autocomplete="bday" toolparamdescription="生年月日。YYYY-MM-DD形式。満年齢は自動計算される">
            <div class="input-group-text">（満 <span id="age-display" role="status" aria-live="polite">&emsp;</span> 歳）</div>
          </div>
        </div>
      </div>
      <div class="row mb-3">
        <label for="sex-input" class="col-md-3 col-form-label-sm text-right">性別</label>
        <div class="col-md-9">
          <input type="text" class="form-control" id="sex-input" name="sex" placeholder="性別を入力してください（空欄可）" toolparamdescription="性別。自由記述で空欄可">
        </div>
      </div>
      <div class="row mb-3">
        <label for="zip-code-input" class="col-md-3 col-form-label-sm text-right required">郵便番号</label>
        <div class="col-md-9">
          <input type="text" class="form-control" id="zip-code-input" name="zip-code" pattern="\\d{3}-?\\d{4}" placeholder="郵便番号を入力してください" required title="7桁の数字を入力してください（ハイフン可）" autocomplete="postal-code" toolparamdescription="郵便番号。半角数字7桁（ハイフンの有無は問わない。例: 1000001）">
        </div>
      </div>
      <div class="row mb-3">
        <label for="address1-input" class="col-md-3 col-form-label-sm text-right required">住所</label>
        <div class="col-md-9">
          <input type="text" class="form-control" id="address1-input" name="address1" pattern=".*\\S+.*" placeholder="住所を入力してください" required autocomplete="street-address" toolparamdescription="現住所（都道府県から番地・建物名まで）">
        </div>
      </div>
      <div class="row mb-3">
        <label for="tel1-input" class="col-md-3 col-form-label-sm text-right">電話番号</label>
        <div class="col-md-9">
          <input type="tel" class="form-control" id="tel1-input" name="tel1" pattern="\\d{2,4}-?\\d{2,4}-?\\d{3,4}" placeholder="電話番号を入力してください" autocomplete="tel" toolparamdescription="電話番号。半角数字（例: 03-1234-5678）">
        </div>
      </div>
      <div class="row mb-3">
        <label for="mail1-input" class="col-md-3 col-form-label-sm text-right">メールアドレス</label>
        <div class="col-md-9">
          <input type="email" class="form-control" id="mail1-input" name="mail1" placeholder="メールアドレスを入力してください"
            pattern="^[a-zA-Z0-9._+\\-]+@[a-zA-Z0-9.\\-]+(\\.[a-zA-Z]{2,})+$" title="有効なメールアドレスを入力してください" autocomplete="email" toolparamdescription="メールアドレス（例: taro@example.com）">
        </div>
      </div>
      <div class="accordion mb-3" id="accordionExample">
        <div class="accordion-item">
          <h2 class="accordion-header" id="headingOne">
            <button class="accordion-button collapsed sf-accordion-initial" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">
              現住所以外に連絡を希望する場合のみ記入
            </button>
          </h2>
          <div id="collapseOne" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample">
            <div class="accordion-body">
              <div class="row mb-3">
                <label for="address2-input" class="col-md-3 col-form-label-sm text-right">住所</label>
                <div class="col-md-9">
                  <input type="text" class="form-control" id="address2-input" name="address2" placeholder="住所を入力してください" autocomplete="address-line2" toolparamdescription="現住所以外に連絡を希望する場合のみ、その連絡先住所。不要なら空欄">
                </div>
              </div>
              <div class="row mb-3">
                <label for="tel2-input" class="col-md-3 col-form-label-sm text-right">電話番号</label>
                <div class="col-md-9">
                  <input type="tel" class="form-control" id="tel2-input" name="tel2" pattern="\\d{2,4}-?\\d{2,4}-?\\d{3,4}" placeholder="電話番号を入力してください" autocomplete="tel" toolparamdescription="現住所以外に連絡を希望する場合のみ、その連絡先電話番号。不要なら空欄">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <h2 class="mt-5" id="career-history-title">学歴・職歴</h2>
        <div class="col-md">
          <div id="career-history" role="group" aria-labelledby="career-history-title">
          </div>
          <button id="add-career-history" type="button" class="btn btn-primary mt-2" aria-label="学歴・職歴を追加" aria-controls="career-history">＋</button>
        </div>
      </div>
      <div class="row">
        <h2 class="mt-5" id="license-history-title">免許・資格</h2>
        <div class="col-md">
          <div id="license-history" role="group" aria-labelledby="license-history-title">
          </div>
          <button id="add-license-history" type="button" class="btn btn-primary mt-2" aria-label="免許・資格を追加" aria-controls="license-history">＋</button>
        </div>
      </div>
    </form>
  </div>
`;
}
