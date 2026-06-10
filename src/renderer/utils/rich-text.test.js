/* @vitest-environment jsdom */

import { describe, expect, it } from 'vitest';
import {
  buildInitialRichTextContent,
  buildRichTextDataUrl,
  decorateEditorTokens,
  DEFAULT_RICH_TEXT_CONTENT,
  renderRichTextTemplate,
  sanitizeRichTextHtml,
} from './rich-text';

describe('rich text utilities', () => {
  it('falls back to default content when config is missing', () => {
    expect(buildInitialRichTextContent(undefined)).toBe(DEFAULT_RICH_TEXT_CONTENT);
  });

  it('migrates legacy placeholder-only content to document template', () => {
    expect(buildInitialRichTextContent('{{name}}')).toBe(DEFAULT_RICH_TEXT_CONTENT);
  });

  it('migrates broken default content missing title font size back to the latest template', () => {
    const brokenContent =
      '<div style="text-align: center; line-height: 1.2; margin-top: 10px; margin-bottom: 20px;">登录手机号码修改申请书</div>'
      + '<div style="line-height: 1.2; text-indent: 2em;">致拼多多平台：</div>'
      + '<div style="line-height: 1.2; text-indent: 2em;">我司为店铺名称：<span data-variable="name">姓名</span>（以下简称“本店铺”）店铺入驻主体。我司现申请修改本店铺登录手机号码，上述店铺信息修改系我司真实意愿，我司自愿承担由此产生的一切经济和法律责任。</div>'
      + '<div style="line-height: 1.2; text-indent: 2em; margin-top: 6px;">特此说明！</div>'
      + '<div style="line-height: 1.2; text-indent: 2em; margin-top: 182px;">请于框内加盖【企业公章】：</div>'
      + '<div style="line-height: 1.2; text-indent: 2em; margin-top: 150px;">注意：框内仅供加盖入驻公司红色鲜章，红章需清晰完整且无任何遮挡。</div>';

    expect(buildInitialRichTextContent(brokenContent)).toBe(DEFAULT_RICH_TEXT_CONTENT);
  });

  it('uses 1.2 line height for the default title and body', () => {
    expect(DEFAULT_RICH_TEXT_CONTENT).toContain('line-height: 1.2; text-align: center;');
    expect(DEFAULT_RICH_TEXT_CONTENT).toContain('font-size: 20px;');
    expect(DEFAULT_RICH_TEXT_CONTENT).toContain('line-height: 1.2; text-indent: 2em;');
  });

  it('sanitizes unsupported tags and unsafe styles', () => {
    const sanitized = sanitizeRichTextHtml(
      '<script>alert(1)</script><div style="text-align: center;"><span style="font-size: 28px; color: #ff0000; position: fixed;">申请人</span><span data-variable="name">abc</span></div>',
    );

    expect(sanitized).toContain('申请人');
    expect(sanitized).toContain('font-size: 28px;');
    expect(sanitized).toContain('color: rgb(255, 0, 0);');
    expect(sanitized).toContain('text-align: center;');
    expect(sanitized).not.toContain('position: fixed');
    expect(sanitized).toContain('<span data-variable="name">${名称占位符}</span>');
    expect(sanitized).toContain('申请人');
  });

  it('keeps half-step font sizes like 10.5px', () => {
    const sanitized = sanitizeRichTextHtml('<div><span style="font-size: 10.5px;">申请人</span></div>');

    expect(sanitized).toContain('font-size: 10.5px;');
  });

  it('renders name placeholders as escaped text', () => {
    expect(renderRichTextTemplate('<span data-variable="name">${名称占位符}</span>', { name: '<测试>' })).toBe('&lt;测试&gt;');
  });

  it('shows imported name on editor variable tokens', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div><span data-variable="name">${名称占位符}</span></div>';

    decorateEditorTokens(root, { name: '测试店铺' });

    expect(root.querySelector('[data-variable="name"]')?.textContent).toBe('测试店铺');
  });

  it('applies explicit export font family to each paragraph block', () => {
    const dataUrl = buildRichTextDataUrl({
      contentHtml: '<div>上文</div><div style="margin-top: 100px;">下文</div>',
      pageName: '测试店铺',
      box: { width: 794, height: 1123 },
      defaultFontFamily: '"CustomGuoBiaoFangSong", "GBFangSong", "FangSong GB2312", FangSong, STFangsong, serif',
      defaultFontSize: 19,
      defaultTextColor: '#111111',
    });
    const svg = decodeURIComponent(dataUrl.replace('data:image/svg+xml;charset=utf-8,', ''));
    const matches = svg.match(/font-family:/g) || [];

    expect(matches.length).toBeGreaterThanOrEqual(3);
  });
});
