import { Button, Card, Form } from 'react-bootstrap';
import type { Career } from '../models/Resume.ts';

interface CareerRowProps {
  row: Career;
  onChange: (patch: Partial<Career>) => void;
  onRemove: () => void;
}

/**
 * 学歴・職歴の 1 行。
 */
export function CareerRow({ row, onChange, onRemove }: CareerRowProps) {
  return (
    <Card className="mb-2">
      <Card.Body className="row align-items-center flex-nowrap" role="group" aria-label="学歴・職歴の項目">
        <div className="col-auto d-flex align-items-center gap-1" style={{ minWidth: '264px' }}>
          <Form.Control
            type="month"
            name="start"
            placeholder="開始年月"
            aria-label="開始年月"
            toolparamdescription="学歴・職歴の開始年月。YYYY-MM形式"
            value={row.start}
            onChange={(e) => onChange({ start: e.target.value })}
            style={{ width: '120px' }}
          />
          <span aria-hidden="true">～</span>
          <Form.Control
            type="month"
            name="end"
            placeholder="終了年月"
            aria-label="終了年月"
            toolparamdescription="学歴・職歴の終了年月。YYYY-MM形式。在籍中は空欄"
            value={row.end}
            onChange={(e) => onChange({ end: e.target.value })}
            style={{ width: '120px' }}
          />
        </div>
        <div className="col px-0">
          <Form.Control
            type="text"
            name="name"
            placeholder="会社・学校名"
            aria-label="会社・学校名"
            toolparamdescription="学歴・職歴の会社名または学校名"
            value={row.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className="col px-0">
          <Form.Control
            type="text"
            name="position"
            placeholder="役職・学科"
            aria-label="役職・学科"
            toolparamdescription="学歴・職歴の役職または学科"
            value={row.position}
            onChange={(e) => onChange({ position: e.target.value })}
          />
        </div>
        <div className="col px-0">
          <Form.Control
            type="text"
            name="description"
            placeholder="説明"
            aria-label="説明"
            toolparamdescription="学歴・職歴の補足説明。不要なら空欄"
            value={row.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
        <div className="col-auto ps-1">
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="remove-row"
            aria-label="この学歴・職歴を削除"
            onClick={onRemove}
          >
            削除
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
