import { describe, expect, it } from 'vitest';
import { getScaledStampRect } from './stamp-layout';

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

  it('keeps the stamp inside the box and away from the center when random positioning is enabled', () => {
    const rect = getScaledStampRect(box, imageSize, {
      randomizePosition: true,
      seed: 'record-1',
    });

    expect(rect.x).toBeGreaterThanOrEqual(box.x);
    expect(rect.y).toBeGreaterThanOrEqual(box.y);
    expect(rect.x + rect.width).toBeLessThanOrEqual(box.x + box.width);
    expect(rect.y + rect.height).toBeLessThanOrEqual(box.y + box.height);
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
});
