import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  type Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';
import { Card } from 'react-bootstrap';

/** 縦方向にだけ動かす（横にはみ出して見えないように） */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

interface SortableListProps {
  /** 行の id（表示順）。DndContext の識別と読み上げの位置の算出に使う */
  ids: string[];
  /** 一覧の名前（読み上げに使う。例: 学歴・職歴） */
  label: string;
  /** activeId の行を overId の行の位置へ移す */
  onMove: (activeId: string, overId: string) => void;
  children: ReactNode;
}

/**
 * 行をドラッグ＆ドロップで並べ替えられる一覧。
 * マウス・タッチ・キーボード（ハンドルにフォーカス → Space で持ち上げ → ↑↓ で移動 → Space で確定、Esc で取り消し）に対応する。
 * 並べ替えの結果は onMove で受け取り、表示順は呼び出し側の state を正とする。
 */
export function SortableList({ ids, label, onMove, children }: SortableListProps) {
  const sensors = useSensors(
    // クリックでは始まらないよう、少し動かしてからドラッグとみなす
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const position = (id: string | number) => ids.indexOf(String(id)) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `${label}の${position(active.id)}番目をつかみました。`,
    onDragOver: ({ over }) => (over ? `${position(over.id)}番目の位置に移動しています。` : '移動先がありません。'),
    onDragEnd: ({ over }) => (over ? `${label}を${position(over.id)}番目に移動しました。` : '元の位置に戻しました。'),
    onDragCancel: () => '移動を取り消しました。元の位置に戻しました。',
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over) onMove(String(active.id), String(over.id));
  };

  return (
    <DndContext
      id={`sortable-${label}`}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            '並べ替えるには、スペースキーで項目をつかみ、上下の矢印キーで移動し、スペースキーで確定します。Escキーで取り消せます。',
        },
      }}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="list-unstyled mb-0">{children}</ul>
      </SortableContext>
    </DndContext>
  );
}

interface SortableRowProps {
  id: string;
  /** 項目の名前（ハンドルのラベルに使う。例: 学歴・職歴） */
  label: string;
  /** Card.Body に付けるクラス */
  bodyClassName: string;
  children: ReactNode;
}

/**
 * 並べ替えできる 1 行。右端にドラッグ用のハンドルを置く。
 * ドラッグを始められるのはハンドルだけなので、入力欄の操作（文字の選択など）とは干渉しない。
 */
export function SortableRow({ id, label, bodyClassName, children }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, index } =
    useSortable({
      id,
      // 既定の aria-roledescription は英語の "sortable"
      attributes: { roleDescription: '並べ替え可能' },
    });

  return (
    <Card
      as="li"
      ref={setNodeRef}
      className={`mb-2${isDragging ? ' shadow border-primary' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 1 : undefined }}
    >
      <Card.Body className={bodyClassName} role="group" aria-label={`${label}の${index + 1}番目`}>
        {children}
        <div className="col-auto ps-1 ms-auto">
          <button
            type="button"
            ref={setActivatorNodeRef}
            className="drag-handle btn btn-link text-secondary p-1 lh-1"
            aria-label={`${label}の項目を並べ替え`}
            // ハンドルの上ではブラウザのスクロールにせず、タッチでもドラッグできるようにする
            style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
            {...attributes}
            {...listeners}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>
        </div>
      </Card.Body>
    </Card>
  );
}
