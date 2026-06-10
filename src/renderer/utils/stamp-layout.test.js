import { describe, expect, it } from 'vitest';
import { getScaledStampRect, STAMP_RANDOM_MIN_EDGE_GAP } from './stamp-layout';

describe('stamp layout', () => {
  const box = {
    x: 100,
    y: 200,
    width: 300,
    height: 240,
  };
  const imageSize = {
    width: 300,
    height: 300,
  };

  it('centers the stamp when random positioning is disabled', () => {
    const rect = getScaledStampRect(box, imageSize, {
      randomizePosition: false,
      seed: 'record-1',
    });

    expect(rect.width).toBeCloseTo(172.8);
    expect(rect.height).toBeCloseTo(172.8);
    expect(rect.x).toBeCloseTo(163.6);
    expect(rect.y).toBeCloseTo(233.6);
  });

  it('keeps the stamp inside the box and at least 8px away from the border when random positioning is enabled', () => {
    const rect = getScaledStampRect(box, imageSize, {
      randomizePosition: true,
      seed: 'record-1',
    });

    expect(rect.x).toBeGreaterThanOrEqual(box.x);
    expect(rect.y).toBeGreaterThanOrEqual(box.y);
    expect(rect.x + rect.width).toBeLessThanOrEqual(box.x + box.width);
    expect(rect.y + rect.height).toBeLessThanOrEqual(box.y + box.height);
    expect(rect.x - box.x).toBeGreaterThanOrEqual(STAMP_RANDOM_MIN_EDGE_GAP);
    expect(rect.y - box.y).toBeGreaterThanOrEqual(STAMP_RANDOM_MIN_EDGE_GAP);
    expect((box.x + box.width) - (rect.x + rect.width)).toBeGreaterThanOrEqual(STAMP_RANDOM_MIN_EDGE_GAP);
    expect((box.y + box.height) - (rect.y + rect.height)).toBeGreaterThanOrEqual(STAMP_RANDOM_MIN_EDGE_GAP);
    expect(rect.x).not.toBeCloseTo(163.6);
    expect(rect.y).not.toBeCloseTo(233.6);
  });

  it('returns stable random placement for the same seed', () => {
    const firstRect = getScaledStampRect(box, imageSize, {
      randomizePosition: true,
      seed: 'same-seed',
    });
    const secondRect = getScaledStampRect(box, imageSize, {
      randomizePosition: true,
      seed: 'same-seed',
    });

    expect(firstRect).toEqual(secondRect);
  });

  it('returns a different placement when the random seed changes', () => {
    const firstRect = getScaledStampRect(box, imageSize, {
      randomizePosition: true,
      seed: 'same-page:nonce-1',
    });
    const secondRect = getScaledStampRect(box, imageSize, {
      randomizePosition: true,
      seed: 'same-page:nonce-2',
    });

    expect(firstRect).not.toEqual(secondRect);
  });
});
