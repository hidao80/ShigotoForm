import { Button, Form } from 'react-bootstrap';
import type { License } from '../models/Resume.ts';
import type { Keyed } from '../models/resume-state.ts';
import { SortableRow } from './sortable-list.tsx';

interface LicenseRowProps {
  row: Keyed<License>;
  onChange: (patch: Partial<License>) => void;
  onRemove: () => void;
}

/**
 * 免許・資格の 1 行。
 */
export function LicenseRow({ row, onChange, onRemove }: LicenseRowProps) {
  return (
    <SortableRow id={row.id} label="免許・資格" bodyClassName="row align-items-center">
      <div className="col-auto" style={{ minWidth: '120px' }}>
        <Form.Control
          type="month"
          name="endDate"
          placeholder="年月"
          aria-label="取得年月"
          toolparamdescription="免許・資格の取得年月。YYYY-MM形式"
          value={row.date}
          onChange={(e) => onChange({ date: e.target.value })}
        />
      </div>
      <div className="col px-0">
        <Form.Control
          type="text"
          name="name"
          placeholder="内容"
          aria-label="免許・資格の内容"
          toolparamdescription="免許・資格の名称（学歴・職歴の name とは別の項目）"
          value={row.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="col-auto ps-1 d-flex gap-1 align-items-center">
        <Form.Select
          size="sm"
          className="status-select"
          name="status"
          style={{ width: 'auto', minWidth: '70px' }}
          aria-label="取得または合格の区分"
          toolparamdescription="免許・資格の区分。「合格」または「取得」"
          value={row.pass}
          onChange={(e) => onChange({ pass: e.target.value })}
        >
          <option value="合格">合格</option>
          <option value="取得">取得</option>
        </Form.Select>
        <Button
          type="button"
          variant="danger"
          size="sm"
          className="remove-row"
          aria-label="この免許・資格を削除"
          onClick={onRemove}
        >
          削除
        </Button>
      </div>
    </SortableRow>
  );
}
