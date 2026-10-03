import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AppMenu } from '../../../src/components/app-menu.tsx';
import { AppNavbar } from '../../../src/components/app-navbar.tsx';
import { DeleteModal } from '../../../src/components/delete-modal.tsx';
import { HelpModal } from '../../../src/components/help-modal.tsx';
import { ResumeModal } from '../../../src/components/resume-modal.tsx';
import { fromResume } from '../../../src/models/resume-state.ts';
import { sample } from '../fixtures.ts';

const downloadResumePdf = vi.hoisted(() => vi.fn());
vi.mock('../../../src/features/pdf-download.ts', () => ({ downloadResumePdf }));

beforeEach(() => {
  // react-bootstrap の Offcanvas は matchMedia を参照する（jsdom には無い）
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  });
  document.documentElement.classList.remove('icons-loaded');
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const menuProps = () => ({
  show: false,
  restoreFocus: true,
  onHide: vi.fn(),
  onExited: vi.fn(),
  ready: true,
  dark: false,
  onThemeChange: vi.fn(),
  updateStatus: '',
  onUpdate: vi.fn(),
  onHelp: vi.fn(),
  onExport: vi.fn(),
  onImport: vi.fn(),
  onShowResume: vi.fn(),
  onDelete: vi.fn(),
});

describe('AppNavbar', () => {
  test('ナビゲーション・ヘルプ・メニューのボタンを描画し、メニューの開閉状態を aria-expanded で伝える', () => {
    const onHelp = vi.fn();
    const onMenu = vi.fn();
    const { rerender } = render(<AppNavbar menuOpen={false} onHelp={onHelp} onMenu={onMenu} />);
    expect(document.querySelector('nav.navbar')).not.toBeNull();
    expect(document.getElementById('version-no')?.textContent).toMatch(/\d/);
    const toggler = screen.getByRole('button', { name: 'メニュー' });
    expect(toggler.getAttribute('aria-expanded')).toBe('false');
    expect(toggler.getAttribute('aria-controls')).toBe('offcanvasNavbar');
    fireEvent.click(toggler);
    expect(onMenu).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'ヘルプ' }));
    expect(onHelp).toHaveBeenCalledOnce();
    rerender(<AppNavbar menuOpen onHelp={onHelp} onMenu={onMenu} />);
    expect(toggler.getAttribute('aria-expanded')).toBe('true');
  });

  test.each(['pointerOver', 'focus'] as const)('ヘルプボタンの %s でアイコンを先読みする', async (eventName) => {
    // lazyLoadIcons はモジュール内で一度きりのため、テストごとにモジュールを読み直す
    vi.resetModules();
    const { AppNavbar: FreshNavbar } = await import('../../../src/components/app-navbar.tsx');
    render(<FreshNavbar menuOpen={false} onHelp={vi.fn()} onMenu={vi.fn()} />);
    expect(document.documentElement.classList.contains('icons-loaded')).toBe(false);
    fireEvent[eventName](document.getElementById('help-modal-btn') as HTMLElement);
    await waitFor(() => expect(document.documentElement.classList.contains('icons-loaded')).toBe(true));
  });
});

describe('AppMenu', () => {
  test('閉じていても操作ボタンが DOM に残る（renderStaticNode）', () => {
    render(<AppMenu {...menuProps()} />);
    for (const id of [
      'offcanvasNavbar',
      'help-modal-in-menu-btn',
      'pwa-update-link',
      'pwa-update-status',
      'theme-switch',
      'backup-button',
      'upload-button',
      'show-resume',
      'delete-content',
    ]) {
      expect(document.getElementById(id), id).not.toBeNull();
    }
    expect(document.getElementById('offcanvasNavbar')?.classList.contains('show')).toBe(false);
  });

  test('ボタンのクリックで対応するハンドラを呼ぶ', () => {
    const props = menuProps();
    render(<AppMenu {...props} />);
    const click = (id: string) => fireEvent.click(document.getElementById(id) as HTMLElement);
    click('backup-button');
    click('upload-button');
    click('show-resume');
    click('delete-content');
    click('pwa-update-link');
    click('help-modal-in-menu-btn');
    expect(props.onExport).toHaveBeenCalledOnce();
    expect(props.onImport).toHaveBeenCalledOnce();
    expect(props.onShowResume).toHaveBeenCalledOnce();
    expect(props.onDelete).toHaveBeenCalledOnce();
    expect(props.onUpdate).toHaveBeenCalledOnce();
    expect(props.onHelp).toHaveBeenCalledOnce();
  });

  test('保存データの復元が終わるまで「履歴書を表示」は無効', () => {
    const { rerender } = render(<AppMenu {...menuProps()} ready={false} />);
    expect((document.getElementById('show-resume') as HTMLButtonElement).disabled).toBe(true);
    rerender(<AppMenu {...menuProps()} ready />);
    expect((document.getElementById('show-resume') as HTMLButtonElement).disabled).toBe(false);
  });

  test('ダークモードのスイッチと更新状態の表示', () => {
    const props = menuProps();
    const { rerender } = render(<AppMenu {...props} />);
    const sw = document.getElementById('theme-switch') as HTMLInputElement;
    expect(sw.checked).toBe(false);
    fireEvent.click(sw);
    expect(props.onThemeChange).toHaveBeenCalledWith(true);
    rerender(<AppMenu {...props} dark updateStatus="新しいバージョンがあります" />);
    expect((document.getElementById('theme-switch') as HTMLInputElement).checked).toBe(true);
    const status = document.getElementById('pwa-update-status');
    expect(status?.textContent).toBe('新しいバージョンがあります');
    expect(status?.getAttribute('role')).toBe('status');
  });
});

