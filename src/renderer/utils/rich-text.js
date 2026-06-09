const BLOCK_TAGS = new Set(['DIV', 'P', 'LI']);
const ALLOWED_INLINE_TAGS = new Set(['SPAN', 'B', 'STRONG', 'I', 'EM', 'U']);
const DEFAULT_DOCUMENT_FONT_FAMILY = '"CustomGuoBiaoFangSong", "GBFangSong", "FangSong GB2312", FangSong, STFangsong, serif';
const VARIABLE_TOKENS = {
  name: {
    label: '姓名',
    placeholder: '{{name}}',
  },
};
const LEGACY_DEFAULT_RICH_TEXT_CONTENT =
  '<div style="text-align: center;"><span style="font-size: 30px; font-weight: 700;">申请书</span></div><div><br></div><div><span data-variable="name">姓名</span></div>';
const PREVIOUS_DEFAULT_RICH_TEXT_CONTENT =
  '<div style="margin-top: 6px; margin-bottom: 18px; text-align: center; font-size: 32px;">登录手机号码修改申请书</div>'
  + '<div style="line-height: 1.25;">致拼多多平台：</div>'
  + '<div style="line-height: 1.25; text-indent: 2em;">我司为店铺名称：<span data-variable="name">姓名</span>（以下简称“本店铺”）店铺入驻主体。</div>'
  + '<div style="line-height: 1.25; text-indent: 2em;">我司现申请修改本店铺登录手机号码，上述店铺信息修改系我司真实意愿，我司自愿承担由此产生的一切经济和法律责任。</div>'
  + '<div style="line-height: 1.25; font-weight: 700; margin-top: 8px;">特此说明！</div>'
  + '<div style="line-height: 1.25; margin-top: 250px;">请于框内加盖【企业公章】：</div>'
  + '<div style="line-height: 1.25; margin-top: 80px;">注意：框内仅供加盖入驻公司红色鲜章，红章需清晰完整且无任何遮挡。</div>';
const CURRENT_DEFAULT_RICH_TEXT_CONTENT =
  '<div style="margin-top: 6px; margin-bottom: 18px; text-align: center; font-size: 19px;">登录手机号码修改申请书</div>'
  + '<div style="line-height: 1.25;">致拼多多平台：</div>'
  + '<div style="line-height: 1.25; text-indent: 2em;">我司为店铺名称：<span data-variable="name">姓名</span>（以下简称“本店铺”）店铺入驻主体。我司现申请修改本店铺登录手机号码，上述店铺信息修改系我司真实意愿，我司自愿承担由此产生的一切经济和法律责任。</div>'
  + '<div style="line-height: 1.25; font-weight: 700; margin-top: 8px;">特此说明！</div>'
  + '<div style="line-height: 1.25; margin-top: 250px;">请于框内加盖【企业公章】：</div>'
  + '<div style="line-height: 1.25; margin-top: 80px;">注意：框内仅供加盖入驻公司红色鲜章，红章需清晰完整且无任何遮挡。</div>';
const PREVIOUS_CURRENT_DEFAULT_RICH_TEXT_CONTENT =
  '<div style="margin-top: 10px; margin-bottom: 20px; text-align: center; font-size: 20px;">登录手机号码修改申请书</div>'
  + '<div style="line-height: 1.2; text-indent: 2em;">致拼多多平台：</div>'
  + '<div style="line-height: 1.2; text-indent: 2em;">我司为店铺名称：<span data-variable="name">姓名</span>（以下简称“本店铺”）店铺入驻主体。我司现申请修改本店铺登录手机号码，上述店铺信息修改系我司真实意愿，我司自愿承担由此产生的一切经济和法律责任。</div>'
  + '<div style="line-height: 1.2; font-weight: 700; text-indent: 2em; margin-top: 6px;">特此说明！</div>'
  + '<div style="line-height: 1.2; text-indent: 2em; margin-top: 182px;">请于框内加盖【企业公章】：</div>'
  + '<div style="line-height: 1.2; text-indent: 2em; margin-top: 150px;">注意：框内仅供加盖入驻公司红色鲜章，红章需清晰完整且无任何遮挡。</div>';
