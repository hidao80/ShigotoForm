/**
 * name を持つコントロールのうち、toolparamdescription（WebMCP の宣言的アノテーション）が無いものの name を返す。
 * E2E（app.test.ts）とコンポーネントテスト（resume-form.test.tsx）で共有する。
 */
export const controlsMissingToolParam = (form: HTMLFormElement): string[] =>
  [...form.elements]
    .filter((el) => (el as HTMLInputElement).name)
    .filter((el) => !el.getAttribute('toolparamdescription'))
    .map((el) => (el as HTMLInputElement).name);
