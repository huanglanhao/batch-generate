import officialSealTemplateUrl from '../assets/stamps/official-seal-template.png';
import sealFontUrl from '../assets/fonts/电子印章字体_mianfeiziti.com.ttf';
import guobiaoFangSongFontUrl from '../assets/fonts/国标仿宋_mianfeiziti.com.ttf';
import songtiFontUrl from '../assets/fonts/宋体_mianfeiziti.com.ttf';
import xiaoheSongtiExtraLightFontUrl from '../assets/fonts/小合简化体 宋体 Extra Light_mianfeiziti.com.ttf';
import xiaoheSongtiLightFontUrl from '../assets/fonts/小合简化体 宋体 Light_mianfeiziti.com.ttf';
import yongzhongSongtiFontUrl from '../assets/fonts/永中宋体_mianfeiziti.com.ttf';

const SEAL_TEXT_COLOR = '#ff2f2f';
const DEFAULT_EXPORT_SIZE = 512;
const GENERATED_SEAL_FONT_SIZE = 70;
const GENERATED_SEAL_TEXT_RADIUS = 179;
const GENERATED_SEAL_TEXT_CENTER_Y_OFFSET = -4;
const GENERATED_SEAL_TEXT_TRACKING = 8;
const GENERATED_SEAL_END_ANGLE_NUDGE_DEGREES = 6;
const GENERATED_SEAL_END_NUDGE_START = 0.72;
const GENERATED_SEAL_EXTREME_END_RELAX_DEGREES = 3.5;
const GENERATED_SEAL_EXTREME_END_START = 0.84;
const DEFAULT_STAMP_FONT_KEY = 'electronic-seal';
const STAMP_FONT_OPTIONS = [
  {
    key: 'guobiao-fangsong',
    label: '国标仿宋',
    family: 'GeneratedGuobiaoFangSongStampFont',
    source: guobiaoFangSongFontUrl,
  },
  {
    key: 'songti',
    label: '宋体',
    family: 'GeneratedSongtiStampFont',
    source: songtiFontUrl,
  },
  {
    key: 'xiaohe-songti-extra-light',
    label: '小合简化体宋体 Extra Light',
    family: 'GeneratedXiaoheSongtiExtraLightStampFont',
    source: xiaoheSongtiExtraLightFontUrl,
  },
  {
    key: 'xiaohe-songti-light',
    label: '小合简化体宋体 Light',
    family: 'GeneratedXiaoheSongtiLightStampFont',
    source: xiaoheSongtiLightFontUrl,
  },
  {
    key: 'yongzhong-songti',
    label: '永中宋体',
    family: 'GeneratedYongzhongSongtiStampFont',
    source: yongzhongSongtiFontUrl,
  },
  {
    key: 'electronic-seal',
    label: '电子印章字体',
    family: 'GeneratedElectronicSealFont',
    source: sealFontUrl,
  },
];

const stampFontReadyPromiseMap = new Map();
let sealTemplateImagePromise = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function loadSealTemplateImage() {
  if (!sealTemplateImagePromise) {
    sealTemplateImagePromise = loadImage(officialSealTemplateUrl);
  }
  return sealTemplateImagePromise;
}

function getStampFontOptionByKey(fontKey = DEFAULT_STAMP_FONT_KEY) {
  return STAMP_FONT_OPTIONS.find((option) => option.key === fontKey)
    || STAMP_FONT_OPTIONS.find((option) => option.key === DEFAULT_STAMP_FONT_KEY)
    || STAMP_FONT_OPTIONS[0];
}

async function ensureSealFontLoaded(fontKey = DEFAULT_STAMP_FONT_KEY) {
  if (typeof document === 'undefined' || !document.fonts || typeof FontFace !== 'function') {
    return;
  }
  const fontOption = getStampFontOptionByKey(fontKey);
  if (!stampFontReadyPromiseMap.has(fontOption.key)) {
    const fontReadyPromise = (async () => {
      const fontFace = new FontFace(
        fontOption.family,
        `url(${fontOption.source}) format("truetype")`,
      );
      const loadedFont = await fontFace.load();
      document.fonts.add(loadedFont);
      await document.fonts.load(`48px ${fontOption.family}`);
    })().catch((error) => {
      stampFontReadyPromiseMap.delete(fontOption.key);
      throw error;
    });
    stampFontReadyPromiseMap.set(fontOption.key, fontReadyPromise);
  }
  await stampFontReadyPromiseMap.get(fontOption.key);
}

export function normalizeStampText(text) {
  return String(text || '')
    .replace(/\s+/g, '')
    .trim();
}

export function getOfficialSealTemplateUrl() {
  return officialSealTemplateUrl;
}

export function getGeneratedSealFontFamily() {
  return getStampFontOptionByKey(DEFAULT_STAMP_FONT_KEY).family;
}

export function normalizeStampFontKey(fontKey) {
  return getStampFontOptionByKey(fontKey).key;
}