const BROKEN_CURRENT_DEFAULT_RICH_TEXT_CONTENT =
  '<div style="text-align: center; line-height: 1.2; margin-top: 10px; margin-bottom: 20px;">登录手机号码修改申请书</div>'
  + '<div style="line-height: 1.2; text-indent: 2em;">致拼多多平台：</div>'
  + '<div style="line-height: 1.2; text-indent: 2em;">我司为店铺名称：<span data-variable="name">姓名</span>（以下简称“本店铺”）店铺入驻主体。我司现申请修改本店铺登录手机号码，上述店铺信息修改系我司真实意愿，我司自愿承担由此产生的一切经济和法律责任。</div>'
  + '<div style="line-height: 1.2; font-weight: 700; text-indent: 2em; margin-top: 6px;">特此说明！</div>'
  + '<div style="line-height: 1.2; text-indent: 2em; margin-top: 182px;">请于框内加盖【企业公章】：</div>'
  + '<div style="line-height: 1.2; text-indent: 2em; margin-top: 150px;">注意：框内仅供加盖入驻公司红色鲜章，红章需清晰完整且无任何遮挡。</div>';
const DEFAULT_RICH_TEXT_CONTENT =
  '<div style="margin-top: 10px; margin-bottom: 20px; line-height: 1.2; text-align: center; font-size: 20px;">登录手机号码修改申请书</div>'
  + '<div style="line-height: 1.2; text-indent: 2em;">致拼多多平台：</div>'
  + '<div style="line-height: 1.2; text-indent: 2em;">我司为店铺名称：<span data-variable="name">姓名</span>（以下简称“本店铺”）店铺入驻主体。我司现申请修改本店铺登录手机号码，上述店铺信息修改系我司真实意愿，我司自愿承担由此产生的一切经济和法律责任。</div>'
  + '<div style="line-height: 1.2; font-weight: 700; text-indent: 2em; margin-top: 6px;">特此说明！</div>'
  + '<div style="line-height: 1.2; text-indent: 2em; margin-top: 144px;">请于框内加盖【企业公章】：</div>'
  + '<div style="line-height: 1.2; text-indent: 2em; margin-top: 188px;">注意：框内仅供加盖入驻公司红色鲜章，红章需清晰完整且无任何遮挡。</div>';
const EMPTY_RICH_TEXT_CONTENT = '<div><br></div>';

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeDocumentFontFamily(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  if (
    normalized === '"SimSun", serif'
    || normalized === 'SimSun, serif'
    || normalized === '"CustomGuoBiaoFangSong", "GBFangSong", "FangSong GB2312", FangSong, STFangsong, serif'
    || normalized === 'CustomGuoBiaoFangSong, GBFangSong, FangSong GB2312, FangSong, STFangsong, serif'
    || normalized === '"GBSong", "STSong", "Songti SC", SimSun, serif'
    || normalized === 'GBSong, STSong, Songti SC, SimSun, serif'
    || normalized === '"STSong", "Songti SC", SimSun, serif'
    || normalized === 'STSong, Songti SC, SimSun, serif'
    || normalized === '"Songti SC", SimSun, STSong, serif'
    || normalized === 'Songti SC, SimSun, STSong, serif'
    || normalized === '"FangSong GB2312", FangSong, STFangsong, serif'
    || normalized === 'FangSong GB2312, FangSong, STFangsong, serif'
  ) {
    return DEFAULT_DOCUMENT_FONT_FAMILY;
  }
  return normalized;
}

function normalizeExportFontFamily(fontFamily) {
  return normalizeDocumentFontFamily(fontFamily) || DEFAULT_DOCUMENT_FONT_FAMILY;
}

