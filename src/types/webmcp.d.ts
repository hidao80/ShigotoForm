import 'react';

/**
 * WebMCP の宣言的アノテーション（toolname / tooldescription / toolparamdescription）を JSX で使えるようにする型拡張。
 * React 19 は未知の小文字属性をそのまま DOM へ出力する。
 */
declare module 'react' {
  interface FormHTMLAttributes<T> {
    toolname?: string;
    tooldescription?: string;
  }
  interface HTMLAttributes<T> {
    toolparamdescription?: string;
  }
}
