import './resume.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import Modal from 'bootstrap/js/dist/modal';
// Font Awesome をローカルにバンドル
// Font Awesome は遅延読み込み
// window.bootstrapが未定義の場合にModalをセット
if (!(window as any).bootstrap) {
  (window as any).bootstrap = { Modal };
}
import * as AutoKana from 'vanilla-autokana'
import * as Resume from './resume.ts'
import { saveFromForm, loadToForm } from './resume.ts'
import * as Theme from './theme.ts'
import { saveResume, loadResume, ResumeJson } from './db.ts'
import { Career, License } from './models/Resume'
import packageJson from '../package.json';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Workbox } from '@vite-pwa/workbox-window';

// フォントの遅延読み込み（初期レンダリング後に読込）
const lazyLoadNotoFonts = (() => {
  let loaded = false;
  return async () => {
    if (loaded) return;
    try {
      await Promise.all([
        import('@fontsource/noto-sans-jp/400.css'),
        import('@fontsource/noto-serif-jp/400.css')
      ]);
      loaded = true;
      document.documentElement.classList.add('fonts-loaded');
    } catch {
      // 失敗してもフォールバックフォントで継続
    }
  };
})();

// Font Awesome（アイコン）の遅延読み込み
const lazyLoadIcons = (() => {
  let loaded = false;
  return async () => {
    if (loaded) return;
    try {
      await import('@fortawesome/fontawesome-free/css/all.min.css');
      loaded = true;
      document.documentElement.classList.add('icons-loaded');
    } catch {
      // 失敗してもテキスト代替とARIAで継続
    }
  };
})();

// Workbox インスタンス（手動更新用に外でも参照）
let wb: Workbox | null = null;
let updateReady = false;
let manualCheck = false;

// 軽量トースト通知
function ensureToastContainer() {
  let el = document.getElementById('sf-toast-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sf-toast-container';
    document.body.appendChild(el);
  }
  return el;
}
function showToast(message: string, kind: 'info'|'success'|'warn'|'error' = 'info', ttl = 3000) {
  const container = ensureToastContainer();
  const div = document.createElement('div');
  div.className = `sf-toast ${kind}`;
  div.textContent = message;
  container.appendChild(div);
  const timer = setTimeout(() => {
    div.remove();
  }, ttl);
  return () => { clearTimeout(timer); div.remove(); };
}

// PWA Service Worker を workbox-window で登録（手動更新フロー）
if ('serviceWorker' in navigator) {
  const options = (import.meta as any).env?.DEV ? { type: 'module' as const } : undefined;
  wb = new Workbox('/sw.js', options as any);

  // 新バージョンが waiting になったら、リンクから手動適用できる状態にする
  wb.addEventListener('waiting', () => {
    updateReady = true;
    const status = document.getElementById('pwa-update-status');
    if (status) status.textContent = '新しいバージョンがあります';
    if (manualCheck) {
      showToast('新しいバージョンがあります。もう一度クリックで適用します。', 'info', 5000);
    }
  });

  // コントロール切替後にリロードして最新反映
  wb.addEventListener('controlling', () => {
    window.location.reload();
  });

  // インストール完了（更新なし/初回インストール）
  wb.addEventListener('installed', (event: any) => {
    if (manualCheck) {
      if (event?.isUpdate === false) {
        showToast('最新の状態です。', 'success', 2500);
      }
    }
  });

  wb.register();
}

/**
 * ResumeJson形式のデータをフォーム用Resume形式へ変換します。
 * @param {ResumeJson} json - ResumeJson形式のデータ
 * @returns {Object} フォーム用Resume形式データ
 * @throws なし
 * @example
 * const formData = jsonToFormResume(json);
 */
function jsonToFormResume(json: ResumeJson) {
  // career, licenseはjson.resume直下・json直下どちらにも対応
  const careerSrc = (json.resume && Array.isArray(json.resume.career))
    ? json.resume.career
    : (Array.isArray(json.career)) ? json.career : [];
  const licenseSrc = (json.resume && Array.isArray(json.resume.license))
    ? json.resume.license
    : (Array.isArray(json.license)) ? json.license : [];
  return {
    createdAt: json.createdAt,
    fullname: json.fullname,
    fullnameKana: json.fullnameKana,
    birthday: json.birthday,
    sex: json.sex,
    zipCode: json.zipCode,
    address1: json.address1,
    address1Kana: json.address1Kana,
    address2: json.address2,
    address2Kana: json.address2Kana,
    tel1: json.tel1,
    tel2: json.tel2,
    mail1: json.mail1,
    mail2: json.mail2,
    career: Array.isArray(careerSrc)
      ? careerSrc.filter(Boolean).map((c: Career) => ({
        start: c.start ?? c.startDate ?? '',
        end: c.end ?? c.endDate ?? '',
        name: c.name ?? '',
        position: c.position ?? '',
        description: c.description ?? ''
      }))
      : [],
    license: Array.isArray(licenseSrc)
      ? licenseSrc.filter(Boolean).map((l: License) => ({
        date: l.date ?? '',
        name: l.name ?? '',
        pass: l.pass ?? '合格'
      }))
      : [],
  };
}