function normalizeExportHtmlFontFamilies(html, fallbackFontFamily = DEFAULT_DOCUMENT_FONT_FAMILY) {
  const normalizedHtml = String(html || '')
    .replaceAll(/font-family:\s*SimSun\s*,\s*serif/gi, `font-family: ${DEFAULT_DOCUMENT_FONT_FAMILY}`)
    .replaceAll(/font-family:\s*&quot;SimSun&quot;\s*,\s*serif/gi, `font-family: ${DEFAULT_DOCUMENT_FONT_FAMILY}`)
    .replaceAll(/font-family:\s*&quot;CustomGuoBiaoFangSong&quot;\s*,\s*&quot;GBFangSong&quot;\s*,\s*&quot;FangSong GB2312&quot;\s*,\s*FangSong\s*,\s*STFangsong\s*,\s*serif/gi, `font-family: ${DEFAULT_DOCUMENT_FONT_FAMILY}`)
    .replaceAll(/font-family:\s*CustomGuoBiaoFangSong\s*,\s*GBFangSong\s*,\s*FangSong GB2312\s*,\s*FangSong\s*,\s*STFangsong\s*,\s*serif/gi, `font-family: ${DEFAULT_DOCUMENT_FONT_FAMILY}`)
    .replaceAll(/font-family:\s*&quot;GBSong&quot;\s*,\s*&quot;STSong&quot;\s*,\s*&quot;Songti SC&quot;\s*,\s*SimSun\s*,\s*serif/gi, `font-family: ${DEFAULT_DOCUMENT_FONT_FAMILY}`)
    .replaceAll(/font-family:\s*GBSong\s*,\s*STSong\s*,\s*Songti SC\s*,\s*SimSun\s*,\s*serif/gi, `font-family: ${DEFAULT_DOCUMENT_FONT_FAMILY}`)
    .replaceAll(/font-family:\s*&quot;STSong&quot;\s*,\s*&quot;Songti SC&quot;\s*,\s*SimSun\s*,\s*serif/gi, `font-family: ${DEFAULT_DOCUMENT_FONT_FAMILY}`)
    .replaceAll(/font-family:\s*STSong\s*,\s*Songti SC\s*,\s*SimSun\s*,\s*serif/gi, `font-family: ${DEFAULT_DOCUMENT_FONT_FAMILY}`)
    .replaceAll(/font-family:\s*&quot;Songti SC&quot;\s*,\s*SimSun\s*,\s*STSong\s*,\s*serif/gi, `font-family: ${DEFAULT_DOCUMENT_FONT_FAMILY}`)
    .replaceAll(/font-family:\s*Songti SC\s*,\s*SimSun\s*,\s*STSong\s*,\s*serif/gi, `font-family: ${DEFAULT_DOCUMENT_FONT_FAMILY}`)
    .replaceAll(/font-family:\s*&quot;FangSong GB2312&quot;\s*,\s*FangSong\s*,\s*STFangsong\s*,\s*serif/gi, `font-family: ${DEFAULT_DOCUMENT_FONT_FAMILY}`)
    .replaceAll(/font-family:\s*FangSong GB2312\s*,\s*FangSong\s*,\s*STFangsong\s*,\s*serif/gi, `font-family: ${DEFAULT_DOCUMENT_FONT_FAMILY}`);
  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<div>${normalizedHtml}</div>`, 'text/html');
  const root = parsed.body.firstElementChild;
  const explicitFontFamily = normalizeExportFontFamily(fallbackFontFamily);

  Array.from(root?.querySelectorAll('div, span') || []).forEach((element) => {
    const currentFontFamily = normalizeDocumentFontFamily(element.style.fontFamily);
    element.style.fontFamily = currentFontFamily || explicitFontFamily;
  });

  return root?.innerHTML || '';
}

function sanitizeFontSize(value) {
  const matched = String(value || '').match(/(\d+(?:\.\d+)?)px/i);
  if (!matched) return '';
  const size = Number.parseFloat(matched[1]);
  if (!Number.isFinite(size)) return '';
  const normalizedSize = Math.round(Math.max(9, Math.min(120, size)) * 10) / 10;
  return `${Number.isInteger(normalizedSize) ? String(normalizedSize) : String(normalizedSize)}px`;
}

function sanitizeColor(value) {
  const normalized = String(value || '').trim();
  if (/^#[0-9a-f]{3,8}$/i.test(normalized)) return normalized;
  if (/^rgb(a)?\([\d\s,.%]+\)$/i.test(normalized)) return normalized;
  return '';
}

function sanitizeFontFamily(value) {
  return normalizeDocumentFontFamily(String(value || '').replace(/[<>]/g, '').trim().slice(0, 160));
}

function sanitizeFontWeight(value) {
  const normalized = String(value || '').trim();
  if (/^(normal|bold|[1-9]00)$/i.test(normalized)) return normalized;
  return '';
}

function sanitizeFontStyle(value) {
  const normalized = String(value || '').trim();
  if (/^(normal|italic|oblique)$/i.test(normalized)) return normalized;
  return '';
}

function sanitizeTextDecoration(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (['underline', 'line-through', 'none'].includes(normalized)) return normalized;
  return '';
}

function sanitizeTextAlign(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (['left', 'center', 'right', 'justify'].includes(normalized)) return normalized;
  return '';
}

function sanitizeLineHeight(value) {
  const normalized = String(value || '').trim();
  if (/^\d+(\.\d+)?$/.test(normalized)) return normalized;
  if (/^\d+(\.\d+)?px$/i.test(normalized)) return normalized.toLowerCase();
  return '';
}

function sanitizeLength(value, allowedUnits = ['px', 'em', 'rem']) {
  const normalized = String(value || '').trim().toLowerCase();
  const matched = normalized.match(/^(-?\d+(?:\.\d+)?)(px|em|rem)$/);
  if (!matched) return '';
  if (!allowedUnits.includes(matched[2])) return '';
  return `${matched[1]}${matched[2]}`;
}

function appendTrailingBreak(fragment, doc) {
  const lastNode = fragment.lastChild;
  if (!lastNode || lastNode.nodeName !== 'BR') {
    fragment.appendChild(doc.createElement('br'));
  }
}

function getSafeVariableName(value) {
  const normalized = String(value || '').trim();
  if (Object.hasOwn(VARIABLE_TOKENS, normalized)) {
    return normalized;
  }
  return '';
}

function getVariableDisplayText(variableName, variables = {}) {
  const value = String(variables?.[variableName] || '').trim();
  return value || VARIABLE_TOKENS[variableName].label;
}

function decorateVariableToken(element, variables = {}) {
  const variableName = getSafeVariableName(element.getAttribute('data-variable'));
  if (!variableName) return;
  element.setAttribute('data-variable', variableName);
  element.textContent = getVariableDisplayText(variableName, variables);
}

function applySafeStyles(source, target) {
  const styleMap = {
    color: sanitizeColor(source.style.color),
    fontSize: sanitizeFontSize(source.style.fontSize),
    fontFamily: sanitizeFontFamily(source.style.fontFamily),
    fontWeight: sanitizeFontWeight(source.style.fontWeight),
    fontStyle: sanitizeFontStyle(source.style.fontStyle),
    textDecoration: sanitizeTextDecoration(source.style.textDecoration),
    textAlign: sanitizeTextAlign(source.style.textAlign),
    lineHeight: sanitizeLineHeight(source.style.lineHeight),
    textIndent: sanitizeLength(source.style.textIndent),
    marginTop: sanitizeLength(source.style.marginTop, ['px']),
    marginBottom: sanitizeLength(source.style.marginBottom, ['px']),
  };

  Object.entries(styleMap).forEach(([key, value]) => {
    if (value) {
      target.style[key] = value;
    }
  });
}

function sanitizeNode(node, doc) {
  if (node.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(String(node.textContent || '').replaceAll('\u200b', ''));
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const tagName = node.tagName.toUpperCase();

  if (tagName === 'BR') {
    return doc.createElement('br');
  }

  if (BLOCK_TAGS.has(tagName)) {
    const element = doc.createElement(tagName === 'LI' ? 'div' : tagName.toLowerCase());
    applySafeStyles(node, element);
    Array.from(node.childNodes).forEach((child) => {
      const sanitizedChild = sanitizeNode(child, doc);
      if (sanitizedChild) {
        element.appendChild(sanitizedChild);
      }
    });
    return element;
  }

  if (ALLOWED_INLINE_TAGS.has(tagName)) {
    const element = doc.createElement('span');
    applySafeStyles(node, element);
    const variableName = getSafeVariableName(node.getAttribute('data-variable'));
    if (variableName) {
      element.setAttribute('data-variable', variableName);
      element.textContent = VARIABLE_TOKENS[variableName].label;
      return element;
    }

    if (tagName === 'B' || tagName === 'STRONG') {
      element.style.fontWeight = element.style.fontWeight || '700';
    }
    if (tagName === 'I' || tagName === 'EM') {
      element.style.fontStyle = element.style.fontStyle || 'italic';
    }
    if (tagName === 'U') {
      element.style.textDecoration = element.style.textDecoration || 'underline';
    }

    Array.from(node.childNodes).forEach((child) => {
      const sanitizedChild = sanitizeNode(child, doc);
      if (sanitizedChild) {
        element.appendChild(sanitizedChild);
      }
    });
    return element;
  }

  const fragment = doc.createDocumentFragment();
  Array.from(node.childNodes).forEach((child) => {
    const sanitizedChild = sanitizeNode(child, doc);
    if (sanitizedChild) {
      fragment.appendChild(sanitizedChild);
    }
  });
  return fragment;
}

function replaceLegacyPlaceholders(value) {
  return Object.entries(VARIABLE_TOKENS).reduce((html, [variableName, meta]) => {
    return html.replaceAll(meta.placeholder, `<span data-variable="${variableName}">${meta.label}</span>`);
  }, String(value || ''));
}

export function sanitizeRichTextHtml(html) {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<div>${replaceLegacyPlaceholders(html)}</div>`, 'text/html');
  const sourceRoot = parsed.body.firstElementChild;
  const cleanDoc = document.implementation.createHTMLDocument('');
  const cleanRoot = cleanDoc.createElement('div');

  Array.from(sourceRoot?.childNodes || []).forEach((child) => {
    const sanitizedChild = sanitizeNode(child, cleanDoc);
    if (sanitizedChild) {
      cleanRoot.appendChild(sanitizedChild);
    }
  });

  return cleanRoot.innerHTML;
}

