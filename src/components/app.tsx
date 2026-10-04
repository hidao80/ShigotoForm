import { useEffect, useRef, useState } from 'react';
import { clearResume, saveResume } from '../db.ts';
import { exportResume, pickJsonFile, readResumeFile } from '../features/backup.ts';
import { lazyLoadNotoFonts, scheduleLazyAssets } from '../features/lazy-assets.ts';
import { requestAppUpdate, useUpdateStatus } from '../features/pwa-update.ts';
import { jsonToFormResume } from '../features/resume-json.ts';
import { useResumeForm } from '../hooks/use-resume-form.ts';
import { useTheme } from '../hooks/use-theme.ts';
import { createEmptyResume } from '../models/Resume.ts';
import type { ResumeFormField } from '../models/resume-form-schema.ts';
import { AppMenu } from './app-menu.tsx';
import { AppNavbar } from './app-navbar.tsx';
import { DeleteModal } from './delete-modal.tsx';
import { CONTACT_FIELDS, FIELD_IDS } from './field-ids.ts';
import { HelpModal } from './help-modal.tsx';
import { ResumeForm } from './resume-form.tsx';
import { ResumeModal } from './resume-modal.tsx';
import { formatToastList, showToast } from './toast.ts';
import { ToastContainer } from './toast-container.tsx';

/**
 * アプリ全体。フォーム状態とモーダル・メニューの開閉を持ち、各画面部品へ配る。
 */
export function App() {
  const form = useResumeForm();
  const [dark, setDark] = useTheme();
  const updateStatus = useUpdateStatus();
  const [menuOpen, setMenuOpen] = useState(false);
  // メニューを閉じたときに、開いたボタンへフォーカスを戻すか。モーダルを開く・欄へフォーカスを移すために閉じるときは戻さない
  const [restoreMenuFocus, setRestoreMenuFocus] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  // メニュー(offcanvas)のフォーカストラップが欄へのフォーカスを奪うため、閉じ終わってから行う処理
  const afterMenuClosed = useRef<(() => void) | null>(null);
  const afterContactOpened = useRef<(() => void) | null>(null);

  // 初期レンダリング後のアイドル時間にフォントとアイコンを遅延読み込み
  useEffect(() => {
    scheduleLazyAssets();
  }, []);

  const openMenu = () => {
    setRestoreMenuFocus(true);
    setMenuOpen(true);
  };
  /** 別の操作（モーダルを開く・欄へフォーカスを移す）のためにメニューを閉じる。トグルボタンへフォーカスを戻さない */
  const closeMenuForAction = () => {
    setRestoreMenuFocus(false);
    setMenuOpen(false);
  };

  /** 最初に不正な欄へフォーカスする（メニューを閉じてから、連絡先の折りたたみ内なら展開してから） */
  const focusInvalid = (field: ResumeFormField) => {
    const focus = () => document.getElementById(FIELD_IDS[field])?.focus();
    const run = () => {
      if (CONTACT_FIELDS.includes(field) && !contactOpen) {
        afterContactOpened.current = focus;
        setContactOpen(true);
      } else {
        focus();
      }
    };
    if (menuOpen) {
      afterMenuClosed.current = run;
      closeMenuForAction();
    } else {
      run();
    }
  };

  /**
   * 現在のフォームを検証し、全欄へエラー表示を反映します。不正があれば警告トーストを出します。
   * @returns すべて正しければ true
   */
  const validateWithWarning = ({ header, focus }: { header: string; focus: boolean }): boolean => {
    const found = form.validateAll();
    if (found.length === 0) return true;
    showToast(
      formatToastList(
        header,
        found.map((e) => e.message),
      ),
      'warn',
      8000,
    );
    if (focus && found[0]) focusInvalid(found[0].field);
    return false;
  };

  const onHelp = () => {
    closeMenuForAction();
    setHelpOpen(true);
  };

  const onExport = () => {
    // 入力途中でもバックアップできるよう、エラーは警告のみでエクスポートは続行する
    validateWithWarning({ header: '入力内容に誤りがあります（エクスポートは続行しました）。', focus: false });
    exportResume(form.resume);
  };

  const onImport = async () => {
    const file = await pickJsonFile();
    if (!file) return;
    const data = await readResumeFile(file);
    if (!data) return;
    form.replace(jsonToFormResume(data));
    await saveResume(data);
  };

  const onShowResume = async () => {
    // 入力エラーがあれば警告して表示をブロック（PDF出力はこのモーダルからのみ到達できる）
    if (
      !validateWithWarning({ header: '入力内容に誤りがあります。修正してから履歴書を表示してください。', focus: true })
    ) {
      return;
    }
    // プレビュー使用前にフォントを確実に読み込み
    await lazyLoadNotoFonts();
    closeMenuForAction();
    setPreviewOpen(true);
  };

  const onDelete = () => {
    closeMenuForAction();
    setDeleteOpen(true);
  };

  const onConfirmDelete = async () => {
    await clearResume();
    form.replace(createEmptyResume());
    setDeleteOpen(false);
    showToast('入力内容を削除しました。', 'success', 2500);
  };

  return (
    <>
      <a href="#main" className="skip-link">
        本文へスキップ
      </a>
      <HelpModal show={helpOpen} onHide={() => setHelpOpen(false)} />
      <header>
        <AppNavbar menuOpen={menuOpen} onHelp={onHelp} onMenu={openMenu} />
      </header>
      <AppMenu
        show={menuOpen}
        restoreFocus={restoreMenuFocus}
        onHide={() => setMenuOpen(false)}
        onExited={() => {
          afterMenuClosed.current?.();
          afterMenuClosed.current = null;
        }}
        ready={form.loaded}
        dark={dark}
        onThemeChange={setDark}
        updateStatus={updateStatus}
        onUpdate={requestAppUpdate}
        onHelp={onHelp}
        onExport={onExport}
        onImport={onImport}
        onShowResume={onShowResume}
        onDelete={onDelete}
      />
      <div className="resume">
        <ResumeForm
          form={form}
          contactOpen={contactOpen}
          onContactToggle={setContactOpen}
          onContactEntered={() => {
            afterContactOpened.current?.();
            afterContactOpened.current = null;
          }}
        />
        <DeleteModal show={deleteOpen} onHide={() => setDeleteOpen(false)} onConfirm={onConfirmDelete} />
      </div>
      <ResumeModal show={previewOpen} onHide={() => setPreviewOpen(false)} data={form.state} />
      <ToastContainer />
    </>
  );
}
