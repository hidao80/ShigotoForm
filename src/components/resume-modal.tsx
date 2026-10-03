import { useRef, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { downloadResumePdf } from '../features/pdf-download.ts';
import type { FormState } from '../models/resume-state.ts';
import { type ResumeFontType, ResumePreview } from './resume-preview.tsx';

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

  const onDownload = async () => {
    const preview = contentRef.current?.querySelector<HTMLElement>('.resume-preview');
    if (preview) await downloadResumePdf(preview, data);
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
