import { marked } from 'marked'
import TurndownService from 'turndown'

const ALLOWED_TAGS = new Set([
  'A',
  'BLOCKQUOTE',
  'BR',
  'CODE',
  'DEL',
  'DIV',
  'EM',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HR',
  'LI',
  'OL',
  'P',
  'PRE',
  'S',
  'SECTION',
  'SPAN',
  'STRONG',
  'SUP',
  'TABLE',
  'TBODY',
  'TD',
  'TH',
  'THEAD',
  'TR',
  'U',
  'UL'
])

const ALLOWED_INLINE_STYLES = new Set([
  'background-color',
  'color',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'letter-spacing',
  'text-decoration',
  'text-decoration-line',
  'text-align'
])

const escapeAttribute = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

export const normalizeSakuMarkdown = (markdown: string): string =>
  markdown.replace(
    /<span style="([^"\n]*font-family:[^"\n]*)"([^"\n]+)"([^"\n]*)">/gi,
    (_match, beforeFamily: string, familyName: string, afterFamily: string) =>
      `<span style="${beforeFamily}&quot;${escapeAttribute(familyName)}&quot;${afterFamily}">`
  )

export const sanitizeInlineStyle = (cssText: string): string => {
  const probe = document.createElement('span')
  const result: string[] = []

  cssText.split(';').forEach((declaration) => {
    const separator = declaration.indexOf(':')
    if (separator < 1) return
    const property = declaration.slice(0, separator).trim().toLowerCase()
    const value = declaration.slice(separator + 1).trim()
    const lowerValue = value.toLowerCase()
    if (!ALLOWED_INLINE_STYLES.has(property) || !value) return
    if (lowerValue.includes('url(') || lowerValue.includes('expression(') || lowerValue.includes('javascript:')) return

    probe.style.removeProperty(property)
    probe.style.setProperty(property, value)
    if (probe.style.getPropertyValue(property)) result.push(`${property}:${value}`)
  })

  return result.join(';')
}

const placeholderHtml = (imageId: string, caption: string): string =>
  `<div data-saku-image-id="${escapeAttribute(imageId)}" data-saku-image-caption="${escapeAttribute(caption)}"></div>`

const tableToMarkdown = (table: HTMLElement): string => {
  const rows = Array.from(table.querySelectorAll('tr')).map((row) =>
    Array.from(row.querySelectorAll('th,td')).map((cell) => (cell.textContent ?? '').trim().replaceAll('|', '\\|'))
  )
  if (rows.length === 0) return '| 列 1 |\n| --- |\n| 内容 |'
  const width = Math.max(...rows.map((row) => row.length), 1)
  const normalized = rows.map((row) => [...row, ...Array(Math.max(0, width - row.length)).fill('')])
  return [
    `| ${normalized[0].join(' | ')} |`,
    `| ${Array(width).fill('---').join(' | ')} |`,
    ...normalized.slice(1).map((row) => `| ${row.join(' | ')} |`)
  ].join('\n')
}

const expandSakuSyntax = (markdown: string): string => {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n')
  const output: string[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const boxMatch = line.match(/^:::saku-box\s+preset=["']?([\w-]+)["']?\s*$/)

    if (boxMatch) {
      const content: string[] = []
      index += 1
      while (index < lines.length && lines[index].trim() !== ':::') {
        content.push(lines[index])
        index += 1
      }
      const rendered = marked.parse(expandSakuSyntax(content.join('\n')), { async: false }) as string
      output.push(`<section data-saku-box="${escapeAttribute(boxMatch[1])}">${rendered}</section>`)
      continue
    }

    const placeholderMatch = line.match(/^\s*\{\{image:([^|}]+)(?:\|([^}]*))?\}\}\s*$/)
    if (placeholderMatch) {
      output.push(placeholderHtml(placeholderMatch[1].trim(), placeholderMatch[2]?.trim() ?? ''))
      continue
    }

    const captionMatch = line.match(/^\s*\{\{(figure|table)-caption:([^}]*)\}\}\s*$/)
    if (captionMatch) {
      const kind = captionMatch[1]
      const text = captionMatch[2].trim()
      output.push(`<p data-saku-caption="${kind}" data-saku-caption-text="${escapeAttribute(text)}">${escapeAttribute(text)}</p>`)
      continue
    }

    output.push(
      line.replace(/\{\{cite:(\d+)\}\}/g, (_match, number: string) =>
        `<sup data-saku-citation="${number}">[${number}]</sup>`
      )
    )
  }

  return output.join('\n')
}

export const sanitizeEditorHtml = (unsafeHtml: string): string => {
  const documentNode = new DOMParser().parseFromString(unsafeHtml, 'text/html')

  documentNode.querySelectorAll('script,style,iframe,object,embed,link,meta,svg').forEach((node) => node.remove())

  let imageCounter = 0
  documentNode.querySelectorAll('img').forEach((image) => {
    imageCounter += 1
    const placeholder = documentNode.createElement('div')
    placeholder.dataset.sakuImageId = `word-image-${String(imageCounter).padStart(2, '0')}`
    placeholder.dataset.sakuImageCaption = image.getAttribute('alt') || '从 Word 导入的图片，请在微信后台重新插入'
    image.replaceWith(placeholder)
  })

  Array.from(documentNode.body.querySelectorAll('*')).forEach((element) => {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes))
      return
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const isSakuData = name.startsWith('data-saku-')
      const isTableSpan = (name === 'colspan' || name === 'rowspan') && ['TD', 'TH'].includes(element.tagName)
      const isLink = name === 'href' && element.tagName === 'A'
      const isTextStyle =
        name === 'style' && ['SPAN', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)

      if (!isSakuData && !isTableSpan && !isLink && !isTextStyle) element.removeAttribute(attribute.name)
    })

    if (element.tagName === 'A') {
      const href = element.getAttribute('href') ?? ''
      if (!/^(https?:|mailto:)/i.test(href)) element.removeAttribute('href')
    }

    if (element.hasAttribute('style')) {
      const style = sanitizeInlineStyle(element.getAttribute('style') ?? '')
      if (style) element.setAttribute('style', style)
      else element.removeAttribute('style')
    }
  })

  return documentNode.body.innerHTML
}

