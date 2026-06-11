import { describe, expect, it } from 'vitest';
import { buildArcTextLayout, getStampFontOptions, normalizeStampFontKey, normalizeStampText } from './stamp-generator';

describe('stamp generator', () => {
  it('removes whitespace from stamp text', () => {
    expect(normalizeStampText('  中山 悟然 \n 电子商务有限公司  ')).toBe('中山悟然电子商务有限公司');
  });

  it('uses a fixed 70px arc font size', () => {
    const shortLayout = buildArcTextLayout('中山公司');
    const longLayout = buildArcTextLayout('中山怿然电子商务有限公司');

    expect(shortLayout.characters).toEqual(['中', '山', '公', '司']);
    expect(longLayout.characters.length).toBeGreaterThan(shortLayout.characters.length);
    expect(shortLayout.fontSize).toBe(70);
    expect(longLayout.fontSize).toBe(70);
    expect(longLayout.angleStep).toBeGreaterThan(0);
  });

  it('normalizes stamp font keys and exposes selectable font options', () => {
    expect(normalizeStampFontKey('electronic-seal')).toBe('electronic-seal');
    expect(normalizeStampFontKey('guobiao-fangsong')).toBe('guobiao-fangsong');
    expect(normalizeStampFontKey('songti')).toBe('songti');
    expect(normalizeStampFontKey('xiaohe-songti-extra-light')).toBe('xiaohe-songti-extra-light');
    expect(normalizeStampFontKey('xiaohe-songti-light')).toBe('xiaohe-songti-light');
    expect(normalizeStampFontKey('yongzhong-songti')).toBe('yongzhong-songti');
    expect(normalizeStampFontKey('unknown')).toBe('electronic-seal');
    expect(getStampFontOptions()).toEqual([
      { key: 'guobiao-fangsong', label: '国标仿宋' },
      { key: 'songti', label: '宋体' },
      { key: 'xiaohe-songti-extra-light', label: '小合简化体宋体 Extra Light' },
      { key: 'xiaohe-songti-light', label: '小合简化体宋体 Light' },
      { key: 'yongzhong-songti', label: '永中宋体' },
      { key: 'electronic-seal', label: '电子印章字体' },
    ]);
  });
});
