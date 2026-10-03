import type { Career } from '../models/Resume.ts';
import { escapeHtml } from './escape-html.ts';

/**
 * 学歴・職歴の1行生成
 * @param {Career} [item] - 初期値として設定するCareerオブジェクト
 * @returns {HTMLDivElement} - 生成された行のHTML要素
 * @throws なし
 * @example
 * const row = createCareerRow({ ... });
 */
export function createCareerRow(item?: Career): HTMLDivElement {
  const div = document.createElement('div');
  div.className = 'card mb-2';
  div.innerHTML = `
    <div class="card-body row align-items-center flex-nowrap" role="group" aria-label="学歴・職歴の項目">
      <div class="col-auto d-flex align-items-center gap-1" style="min-width:264px;">
        <input type="month" class="form-control" name="start" placeholder="開始年月" aria-label="開始年月" toolparamdescription="学歴・職歴の開始年月。YYYY-MM形式" value="${escapeHtml(item?.start)}" style="width:120px;" />
        <span aria-hidden="true">～</span>
        <input type="month" class="form-control" name="end" placeholder="終了年月" aria-label="終了年月" toolparamdescription="学歴・職歴の終了年月。YYYY-MM形式。在籍中は空欄" value="${escapeHtml(item?.end)}" style="width:120px;" />
      </div>
      <div class="col px-0">
        <input type="text" class="form-control" name="name" placeholder="会社・学校名" aria-label="会社・学校名" toolparamdescription="学歴・職歴の会社名または学校名" value="${escapeHtml(item?.name)}" />
      </div>
      <div class="col px-0">
        <input type="text" class="form-control" name="position" placeholder="役職・学科" aria-label="役職・学科" toolparamdescription="学歴・職歴の役職または学科" value="${escapeHtml(item?.position)}" />
      </div>
      <div class="col px-0">
        <input type="text" class="form-control" name="description" placeholder="説明" aria-label="説明" toolparamdescription="学歴・職歴の補足説明。不要なら空欄" value="${escapeHtml(item?.description)}" />
      </div>
      <div class="col-auto ps-1">
        <button type="button" class="btn btn-danger btn-sm remove-row" aria-label="この学歴・職歴を削除">削除</button>
      </div>
    </div>
  `;
  return div;
}
