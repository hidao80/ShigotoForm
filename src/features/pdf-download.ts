import html2pdf from 'html2pdf.js';
import { loadResume } from '../db.ts';

/**
 * プレビューモーダル内「履歴書PDFダウンロード」ボタンのイベントを設定します。
 * @returns {void}
 * @throws なし
 */
export function setupPdfDownload() {
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
            quality: 1.0, // 品質を最大に
          },
          html2canvas: {
            scale: 3, // スケールを上げて解像度向上
            // backgroundColor: '#ffffff',  // 明示的に白背景設定
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

        try {
          // 少し待ってからPDF生成（レンダリング完了を待つ）
          // await new Promise(resolve => setTimeout(resolve, 100));
          await html2pdf().set(opt).from(preview).save();
        } finally {
        }
      }
    }
  });
}
