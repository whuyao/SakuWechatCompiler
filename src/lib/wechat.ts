import { getBoxPreset } from '../editor/boxPresets'
import { sanitizeEditorHtml } from './markdown'
import { getWechatTheme } from './wechatThemes'

const appendStyle = (element: HTMLElement, cssText: string): void => {
  const existing = element.getAttribute('style') ?? ''
  element.setAttribute('style', `${cssText}${existing}`)
}

const forceStyle = (element: HTMLElement, cssText: string): void => {
  const existing = element.getAttribute('style') ?? ''
  element.setAttribute('style', `${existing}${cssText}`)
}

const CODE_LINE_STYLE =
  'margin:0;min-height:1.75em;padding:0;font-family:Menlo,Monaco,Consolas,"Courier New",monospace;font-size:12px;line-height:1.75em;letter-spacing:0;text-align:left;white-space:pre-wrap;word-break:break-all;overflow-wrap:anywhere;'

const LIST_ROW_STYLE =
  'display:table;box-sizing:border-box;width:100%;margin:5px 0;padding:0;font-size:15px;line-height:1.85em;table-layout:fixed;'

const LIST_CONTENT_STYLE =
  'display:table-cell;margin:0;padding:0;text-align:left;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;'

const CODE_TOKEN_PATTERN = /(\/\/.*$|#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:async|await|break|case|catch|class|const|continue|def|else|export|extends|false|finally|for|from|function|if|import|in|interface|let|new|null|private|public|return|throw|true|try|type|undefined|var|while)\b|\b\d+(?:\.\d+)?\b)/g

const appendHighlightedCode = (
  documentNode: Document,
  target: HTMLElement,
  line: string,
  darkBackground: boolean
): void => {
  let cursor = 0
  for (const match of line.matchAll(CODE_TOKEN_PATTERN)) {
    const index = match.index ?? 0
    if (index > cursor) target.append(documentNode.createTextNode(line.slice(cursor, index)))
    const token = documentNode.createElement('span')
    const value = match[0]
    const isComment = value.startsWith('//') || value.startsWith('#')
    const isString = ['"', "'", '`'].includes(value[0])
    const isNumber = /^\d/.test(value)
    const color = isComment
      ? darkBackground ? '#8fa78f' : '#668266'
      : isString
        ? darkBackground ? '#d7ba7d' : '#9b5c20'
        : isNumber
          ? darkBackground ? '#b5cea8' : '#27756a'
          : darkBackground ? '#c586c0' : '#7a4aa0'
    token.setAttribute('style', `color:${color};${isComment ? 'font-style:italic;' : ''}`)
    token.textContent = value
    target.append(token)
    cursor = index + value.length
  }
  if (cursor < line.length) target.append(documentNode.createTextNode(line.slice(cursor)))
  if (!line.length) target.textContent = '\u00a0'
}

export type WechatRenderOptions = {
  lineHeight?: number
  themeId?: string
}

export const renderWechatHtml = (editorHtml: string, options: WechatRenderOptions = {}): string => {
  const lineHeight = Math.min(2.3, Math.max(1.7, options.lineHeight ?? 2))
  const listLineHeight = Math.max(1.75, Number((lineHeight - 0.15).toFixed(2)))
  const theme = getWechatTheme(options.themeId)
  const styles = theme.styles
  const headingStyles: Record<string, string> = {
    H1: styles.h1,
    H2: styles.h2,
    H3: styles.h3,
    H4: styles.h4,
    H5: styles.h5
  }
  const tagStyles: Record<string, string> = {
    P: styles.paragraph,
    A: styles.link,
    STRONG: styles.strong,
    EM: styles.emphasis,
    U: 'text-decoration:underline;',
    DEL: 'text-decoration:line-through;',
    S: 'text-decoration:line-through;',
    SPAN: 'max-width:100%;',
    SUP: `margin-left:2px;color:${theme.accent};font-size:11px;line-height:1;vertical-align:super;`,
    TABLE: styles.table,
    THEAD: 'display:table-header-group;',
    TBODY: 'display:table-row-group;',
    TR: 'break-inside:avoid;page-break-inside:avoid;',
    TH: styles.tableHead,
    TD: styles.tableCell
  }
  const safeHtml = sanitizeEditorHtml(editorHtml)
  const documentNode = new DOMParser().parseFromString('<section></section>', 'text/html')
  const root = documentNode.querySelector('section') as HTMLElement
  root.innerHTML = safeHtml
  root.querySelectorAll<HTMLElement>('span[style]').forEach((span) =>
    span.setAttribute('data-saku-user-text-style', 'true')
  )

  root.setAttribute(
    'style',
    `${styles.container}line-height:${lineHeight}em !important;`
  )

  root.querySelectorAll<HTMLElement>('pre').forEach((codeBlock) => {
    const replacement = documentNode.createElement('section')
    const code = (codeBlock.textContent ?? '').replace(/\n$/, '').replaceAll('\t', '    ')
    const darkBackground = /background-color:\s*#[23]/i.test(styles.codeBlock)
    replacement.setAttribute('data-saku-wechat-code-block', 'true')
    replacement.setAttribute('style', styles.codeBlock)

    const header = documentNode.createElement('section')
    header.setAttribute('style', styles.codeHeader)
    ;['#ff5f57', '#febc2e', '#28c840'].forEach((color) => {
      const dot = documentNode.createElement('span')
      dot.setAttribute('style', `display:inline-block;width:9px;height:9px;margin-right:6px;border-radius:50%;background-color:${color};`)
      dot.innerHTML = '&nbsp;'
      header.append(dot)
    })
    replacement.append(header)

    code.split('\n').forEach((line) => {
      const codeLine = documentNode.createElement('section')
      const leadingSpaces = line.match(/^ +/)?.[0].length ?? 0
      codeLine.setAttribute('style', CODE_LINE_STYLE)
      if (leadingSpaces) codeLine.append(documentNode.createTextNode('\u00a0'.repeat(leadingSpaces)))
      appendHighlightedCode(documentNode, codeLine, line.slice(leadingSpaces), darkBackground)
      replacement.append(codeLine)
    })

    codeBlock.replaceWith(replacement)
  })

  root.querySelectorAll<HTMLElement>('code').forEach((inlineCode) => {
    const replacement = documentNode.createElement('span')
    replacement.setAttribute('data-saku-wechat-inline-code', 'true')
    replacement.setAttribute('style', styles.inlineCode)
    replacement.textContent = inlineCode.textContent
    inlineCode.replaceWith(replacement)
  })

  root.querySelectorAll<HTMLElement>('blockquote').forEach((quote) => {
    const replacement = documentNode.createElement('section')
    replacement.setAttribute('data-saku-wechat-quote', 'true')
    replacement.setAttribute('style', `${styles.quote}line-height:${Math.max(1.7, lineHeight - 0.15)}em !important;`)
    replacement.innerHTML = quote.innerHTML
    quote.replaceWith(replacement)
  })

  Array.from(root.querySelectorAll<HTMLElement>('ul,ol'))
    .reverse()
    .forEach((list) => {
      const replacement = documentNode.createElement('section')
      const ordered = list.tagName === 'OL'
      replacement.setAttribute('data-saku-wechat-list', ordered ? 'ordered' : 'bullet')
      replacement.setAttribute('style', styles.list)

      Array.from(list.children).forEach((item, index) => {
        if (item.tagName !== 'LI') return
        const row = documentNode.createElement('section')
        const marker = documentNode.createElement('span')
        const content = documentNode.createElement('section')
        row.setAttribute('style', `${LIST_ROW_STYLE}line-height:${listLineHeight}em;`)
        marker.setAttribute('style', styles.listMarker)
        marker.textContent = ordered ? `${index + 1}.` : '•'
        content.setAttribute('data-saku-wechat-list-content', 'true')
        content.setAttribute('style', LIST_CONTENT_STYLE)
        content.append(...Array.from(item.childNodes))
        row.append(marker, content)
        replacement.append(row)
      })

      list.replaceWith(replacement)
    })

  root.querySelectorAll<HTMLElement>('div').forEach((container) => {
    const replacement = documentNode.createElement('section')
    Array.from(container.attributes).forEach((attribute) =>
      replacement.setAttribute(attribute.name, attribute.value)
    )
    replacement.innerHTML = container.innerHTML
    container.replaceWith(replacement)
  })

  root.querySelectorAll<HTMLElement>('p').forEach((paragraph) => {
    const hasVisibleContent = Boolean(paragraph.textContent?.replaceAll('\u00a0', ' ').trim())
    const hasEmbeddedContent = Boolean(paragraph.querySelector('img,table,code,sup'))
    if (!hasVisibleContent && !hasEmbeddedContent) paragraph.remove()
  })

  root.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5').forEach((heading) => {
    const replacement = documentNode.createElement('section')
    const textAlign = heading.style.textAlign
    replacement.innerHTML = heading.innerHTML
    replacement.setAttribute('data-saku-wechat-heading', heading.tagName)
    replacement.setAttribute('style', `${headingStyles[heading.tagName]}break-after:avoid;page-break-after:avoid;`)
    if (textAlign) forceStyle(replacement, `text-align:${textAlign};`)
    heading.replaceWith(replacement)
  })

  root.querySelectorAll('hr').forEach((rule) => {
    const replacement = documentNode.createElement('section')
    replacement.setAttribute('style', styles.rule)
    replacement.innerHTML = '&nbsp;'
    rule.replaceWith(replacement)
  })

  root.querySelectorAll<HTMLElement>('table').forEach((table) => {
    const columnCount = table.querySelectorAll('tr:first-child > th, tr:first-child > td').length
    const compact = columnCount >= 4
    const cellStyle = compact
      ? 'padding:5px 4px;font-size:12px;line-height:1.5;'
      : 'padding:6px 7px;font-size:13px;line-height:1.55;'
    table.querySelectorAll<HTMLElement>('th,td').forEach((cell) => forceStyle(cell, cellStyle))
  })

  root.querySelectorAll<HTMLElement>('*').forEach((element) => {
    const tagStyle = tagStyles[element.tagName]
    if (tagStyle) appendStyle(element, tagStyle)

    if (element.tagName === 'P' && !element.hasAttribute('data-saku-caption')) {
      forceStyle(element, `line-height:${lineHeight}em !important;`)
    }

    if (element.tagName === 'LI') forceStyle(element, `line-height:${listLineHeight}em;`)

    if (element.matches('section[data-saku-box]')) {
      const preset = getBoxPreset(element.getAttribute('data-saku-box') ?? 'sakura-note')
      appendStyle(element, preset.style)
      element.removeAttribute('data-saku-box')
      element.removeAttribute('data-saku-box-name')
    }

    if (element.matches('section[data-saku-image-id]')) {
      const imageId = element.getAttribute('data-saku-image-id') ?? 'figure-01'
      const caption = element.getAttribute('data-saku-image-caption') ?? ''
      element.setAttribute(
        'style',
        styles.placeholder
      )
      element.textContent = `图片占位 · ${imageId}${caption ? `\n${caption}` : ''}`
      element.removeAttribute('data-saku-image-id')
      element.removeAttribute('data-saku-image-caption')
    }

    if (element.matches('p[data-saku-caption]')) {
      const kind = element.getAttribute('data-saku-caption') === 'table' ? '表' : '图'
      element.setAttribute(
        'style',
        `${styles.caption}${kind === '表' ? 'font-weight:700;' : ''}`
      )
      element.removeAttribute('data-saku-caption')
      element.removeAttribute('data-saku-caption-text')
    }

    element.removeAttribute('data-saku-citation')
    element.removeAttribute('data-saku-table-source')
    element.removeAttribute('data-saku-wechat-heading')
    element.removeAttribute('data-saku-wechat-code-block')
    element.removeAttribute('data-saku-wechat-inline-code')

    element.removeAttribute('class')
    element.removeAttribute('contenteditable')
  })

  root
    .querySelectorAll<HTMLElement>(
      'section[data-saku-wechat-quote] > p, section[data-saku-wechat-list-content] > p'
    )
    .forEach((paragraph) => forceStyle(paragraph, 'margin:0;'))

  root.querySelectorAll<HTMLElement>('span[data-saku-user-text-style]').forEach((span) => {
    if (span.style.color) {
      span.querySelectorAll<HTMLElement>('strong,em,a,u,s,del,sup').forEach((child) =>
        forceStyle(child, 'color:inherit;')
      )
    }
    span.removeAttribute('data-saku-user-text-style')
  })

  root.querySelectorAll<HTMLElement>('[data-saku-wechat-quote],[data-saku-wechat-list],[data-saku-wechat-list-content]')
    .forEach((element) => {
      element.removeAttribute('data-saku-wechat-quote')
      element.removeAttribute('data-saku-wechat-list')
      element.removeAttribute('data-saku-wechat-list-content')
    })

  return root.outerHTML
}

export const copyWechatRichText = async (html: string, text: string): Promise<void> => {
  if (window.saku) {
    await window.saku.writeRichText(html, text)
    return
  }

  if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
    const item = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' })
    })
    await navigator.clipboard.write([item])
    return
  }

  throw new Error('当前环境不支持富文本剪贴板，请在桌面应用中运行。')
}