describe('モーダル', () => {
  test('HelpModal は表示中だけ描画し、閉じるボタンで onHide を呼ぶ', () => {
    const onHide = vi.fn();
    const { rerender } = render(<HelpModal show={false} onHide={onHide} />);
    expect(document.getElementById('helpModalLabel')).toBeNull();
    rerender(<HelpModal show onHide={onHide} />);
    expect(document.getElementById('helpModalLabel')?.textContent).toBe('ヘルプ');
    expect(document.getElementById('helpModal')?.closest('.modal')?.getAttribute('aria-labelledby')).toBe(
      'helpModalLabel',
    );
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(onHide).toHaveBeenCalled();
  });

  test('DeleteModal は説明を aria-describedby で関連づけ、キャンセル・削除を呼び分ける', () => {
    const onHide = vi.fn();
    const onConfirm = vi.fn();
    render(<DeleteModal show onHide={onHide} onConfirm={onConfirm} />);
    const modal = document.getElementById('confirmDeleteModal')?.closest('.modal');
    expect(modal?.getAttribute('aria-describedby')).toBe('confirmDeleteModalBody');
    expect(document.getElementById('confirmDeleteModalBody')?.textContent).toContain('よろしいですか');
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(onHide).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(document.getElementById('confirm-delete') as HTMLElement);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  test('ResumeModal はプレビューを描画し、フォント切替とPDFダウンロードができる', async () => {
    render(<ResumeModal show onHide={vi.fn()} data={fromResume(sample())} />);
    const preview = () => document.querySelector('#resume-modal-content .resume-preview') as HTMLElement;
    expect(preview().classList.contains('font-gothic')).toBe(true);
    expect(preview().textContent).toContain('山田 太郎');
    fireEvent.change(document.getElementById('font-select') as HTMLSelectElement, { target: { value: 'mincho' } });
    expect(preview().classList.contains('font-mincho')).toBe(true);
    fireEvent.click(document.getElementById('download-resume-html') as HTMLElement);
    await waitFor(() => expect(downloadResumePdf).toHaveBeenCalledOnce());
    expect(downloadResumePdf).toHaveBeenCalledWith(
      preview(),
      expect.objectContaining({ createdAt: '2026-10-03', fullname: '山田 太郎' }),
    );
  });

  test('PDF ダウンロードは Web フォントの読み込み完了を待ってから始める（代替フォントで撮らない）', async () => {
    let finish: () => void = () => {};
    const load = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    Object.defineProperty(document, 'fonts', { configurable: true, value: { load } });
    try {
      render(<ResumeModal show onHide={vi.fn()} data={fromResume(sample())} />);
      // 表示と同時に、表示する文字列でフォントの読み込みを始める
      await waitFor(() => expect(load).toHaveBeenCalledWith('400 1em "Noto Sans JP"', expect.stringContaining('山田')));
      fireEvent.click(document.getElementById('download-resume-html') as HTMLElement);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(downloadResumePdf).not.toHaveBeenCalled();
      finish();
      await waitFor(() => expect(downloadResumePdf).toHaveBeenCalledOnce());
    } finally {
      Reflect.deleteProperty(document, 'fonts');
    }
  });

  test('開いているモーダル・メニューの id は重複しない', () => {
    render(
      <>
        <AppNavbar menuOpen={false} onHelp={vi.fn()} onMenu={vi.fn()} />
        <AppMenu {...menuProps()} />
        <HelpModal show onHide={vi.fn()} />
        <DeleteModal show onHide={vi.fn()} onConfirm={vi.fn()} />
        <ResumeModal show onHide={vi.fn()} data={fromResume(sample())} />
      </>,
    );
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });
});
