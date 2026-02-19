/**
 * html2pdf.js の型定義
 * 公式 @types パッケージが存在しないため独自宣言
 */
declare module 'html2pdf.js' {
  interface Html2PdfImageOptions {
    type?: 'jpeg' | 'png' | 'webp';
    quality?: number;
  }

  interface Html2PdfHtml2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    allowTaint?: boolean;
    width?: number;
    height?: number;
    dpi?: number;
    letterRendering?: boolean;
    removeContainer?: boolean;
    foreignObjectRendering?: boolean;
    onclone?: (clonedDoc: Document) => void;
    backgroundColor?: string | null;
  }

  interface Html2PdfJsPDFOptions {
    unit?: 'pt' | 'mm' | 'cm' | 'in' | 'px';
    format?: 'a4' | 'a3' | 'letter' | string | number[];
    orientation?: 'portrait' | 'landscape';
    putOnlyUsedFonts?: boolean;
    compress?: boolean;
  }

  interface Html2PdfOptions {
    margin?: number | [number, number] | [number, number, number, number];
    filename?: string;
    image?: Html2PdfImageOptions;
    html2canvas?: Html2PdfHtml2CanvasOptions;
    jsPDF?: Html2PdfJsPDFOptions;
    pagebreak?: Record<string, unknown>;
  }

  interface Html2PdfChain {
    set(options: Html2PdfOptions): Html2PdfChain;
    from(element: HTMLElement | string): Html2PdfChain;
    save(): Promise<void>;
    output(type: string, options?: Record<string, unknown>): Promise<unknown>;
    outputPdf(type?: string): Promise<unknown>;
    toContainer(): Html2PdfChain;
    toCanvas(): Html2PdfChain;
    toImg(): Html2PdfChain;
    toPdf(): Html2PdfChain;
  }

  function html2pdf(): Html2PdfChain;
  function html2pdf(element: HTMLElement, options?: Html2PdfOptions): Html2PdfChain;

  export default html2pdf;
}
