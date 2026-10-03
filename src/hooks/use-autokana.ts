import { bind } from '@j1nn0/vanilla-autokana';
import { useEffect, useRef } from 'react';

/**
 * 氏名入力欄から、ふりがなを自動入力します（@j1nn0/vanilla-autokana）。
 * ライブラリは氏名欄の入力・IME（composition）イベントを購読し、ふりがなが変わるたびに `onChange` を呼ぶ
 * （タイマーによる監視はしない）。フォーカス時には、ふりがな欄の現在値を起点にして続きから入力する。
 * 制御コンポーネントのふりがな欄へはライブラリが `value` を直接書き込むが、React は `onChange` の
 * コールバック経由の state 更新で値を持つため、書き込みの結果は state と一致する。
 * @param {string} nameId - 氏名の入力欄の id
 * @param {string} kanaId - ふりがなの入力欄の id
 * @param {(value: string) => void} onChange - ふりがなの更新
 * @returns {void}
 * @throws なし
 */
export function useAutoKana(nameId: string, kanaId: string, onChange: (value: string) => void) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const nameEl = document.getElementById(nameId);
    const kanaEl = document.getElementById(kanaId);
    if (!(nameEl instanceof HTMLInputElement) || !(kanaEl instanceof HTMLInputElement)) return;
    const autoKana = bind(nameEl, kanaEl, {
      onChange: (value) => {
        // ブラウザの自動入力やプログラムによる氏名の書き換え（フォーカスのない input イベント）では、
        // ユーザーが入力したふりがなを上書きしない。氏名欄を編集している間だけ反映する
        if (document.activeElement === nameEl) onChangeRef.current(value);
      },
    });
    // StrictMode の再実行でもリスナーが二重にならないよう、必ず解除する
    return () => autoKana.destroy();
  }, [nameId, kanaId]);
}
