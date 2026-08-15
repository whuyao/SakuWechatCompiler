export const sanitizeFileStem = (value: string | undefined, fallback: string): string => {
  const stem = (value ?? '')
    .trim()
    .replace(/\.(?:sakuwechat|markdown|md|docx|pdf)$/i, '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[.\s]+$/g, '')
    .trim()

  return stem || fallback
}

export const buildSuggestedFileName = (
  value: string | undefined,
  fallback: string,
  extension: string
): string => `${sanitizeFileStem(value, fallback)}.${extension.replace(/^\./, '')}`