export function buildInitialRichTextContent(contentHtml) {
  if (typeof contentHtml === 'string') {
    const normalized = sanitizeRichTextHtml(contentHtml);
    if (
      normalized === '<span data-variable="name">姓名</span>' ||
      normalized === '申请人：<span data-variable="name">姓名</span>' ||
      normalized === '{{name}}' ||
      normalized === sanitizeRichTextHtml(LEGACY_DEFAULT_RICH_TEXT_CONTENT) ||
      normalized === sanitizeRichTextHtml(PREVIOUS_DEFAULT_RICH_TEXT_CONTENT) ||
      normalized === sanitizeRichTextHtml(CURRENT_DEFAULT_RICH_TEXT_CONTENT) ||
      normalized === sanitizeRichTextHtml(PREVIOUS_CURRENT_DEFAULT_RICH_TEXT_CONTENT) ||
      normalized === sanitizeRichTextHtml(BROKEN_CURRENT_DEFAULT_RICH_TEXT_CONTENT)
    ) {
      return DEFAULT_RICH_TEXT_CONTENT;
    }
    return normalized;
  }
  return DEFAULT_RICH_TEXT_CONTENT;
}

export function renderRichTextTemplate(contentHtml, variables = {}) {
  const html = sanitizeRichTextHtml(contentHtml || DEFAULT_RICH_TEXT_CONTENT);
  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = parsed.body.firstElementChild;

  Array.from(root?.querySelectorAll('[data-variable]') || []).forEach((element) => {
    const variableName = getSafeVariableName(element.getAttribute('data-variable'));
    const value = escapeHtml(variables[variableName] || '请导入 template_name 数据');
    element.outerHTML = value;
  });

  return root?.innerHTML || '';
}

