/**
 * 入力内容の削除確認モーダルのHTMLを生成します。
 * @returns {string} HTML文字列
 */
export function confirmDeleteModalHtml(): string {
  return `
  <div class="modal fade" id="confirmDeleteModal" tabindex="-1" aria-labelledby="confirmDeleteModalLabel" aria-describedby="confirmDeleteModalBody" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="confirmDeleteModalLabel">入力内容の削除</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button>
      </div>
        <div class="modal-body" id="confirmDeleteModalBody">
          入力内容を削除します。よろしいですか？
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">キャンセル</button>
          <button type="button" class="btn btn-danger" id="confirm-delete">削除</button>
        </div>
      </div>
    </div>
  </div>
`;
}
