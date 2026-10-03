import { afterEach, describe, expect, test, vi } from 'vitest';
import { confirmDeleteModalHtml } from '../../../src/components/confirm-delete-modal.ts';
import { helpModalHtml } from '../../../src/components/help-modal.ts';
import { navbarHtml } from '../../../src/components/navbar.ts';
import { offcanvasMenuHtml } from '../../../src/components/offcanvas-menu.ts';
import { resumeFormHtml } from '../../../src/components/resume-form.ts';
import { resumeModalHtml } from '../../../src/components/resume-modal.ts';
import { showToast } from '../../../src/components/toast.ts';

const parse = (html: string) => {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host;
};

describe('テンプレートコンポーネント', () => {
  test.each([
    ['helpModalHtml', helpModalHtml, ['#helpModal', '#helpModalLabel']],
    ['navbarHtml', navbarHtml, ['nav.navbar', '#help-modal-btn']],
    [
      'offcanvasMenuHtml',
      offcanvasMenuHtml,
      ['#offcanvasNavbar', '#theme-switch', '#backup-button', '#delete-content'],
    ],
    ['resumeFormHtml', resumeFormHtml, ['#main', 'form[toolname]', '#career-history', '#license-history']],
    ['confirmDeleteModalHtml', confirmDeleteModalHtml, ['#confirmDeleteModal', '#confirm-delete']],
    ['resumeModalHtml', resumeModalHtml, ['#resumeModal', '#font-select', '#download-resume-html']],
  ])('%s は必要な要素を含む', (_name, render, selectors) => {
    const host = parse(render());
    for (const selector of selectors) expect(host.querySelector(selector), selector).not.toBeNull();
  });

  test('各テンプレートの id は重複しない', () => {
    const html = [
      helpModalHtml(),
      navbarHtml(),
      offcanvasMenuHtml(),
      resumeFormHtml(),
      confirmDeleteModalHtml(),
      resumeModalHtml(),
    ].join('');
    const ids = [...parse(html).querySelectorAll('[id]')].map((e) => e.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });
});

describe('showToast', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  test('コンテナは role=status / aria-live=polite で、error のみ role=alert になる', () => {
    showToast('ok', 'success');
    showToast('ng', 'error');
    const container = document.getElementById('sf-toast-container');
    expect(container?.getAttribute('role')).toBe('status');
    expect(container?.getAttribute('aria-live')).toBe('polite');
    const toasts = container?.querySelectorAll('.sf-toast');
    expect(toasts?.[0].getAttribute('role')).toBeNull();
    expect(toasts?.[1].getAttribute('role')).toBe('alert');
  });

  test('ttl 経過で消え、返り値の関数で即時に消せる', () => {
    vi.useFakeTimers();
    showToast('a', 'info', 1000);
    const dismiss = showToast('b', 'info', 10_000);
    expect(document.querySelectorAll('.sf-toast')).toHaveLength(2);
    vi.advanceTimersByTime(1000);
    expect(document.querySelectorAll('.sf-toast')).toHaveLength(1);
    dismiss();
    expect(document.querySelectorAll('.sf-toast')).toHaveLength(0);
  });
});
