<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  buildInitialRichTextContent,
  buildVariableTokenHtml,
  decorateEditorTokens,
  renderRichTextTemplate,
} from '../utils/rich-text';
import { getScaledStampRect } from '../utils/stamp-layout';

const SHEET_WIDTH = 794;
const SHEET_HEIGHT = 1123;
const SHEET_WIDTH_CM = 21;
const SHEET_HEIGHT_CM = 29.7;
const RULER_GUTTER = 34;

const props = defineProps({
  pageName: {
    type: String,
    default: '',
  },
  pageNumber: {
    type: Number,
    default: 1,
  },
  template: {
    type: Object,
    required: true,
  },
  stamp: {
    type: Object,
    required: true,
  },
  scale: {
    type: Number,
    default: 1,
  },
  drawMode: {
    type: String,
    default: 'none',
  },
  interactive: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
  showRulers: {
    type: Boolean,
    default: false,
  },
  captureMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['box-drawn', 'select', 'content-updated', 'content-persist', 'selection-style-change']);
const TYPING_MARKER = '\u200b';

const pageSurfaceRef = ref(null);
const startPoint = ref(null);
const draftBox = ref(null);
const draggingBox = ref(null);
const resizingBox = ref(null);
const stampBoxSelected = ref(false);
const editorRef = ref(null);
const savedSelectionRange = ref(null);
const editorFocused = ref(false);
const stampImageNaturalSize = ref({ width: 0, height: 0 });
const rulerVisible = computed(() => props.showRulers && props.scale >= 0.4);
const stampResizeHandles = [
  { direction: 'nw', cursor: 'nwse-resize' },
  { direction: 'n', cursor: 'ns-resize' },
  { direction: 'ne', cursor: 'nesw-resize' },
  { direction: 'e', cursor: 'ew-resize' },
  { direction: 'se', cursor: 'nwse-resize' },
  { direction: 's', cursor: 'ns-resize' },
  { direction: 'sw', cursor: 'nesw-resize' },
  { direction: 'w', cursor: 'ew-resize' },
];

const surfaceStyle = computed(() => ({
  width: `${SHEET_WIDTH * props.scale}px`,
  height: `${SHEET_HEIGHT * props.scale}px`,
  marginLeft: rulerVisible.value ? `${RULER_GUTTER}px` : '0',
  marginTop: rulerVisible.value ? `${RULER_GUTTER}px` : '0',
}));
const previewShellStyle = computed(() => ({
  width: `${SHEET_WIDTH * props.scale + (rulerVisible.value ? RULER_GUTTER : 0)}px`,
  height: `${SHEET_HEIGHT * props.scale + (rulerVisible.value ? RULER_GUTTER : 0)}px`,
}));
const layoutLayerStyle = computed(() => ({
  width: `${SHEET_WIDTH}px`,
  height: `${SHEET_HEIGHT}px`,
  transform: `scale(${props.scale})`,
  transformOrigin: 'top left',
}));

const activeStampBox = computed(() => {
  if (resizingBox.value?.type === 'stamp-box') return resizingBox.value.box;
  if (draggingBox.value?.type === 'stamp-box') return draggingBox.value.box;
  return props.stamp.box;
});
const stampBoxStyle = computed(() => toBoxStyle(activeStampBox.value));
const stampPlacementSeed = computed(() => `${props.pageName || 'page'}:${props.pageNumber || 1}:${props.stamp.randomSeedNonce || 0}`);
const stampImageStyle = computed(() => {
  const box = activeStampBox.value;
  if (!box) return {};
  const drawRect = getScaledStampRect(box, stampImageNaturalSize.value, {
    randomizePosition: Boolean(props.stamp.randomizePosition),
    seed: stampPlacementSeed.value,
  });
  return {
    left: `${drawRect.x - box.x}px`,
    top: `${drawRect.y - box.y}px`,
    width: `${drawRect.width}px`,
    height: `${drawRect.height}px`,
  };
});
const draftBoxStyle = computed(() => toBoxStyle(draftBox.value));
const editorEnabled = computed(() => props.interactive && props.drawMode !== 'stamp-box');
const stampResizeEnabled = computed(() => props.interactive && props.drawMode === 'none');
const pageEditorStyle = computed(() => ({
  fontFamily: props.template.fontFamily,
  fontSize: `${Math.max(12, props.template.fontSize)}px`,
  color: props.template.textColor,
}));
const renderedContentHtml = computed(() => renderRichTextTemplate(props.template.contentHtml, { name: props.pageName }));
const horizontalRulerMarks = computed(() => {
  return Array.from({ length: SHEET_WIDTH_CM + 1 }, (_, index) => ({
    label: index,
    offset: `${(index / SHEET_WIDTH_CM) * 100}%`,
  }));
});
const verticalRulerMarks = computed(() => {
  return Array.from({ length: Math.floor(SHEET_HEIGHT_CM) + 1 }, (_, index) => ({
    label: index,
    offset: `${(index / SHEET_HEIGHT_CM) * 100}%`,
  }));
});
const stampReferenceText = computed(() => {
  const box = activeStampBox.value;
  if (!box) return '';
  const widthCm = (box.width / (SHEET_WIDTH / SHEET_WIDTH_CM)).toFixed(1).replace(/\.0$/, '');
  const heightCm = (box.height / (SHEET_HEIGHT / SHEET_HEIGHT_CM)).toFixed(1).replace(/\.0$/, '');
  return `参考盖章区 ${widthCm} x ${heightCm} cm`;
});

function toBoxStyle(box) {
  if (!box) return {};
  return {
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  };
}

function resolvePoint(event) {
  const rect = pageSurfaceRef.value?.getBoundingClientRect();
  if (!rect) return null;
  return {
    x: Math.max(0, Math.min(SHEET_WIDTH, (event.clientX - rect.left) / props.scale)),
    y: Math.max(0, Math.min(SHEET_HEIGHT, (event.clientY - rect.top) / props.scale)),
  };
}

function handlePointerDown(event) {
  emit('select');
  stampBoxSelected.value = false;
  if (!props.interactive || props.drawMode !== 'stamp-box') return;
  const point = resolvePoint(event);
  if (!point) return;
  startPoint.value = point;
  draftBox.value = { x: point.x, y: point.y, width: 0, height: 0 };
}

function handleStampImageLoad(event) {
  const image = event.target;
  stampImageNaturalSize.value = {
    width: Number(image?.naturalWidth) || 0,
    height: Number(image?.naturalHeight) || 0,
  };
}

function handlePointerMove(event) {
  if (resizingBox.value) {
    const point = resolvePoint(event);
    if (!point) return;
    resizingBox.value = {
      ...resizingBox.value,
      box: resizeBoxFromHandle(resizingBox.value, point),
    };
    return;
  }
  if (draggingBox.value) {
    const point = resolvePoint(event);
    if (!point) return;
    const nextX = draggingBox.value.originBox.x + (point.x - draggingBox.value.startPoint.x);
    const nextY = draggingBox.value.originBox.y + (point.y - draggingBox.value.startPoint.y);
    draggingBox.value = {
      ...draggingBox.value,
      box: {
        ...draggingBox.value.originBox,
        x: Math.max(0, Math.min(SHEET_WIDTH - draggingBox.value.originBox.width, nextX)),
        y: Math.max(0, Math.min(SHEET_HEIGHT - draggingBox.value.originBox.height, nextY)),
      },
    };
    return;
  }
  if (!startPoint.value || !props.interactive || props.drawMode !== 'stamp-box') return;
  const point = resolvePoint(event);
  if (!point) return;
  draftBox.value = {
    x: Math.min(startPoint.value.x, point.x),
    y: Math.min(startPoint.value.y, point.y),
    width: Math.abs(point.x - startPoint.value.x),
    height: Math.abs(point.y - startPoint.value.y),
  };
}

function handlePointerUp() {
  if (resizingBox.value) {
    emit('box-drawn', {
      type: resizingBox.value.type,
      box: resizingBox.value.box,
    });
    resizingBox.value = null;
    return;
  }
  if (draggingBox.value) {
    emit('box-drawn', {
      type: draggingBox.value.type,
      box: draggingBox.value.box,
    });
    draggingBox.value = null;
    return;
  }
  if (!startPoint.value || !draftBox.value) return;
  const minWidth = 24;
  const minHeight = 24;
  const normalized = {
    x: draftBox.value.x,
    y: draftBox.value.y,
    width: Math.max(minWidth, draftBox.value.width),
    height: Math.max(minHeight, draftBox.value.height),
  };
  emit('box-drawn', {
    type: 'stamp-box',
    box: normalized,
  });
  startPoint.value = null;
  draftBox.value = null;
}

function beginDrag(type, event) {
  if (!props.interactive || props.drawMode !== 'none' || type !== 'stamp-box') return;
  emit('select');
  stampBoxSelected.value = true;
  event.stopPropagation();
  const point = resolvePoint(event);
  if (!point) return;
  const originBox = props.stamp.box;
  draggingBox.value = {
    type,
    startPoint: point,
    originBox: { ...originBox },
    box: { ...originBox },
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resizeBoxFromHandle(session, point) {
  const minWidth = 24;
  const minHeight = 24;
  const originLeft = session.originBox.x;
  const originTop = session.originBox.y;
  const originRight = session.originBox.x + session.originBox.width;
  const originBottom = session.originBox.y + session.originBox.height;
  const deltaX = point.x - session.startPoint.x;
  const deltaY = point.y - session.startPoint.y;

  let nextLeft = originLeft;
  let nextTop = originTop;
  let nextRight = originRight;
  let nextBottom = originBottom;

  if (session.direction.includes('w')) {
    nextLeft = clamp(originLeft + deltaX, 0, originRight - minWidth);
  }
  if (session.direction.includes('e')) {
    nextRight = clamp(originRight + deltaX, originLeft + minWidth, SHEET_WIDTH);
  }
  if (session.direction.includes('n')) {
    nextTop = clamp(originTop + deltaY, 0, originBottom - minHeight);
  }
  if (session.direction.includes('s')) {
    nextBottom = clamp(originBottom + deltaY, originTop + minHeight, SHEET_HEIGHT);
  }

  return {
    x: nextLeft,
    y: nextTop,
    width: nextRight - nextLeft,
    height: nextBottom - nextTop,
  };
}

function beginResize(type, direction, event) {
  if (!stampResizeEnabled.value || type !== 'stamp-box') return;
  emit('select');
  stampBoxSelected.value = true;
  event.stopPropagation();
  const point = resolvePoint(event);
  if (!point) return;
  const originBox = props.stamp.box;
  resizingBox.value = {
    type,
    direction,
    startPoint: point,
    originBox: { ...originBox },
    box: { ...originBox },
  };
}

function setEditorHtml(html) {
  if (!editorRef.value) return;
  if (editorRef.value.innerHTML !== html) {
    editorRef.value.innerHTML = html;
  }
  decorateEditorTokens(editorRef.value, { name: props.pageName });
}

function refreshEditorTokens() {
  if (!editorRef.value) return;
  decorateEditorTokens(editorRef.value, { name: props.pageName });
}

function syncEditorFromProps() {
  const normalizedHtml = buildInitialRichTextContent(props.template.contentHtml);
  setEditorHtml(normalizedHtml);
  emitSelectionStyleChange();
}

function getEditorHtml() {
  return buildInitialRichTextContent(editorRef.value?.innerHTML || '');
}

function persistEditor(shouldPersist = false) {
  const html = getEditorHtml();
  emit('content-updated', html);
  if (shouldPersist) {
    setEditorHtml(html);
    emit('content-persist', html);
  }
  return html;
}

function isRangeInsideEditor(range) {
  if (!range || !editorRef.value) return false;
  const container = range.commonAncestorContainer;
  return container === editorRef.value || editorRef.value.contains(container);
}

function cacheSelection() {
  if (!editorEnabled.value) return;
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (!isRangeInsideEditor(range)) return;
  savedSelectionRange.value = range.cloneRange();
}

function handleDocumentSelectionChange() {
  if (!editorFocused.value) return;
  cacheSelection();
  emitSelectionStyleChange();
}

function getPageSurfaceBounds() {
  const rect = pageSurfaceRef.value?.getBoundingClientRect();
  if (!rect) return null;
  return {
    x: Math.round(rect.left + window.scrollX),
    y: Math.round(rect.top + window.scrollY),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

async function waitForCaptureReady() {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const stampImage = pageSurfaceRef.value?.querySelector('.document-stamp-image');
  if (stampImage?.decode) {
    try {
      await stampImage.decode();
    } catch {
      // Ignore decode failures and let the next frame capture the current state.
    }
  }
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

function restoreSelection() {
  if (!savedSelectionRange.value) return false;
  const selection = window.getSelection();
  if (!selection) return false;
  selection.removeAllRanges();
  selection.addRange(savedSelectionRange.value.cloneRange());
  return true;
}

function getSelectionRange() {
  const selection = window.getSelection();
  if (!selection) return null;

  if ((!selection.rangeCount || !isRangeInsideEditor(selection.getRangeAt(0))) && savedSelectionRange.value) {
    restoreSelection();
  }

  if (!selection.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!isRangeInsideEditor(range)) return null;
  return range;
}

function getSelectionState() {
  const range = getSelectionRange();
  return {
    range,
    collapsed: !range || range.collapsed,
  };
}

function createStyledSpan(stylePatch) {
  const span = document.createElement('span');
  Object.entries(stylePatch).forEach(([key, value]) => {
    if (value) {
      span.style[key] = value;
    }
  });
  return span;
}

function placeCaretInsideTextNode(textNode, offset) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.setStart(textNode, offset);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  savedSelectionRange.value = range.cloneRange();
}

function applyTypingStyle(stylePatch) {
  if (!editorEnabled.value || !editorRef.value) return false;
  editorRef.value.focus();
  const range = getSelectionRange();
  if (!range) return false;

  const markerSpan = createStyledSpan(stylePatch);
  markerSpan.textContent = TYPING_MARKER;

  range.deleteContents();
  range.insertNode(markerSpan);
  placeCaretInsideTextNode(markerSpan.firstChild, 1);
  persistEditor();
  return true;
}

function execEditorCommand(command, value = null) {
  if (!editorEnabled.value || !editorRef.value) return false;
  editorRef.value.focus();
  const range = getSelectionRange();
  if (!range) return false;

  if (typeof document.execCommand === 'function') {
    document.execCommand(command, false, value);
    persistEditor(true);
    cacheSelection();
    return true;
  }

  return false;
}

function findBlockElement(node) {
  if (!node || !editorRef.value) return null;
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  if (!element) return null;
  const block = element.closest('div');
  if (!block || block === editorRef.value) return null;
  return editorRef.value.contains(block) ? block : null;
}

function resolveBlockFromRangeBoundary(container, offset) {
  if (!editorRef.value) return null;
  const blocks = Array.from(editorRef.value.children).filter((child) => child.nodeType === Node.ELEMENT_NODE);
  if (!blocks.length) return null;

  if (container === editorRef.value) {
    const directChild = editorRef.value.childNodes[Math.min(offset, Math.max(0, editorRef.value.childNodes.length - 1))];
    if (directChild?.nodeType === Node.ELEMENT_NODE && editorRef.value.contains(directChild)) {
      return directChild;
    }
    return blocks[Math.min(offset, blocks.length - 1)] || blocks[0];
  }

  if (container.nodeType === Node.ELEMENT_NODE && editorRef.value.contains(container)) {
    const targetChild = container.childNodes[offset > 0 ? offset - 1 : offset] || container.childNodes[0] || container;
    return findBlockElement(targetChild) || findBlockElement(container);
  }

  return findBlockElement(container);
}

function collectBlocksInRange(range) {
  if (!editorRef.value || !range) return [];
  const blocks = Array.from(editorRef.value.children).filter((child) => child.nodeType === Node.ELEMENT_NODE);
  if (!blocks.length) return [editorRef.value];

  const startBlock = resolveBlockFromRangeBoundary(range.startContainer, range.startOffset);
  const endBlock = resolveBlockFromRangeBoundary(range.endContainer, range.endOffset);

  if (startBlock && endBlock) {
    if (startBlock === endBlock) {
      return [startBlock];
    }

    const startIndex = blocks.indexOf(startBlock);
    const endIndex = blocks.indexOf(endBlock);
    if (startIndex >= 0 && endIndex >= 0) {
      const from = Math.min(startIndex, endIndex);
      const to = Math.max(startIndex, endIndex);
      return blocks.slice(from, to + 1);
    }
  }

  const selectedBlocks = blocks.filter((block) => range.intersectsNode(block));
  if (selectedBlocks.length) return selectedBlocks;

  const currentBlock = startBlock || resolveBlockFromRangeBoundary(range.startContainer, range.startOffset);
  return currentBlock ? [currentBlock] : [editorRef.value];
}

function getCurrentInlineStyleValue(propertyName) {
  const range = getSelectionRange();
  if (!range) return '';
  const node = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
  if (!node) return '';
  const inlineNode = node.closest?.('span');
  return inlineNode?.style?.[propertyName] || '';
}

function normalizePxFontSize(value) {
  const matched = String(value || '').match(/(\d+(?:\.\d+)?)px/i);
  if (!matched) return '';
  const size = Math.round(Number(matched[1]) * 10) / 10;
  if (!Number.isFinite(size)) return '';
  return Number.isInteger(size) ? String(size) : String(size);
}

function getStyleElementFromNode(node) {
  if (!node || !editorRef.value) return null;
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  if (!(element instanceof HTMLElement)) return null;
  return editorRef.value.contains(element) ? element : null;
}

function getLeadingStyleElement() {
  if (!editorRef.value) return null;
  const walker = document.createTreeWalker(editorRef.value, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    if (String(current.textContent || '').trim()) {
      return getStyleElementFromNode(current);
    }
    current = walker.nextNode();
  }
  return editorRef.value.firstElementChild instanceof HTMLElement ? editorRef.value.firstElementChild : editorRef.value;
}

function getLeadingBlockElement() {
  if (!editorRef.value) return null;
  const block = Array.from(editorRef.value.children).find((child) => String(child.textContent || '').trim());
  return block instanceof HTMLElement ? block : editorRef.value;
}

function getFontSizeFromNode(node) {
  const element = getStyleElementFromNode(node);
  if (!element) return '';
  return normalizePxFontSize(window.getComputedStyle(element).fontSize);
}

function getCurrentBlockElement(range) {
  if (!range) return null;
  return resolveBlockFromRangeBoundary(range.startContainer, range.startOffset)
    || findBlockElement(range.startContainer)
    || editorRef.value;
}

function getComputedStyleValue(node, propertyName) {
  const element = getStyleElementFromNode(node);
  if (!element) return '';
  return window.getComputedStyle(element)[propertyName] || '';
}

function getCaretAdjacentNode(range, direction) {
  if (!range) return null;
  const { startContainer, startOffset } = range;

  if (startContainer.nodeType === Node.TEXT_NODE) {
    const textLength = startContainer.textContent?.length || 0;
    if ((direction === 'backward' && startOffset > 0) || (direction === 'forward' && startOffset < textLength)) {
      return startContainer;
    }
    return findAdjacentNode(startContainer, direction);
  }

  const sibling = direction === 'backward'
    ? (startOffset > 0 ? startContainer.childNodes[startOffset - 1] : findAdjacentNode(startContainer, direction))
    : (startOffset < startContainer.childNodes.length ? startContainer.childNodes[startOffset] : findAdjacentNode(startContainer, direction));

  return sibling ? getDeepestCandidate(sibling, direction) : null;
}

function getCurrentSelectionFontSize() {
  const range = getSelectionRange();
  if (!range) {
    const fontSize = getFontSizeFromNode(getLeadingStyleElement());
    return fontSize || String(Math.max(12, props.template.fontSize));
  }

  const candidateNodes = [
    range.startContainer,
    range.commonAncestorContainer,
    getCaretAdjacentNode(range, 'forward'),
    getCaretAdjacentNode(range, 'backward'),
  ];

  for (const node of candidateNodes) {
    const fontSize = getFontSizeFromNode(node);
    if (fontSize) return fontSize;
  }

  return String(Math.max(12, props.template.fontSize));
}

function getCurrentSelectionFontFamily() {
  const range = getSelectionRange();
  if (!range) {
    return getComputedStyleValue(getLeadingStyleElement(), 'fontFamily') || props.template.fontFamily;
  }

  const candidateNodes = [
    range.startContainer,
    range.commonAncestorContainer,
    getCaretAdjacentNode(range, 'forward'),
    getCaretAdjacentNode(range, 'backward'),
  ];

  for (const node of candidateNodes) {
    const fontFamily = getComputedStyleValue(node, 'fontFamily');
    if (fontFamily) return fontFamily;
  }

  return props.template.fontFamily;
}

function getCurrentSelectionColor() {
  const range = getSelectionRange();
  if (!range) {
    return getComputedStyleValue(getLeadingStyleElement(), 'color') || props.template.textColor;
  }

  const candidateNodes = [
    range.startContainer,
    range.commonAncestorContainer,
    getCaretAdjacentNode(range, 'forward'),
    getCaretAdjacentNode(range, 'backward'),
  ];

  for (const node of candidateNodes) {
    const color = getComputedStyleValue(node, 'color');
    if (color) return color;
  }

  return props.template.textColor;
}

function getCurrentSelectionLineHeight() {
  const range = getSelectionRange();
  const block = getCurrentBlockElement(range) || getLeadingBlockElement();
  if (!(block instanceof HTMLElement)) return '1.2';

  if (/^\d+(\.\d+)?$/.test(String(block.style.lineHeight || '').trim())) {
    return block.style.lineHeight.trim();
  }

  const computedStyle = window.getComputedStyle(block);
  const computedLineHeight = String(computedStyle.lineHeight || '').trim();
  if (/^\d+(\.\d+)?$/.test(computedLineHeight)) {
    return computedLineHeight;
  }

  const fontSize = Number.parseFloat(computedStyle.fontSize || '');
  const lineHeightPx = Number.parseFloat(computedLineHeight || '');
  if (Number.isFinite(fontSize) && fontSize > 0 && Number.isFinite(lineHeightPx) && lineHeightPx > 0) {
    const ratio = Math.round((lineHeightPx / fontSize) * 10) / 10;
    return Number.isInteger(ratio) ? String(ratio) : String(ratio);
  }

  return '1.2';
}

function emitSelectionStyleChange() {
  emit('selection-style-change', {
    fontSize: getCurrentSelectionFontSize(),
    fontFamily: getCurrentSelectionFontFamily(),
    textColor: getCurrentSelectionColor(),
    lineHeight: getCurrentSelectionLineHeight(),
  });
}

function syncSelectionStyle() {
  emitSelectionStyleChange();
}

function applyInlineStyle(stylePatch) {
  if (!editorEnabled.value || !editorRef.value) return false;
  editorRef.value.focus();
  restoreSelection();
  const selectionState = getSelectionState();
  const { range, collapsed } = selectionState;
  if (!range) return false;

  if (collapsed) {
    return applyTypingStyle(stylePatch);
  }

  const fragment = range.extractContents();
  const wrapper = createStyledSpan(stylePatch);
  wrapper.appendChild(fragment);
  range.insertNode(wrapper);
  const selection = window.getSelection();
  if (!selection) return false;
  range.selectNodeContents(wrapper);
  selection.removeAllRanges();
  selection.addRange(range);
  savedSelectionRange.value = range.cloneRange();
  persistEditor();
  return true;
}

function applyParagraphStyle(stylePatch) {
  if (!editorEnabled.value || !editorRef.value) return false;
  editorRef.value.focus();
  const range = getSelectionRange();
  if (!range) return false;

  const blocks = collectBlocksInRange(range);
  blocks.forEach((block) => {
    Object.entries(stylePatch).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        block.style.removeProperty(key.replace(/[A-Z]/g, (matched) => `-${matched.toLowerCase()}`));
      } else {
        block.style[key] = value;
      }
    });
  });

  persistEditor(true);
  cacheSelection();
  return true;
}

function applyTextAlignment(alignment) {
  return applyParagraphStyle({ textAlign: alignment });
}

function insertHtmlAtSelection(html) {
  if (!editorRef.value) return;
  const selection = window.getSelection();
  if (!selection) return;

  if (!selection.rangeCount || !isRangeInsideEditor(selection.getRangeAt(0))) {
    moveCaretToEnd();
  }

  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (!isRangeInsideEditor(range)) return;

  range.deleteContents();
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const fragment = document.createDocumentFragment();
  let lastNode = null;
  while (temp.firstChild) {
    lastNode = fragment.appendChild(temp.firstChild);
  }
  range.insertNode(fragment);
  if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    cacheSelection();
  }
}

function insertParagraphAtSelection() {
  if (!editorRef.value) return;
  editorRef.value.focus();
  const range = getSelectionRange();
  if (!range) return;

  if (execEditorCommand('insertParagraph')) {
    return;
  }

  insertHtmlAtSelection('<div><br></div>');
  persistEditor();
}

function moveCaretToEnd() {
  if (!editorRef.value) return;
  editorRef.value.focus();
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(editorRef.value);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
  cacheSelection();
}

function handleEditorInput() {
  persistEditor();
  cacheSelection();
  emitSelectionStyleChange();
}

function handleEditorFocus() {
  editorFocused.value = true;
  stampBoxSelected.value = false;
  emit('select');
  cacheSelection();
  emitSelectionStyleChange();
}

function handleEditorBlur(event) {
  const nextTarget = event?.relatedTarget;
  if (nextTarget instanceof HTMLElement && nextTarget.closest('.studio-toolbar')) {
    cacheSelection();
    editorFocused.value = false;
    return;
  }
  editorFocused.value = false;
  persistEditor(true);
}

function handleEditorPointerDown(event) {
  event.stopPropagation();
  emit('select');
}

function findTokenElement(node) {
  if (!node) return null;
  if (node.nodeType === Node.ELEMENT_NODE) {
    return node.closest?.('[data-variable]') || null;
  }
  return node.parentElement?.closest?.('[data-variable]') || null;
}

function getDeepestCandidate(node, direction) {
  let current = node;
  while (current?.nodeType === Node.ELEMENT_NODE && current.childNodes.length) {
    current = direction === 'backward' ? current.lastChild : current.firstChild;
  }
  return current || node;
}

function findAdjacentNode(node, direction) {
  let current = node;
  while (current) {
    const sibling = direction === 'backward' ? current.previousSibling : current.nextSibling;
    if (sibling) {
      return getDeepestCandidate(sibling, direction);
    }
    current = current.parentNode;
    if (current === editorRef.value) {
      return null;
    }
  }
  return null;
}

function findTokenNearCaret(range, direction) {
  const { startContainer, startOffset } = range;
  let candidate = null;

  if (startContainer.nodeType === Node.TEXT_NODE) {
    const textLength = startContainer.textContent?.length || 0;
    if (direction === 'backward' && startOffset === 0) {
      candidate = findAdjacentNode(startContainer, direction);
    }
    if (direction === 'forward' && startOffset === textLength) {
      candidate = findAdjacentNode(startContainer, direction);
    }
  } else {
    candidate = direction === 'backward'
      ? (startOffset > 0 ? startContainer.childNodes[startOffset - 1] : findAdjacentNode(startContainer, direction))
      : (startOffset < startContainer.childNodes.length ? startContainer.childNodes[startOffset] : findAdjacentNode(startContainer, direction));
  }

  return findTokenElement(candidate);
}

function removeTokenElement(tokenElement, range) {
  if (!tokenElement) return false;
  const parent = tokenElement.parentNode;
  if (!parent) return false;
  const index = Array.prototype.indexOf.call(parent.childNodes, tokenElement);
  tokenElement.remove();

  const selection = window.getSelection();
  if (selection) {
    const nextRange = range.cloneRange();
    nextRange.setStart(parent, Math.max(0, Math.min(index, parent.childNodes.length)));
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    savedSelectionRange.value = nextRange.cloneRange();
  }

  persistEditor();
  return true;
}

function handleEditorKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    insertParagraphAtSelection();
    return;
  }

  if (event.key !== 'Backspace' && event.key !== 'Delete') return;
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (!isRangeInsideEditor(range) || !range.collapsed) return;

  const tokenElement = findTokenNearCaret(range, event.key === 'Backspace' ? 'backward' : 'forward');
  if (!tokenElement) return;

  event.preventDefault();
  removeTokenElement(tokenElement, range);
}

