import { useEffect, useRef } from 'react';
import * as AutoKana from 'vanilla-autokana';

const PROXY_ID = 'sf-autokana-proxy';

/**
 * 氏名入力欄から、ふりがなを自動入力します（vanilla-autokana）。
 * vanilla-autokana はタイマーで氏名を監視し、ふりがな欄の `value` へ直接書き込む（イベントを発火しない）。
 * 制御コンポーネントの入力欄は DOM への直接書き込みを state に反映できないため、`value` を横取りする
 * 非表示の input をふりがな欄の代わりに渡し、書き込みを state の更新（onChange）へ変換する。
 * （配布版の vanilla-autokana は要素ではなく id 文字列でしか受け付けないため、proxy も DOM に置く）
 * @param {string} nameId - 氏名の入力欄の id
 * @param {string} kana - 現在のふりがな（state）
 * @param {(value: string) => void} onChange - ふりがなの更新
 * @returns {void}
 * @throws なし
 */
export function useAutoKana(nameId: string, kana: string, onChange: (value: string) => void) {
  const kanaRef = useRef(kana);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    kanaRef.current = kana;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const proxy = document.createElement('input');
    proxy.id = PROXY_ID;
    proxy.type = 'hidden';
    Object.defineProperty(proxy, 'value', {
      configurable: true,
      get: () => kanaRef.current,
      set: (value: string) => {
        // 氏名が空のときも 30ms ごとに同じ値が書き込まれるため、変化したときだけ state を更新する
        if (value === kanaRef.current) return;
        kanaRef.current = value;
        onChangeRef.current(value);
      },
    });
    document.body.append(proxy);
    const autoKana = AutoKana.bind(`#${nameId}`, `#${PROXY_ID}`);
    return () => {
      // バインド解除の API は無いため、停止して書き込みを無効化する（StrictMode の再実行でも二重に書き込まない）
      autoKana.stop();
      proxy.remove();
    };
  }, [nameId]);
}
