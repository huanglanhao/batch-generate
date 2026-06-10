import { describe, expect, it } from 'vitest';
import { buildExportFileName, buildUniqueExportFileName, renderDocumentText } from './document-template';

describe('document-template utilities', () => {
  it('replaces name placeholders in template text', () => {
    expect(renderDocumentText('申请人：{{name}}', '李四')).toBe('申请人：李四');
  });

  it('creates a stable jpg file name by default', () => {
    expect(buildExportFileName('王五/测试')).toBe('王五-测试.jpg');
  });

  it('creates a png file name when format is provided', () => {
    expect(buildExportFileName('王五/测试', 'png')).toBe('王五-测试.png');
  });

  it('adds suffix only when names are duplicated', () => {
    const usedNameMap = new Map();

    expect(buildUniqueExportFileName('悸然好物店', usedNameMap)).toBe('悸然好物店.jpg');
    expect(buildUniqueExportFileName('悸然好物店', usedNameMap)).toBe('悸然好物店(2).jpg');
    expect(buildUniqueExportFileName('悸然好物店', usedNameMap)).toBe('悸然好物店(3).jpg');
  });

  it('keeps duplicated png names stable', () => {
    const usedNameMap = new Map();

    expect(buildUniqueExportFileName('悸然好物店', usedNameMap, 'png')).toBe('悸然好物店.png');
    expect(buildUniqueExportFileName('悸然好物店', usedNameMap, 'png')).toBe('悸然好物店(2).png');
  });
});