/**
 * フォームの内容をResumeJson形式へ変換します。
 * @param {Object} form - フォームの入力データ
 * @returns {ResumeJson} ResumeJson形式のデータ
 * @throws なし
 * @example
 * const json = formResumeToJson(form);
 */
function formResumeToJson(form: any): ResumeJson {
  return {
    fullnameKana: form.fullnameKana || '',
    fullname: form.fullname || '',
    sex: form.sex || '',
    birthday: form.birthday || '',
    age: 0,
    zipCode: form.zipCode || '',
    address1Kana: form.address1Kana || '',
    address1: form.address1 || '',
    tel1: form.tel1 || '',
    mail1: form.mail1 || '',
    address2Kana: form.address2Kana || '',
    address2: form.address2 || '',
    tel2: form.tel2 || '',
    mail2: form.mail2 || '',
    photo: form.photo || '',
    createdAt: form.createdAt || '',
    resume: {
      education: [],
      career: (form.career || []),
      license: (form.license || []),
      subject: '',
      condition: '',
      hobby: '',
      reason: '',
      expectations: ''
    }
  };
}

/**
 * フォームにResumeJson形式のデータを読み込む
 * @param {ResumeJson} json - ResumeJson形式のデータ
 * @description
 * ResumeJson形式のデータをフォームに読み込みます。
 * 各項目は存在しない場合は空文字列に変換されます。
 * 履歴書の学歴・職歴と免許・資格は、フォームの対応するセクションに追加されます。
 */