function handleEditorPaste(event) {
  event.preventDefault();
  const text = event.clipboardData?.getData('text/plain') || '';
  const lines = text.split(/\r?\n/);
  const html = lines
    .map((line) => {
      const escaped = line.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
      return `<div>${escaped || '<br>'}</div>`;
    })
    .join('');
  insertHtmlAtSelection(lines.length > 1 ? html : (html || '<div><br></div>'));
  persistEditor();
}

function applyTextStyle(stylePatch) {
  return applyInlineStyle(stylePatch);
}

function applyParagraphFormatting(stylePatch) {
  return applyParagraphStyle(stylePatch);
}

function insertVariableToken(variableName) {
  if (!editorEnabled.value || !editorRef.value) return false;
  editorRef.value.focus();
  restoreSelection();
  insertHtmlAtSelection(buildVariableTokenHtml(variableName));
  persistEditor(true);
  return true;
}

function toggleTextFormat(format) {
  const selectionState = getSelectionState();
  if (!selectionState.range) return false;

  if (!selectionState.collapsed) {
    const commandMap = {
      bold: 'bold',
      italic: 'italic',
      underline: 'underline',
    };
    const command = commandMap[format];
    if (!command) return false;
    return execEditorCommand(command);
  }

  const currentValueMap = {
    bold: getCurrentInlineStyleValue('fontWeight'),
    italic: getCurrentInlineStyleValue('fontStyle'),
    underline: getCurrentInlineStyleValue('textDecoration'),
  };

  if (format === 'bold') {
    return applyTypingStyle({ fontWeight: /^(700|bold)$/i.test(currentValueMap.bold) ? '400' : '700' });
  }
  if (format === 'italic') {
    return applyTypingStyle({ fontStyle: /^italic$/i.test(currentValueMap.italic) ? 'normal' : 'italic' });
  }
  if (format === 'underline') {
    return applyTypingStyle({ textDecoration: /underline/i.test(currentValueMap.underline) ? 'none' : 'underline' });
  }
  return false;
}

