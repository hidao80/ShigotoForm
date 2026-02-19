/**
 * 職歴情報を表すインターフェース
 */
export interface Career {
  start: string; // 開始年月
  end: string; // 終了年月
  name: string; // 会社・学校名
  position: string; // 役職・学年
  description: string; // 詳細説明
  startDate?: string;
  endDate?: string;
}

/**
 * 免許・資格情報を表すインターフェース
 */
export interface License {
  date: string; // 取得年月
  name: string; // 資格名
  pass: string; // 合格・取得
}

/**
 * 履歴書全体のデータ構造
 */
export interface Resume {
  createdAt: string; // 作成日
  fullname: string; // 氏名
  fullnameKana: string; // 氏名ふりがな
  birthday: string; // 生年月日
  sex: string; // 性別
  zipCode: string; // 郵便番号
  address1: string; // 住所1
  address2: string; // 住所2
  tel1: string; // 電話番号1
  tel2: string; // 電話番号2
  mail1: string; // メールアドレス1
  mail2: string; // メールアドレス2
  career: Career[]; // 職歴
  license: License[]; // 免許・資格
}

/**
 * 空の履歴書データを生成します。
 * @returns {Resume} 空のResumeオブジェクト
 * @throws なし
 * @example
 * const resume = createEmptyResume();
 */
export function createEmptyResume(): Resume {
  return {
    createdAt: '',
    fullname: '',
    fullnameKana: '',
    birthday: '',
    sex: '',
    zipCode: '',
    address1: '',
    address2: '',
    tel1: '',
    tel2: '',
    mail1: '',
    mail2: '',
    career: [],
    license: [],
  };
}
