export const STAMP_IMAGE_SCALE = 0.72;
export const STAMP_RANDOM_MIN_EDGE_GAP = 8;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hashSeed(seed) {
  let hash = 2166136261;
  const normalizedSeed = String(seed || '');
  for (let index = 0; index < normalizedSeed.length; index += 1) {
    hash ^= normalizedSeed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createUnitRandom(seed) {
  return hashSeed(seed) / 4294967295;
}

function pickOffsetRatio(seed, maxOffset) {
  if (maxOffset <= 0) return 0.5;

  const randomValue = createUnitRandom(seed);
  if (maxOffset < 24) {
    return randomValue;
  }

  const edgeBandRatio = 0.35;
  if (randomValue < 0.5) {
    return (randomValue / 0.5) * edgeBandRatio;
  }
  return 1 - (((1 - randomValue) / 0.5) * edgeBandRatio);
}

function getRandomOffset(seed, maxOffset) {
  if (maxOffset <= 0) return 0;

  const minEdgeGap = Math.min(STAMP_RANDOM_MIN_EDGE_GAP, maxOffset / 2);
  const availableOffset = maxOffset - (minEdgeGap * 2);
  if (availableOffset <= 0) {
    return maxOffset / 2;
  }

  return minEdgeGap + (availableOffset * pickOffsetRatio(seed, availableOffset));
}

export function getScaledStampRect(box, imageSize = {}, options = {}) {
  const safeBox = {
    x: Number(box?.x) || 0,
    y: Number(box?.y) || 0,
    width: Math.max(1, Number(box?.width) || 1),
    height: Math.max(1, Number(box?.height) || 1),
  };
  const naturalWidth = Math.max(1, Number(imageSize.width) || safeBox.width);
  const naturalHeight = Math.max(1, Number(imageSize.height) || safeBox.height);
  const targetWidth = safeBox.width * STAMP_IMAGE_SCALE;
  const targetHeight = safeBox.height * STAMP_IMAGE_SCALE;
  const imageRatio = naturalWidth / naturalHeight;
  const targetRatio = targetWidth / targetHeight;

  let drawWidth = targetWidth;
  let drawHeight = targetHeight;

  if (imageRatio > targetRatio) {
    drawHeight = targetWidth / imageRatio;
  } else {
    drawWidth = targetHeight * imageRatio;
  }

  const maxOffsetX = Math.max(0, safeBox.width - drawWidth);
  const maxOffsetY = Math.max(0, safeBox.height - drawHeight);
  const randomizePosition = Boolean(options.randomizePosition);
  const seed = String(options.seed || '');
  const offsetX = randomizePosition
    ? getRandomOffset(`${seed}:x`, maxOffsetX)
    : maxOffsetX / 2;
  const offsetY = randomizePosition
    ? getRandomOffset(`${seed}:y`, maxOffsetY)
    : maxOffsetY / 2;

  return {
    x: safeBox.x + clamp(offsetX, 0, maxOffsetX),
    y: safeBox.y + clamp(offsetY, 0, maxOffsetY),
    width: drawWidth,
    height: drawHeight,
  };
}
