import { createEmptyResume, type Resume } from '../../src/models/Resume.ts';

export const sample = (): Resume => ({
  ...createEmptyResume(),
  createdAt: '2026-10-03',
  fullname: '山田 太郎',
  fullnameKana: 'やまだ たろう',
  birthday: '1990-04-01',
  sex: '男',
  zipCode: '1000001',
  address1: '東京都千代田区',
  address2: '大阪府大阪市',
  tel1: '03-1234-5678',
  tel2: '06-1234-5678',
  mail1: 'taro@example.com',
  career: [
    { start: '2010-04', end: '2014-03', name: '○○大学', position: '工学部', description: '卒業' },
    { start: '2014-04', end: '', name: 'ACME', position: '開発', description: '在職中' },
  ],
  license: [
    { date: '2012-06', name: '普通自動車免許', pass: '取得' },
    { date: '2015-11', name: '基本情報技術者', pass: '合格' },
  ],
});