export function decorateEditorTokens(root, variables = {}) {
  if (!root) return;
  Array.from(root.querySelectorAll('[data-variable]')).forEach((element) => {
    decorateVariableToken(element, variables);
    element.setAttribute('contenteditable', 'false');
    element.classList.add('document-variable-token');
    element.setAttribute('title', '变量符号，导出时会替换为实际名称');
  });
}

export function buildVariableTokenHtml(variableName) {
  const safeName = getSafeVariableName(variableName);
  if (!safeName) return '';
  const label = VARIABLE_TOKENS[safeName].label;
  return `<span data-variable="${safeName}">${label}</span>&nbsp;`;
}

export function buildRichTextDataUrl({
  contentHtml,
  pageName,
  box,
  defaultFontFamily,
  defaultFontSize,
  defaultTextColor,
  padding = '38px 74px 60px',
  textAlign = 'left',
  fontWeight = 400,
  renderScale = 1,
}) {
  const exportFontFamily = normalizeExportFontFamily(defaultFontFamily);
  const renderedHtml = normalizeExportHtmlFontFamilies(renderRichTextTemplate(contentHtml, { name: pageName }), exportFontFamily);
  const scaledWidth = box.width * renderScale;
  const scaledHeight = box.height * renderScale;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${scaledWidth}" height="${scaledHeight}" viewBox="0 0 ${scaledWidth} ${scaledHeight}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${scaledWidth}px;height:${scaledHeight}px;overflow:hidden;background:transparent;">
          <div style="width:${box.width}px;height:${box.height}px;transform:scale(${renderScale});transform-origin:top left;">
            <div style="box-sizing:border-box;width:100%;height:100%;padding:${padding};font-family:${escapeHtml(exportFontFamily)};font-size:${Math.max(12, defaultFontSize)}px;color:${escapeHtml(defaultTextColor)};font-weight:${fontWeight};line-height:1.2;text-align:${textAlign};white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;">
              ${renderedHtml}
            </div>
          </div>
        </div>
      </foreignObject>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export { DEFAULT_RICH_TEXT_CONTENT, EMPTY_RICH_TEXT_CONTENT };
