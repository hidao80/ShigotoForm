/**
 * 履歴書プレビュー（PDF出力）モーダルのHTMLを生成します。
 * @returns {string} HTML文字列
 */
export function resumeModalHtml(): string {
  return `
<div class="modal fade" id="resumeModal" tabindex="-1" aria-labelledby="resumeModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title fs-5" id="resumeModalLabel">履歴書プレビュー</h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button>
      </div>
      <div class="modal-body d-flex justify-content-center align-items-center">
        <div id="resume-modal-content" class="w-100 d-flex justify-content-center" style="padding-top:500px;"></div>
      </div>
      <div class="modal-footer">
        <div class="font-switcher">
          <label class="me-2" for="font-select">フォント:</label>
          <select id="font-select" class="form-select form-select-sm d-inline-block" style="width:auto;" aria-controls="resume-modal-content">
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
}
