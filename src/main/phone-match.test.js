import { describe, expect, it } from 'vitest';
import XLSX from 'xlsx';
import phoneMatch from './phone-match';

const {
  extractFullPhone,
  extractMaskedPattern,
  buildPhoneIndex,
  matchShopPhone,
  findShopPhoneColumnIndex,
  extractPhonesFromWorkbook,
  collectMatchPreview,
  applyMatchesToWorkbook,
  summarizeMatchRows,
} = phoneMatch;

function createWorkbook(rows, sheetName = '店铺入驻') {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  return workbook;
}

describe('phone match', () => {
  it('reads full phones from numbers and text', () => {
    expect(extractFullPhone(15085805122)).toBe('15085805122');
    expect(extractFullPhone('150-8214-5269')).toBe('15082145269');
    expect(extractFullPhone('187****0983')).toBe('');
  });

  it('parses masked shop phones by first 3 and last 4 digits', () => {
    expect(extractMaskedPattern('187****0983')).toEqual({
      type: 'masked',
      prefix: '187',
      suffix: '0983',
      key: '1870983',
    });
    expect(extractMaskedPattern('150＊＊5269')).toEqual({
      type: 'masked',
      prefix: '150',
      suffix: '5269',
      key: '1505269',
    });
  });

  it('matches a unique full phone onto a masked shop phone', () => {
    const phoneIndex = buildPhoneIndex(['15085805122', '15082145269', '18712340983']);
    expect(matchShopPhone('150****5269', phoneIndex)).toEqual({
      status: 'matched',
      original: '150****5269',
      matched: '15082145269',
    });
    expect(matchShopPhone('133****6071', phoneIndex).status).toBe('unmatched');
  });

  it('keeps the original value when multiple phones share the same prefix and suffix', () => {
    const phoneIndex = buildPhoneIndex(['15082145269', '15099945269']);
    const result = matchShopPhone('150****5269', phoneIndex);
    expect(result.status).toBe('ambiguous');
    expect(result.matched).toBe('');
    expect(result.candidates).toEqual(['15082145269', '15099945269']);
  });

  it('finds the 店铺手机号 column and replaces only that column', () => {
    expect(findShopPhoneColumnIndex(['序号', '店铺账号', '店铺名称', '店铺手机号', '状态'])).toBe(3);

    const sourceWorkbook = createWorkbook([
      [15085805122],
      ['15082145269'],
      ['18712340983'],
    ], '工作表1');
    const phones = extractPhonesFromWorkbook(sourceWorkbook);
    const phoneIndex = buildPhoneIndex(phones);
    const targetWorkbook = createWorkbook([
      ['序号', '店铺账号', '店铺名称', '店铺手机号', '状态'],
      [1, 'pdd49482615717', 'P35559749223', '187****0983', '审核通过:审核通过'],
      [2, 'pdd15082145269', 'P15082145269', '150****5269', '审核通过:审核通过'],
      [3, 'pdd13300000000', 'P13300000000', '133****6071', '审核通过:审核通过'],
    ]);

    const preview = collectMatchPreview(targetWorkbook, phoneIndex);
    expect(preview.map((item) => item.status)).toEqual(['matched', 'matched', 'unmatched']);

    applyMatchesToWorkbook(targetWorkbook, phoneIndex);
    const rows = XLSX.utils.sheet_to_json(targetWorkbook.Sheets['店铺入驻'], { header: 1, defval: '' });
    expect(rows[1][3]).toBe('18712340983');
    expect(rows[2][3]).toBe('15082145269');
    expect(rows[3][3]).toBe('133****6071');
    expect(rows[1][1]).toBe('pdd49482615717');
    expect(summarizeMatchRows(preview)).toMatchObject({
      matched: 2,
      unmatched: 1,
      total: 3,
    });
  });
});