export const markdownToHtml = (markdown: string): string => {
  const expanded = expandSakuSyntax(normalizeSakuMarkdown(markdown))
  const html = marked.parse(expanded, { async: false, gfm: true, breaks: false }) as string
  return sanitizeEditorHtml(html)
}

export const htmlToMarkdown = (html: string): string => {
  const service = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    blankReplacement: (_content, node) => {
      if (node.nodeName === 'DIV' && (node as HTMLElement).hasAttribute('data-saku-image-id')) {
        const element = node as HTMLElement
        const imageId = element.getAttribute('data-saku-image-id') ?? 'figure-01'
        const caption = element.getAttribute('data-saku-image-caption') ?? ''
        return `\n\n{{image:${imageId}${caption ? `|${caption}` : ''}}}\n\n`
      }
      return node.isBlock ? '\n\n' : ''
    }
  })

  service.addRule('sakuBox', {
    filter: (node) => node.nodeName === 'SECTION' && (node as HTMLElement).hasAttribute('data-saku-box'),
    replacement: (_content, node) => {
      const element = node as HTMLElement
      const preset = element.getAttribute('data-saku-box') ?? 'sakura-note'
      const inner = service.turndown(element.innerHTML).trim()
      return `\n\n:::saku-box preset="${preset}"\n${inner}\n:::\n\n`
    }
  })

  service.addRule('sakuImagePlaceholder', {
    filter: (node) => node.nodeName === 'DIV' && (node as HTMLElement).hasAttribute('data-saku-image-id'),
    replacement: (_content, node) => {
      const element = node as HTMLElement
      const imageId = element.getAttribute('data-saku-image-id') ?? 'figure-01'
      const caption = element.getAttribute('data-saku-image-caption') ?? ''
      return `\n\n{{image:${imageId}${caption ? `|${caption}` : ''}}}\n\n`
    }
  })

  service.addRule('sakuCaption', {
    filter: (node) => node.nodeName === 'P' && (node as HTMLElement).hasAttribute('data-saku-caption'),
    replacement: (_content, node) => {
      const element = node as HTMLElement
      const kind = element.getAttribute('data-saku-caption') === 'table' ? 'table' : 'figure'
      const text = element.getAttribute('data-saku-caption-text') ?? element.textContent ?? ''
      return `\n\n{{${kind}-caption:${text}}}\n\n`
    }
  })

  service.addRule('sakuCitation', {
    filter: (node) => node.nodeName === 'SUP' && (node as HTMLElement).hasAttribute('data-saku-citation'),
    replacement: (_content, node) => {
      const number = (node as HTMLElement).getAttribute('data-saku-citation') ?? '1'
      return `{{cite:${number}}}`
    }
  })

  service.addRule('sakuTable', {
    filter: ['table'],
    replacement: (_content, node) => {
      const element = node as HTMLElement
      return `\n\n${element.getAttribute('data-saku-table-source') ?? tableToMarkdown(element)}\n\n`
    }
  })

  service.addRule('styledSpan', {
    filter: (node) => node.nodeName === 'SPAN' && Boolean((node as HTMLElement).getAttribute('style')),
    replacement: (content, node) => {
      const style = sanitizeInlineStyle((node as HTMLElement).getAttribute('style') ?? '')
      return style ? `<span style="${escapeAttribute(style)}">${content}</span>` : content
    }
  })

  service.addRule('styledTextBlock', {
    filter: (node) => {
      if (!['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.nodeName)) return false
      const style = sanitizeInlineStyle((node as HTMLElement).getAttribute('style') ?? '')
      return /(?:^|;)text-align:/.test(style)
    },
    replacement: (_content, node) => {
      const element = node as HTMLElement
      const style = sanitizeInlineStyle(element.getAttribute('style') ?? '')
      if (!style) return service.turndown(element.innerHTML)
      const tag = element.tagName.toLowerCase()
      return `\n\n<${tag} style="${escapeAttribute(style)}">${element.innerHTML}</${tag}>\n\n`
    }
  })

  service.addRule('underline', {
    filter: ['u'],
    replacement: (content) => `<u>${content}</u>`
  })

  const cleanHtml = sanitizeEditorHtml(html)
  const markdown = service.turndown(cleanHtml).replace(/\n{3,}/g, '\n\n').trim()
  return `<!-- saku-format: 1 -->\n\n${markdown}\n`
}

export const richTextToMarkdown = (html: string): string =>
  htmlToMarkdown(html)
    .replace(/^<!-- saku-format: 1 -->\s*/, '')
    .replace(/^(\s*[-+*])\s{2,}/gm, '$1 ')
    .replace(/^(\s*\d+\.)\s{2,}/gm, '$1 ')
    .trim()