window.addEventListener('DOMContentLoaded', async () => {
  // 初期レンダリング後のアイドル時間にフォントを遅延読み込み
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => { lazyLoadNotoFonts(); lazyLoadIcons(); });
  } else {
    setTimeout(() => { lazyLoadNotoFonts(); lazyLoadIcons(); }, 0);
  }

  // 初回のアイコン使用時に即時ロード（FOUT軽減）
  const loadIconsOnFirstInteraction = () => { lazyLoadIcons(); detach(); };
  const helpTriggerBtn = document.getElementById('help-modal-btn');
  const helpTriggerBtnInMenu = document.getElementById('help-modal-in-menu-btn');
  const offcanvas = document.getElementById('offcanvasNavbar');
  const detach = () => {
    helpTriggerBtn?.removeEventListener('pointerover', loadIconsOnFirstInteraction);
    helpTriggerBtn?.removeEventListener('focusin', loadIconsOnFirstInteraction);
    helpTriggerBtnInMenu?.removeEventListener('pointerover', loadIconsOnFirstInteraction);
    helpTriggerBtnInMenu?.removeEventListener('focusin', loadIconsOnFirstInteraction);
    offcanvas?.removeEventListener('show.bs.offcanvas' as any, loadIconsOnFirstInteraction as any);
  };
  helpTriggerBtn?.addEventListener('pointerover', loadIconsOnFirstInteraction, { once: true } as any);
  helpTriggerBtn?.addEventListener('focusin', loadIconsOnFirstInteraction, { once: true } as any);
  helpTriggerBtnInMenu?.addEventListener('pointerover', loadIconsOnFirstInteraction, { once: true } as any);
  helpTriggerBtnInMenu?.addEventListener('focusin', loadIconsOnFirstInteraction, { once: true } as any);
  // Offcanvas メニューを開いたら確実に読み込み
  offcanvas?.addEventListener('show.bs.offcanvas' as any, loadIconsOnFirstInteraction as any, { once: true } as any);
  document.querySelector('#app')!.innerHTML = `
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
<nav class="navbar navbar-expand-lg px-3 py-2 fixed-top" role="navigation" aria-label="主要ナビゲーション">
  <div class="container-fluid">
    <a class="navbar-brand" href="#">
      <img src="./img/favicon32.webp" alt="ShigotoForm" width="30" height="30" class="d-inline-block align-text-top me-2">
      <ruby>ShigotoForm<rt>シゴトフォーム</rt></ruby><span class="fs-6 d-none d-md-block">&emsp;履歴書メーカー&emsp;</span><span id="version-no" class="fs-6 d-none d-md-block"></span>
    </a>
    <button type="button" class="btn p-0 border-0 bg-transparent shadow-none ms-auto me-3" id="help-modal-btn" aria-label="ヘルプ">
      <i class="fa-regular fa-circle-question"></i>
    </button>
    <button class="navbar-toggler d-block" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar" aria-controls="offcanvasNavbar" aria-label="メニュー" aria-expanded="false">
      <span class="navbar-toggler-icon"></span>
    </button>
  </div>
</nav>

<div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasNavbar" aria-labelledby="offcanvasNavbarLabel" role="navigation" aria-label="アプリメニュー">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title" id="offcanvasNavbarLabel">メニュー</h5>
    <button type="button" class="btn p-0 border-0 bg-transparent shadow-none ms-auto me-3" id="help-modal-in-menu-btn" aria-label="ヘルプ">
      <i class="fa-regular fa-circle-question"></i>
    </button>
    <button type="button" class="btn-close ms-0" data-bs-dismiss="offcanvas" aria-label="Close"></button>
  </div>
  <div class="offcanvas-body d-flex flex-column">
    <div class="mb-2">
      <a href="#" id="pwa-update-link" class="link-primary small">アプリのアップデート</a>
      <span id="pwa-update-status" class="text-muted small ms-2" role="status" aria-live="polite"></span>
    </div>
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
  <div class="main-content" id="main" role="main">
    <h1 class="">履歴書</h1>
    <form>
      <div class="row mb-3">
        <label for="created-at" class="col-md-3 col-form-label-sm text-right required">年月日入力欄</label>
        <div class="col-md-9">
          <div class="input-group">
            <input type="date" class="form-control" id="created-at" name="createdAt" required autocomplete="off">
            <div class="input-group-text">現在</div>
          </div>
        </div>
      </div>
      <div class="row mb-3">
        <label for="furigana-input" class="col-md-3 col-form-label-sm text-right required">ふりがな</label>
        <div class="col-md-9">
          <input type="text" class="form-control" id="furigana-input" name="fullname-kana" pattern="(?=.*?[\u3041-\u309F])[\u3041-\u309F\s]*" placeholder="ふりがなを入力してください" required autocomplete="off">
        </div>
      </div>
      <div class="row mb-3">
        <label for="name-input" class="col-md-3 col-form-label-sm text-right required">氏名</label>
        <div class="col-md-9">
          <input type="text" class="form-control" id="name-input" name="fullname" pattern=".*\S+.*" placeholder="氏名を入力してください" required autocomplete="name">
        </div>
      </div>
      <div class="row mb-3">
        <label for="birthdate-input" class="col-md-3 col-form-label-sm text-right required">生年月日</label>
        <div class="col-md-9">
          <div class="input-group">
            <input type="date" class="form-control" id="birthdate-input" name="birthday" required autocomplete="bday">
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
        <label for="zip-code-input" class="col-md-3 col-form-label-sm text-right required">郵便番号</label>
        <div class="col-md-9">
          <input type="text" class="form-control" id="zip-code-input" name="zip-code" pattern="\d{3}-?\d{4}" placeholder="郵便番号を入力してください" required pattern="\\d{7}" title="7桁の数字を入力してください" autocomplete="postal-code">
        </div>
      </div>
      <div class="row mb-3">
        <label for="address1-input" class="col-md-3 col-form-label-sm text-right required">住所</label>
        <div class="col-md-9">
          <input type="text" class="form-control" id="address1-input" name="address1" pattern=".*\S+.*" placeholder="住所を入力してください" required autocomplete="street-address">
        </div>
      </div>
      <div class="row mb-3">
        <label for="tel1-input" class="col-md-3 col-form-label-sm text-right">電話番号</label>
        <div class="col-md-9">
          <input type="tel" class="form-control" id="tel1-input" name="tel1" pattern="\d{2,4}-?\d{2,4}-?\d{3,4}" placeholder="電話番号を入力してください" autocomplete="tel">
        </div>
      </div>
      <div class="row mb-3">
        <label for="mail1-input" class="col-md-3 col-form-label-sm text-right">メールアドレス</label>
        <div class="col-md-9">
          <input type="email" class="form-control" id="mail1-input" name="mail1" placeholder="メールアドレスを入力してください"
            pattern="^[a-zA-Z0-9._+\\-]+@[a-zA-Z0-9.\\-]+(\\.[a-zA-Z]{2,})+$" title="有効なメールアドレスを入力してください" autocomplete="email">
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
                <label for="address2-input" class="col-md-3 col-form-label-sm text-right">住所</label>
                <div class="col-md-9">
                  <input type="text" class="form-control" id="address2-input" name="address2" placeholder="住所を入力してください" autocomplete="address-line2">
                </div>
              </div>
              <div class="row mb-3">
                <label for="tel2-input" class="col-md-3 col-form-label-sm text-right">電話番号</label>
                <div class="col-md-9">
                  <input type="tel" class="form-control" id="tel2-input" pattern="\d{2,4}-?\d{2,4}-?\d{3,4}" placeholder="電話番号を入力してください" autocomplete="tel">
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
        <h5 class="modal-title" id="resumeModalLabel">履歴書プレビュー</h5>
        <div class="ms-auto d-flex align-items-center" style="gap:0.5em;">
          <label class="me-1 mb-0" for="font-select" style="white-space:nowrap;">フォント:</label>
          <select id="font-select" class="form-select form-select-sm" style="width:auto;">
            <option value="gothic">ゴシック体</option>
            <option value="mincho">明朝体</option>
          </select>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button>
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
`;

  // ヘルプボタンとメニュー内のヘルプボタンでモーダル表示
  const helpBtn = document.getElementById('help-modal-btn');
  const helpInMenuBtn = document.getElementById('help-modal-in-menu-btn');
  if (helpBtn && helpInMenuBtn) {
    const func = () => {
      const modalEl = document.getElementById('helpModal');
      if (!modalEl) return;
      const modal = new (window as any).bootstrap.Modal(modalEl, { backdrop: true });
      modal.show();
    };

    helpBtn.addEventListener('click', func);
    helpInMenuBtn.addEventListener('click', func);
  }

  // アプリのアップデート（手動更新）リンク
  const updateLink = document.getElementById('pwa-update-link');
  const updateStatus = document.getElementById('pwa-update-status');
  if (updateLink) {
    updateLink.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!wb) {
        // SW未対応環境は単純リロード
        window.location.reload();
        return;
      }
      if (updateStatus) updateStatus.textContent = '更新を確認中…';
      manualCheck = true;
      const clearMsg = showToast('更新を確認中…', 'info', 8000);
      try {
        if (updateReady) {
          // すでにwaitingなら即適用
          await wb.messageSkipWaiting();
        } else {
          // 更新チェックを実行
          await wb.update();
          // 一部環境では waiting が即発火しないことがあるためフォールバック
          setTimeout(() => {
            if (!updateReady) {
              // waiting になっていない = 更新なしの可能性が高い
              showToast('最新の状態です。', 'success', 2500);
              if (updateStatus) updateStatus.textContent = '';
              manualCheck = false;
            }
          }, 4000);
        }
      } catch (err) {
        showToast('更新の確認に失敗しました。ネットワークを確認してください。', 'error', 5000);
        manualCheck = false;
        if (updateStatus) updateStatus.textContent = '';
      } finally {
        clearMsg();
        // 状態表示をクリア（waiting時は上書きされる）
        if (!updateReady && updateStatus) updateStatus.textContent = '';
      }
    });
  }

  AutoKana.bind('#name-input', '#furigana-input');

  Theme.addThemeSwitchEventListener();

  // IndexedDBから初期化・復元
  const resumeJson = await loadResume();
  if (resumeJson) {
    loadToForm(jsonToFormResume(resumeJson));
  }
  Resume.addHistoryEventListener();
  Resume.addLicenseEventListener();
  // 「履歴書を表示」ボタンを有効化
  const showResumeBtn = document.querySelector('#show-resume') as HTMLButtonElement | null;
  if (showResumeBtn) showResumeBtn.disabled = false;

  /**
   * 入力・変更イベントで自動保存
   * すべてのinput, textarea, select要素にchangeイベントを付与
   * 生年月日入力時は満年齢も自動計算
   */
  const formEl = document.querySelector('form');
  if (formEl) {
    const saveHandler = async () => {
      const data = saveFromForm();
      await saveResume(formResumeToJson(data));
    };
    const elements = formEl.querySelectorAll('input, textarea, select');
    elements.forEach(el => {
      el.addEventListener('change', saveHandler);
      // 年月入力にもイベントを追加
      if (el instanceof HTMLInputElement && (el.type === 'month' || el.type === 'date')) {
        el.addEventListener('input', saveHandler);
      }
    });

    // 動的追加項目にも保存イベントを付与
    const observeTargets = [
      document.getElementById('career-history'),
      document.getElementById('license-history')
    ];
    observeTargets.forEach(target => {
      if (!target) return;
      const observer = new MutationObserver(() => {
        // 新しく追加されたinput, textarea, select全てにイベントを付与
        const newInputs = target.querySelectorAll('input, textarea, select');
        newInputs.forEach(el => {
          el.removeEventListener('change', saveHandler);
          el.removeEventListener('input', saveHandler);
          el.addEventListener('change', saveHandler);
          el.addEventListener('input', saveHandler);
        });
      });
      observer.observe(target, { childList: true, subtree: true });
    });

    // 生年月日入力時に満年齢を計算して表示
    const birthInput = document.querySelector('#birthdate-input') as HTMLInputElement | null;
    const ageDisplay = document.querySelector('#age-display');
    if (birthInput && ageDisplay) {
      birthInput.addEventListener('change', async () => {
        const val = birthInput.value;
        let age = '';
        if (val) {
          const today = new Date();
          const birth = new Date(val);
          let calcAge = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            calcAge--;
          }
          age = isNaN(calcAge) ? '' : String(calcAge);
        }
        ageDisplay.textContent = age;

        // 年齢再計算時にDBへ保存
        const data = saveFromForm();
        const json = formResumeToJson(data);
        json.age = age ? Number(age) : 0;
        await saveResume(json);
      });
      // 初期表示時も反映
      if (birthInput.value) {
        const val = birthInput.value;
        const today = new Date();
        const birth = new Date(val);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        ageDisplay.textContent = isNaN(age) ? '' : String(age);
      }
    }
  }

  /**
   * エクスポートボタン
   */
  document.querySelector('#backup-button')?.addEventListener('click', async () => {
    const data = saveFromForm();
    // 入力年月日取得
    const date = (data.createdAt || '').replace(/-/g, '');
    const filename = `resume_${date}.json`;
    // エクスポートは従来のjson形式
    const blob = new Blob([JSON.stringify(formResumeToJson(data), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  });

  /**
   * インポートボタン
   */
  document.querySelector('#upload-button')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      loadToForm(jsonToFormResume(data));
      await saveResume(data);
    };
    input.click();
  });

  // 履歴書プレビュー用モーダルHTMLをbody直下に追加
  const resumeModalHtml = `
<div class="modal fade" id="resumeModal" tabindex="-1" aria-labelledby="resumeModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="resumeModalLabel">履歴書プレビュー</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button>
      </div>
      <div class="modal-body d-flex justify-content-center align-items-center">
        <div id="resume-modal-content" class="w-100 d-flex justify-content-center" style="padding-top:500px;"></div>
      </div>
      <div class="modal-footer">
        <div class="font-switcher">
          <label class="me-2">フォント:</label>
          <select id="font-select" class="form-select form-select-sm d-inline-block" style="width:auto;">
            <option value="gothic">ゴシック体</option>
            <option value="mincho">明朝体</option>
          </select>
        </div>

        <button id="download-resume-html" class="btn btn-primary">履歴書PDFダウンロード</button>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">閉じる</button>
      </div>
    </div>
  </div>
</div>
`;
  document.body.insertAdjacentHTML('beforeend', resumeModalHtml);

  // 「履歴書を表示」ボタンイベント
  document.querySelector('#show-resume')?.addEventListener('click', async () => {
    // プレビュー使用前にフォントを確実に読み込み
    await lazyLoadNotoFonts();
    const resumeJson = await loadResume();
    if (!resumeJson) return;
    const data = jsonToFormResume(resumeJson);
    // フォント選択状態を取得
    const fontType = (document.querySelector('#resumeModal .modal-footer #font-select') as HTMLSelectElement)?.value
      || (document.getElementById('font-select') as HTMLSelectElement)?.value
      || 'gothic';
    // 履歴書HTML生成
    const html = Resume.generateResumeHtml(data, fontType as 'gothic' | 'mincho');
    const content = document.querySelector('#resume-modal-content');
    if (content) {
      content.innerHTML = html;
    }
    // モーダル内font-selectイベントリスナーを付与
    const modalFontSelect = document.querySelector('#resumeModal .modal-footer #font-select') as HTMLSelectElement | null;
    if (modalFontSelect) {
      modalFontSelect.addEventListener('change', () => {
        const preview = document.querySelector('#resume-modal-content .resume-preview') as HTMLElement | null;
        if (preview) {
          preview.classList.remove('font-gothic', 'font-mincho');
          if (modalFontSelect.value === 'gothic') {
            preview.classList.add('font-gothic');
          } else if (modalFontSelect.value === 'mincho') {
            preview.classList.add('font-mincho');
          }
        }
      });
    }
    // モーダル表示
    const modal = new (window as any).bootstrap.Modal(document.querySelector('#resumeModal'));
    modal.show();
  });

  // モーダル内ダウンロードボタン
  document.body.addEventListener('click', async (e) => {
    if ((e.target as HTMLElement).id === 'download-resume-html') {
      // 最新データ取得
      const resumeJson = await loadResume();
      let date = '';
      let name = '';
      if (resumeJson) {
        date = (resumeJson.createdAt || '').replace(/-/g, '');
        name = resumeJson.fullname || '';
      }
      // .resume-previewのみPDF化
      const preview = document.querySelector('#resume-modal-content .resume-preview') as HTMLElement | null;
      if (preview) {
        // 背景色の斑を防ぐためのオプション設定
        const opt = {
          margin: 0,
          filename: `履歴書_${name}_${date}.pdf`,
          image: {
            type: 'jpeg' as const,
            quality: 1.0  // 品質を最大に
          },
          html2canvas: {
            scale: 3,  // スケールを上げて解像度向上
            // backgroundColor: '#ffffff',  // 明示的に白背景設定
            useCORS: true,
            allowTaint: true,
            width: Math.round(212 * 96 / 25.4),  // 212mm × 96dpi ÷ 25.4
            height: Math.round(299 * 96 / 25.4), // 299mm × 96dpi ÷ 25.4
            dpi: 192,  // DPIを192に設定
            letterRendering: true,  // 文字レンダリング改善
            removeContainer: true,  // コンテナ削除
            foreignObjectRendering: false,  // SVG関連の問題回避
            onclone: function(clonedDoc: Document) {              
              // クローンされたドキュメントでテーブル線幅を調整
              clonedDoc.body.style.backgroundColor = '#fff';  // 背景色を白に設定
              clonedDoc.body.style.color = '#000';  // 文字色を黒に設定
              const tables = clonedDoc.querySelectorAll('table, th, td, tr');
              tables.forEach((el: Element) => {
                const style = (el as HTMLElement).style;
                style.border = '0.1px solid #ddd';  // 極細の線幅
                style.backgroundColor = '#fff';  // 背景色を白に
                style.color = '#000';  // 文字色を黒に
              });
            }
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait' as const,
            putOnlyUsedFonts: true,
            compress: false  // 圧縮無効で品質保持
          }
        };

        try {
          // 少し待ってからPDF生成（レンダリング完了を待つ）
          // await new Promise(resolve => setTimeout(resolve, 100));
          await html2pdf().set(opt).from(preview).save();
        } finally {
        }
      }
    }
  });

  const versionNo = document.querySelector('#version-no');
  if (versionNo) versionNo.textContent = packageJson.version;

  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark')
  }

  // フォント切替イベント
  const fontSelect = document.getElementById('font-select') as HTMLSelectElement | null;
  if (fontSelect) {
    fontSelect.addEventListener('change', () => {
      // プレビュー内のフォントクラスを切り替え
      const preview = document.querySelector('#resume-modal-content .resume-preview') as HTMLElement | null;
      if (preview) {
        preview.classList.remove('font-gothic', 'font-mincho');
        if (fontSelect.value === 'gothic') {
          preview.classList.add('font-gothic');
        } else if (fontSelect.value === 'mincho') {
          preview.classList.add('font-mincho');
        }
      }
    });
  }
});

/**
 * 非同期でIndexedDBから履歴書データを初期化・復元します。
 * @returns {Promise<void>}
 * @throws なし
 */
(async () => {
  const resumeJson = await loadResume();
  if (resumeJson) {
    loadToForm(jsonToFormResume(resumeJson));
  }
  // 「履歴書を表示」ボタンを有効化
  const showResumeBtn = document.querySelector('#show-resume') as HTMLButtonElement | null;
  if (showResumeBtn) showResumeBtn.disabled = false;
})();
