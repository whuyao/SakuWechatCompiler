export type MarkdownOutlineItem = {
  id: string
  level: number
  title: string
  start: number
  end: number
  line: number
}

const cleanHeading = (value: string): string =>
  value
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_~]/g, '')
    .trim()

export const buildMarkdownOutline = (markdown: string): MarkdownOutlineItem[] => {
  const normalized = markdown.replaceAll('\r\n', '\n')
  const lines = normalized.split('\n')
  const result: MarkdownOutlineItem[] = []
  let offset = 0
  let fence: string | null = null

  lines.forEach((line, index) => {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)
    if (fenceMatch) {
      const marker = fenceMatch[1][0]
      if (!fence) fence = marker
      else if (fence === marker) fence = null
    } else if (!fence) {
      const match = line.match(/^(#{1,5})\s+(.+?)\s*#*\s*$/)
      if (match) {
        const title = cleanHeading(match[2])
        if (title) {
          result.push({
            id: `heading-${result.length + 1}`,
            level: match[1].length,
            title,
            start: offset,
            end: offset + line.length,
            line: index + 1
          })
        }
      }
    }
    offset += line.length + 1
  })

  return result
}
