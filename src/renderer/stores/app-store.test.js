/* @vitest-environment jsdom */

import { describe, expect, it } from 'vitest';
import {
  buildBootstrapStamp,
  buildBootstrapTemplate,
} from './app-store';

describe('app store bootstrap defaults', () => {
  it('restores document typography defaults on bootstrap', () => {
    const template = buildBootstrapTemplate({
      title: '自定义申请书',
      fontFamily: '"SimHei", sans-serif',
      fontSize: 12,
      textColor: '#ff0000',
      contentHtml: '<div><span style="font-size: 12px; color: #ff0000;">自定义内容</span></div>',
      textBox: {
        x: 12,
        y: 34,
        width: 320,
        height: 56,
      },
    });

    expect(template.title).toBe('自定义申请书');
    expect(template.fontFamily).toBe('"CustomGuoBiaoFangSong", "GBFangSong", "FangSong GB2312", FangSong, STFangsong, serif');
    expect(template.fontSize).toBe(18);
    expect(template.textColor).toBe('#111111');
    expect(template.contentHtml).toContain('font-size: 12px;');
    expect(template.contentHtml).toContain('color: rgb(255, 0, 0);');
    expect(template.contentHtml).toContain('自定义内容');
    expect(template.textBox).toEqual({
      x: 12,
      y: 34,
      width: 320,
      height: 56,
    });
  });

  it('restores default stamp box while keeping the selected stamp image', () => {
    const stamp = buildBootstrapStamp({
      imagePath: '/tmp/company-stamp.png',
      box: {
        x: 1,
        y: 2,
        width: 3,
        height: 4,
      },
    });

    expect(stamp.imagePath).toBe('/tmp/company-stamp.png');
    expect(stamp.previewUrl).toBe('');
    expect(stamp.box).toEqual({
      x: 379,
      y: 231,
      width: 284,
      height: 284,
    });
  });
});