defineExpose({
  applyTextAlignment,
  applyParagraphFormatting,
  applyTextStyle,
  getPageSurfaceBounds,
  insertVariableToken,
  syncSelectionStyle,
  toggleTextFormat,
  waitForCaptureReady,
});

onMounted(() => {
  syncEditorFromProps();
  document.addEventListener('selectionchange', handleDocumentSelectionChange);
  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerup', handlePointerUp);
  document.addEventListener('pointercancel', handlePointerUp);
});

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', handleDocumentSelectionChange);
  document.removeEventListener('pointermove', handlePointerMove);
  document.removeEventListener('pointerup', handlePointerUp);
  document.removeEventListener('pointercancel', handlePointerUp);
});

watch(
  () => props.template.contentHtml,
  () => {
    if (!editorFocused.value) {
      syncEditorFromProps();
    }
  },
);

watch(
  () => props.drawMode,
  () => {
    stampBoxSelected.value = false;
    draggingBox.value = null;
    resizingBox.value = null;
    startPoint.value = null;
    draftBox.value = null;
    if (!editorFocused.value) {
      syncEditorFromProps();
    }
  },
);

watch(
  () => props.pageName,
  () => {
    refreshEditorTokens();
  },
);

watch(
  () => props.stamp.previewUrl,
  () => {
    stampImageNaturalSize.value = { width: 0, height: 0 };
  },
);
</script>

