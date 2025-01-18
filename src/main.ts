import './resume.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import * as AutoKana from 'vanilla-autokana'
import * as Resume from './resume.ts'
import { $$one } from './indolence.ts'
import * as Theme from './theme.ts'
import * as RsumeData from './models/Resume.ts'
import packageJson from '../package.json';

$$one('#app')!.innerHTML = `
<nav class="navbar navbar-expand-lg px-3 py-2 fixed-top">
  <div class="container-fluid">
    <a class="navbar-brand" href="#">
      <img src="./img/favicon32.webp" alt="ShigotoForm" width="30" height="30" class="d-inline-block align-text-top me-2">
      <ruby>ShigotoForm<rt>シゴトフォーム</rt></rb><span class="fs-6 d-none d-md-block">&emsp;履歴書メーカー&emsp;</span><span id="version-no" class="fs-6 d-none d-md-block"></span>
    </a>
    <button class="navbar-toggler d-block" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar" aria-controls="offcanvasNavbar">
      <span class="navbar-toggler-icon"></span>
    </button>
  </div>
</nav>

<div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasNavbar" aria-labelledby="offcanvasNavbarLabel">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title" id="offcanvasNavbarLabel">メニュー</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
  </div>
  <div class="offcanvas-body d-flex flex-column">
    <ul class="navbar-nav flex-grow-1">
      <li class="nav-item mb-5">
        <div class="form-check form-switch ms-auto">
          <input class="form-check-input" type="checkbox" id="theme-switch" data-bs-theme="light">
          <label class="form-check-label" for="theme-switch">ダークモード</label>
        </div>
      </li>
      <li class="nav-item mb-5">
        <button id="backup-button" class="btn btn-primary">エクスポート</button>
      </li>
      <li class="nav-item row mb-5">
        <div class="col-md-9">
          <button type="button" class="btn btn-outline-primary" id="upload-button">インポート</button>
        </div>
      </li>
      <li class="nav-item row mb-5">
        <div class="col-md-9">
          <button type="button" class="btn btn-success" id="show-resume" disabled>履歴書を表示</button>
        </div>
      </li>
      <li class="nav-item row mt-auto">
        <div class="col-md-9">
          <button type="button" class="btn btn-danger" id="delete-content">入力内容を削除</button>
        </div>
      </li>
    </ul>
  </div>
</div>

<div class="resume">
  <div class="main-content">
    <h1 class="mb-5">履歴書</h1>
    <form>
      <div class="row mb-3">
        <label for="date-input" class="col-md-3 col-form-label-sm text-right required">年月日入力欄</label>
        <div class="col-md-9">
          <div class="input-group">
            <input type="date" class="form-control" id="created-at" name="createdAt" required>
            <div class="input-group-text">現在</div>
          </div>
        </div>
      </div>
      <div class="row mb-3">
        <label for="furigana-input" class="col-md-3 col-form-label-sm text-right required">ふりがな</label>
        <div class="col-md-9">
          <input type="text" class="form-control" id="furigana-input" name="fullname-kana" pattern="(?=.*?[\u3041-\u309F])[\u3041-\u309F\s]*" placeholder="ふりがなを入力してください" required>
        </div>
      </div>
      <div class="row mb-3">
        <label for="name-input" class="col-md-3 col-form-label-sm text-right required">氏名</label>
        <div class="col-md-9">
          <input type="text" class="form-control" id="name-input" name="fullname" pattern=".*\S+.*" placeholder="氏名を入力してください" required>
        </div>
      </div>
      <div class="row mb-3">
        <label for="birthdate-input" class="col-md-3 col-form-label-sm text-right required">生年月日</label>
        <div class="col-md-9">
          <div class="input-group">
            <input type="date" class="form-control" id="birthdate-input" name="birthday" required>
            <div class="input-group-text">（満 <span id="age-display">&emsp;</span> 歳）</div>
          </div>
        </div>
      </div>
      <div class="row mb-3">
        <label for="gender-input" class="col-md-3 col-form-label-sm text-right">性別</label>
        <div class="col-md-9">
          <input type="text" class="form-control" id="sex-input" name="sex" placeholder="性別を入力してください（空欄可）">
        </div>
      </div>
      <div class="row mb-3">
        <label for="address-input" class="col-md-3 col-form-label-sm text-right required">郵便番号</label>
        <div class="col-md-9">
          <input type="text" class="form-control" id="address-input" name="zip-code" pattern="\d{3}-?\d{4}" placeholder="郵便番号を入力してください" required pattern="\\d{7}" title="7桁の数字を入力してください">
        </div>
      </div>
      <div class="row mb-3">
        <label for="address-input" class="col-md-3 col-form-label-sm text-right required">住所</label>
        <div class="col-md-9">
          <input type="text" class="form-control" id="address-input" name="address1" pattern=".*\S+.*" placeholder="住所を入力してください" required>
        </div>
      </div>
      <div class="accordion mb-3" id="accordionExample">
        <div class="accordion-item">
          <h2 class="accordion-header" id="headingOne">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
              現住所以外に連絡を希望する場合のみ記入
            </button>
          </h2>
          <div id="collapseOne" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample">
            <div class="accordion-body">
              <div class="row mb-3">
                <label for="alt-address-input" class="col-md-3 col-form-label-sm text-right">住所</label>
                <div class="col-md-9">
                  <input type="text" class="form-control" id="alt-address-input" name="address2" placeholder="住所を入力してください">
                </div>
              </div>
              <div class="row mb-3">
                <label for="alt-phone-input" class="col-md-3 col-form-label-sm text-right">電話番号</label>
                <div class="col-md-9">
                  <input type="tel" class="form-control" id="alt-phone-input" pattern="\d{2,4}-?\d{2,4}-?\d{3,4}" placeholder="電話番号を入力してください">
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      <div class="row">
        <h2 class="mt-5">学歴・職歴</h2>
        <div class="col-md">
          <div id="career-history">
          </div>
          <button id="add-career-history" type="button" class="btn btn-primary mt-2">＋</button>
        </div>
      </div>
      <div class="row">
        <h2 class="mt-5">免許・資格</h2>
        <div class="col-md">
          <div id="license-history">
          </div>
          <button id="add-license-history" type="button" class="btn btn-primary mt-2">＋</button>
        </div>
      </div>
    </form>
  </div>
  <div class="modal fade" id="confirmDeleteModal" tabindex="-1" aria-labelledby="confirmDeleteModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="confirmDeleteModalLabel">確認</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          入力内容を削除します。よろしいですか？
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">キャンセル</button>
          <button type="button" class="btn btn-danger" id="confirm-delete">削除</button>
        </div>
      </div>
    </div>
  </div>
</div>
`

AutoKana.bind('#name-input', '#furigana-input')

Resume.addHistoryEventListener()
Resume.addLicenseEventListener()
Theme.addThemeSwitchEventListener()

Resume.initCreatedAt()
Resume.addInputEventListeners()
Resume.addDownloadButtonEventListener()
Resume.addDeleteConfirmButtonEventListener()
Resume.addUploadButtonEventListener()

$$one('#version-no')!.textContent = packageJson.version

if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark')
}

let resume = JSON.parse(localStorage.getItem('resume')!)
if (resume) {
  Resume.loadFromLocalStorage()
} else {
  resume = new RsumeData.Resume()
  localStorage.setItem('resume', JSON.stringify(resume))
}
