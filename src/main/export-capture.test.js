import { describe, expect, it } from 'vitest';
import exportCaptureModule from './export-capture';

const { resolveCaptureLayout } = exportCaptureModule;

describe('export capture layout', () => {
  it('keeps the requested output size on non-Windows platforms', () => {
    const layout = resolveCaptureLayout(
      { width: 2480, height: 3508 },
      'darwin',
      { width: 1920, height: 1080 },
    );

    expect(layout.outputWidth).toBe(2480);
    expect(layout.outputHeight).toBe(3508);
    expect(layout.viewportWidth).toBe(2480);
    expect(layout.viewportHeight).toBe(3508);
    expect(layout.fitScale).toBe(1);
    expect(layout.useOffscreen).toBe(false);
  });

  it('uses full-size offscreen rendering on Windows to preserve output sharpness', () => {
    const layout = resolveCaptureLayout(
      { width: 2480, height: 3508 },
      'win32',
      { width: 1920, height: 1080 },
    );

    expect(layout.outputWidth).toBe(2480);
    expect(layout.outputHeight).toBe(3508);
    expect(layout.viewportWidth).toBe(2480);
    expect(layout.viewportHeight).toBe(3508);
    expect(layout.fitScale).toBe(1);
    expect(layout.pageScale).toBeCloseTo(2480 / 794, 6);
    expect(layout.useOffscreen).toBe(true);
  });
});
