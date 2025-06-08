export interface Career {
  start: string;
  end: string;
  name: string;
  position: string;
  description: string;
}

export interface License {
  date: string;
  name: string;
  pass: string; // 合格・取得
}

export interface Resume {
  createdAt: string;
  fullname: string;
  fullnameKana: string;
  birthday: string;
  sex: string;
  zipCode: string;
  address1: string;
  address2: string;
  tel1: string;
  tel2: string;
  mail1: string;
  mail2: string;
  career: Career[];
  license: License[];
}

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
