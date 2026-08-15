import { mergeAttributes, Node } from '@tiptap/core'
import { getBoxPreset } from './boxPresets'

const tableElementToMarkdown = (table: HTMLElement): string => {
  const rows = Array.from(table.querySelectorAll('tr')).map((row) =>
    Array.from(row.querySelectorAll('th,td')).map((cell) => (cell.textContent ?? '').trim().replaceAll('|', '\\|'))
  )
  if (rows.length === 0) return '| 列 1 |\n| --- |\n| 内容 |'
  const width = Math.max(...rows.map((row) => row.length), 1)
  const normalized = rows.map((row) => [...row, ...Array(Math.max(0, width - row.length)).fill('')])
  const header = normalized[0]
  const body = normalized.slice(1)
  return [
    `| ${header.join(' | ')} |`,
    `| ${Array(width).fill('---').join(' | ')} |`,
    ...body.map((row) => `| ${row.join(' | ')} |`)
  ].join('\n')
}

const markdownTableRows = (source: string): string[][] =>
  source
    .trim()
    .split('\n')
    .filter((_, index) => index !== 1)
    .map((line) => line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((cell) => cell.trim().replaceAll('\\|', '|')))

export const SakuBox = Node.create({
  name: 'sakuBox',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      preset: {
        default: 'sakura-note',
        parseHTML: (element) => element.getAttribute('data-saku-box') ?? 'sakura-note'
      }
    }
  },

  parseHTML() {
    return [{ tag: 'section[data-saku-box]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const preset = getBoxPreset(String(HTMLAttributes.preset ?? 'sakura-note'))
    const attributes = { ...HTMLAttributes }
    delete attributes.preset
    return [
      'section',
      mergeAttributes(attributes, {
        'data-saku-box': preset.id,
        'data-saku-box-name': preset.name,
        style: preset.style
      }),
      0
    ]
  }
})

export const SakuImagePlaceholder = Node.create({
  name: 'sakuImagePlaceholder',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      imageId: {
        default: 'figure-01',
        parseHTML: (element) => element.getAttribute('data-saku-image-id') ?? 'figure-01'
      },
      caption: {
        default: '请在微信后台插入图片',
        parseHTML: (element) => element.getAttribute('data-saku-image-caption') ?? ''
      }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-saku-image-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const imageId = String(HTMLAttributes.imageId ?? 'figure-01')
    const caption = String(HTMLAttributes.caption ?? '')
    return [
      'div',
      {
        'data-saku-image-id': imageId,
        'data-saku-image-caption': caption,
        class: 'saku-image-placeholder',
        contenteditable: 'false'
      },
      ['strong', {}, `图片占位 · ${imageId}`],
      ['span', {}, caption]
    ]
  }
})

export const SakuCaption = Node.create({
  name: 'sakuCaption',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      kind: {
        default: 'figure',
        parseHTML: (element) => element.getAttribute('data-saku-caption') ?? 'figure'
      },
      text: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-saku-caption-text') ?? element.textContent ?? ''
      }
    }
  },

  parseHTML() {
    return [{ tag: 'p[data-saku-caption]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const kind = String(HTMLAttributes.kind ?? 'figure')
    const text = String(HTMLAttributes.text ?? '')
    return [
      'p',
      {
        'data-saku-caption': kind,
        'data-saku-caption-text': text,
        class: `saku-caption saku-caption-${kind}`,
        contenteditable: 'false'
      },
      text
    ]
  }
})

export const SakuCitation = Node.create({
  name: 'sakuCitation',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      number: {
        default: '1',
        parseHTML: (element) => element.getAttribute('data-saku-citation') ?? element.textContent?.replace(/\D/g, '') ?? '1'
      }
    }
  },

  parseHTML() {
    return [{ tag: 'sup[data-saku-citation]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const number = String(HTMLAttributes.number ?? '1')
    return ['sup', { 'data-saku-citation': number, class: 'saku-citation', contenteditable: 'false' }, `[${number}]`]
  }
})

export const SakuTable = Node.create({
  name: 'sakuTable',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      source: {
        default: '| 列 1 |\n| --- |\n| 内容 |',
        parseHTML: (element) => element.getAttribute('data-saku-table-source') ?? tableElementToMarkdown(element)
      }
    }
  },

  parseHTML() {
    return [{ tag: 'table' }]
  },

  renderHTML({ HTMLAttributes }) {
    const source = String(HTMLAttributes.source ?? '')
    const rows = markdownTableRows(source)
    const header = rows[0] ?? ['列 1']
    const body = rows.slice(1)
    return [
      'table',
      { 'data-saku-table-source': source, class: 'saku-table', contenteditable: 'false' },
      ['thead', {}, ['tr', {}, ...header.map((cell) => ['th', {}, cell])]],
      ['tbody', {}, ...body.map((row) => ['tr', {}, ...row.map((cell) => ['td', {}, cell])])]
    ] as never
  }
})
