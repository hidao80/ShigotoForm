import type { License } from '../models/Resume.ts';
import { escapeHtml } from './escape-html.ts';

/**
 * 免許・資格の1行生成
 * @param {License} [item] - 初期値として設定するLicenseオブジェクト
 * @returns {HTMLDivElement} - 生成された行のHTML要素
 * @throws なし
 * @example
 * const row = createLicenseRow({ ... });
 */
export function createLicenseRow(item?: License): HTMLDivElement {
  const div = document.createElement('div');
  div.className = 'card mb-2';
  div.innerHTML = `
    <div class="card-body row align-items-center" role="group" aria-label="免許・資格の項目">
      <div class="col-auto" style="min-width:120px;">
        <input type="month" class="form-control" name="endDate" placeholder="年月" aria-label="取得年月" toolparamdescription="免許・資格の取得年月。YYYY-MM形式" value="${escapeHtml(item?.date)}" />
      </div>
      <div class="col px-0">
        <input type="text" class="form-control" name="name" placeholder="内容" aria-label="免許・資格の内容" toolparamdescription="免許・資格の名称（学歴・職歴の name とは別の項目）" value="${escapeHtml(item?.name)}" />
      </div>
      <div class="col-auto ps-1 d-flex gap-1 align-items-center">
        <select class="form-select form-select-sm status-select" name="status" style="width:auto;min-width:70px;" aria-label="取得または合格の区分" toolparamdescription="免許・資格の区分。「合格」または「取得」">
          <option value="合格"${item?.pass === '合格' || !item?.pass ? ' selected' : ''}>合格</option>
          <option value="取得"${item?.pass === '取得' ? ' selected' : ''}>取得</option>
        </select>
        <button type="button" class="btn btn-danger btn-sm remove-row" aria-label="この免許・資格を削除">削除</button>
      </div>
    </div>
  `;
  return div;
}
