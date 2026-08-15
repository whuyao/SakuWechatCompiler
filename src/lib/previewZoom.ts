export const DEFAULT_PREVIEW_ZOOM = 100
export const MIN_PREVIEW_ZOOM = 50
export const MAX_PREVIEW_ZOOM = 200
export const PREVIEW_ZOOM_STEP = 10

export const normalizePreviewZoom = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''))
  if (!Number.isFinite(parsed)) return DEFAULT_PREVIEW_ZOOM
  const stepped = Math.round(parsed / PREVIEW_ZOOM_STEP) * PREVIEW_ZOOM_STEP
  return Math.min(MAX_PREVIEW_ZOOM, Math.max(MIN_PREVIEW_ZOOM, stepped))
}

export const stepPreviewZoom = (value: unknown, direction: -1 | 1): number =>
  normalizePreviewZoom(normalizePreviewZoom(value) + direction * PREVIEW_ZOOM_STEP)
