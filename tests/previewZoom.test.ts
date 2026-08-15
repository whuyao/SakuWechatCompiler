import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PREVIEW_ZOOM,
  MAX_PREVIEW_ZOOM,
  MIN_PREVIEW_ZOOM,
  normalizePreviewZoom,
  stepPreviewZoom
} from '../src/lib/previewZoom'

describe('公众号页面缩放', () => {
  it('使用 100% 作为无效设置的默认值，并规范化为 10% 步进', () => {
    expect(normalizePreviewZoom('invalid')).toBe(DEFAULT_PREVIEW_ZOOM)
    expect(normalizePreviewZoom('126')).toBe(130)
  })

  it('在 50% 到 200% 之间放大和缩小', () => {
    expect(stepPreviewZoom(100, 1)).toBe(110)
    expect(stepPreviewZoom(100, -1)).toBe(90)
    expect(stepPreviewZoom(MAX_PREVIEW_ZOOM, 1)).toBe(MAX_PREVIEW_ZOOM)
    expect(stepPreviewZoom(MIN_PREVIEW_ZOOM, -1)).toBe(MIN_PREVIEW_ZOOM)
  })
})
