import html2pdf from 'html2pdf.js';

/**
 * 履歴書プレビュー要素を PDF として保存します。
 * @param {HTMLElement} preview - PDF 化する `.resume-preview` 要素
 * @param {{ createdAt: string; fullname: string }} meta - ファイル名に使う作成日・氏名
 * @returns {Promise<void>}
 * @throws html2pdf の描画・保存エラー
 * @example
 * await downloadResumePdf(previewEl, { createdAt: '2026-10-03', fullname: '山田 太郎' });
 */
export async function downloadResumePdf(preview: HTMLElement, meta: { createdAt: string; fullname: string }) {
  const date = (meta.createdAt || '').replace(/-/g, '');
  const name = meta.fullname || '';
  // 背景色の斑を防ぐためのオプション設定
  const opt = {
    margin: 0,
    filename: `履歴書_${name}_${date}.pdf`,
    image: {
      type: 'jpeg' as const,
      quality: 1.0, // 品質を最大に
    },
    html2canvas: {
      scale: 3, // スケールを上げて解像度向上
      useCORS: true,
      allowTaint: true,
      width: Math.round((212 * 96) / 25.4), // 212mm × 96dpi ÷ 25.4
      height: Math.round((299 * 96) / 25.4), // 299mm × 96dpi ÷ 25.4
      dpi: 192, // DPIを192に設定
      letterRendering: true, // 文字レンダリング改善
      removeContainer: true, // コンテナ削除
      foreignObjectRendering: false, // SVG関連の問題回避
      onclone: (clonedDoc: Document) => {
        // クローンされたドキュメントでテーブル線幅を調整
        clonedDoc.body.style.backgroundColor = '#fff'; // 背景色を白に設定
        clonedDoc.body.style.color = '#000'; // 文字色を黒に設定
        const tables = clonedDoc.querySelectorAll('table, th, td, tr');
        for (const el of tables) {
          const style = (el as HTMLElement).style;
          style.border = '0.1px solid #ddd'; // 極細の線幅
          style.backgroundColor = '#fff'; // 背景色を白に
          style.color = '#000'; // 文字色を黒に
        }
      },
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4',
      orientation: 'portrait' as const,
      putOnlyUsedFonts: true,
      compress: false, // 圧縮無効で品質保持
    },
  };
  await html2pdf().set(opt).from(preview).save();
}