<template>
  <div class="document-preview-shell" :class="{ 'has-rulers': rulerVisible }" :style="previewShellStyle">
    <div v-if="rulerVisible" class="document-preview-ruler-corner"></div>
    <div v-if="rulerVisible" class="document-preview-ruler document-preview-ruler-horizontal">
      <div
        v-for="mark in horizontalRulerMarks"
        :key="`horizontal-${mark.label}`"
        class="document-preview-ruler-mark"
        :style="{ left: mark.offset }"
      >
        <i></i>
        <span>{{ mark.label }}</span>
      </div>
    </div>
    <div v-if="rulerVisible" class="document-preview-ruler document-preview-ruler-vertical">
      <div
        v-for="mark in verticalRulerMarks"
        :key="`vertical-${mark.label}`"
        class="document-preview-ruler-mark"
        :style="{ top: mark.offset }"
      >
        <i></i>
        <span>{{ mark.label }}</span>
      </div>
    </div>

    <div
      ref="pageSurfaceRef"
      class="document-surface"
      :class="{ 'is-thumbnail': scale < 1, 'is-active-thumbnail': active }"
      :style="surfaceStyle"
      @pointerdown="handlePointerDown"
    >
      <div class="document-layout-layer" :style="layoutLayerStyle">
        <div class="document-page-editor" :class="{ 'is-editable': editorEnabled }">
          <div
            v-if="editorEnabled"
            ref="editorRef"
            class="document-page-editor-content document-rich-text-editor"
            :style="pageEditorStyle"
            contenteditable="true"
            spellcheck="false"
            @blur="handleEditorBlur"
            @focus="handleEditorFocus"
            @input="handleEditorInput"
            @keydown="handleEditorKeydown"
            @paste="handleEditorPaste"
            @pointerdown="handleEditorPointerDown"
            @keyup="cacheSelection"
            @mouseup="cacheSelection"
          ></div>
          <div
            v-else
            class="document-page-editor-content"
            :style="pageEditorStyle"
            v-html="renderedContentHtml"
          ></div>
        </div>

        <div
          class="document-stamp-box"
          :class="{ 'is-selected': stampResizeEnabled && stampBoxSelected }"
          :style="stampBoxStyle"
          @pointerdown.stop="beginDrag('stamp-box', $event)"
        >
          <span v-if="rulerVisible && !captureMode" class="document-stamp-guide-label">{{ stampReferenceText }}</span>
          <img
            v-if="stamp.previewUrl"
            class="document-stamp-image"
            :src="stamp.previewUrl"
            :style="stampImageStyle"
            alt="企业公章"
            @load="handleStampImageLoad"
          />
          <span v-else class="document-stamp-placeholder">
            {{ stamp.imagePath ? '盖章加载失败' : '请导入盖章' }}
          </span>
          <button
            v-for="handle in stampResizeHandles"
            v-show="stampResizeEnabled && stampBoxSelected && !captureMode"
            :key="handle.direction"
            type="button"
            class="document-stamp-resize-handle"
            :class="`is-${handle.direction}`"
            :style="{ cursor: handle.cursor }"
            :aria-label="`调整盖章框${handle.direction}`"
            @pointerdown.stop="beginResize('stamp-box', handle.direction, $event)"
          ></button>
        </div>

        <div v-if="draftBox" class="document-draft-box" :style="draftBoxStyle"></div>
      </div>
    </div>
  </div>
</template>