export function getStampFontOptions() {
  return STAMP_FONT_OPTIONS.map((option) => ({
    key: option.key,
    label: option.label,
  }));
}

export function buildArcTextLayout(text) {
  const characters = Array.from(normalizeStampText(text));
  const characterCount = characters.length;
  const fontSize = GENERATED_SEAL_FONT_SIZE;
  const radius = GENERATED_SEAL_TEXT_RADIUS + clamp(characterCount - 10, -4, 8) * 1.6;
  const arcSpanDegrees = clamp(136 + characterCount * 11.0, 166, 254);
  const startAngle = (270 - (arcSpanDegrees / 2)) * (Math.PI / 180);
  const angleStep = characterCount <= 1
    ? 0
    : (arcSpanDegrees * (Math.PI / 180)) / (characterCount - 1);

  return {
    characters,
    fontSize,
    radius,
    startAngle,
    angleStep,
  };
}

function buildMeasuredArcGlyphLayout(ctx, characters, textRadius, tracking = GENERATED_SEAL_TEXT_TRACKING) {
  if (!characters.length || !textRadius) return [];

  const glyphWidths = characters.map((character) => {
    const measuredWidth = Number(ctx.measureText(character).width) || 0;
    return Math.max(1, measuredWidth);
  });
  const letterSpacing = Math.max(0, Number(tracking) || 0);
  const totalArcLength = glyphWidths.reduce((sum, width) => sum + width, 0)
    + (Math.max(0, characters.length - 1) * letterSpacing);

  let currentArcOffset = -totalArcLength / 2;

  return characters.map((character, index) => {
    const glyphWidth = glyphWidths[index];
    const arcCenterOffset = currentArcOffset + (glyphWidth / 2);
    const normalizedOffset = totalArcLength <= 0 ? 0 : (arcCenterOffset / (totalArcLength / 2));
    const endZoneProgress = clamp(
      (Math.abs(normalizedOffset) - GENERATED_SEAL_END_NUDGE_START) / (1 - GENERATED_SEAL_END_NUDGE_START),
      0,
      1,
    );
    const endAngleNudge = (Math.PI / 180)
      * GENERATED_SEAL_END_ANGLE_NUDGE_DEGREES
      * -Math.sign(normalizedOffset)
      * (endZoneProgress ** 1.4);
    const extremeEndProgress = clamp(
      (Math.abs(normalizedOffset) - GENERATED_SEAL_EXTREME_END_START)
        / (1 - GENERATED_SEAL_EXTREME_END_START),
      0,
      1,
    );
    const extremeEndRelax = (Math.PI / 180)
      * GENERATED_SEAL_EXTREME_END_RELAX_DEGREES
      * Math.sign(normalizedOffset)
      * (extremeEndProgress ** 1.2);
    const angle = (-Math.PI / 2)
      + (arcCenterOffset / textRadius)
      + endAngleNudge
      + extremeEndRelax;
    currentArcOffset += glyphWidth + letterSpacing;
    return {
      character,
      angle,
    };
  });
}

export async function generateStampPreviewUrl({
  text,
  fontKey = DEFAULT_STAMP_FONT_KEY,
  size = DEFAULT_EXPORT_SIZE,
} = {}) {
  const normalizedText = normalizeStampText(text);
  if (!normalizedText) return '';

  const normalizedFontKey = normalizeStampFontKey(fontKey);
  const fontOption = getStampFontOptionByKey(normalizedFontKey);
  await ensureSealFontLoaded(normalizedFontKey);
  const templateImage = await loadSealTemplateImage();
  const exportSize = Math.max(128, Math.round(Number(size) || DEFAULT_EXPORT_SIZE));
  const scale = exportSize / Math.max(1, templateImage.naturalWidth || templateImage.width || DEFAULT_EXPORT_SIZE);
  const canvas = document.createElement('canvas');
  canvas.width = exportSize;
  canvas.height = exportSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.clearRect(0, 0, exportSize, exportSize);
  ctx.drawImage(templateImage, 0, 0, exportSize, exportSize);

  const { characters, fontSize, radius, startAngle, angleStep } = buildArcTextLayout(normalizedText);
  const centerX = exportSize / 2;
  const centerY = (exportSize / 2) + (GENERATED_SEAL_TEXT_CENTER_Y_OFFSET * scale);
  const textRadius = radius * scale;

  ctx.save();
  ctx.fillStyle = SEAL_TEXT_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${fontSize * scale}px "${fontOption.family}", "Microsoft YaHei", sans-serif`;
  const glyphLayout = buildMeasuredArcGlyphLayout(
    ctx,
    characters,
    textRadius,
    GENERATED_SEAL_TEXT_TRACKING * scale,
  );

  glyphLayout.forEach(({ character, angle }) => {
    const x = centerX + Math.cos(angle) * textRadius;
    const y = centerY + Math.sin(angle) * textRadius;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + (Math.PI / 2));
    ctx.fillText(character, 0, 0);
    ctx.restore();
  });

  ctx.restore();
  return canvas.toDataURL('image/png');
}
