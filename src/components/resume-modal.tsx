import { useEffect, useRef, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { waitForPreviewFonts } from '../features/lazy-assets.ts';
import { downloadResumePdf } from '../features/pdf-download.ts';
import type { FormState } from '../models/resume-state.ts';
import { type ResumeFontType, ResumePreview } from './resume-preview.tsx';

/** プレビューに表示する文字列（フォントの必要な文字を先読みするため） */
const previewText = (data: FormState) =>
  [
    ...Object.values(data).filter((v): v is string => typeof v === 'string'),
    ...data.career.flatMap((c) => [c.start, c.end, c.name, c.position, c.description]),
    ...data.license.flatMap((l) => [l.date, l.name, l.pass]),
  ].join('');

interface ResumeModalProps {
  show: boolean;
  onHide: () => void;
  data: FormState;
}

/**
 * 履歴書プレビュー（PDF 出力）モーダル。
 */
export function ResumeModal({ show, onHide, data }: ResumeModalProps) {
  const [fontType, setFontType] = useState<ResumeFontType>('gothic');
  const contentRef = useRef<HTMLDivElement>(null);

  // 表示と同時に Web フォントの読み込みを始める（表示は swap で先に出るので待たせない）。ダウンロード時には通常すでに完了している
  useEffect(() => {
    if (show) waitForPreviewFonts(fontType, previewText(data));
  }, [show, fontType, data]);

  const onDownload = async () => {
    const preview = contentRef.current?.querySelector<HTMLElement>('.resume-preview');
    if (!preview) return;
    // 表示は swap で先に出ているが、PDF は代替フォントで撮らないよう、Web フォントの読み込み完了を待つ
    await waitForPreviewFonts(fontType, preview.textContent ?? '');
    await downloadResumePdf(preview, data);
  };

  return (
    <Modal show={show} onHide={onHide} fullscreen id="resumeModal" aria-labelledby="resumeModalLabel">
      <Modal.Header closeButton closeLabel="閉じる">
        <Modal.Title as="h2" className="fs-5" id="resumeModalLabel">
          履歴書プレビュー
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex justify-content-center align-items-center">
        <div
          id="resume-modal-content"
          ref={contentRef}
          className="w-100 d-flex justify-content-center"
          style={{ paddingTop: '500px' }}
        >
          <ResumePreview data={data} fontType={fontType} />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="font-switcher">
          <label className="me-2" htmlFor="font-select">
            フォント:
          </label>
          <select
            id="font-select"
            className="form-select form-select-sm d-inline-block"
            style={{ width: 'auto' }}
            aria-controls="resume-modal-content"
            value={fontType}
            onChange={(e) => setFontType(e.target.value as ResumeFontType)}
          >
            <option value="gothic">ゴシック体</option>
            <option value="mincho">明朝体</option>
          </select>
        </div>
        <Button id="download-resume-html" variant="primary" onClick={onDownload}>
          履歴書PDFダウンロード
        </Button>
        <Button type="button" variant="secondary" onClick={onHide}>
          閉じる
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
