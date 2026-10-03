import { bind } from '@j1nn0/vanilla-autokana';
import { useEffect, useRef } from 'react';

/** ふりがなとして意味のある文字（ひらがな）を含むか。ふりがなの検証（FIELD_PATTERNS.furigana）と同じ基準 */
const hasKana = (value: string) => /[ぁ-ゟ]/.test(value);

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
    // 最後に反映したふりがな。氏名欄にフォーカスしたときに、ふりがな欄の現在値から始める
    let accepted = kanaEl.value;
    const seedAccepted = () => {
      accepted = kanaEl.value;
    };
    nameEl.addEventListener('focus', seedAccepted);
    const autoKana = bind(nameEl, kanaEl, {
      onChange: (value) => {
        // ブラウザの自動入力やプログラムによる氏名の書き換え（フォーカスのない input イベント）では、
        // ユーザーが入力したふりがなを上書きしない。氏名欄を編集している間だけ反映する
        if (document.activeElement !== nameEl) return;
        // 貼り付けやキーボードの候補などで、かなに変換できない氏名（漢字など）がまとめて入る入力では、
        // ライブラリは入力済みのふりがなを空白だけに上書きしてしまう。氏名があるのにかなが無くなる更新は取り消し、
        // ふりがな欄を元に戻して、現在の氏名・ふりがなを起点にライブラリを再同期する（focus と同じ処理）
        if (!hasKana(value) && nameEl.value !== '' && hasKana(accepted)) {
          kanaEl.value = accepted;
          nameEl.dispatchEvent(new Event('focus'));
          return;
        }
        accepted = value;
        // 状態更新は次のタスクへ遅延させる。ライブラリのリスナーは React のリスナー（root）より先に実行され、
        // 実機の入力ではその間にマイクロタスクが走るため、同期で更新すると氏名欄の state が古いまま再描画され、
        // IME 変換中の氏名欄の値が空に戻されて入力できなくなる（スマホ・タブレット）
        setTimeout(() => onChangeRef.current(value));
      },
    });
    // StrictMode の再実行でもリスナーが二重にならないよう、必ず解除する
    return () => {
      nameEl.removeEventListener('focus', seedAccepted);
      autoKana.destroy();
    };
  }, [nameId, kanaId]);
}
