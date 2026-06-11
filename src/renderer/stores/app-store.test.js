/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import {
  buildBootstrapStamp,
  buildBootstrapTemplate,
  useAppStore,
} from './app-store';

describe('app store bootstrap defaults', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    window.alert = vi.fn();
    window.applicationFormApi = {
      selectOutputDir: vi.fn(),
      capturePreviewPage: vi.fn(),
      writeExportImages: vi.fn(),
      saveConfig: vi.fn(),
      pushExportHistory: vi.fn(),
    };
  });

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
      source: 'generated',
      imagePath: '/tmp/company-stamp.png',
      content: '中山悟然电子商务有限公司',
      fontKey: 'guobiao-fangsong',
      randomizePosition: true,
      randomSeedNonce: 3,
      box: {
        x: 1,
        y: 2,
        width: 3,
        height: 4,
      },
    });

    expect(stamp.source).toBe('generated');
    expect(stamp.imagePath).toBe('/tmp/company-stamp.png');
    expect(stamp.content).toBe('中山悟然电子商务有限公司');
    expect(stamp.fontKey).toBe('guobiao-fangsong');
    expect(stamp.previewUrl).toBe('');
    expect(stamp.randomizePosition).toBe(true);
    expect(stamp.randomSeedNonce).toBe(3);
    expect(stamp.box).toEqual({
      x: 379,
      y: 231,
      width: 284,
      height: 284,
    });
  });

  it('exports documents through the preview capture pipeline', async () => {
    const store = useAppStore();
    store.records = [
      { rowIndex: 2, name: '张三' },
      { rowIndex: 3, name: '李四' },
    ];
    store.exportSettings = {
      format: 'png',
      width: 2480,
      height: 3508,
      jpegQuality: 100,
    };

    window.applicationFormApi.selectOutputDir.mockResolvedValue('/tmp/output');
    window.applicationFormApi.capturePreviewPage
      .mockResolvedValueOnce('data:image/png;base64,AAA')
      .mockResolvedValueOnce('data:image/png;base64,BBB');
    window.applicationFormApi.writeExportImages.mockResolvedValue({
      outputDir: '/tmp/output',
      files: ['/tmp/output/张三.png', '/tmp/output/李四.png'],
    });
    window.applicationFormApi.saveConfig.mockResolvedValue({
      template: store.template,
      stamp: {
        source: store.stamp.source,
        imagePath: store.stamp.imagePath,
        content: store.stamp.content,
        fontKey: store.stamp.fontKey,
        randomizePosition: store.stamp.randomizePosition,
        randomSeedNonce: store.stamp.randomSeedNonce,
        box: store.stamp.box,
      },
      outputDir: '/tmp/output',
      exportSettings: store.exportSettings,
    });
    window.applicationFormApi.pushExportHistory.mockResolvedValue([]);

    await store.exportDocuments();

    expect(window.applicationFormApi.capturePreviewPage).toHaveBeenCalledTimes(2);
    expect(window.applicationFormApi.capturePreviewPage).toHaveBeenNthCalledWith(1, expect.objectContaining({
      pageName: '张三',
      pageNumber: 1,
      exportSettings: {
        format: 'png',
        width: 2480,
        height: 3508,
        jpegQuality: 100,
      },
    }));
    expect(window.applicationFormApi.capturePreviewPage).toHaveBeenNthCalledWith(2, expect.objectContaining({
      pageName: '李四',
      pageNumber: 2,
      exportSettings: {
        format: 'png',
        width: 2480,
        height: 3508,
        jpegQuality: 100,
      },
    }));
    expect(window.applicationFormApi.writeExportImages).toHaveBeenCalledWith({
      outputDir: '/tmp/output',
      items: [
        { fileName: '张三.png', dataUrl: 'data:image/png;base64,AAA' },
        { fileName: '李四.png', dataUrl: 'data:image/png;base64,BBB' },
      ],
    });
  });

  it('saves generated stamp only after explicit confirmation', async () => {
    const store = useAppStore();
    window.applicationFormApi.saveConfig.mockResolvedValue({
      template: store.template,
      stamp: {
        source: 'generated',
        imagePath: '',
        content: '中山悟然电子商务有限公司',
        fontKey: 'guobiao-fangsong',
        randomizePosition: false,
        randomSeedNonce: 0,
        box: store.stamp.box,
      },
      outputDir: '',
      exportSettings: store.exportSettings,
    });

    const saved = await store.saveGeneratedStamp(
      '中山悟然电子商务有限公司',
      'data:image/png;base64,SEAL',
      'guobiao-fangsong',
    );

    expect(saved).toBe(true);
    expect(store.stamp.source).toBe('generated');
    expect(store.stamp.content).toBe('中山悟然电子商务有限公司');
    expect(store.stamp.fontKey).toBe('guobiao-fangsong');
    expect(store.stamp.previewUrl).toBe('data:image/png;base64,SEAL');
    expect(window.applicationFormApi.saveConfig).toHaveBeenCalledWith(expect.objectContaining({
      stamp: expect.objectContaining({
        source: 'generated',
        content: '中山悟然电子商务有限公司',
        fontKey: 'guobiao-fangsong',
        imagePath: '',
      }),
    }));
  });
});
