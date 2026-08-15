import { useEffect, useMemo, useRef, useState, type ClipboardEvent as ReactClipboardEvent, type CSSProperties, type MouseEvent } from 'react'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import TextAlign from '@tiptap/extension-text-align'
import { FontSize, TextStyle } from '@tiptap/extension-text-style'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ClearFormattingIcon,
  FormatPainterIcon,
  RedoIcon,
  UndoIcon
} from './components/ToolbarIcons'
import { BOX_PRESETS } from './editor/boxPresets'
import { SakuBox, SakuCaption, SakuCitation, SakuImagePlaceholder, SakuTable } from './editor/extensions'
import {
  htmlToMarkdown,
  markdownToHtml,
  normalizeSakuMarkdown,
  richTextToMarkdown,
  sanitizeEditorHtml
} from './lib/markdown'
import { createProject, parseProject } from './lib/project'
import { applyFormatBrush, captureFormatBrush, type FormatBrushSnapshot } from './lib/formatBrush'
import { buildMarkdownOutline, type MarkdownOutlineItem } from './lib/outline'
import { copyWechatRichText, renderWechatHtml } from './lib/wechat'
import { DEFAULT_WECHAT_THEME_ID, getWechatTheme, WECHAT_THEMES } from './lib/wechatThemes'
import appLogo from '../resources/app-logo-source.png'

const SAMPLE_MARKDOWN = `# 欢迎使用 SakuWechatCompiler

这是一个完全离线运行的微信公众号排版工具。你可以直接选中文字，在右侧调整字体、字号与颜色。

:::saku-box preset="sakura-note"
## 从这里开始

从左侧选择一个彩色框，就能包裹当前段落或选中的多个段落。
:::

## Markdown 与可视化编辑

文章可以导入或导出为扩展 Markdown；工程文件则会保留完整编辑状态。

- 支持标题、列表、引用和代码块
- 支持任意选中文字设置样式
- 支持一键复制微信兼容富文本

{{image:figure-01|请在微信后台插入文章配图}}
`

const FONT_OPTIONS = [
  { label: '系统中文', value: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif' },
  { label: '苹方', value: '"PingFang SC", sans-serif' },
  { label: '宋体风格', value: 'Songti SC, STSong, serif' },
  { label: '黑体风格', value: 'Heiti SC, STHeiti, sans-serif' },
  { label: '等宽字体', value: 'SFMono-Regular, Menlo, Monaco, monospace' }
]

const FONT_SIZES = ['13px', '14px', '15px', '16px', '17px', '18px', '20px', '22px', '24px', '28px', '32px']

type Toast = { message: string; kind: 'success' | 'error' | 'info' }
type PreviewMode = 'final' | 'visual'
type UtilityDrawer = 'themes' | 'outline' | null
type SidebarTab = 'boxes' | 'academic' | 'image'
type FormatBrushMode = 'single' | 'continuous' | null

const readFavoriteThemes = (): string[] => {
  try {
    const stored = JSON.parse(localStorage.getItem('saku-wechat-favorite-themes') ?? '[]')
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

const stripExtension = (name: string): string => name.replace(/\.(sakuwechat|markdown|md|docx)$/i, '')

function App() {
  const [documentTitle, setDocumentTitle] = useState('未命名文章')
  const [projectPath, setProjectPath] = useState<string | null>(null)
  const [markdownPath, setMarkdownPath] = useState<string | null>(null)
  const [importedDocumentPath, setImportedDocumentPath] = useState<string | null>(null)
  const [projectCreatedAt, setProjectCreatedAt] = useState<string | undefined>()
  const [dirty, setDirty] = useState(false)
  const [source, setSource] = useState(SAMPLE_MARKDOWN)
  const [selectionRevision, setSelectionRevision] = useState(0)
  const [toast, setToast] = useState<Toast | null>(null)
  const [imageId, setImageId] = useState('figure-02')
  const [imageCaption, setImageCaption] = useState('请在微信后台插入图片')
  const [figureCaption, setFigureCaption] = useState('图 1｜图片说明或来源')
  const [tableCaption, setTableCaption] = useState('表 1｜数据说明或来源')
  const [tableRows, setTableRows] = useState(3)
  const [tableColumns, setTableColumns] = useState(3)
  const [citationNumber, setCitationNumber] = useState(1)
  const [referenceText, setReferenceText] = useState('作者. 文献标题. 出版物, 年份.')
  const [wechatLineHeight, setWechatLineHeight] = useState(2)
  const [wechatTheme, setWechatTheme] = useState(DEFAULT_WECHAT_THEME_ID)
  const [favoriteThemes, setFavoriteThemes] = useState<string[]>(readFavoriteThemes)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('final')
  const [utilityDrawer, setUtilityDrawer] = useState<UtilityDrawer>(null)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('boxes')
  const [checkingForUpdates, setCheckingForUpdates] = useState(false)
  const [formatBrushMode, setFormatBrushMode] = useState<FormatBrushMode>(null)
  const sourceSyncTimer = useRef<number | null>(null)
  const sourceTextareaRef = useRef<HTMLTextAreaElement>(null)
  const formatBrushRef = useRef<FormatBrushSnapshot | null>(null)
  const formatBrushModeRef = useRef<FormatBrushMode>(null)
  const formatBrushApplyTimer = useRef<number | null>(null)
  const formatBrushApplyingRef = useRef(false)
  const lastFormatBrushRangeRef = useRef<{ from: number; to: number } | null>(null)

  const notify = (message: string, kind: Toast['kind'] = 'success') => {
    setToast({ message, kind })
    window.setTimeout(() => setToast(null), 2800)
  }

  const updateFormatBrushMode = (mode: FormatBrushMode) => {
    formatBrushModeRef.current = mode
    setFormatBrushMode(mode)
  }

  const clearFormatBrush = () => {
    if (formatBrushApplyTimer.current) window.clearTimeout(formatBrushApplyTimer.current)
    formatBrushApplyTimer.current = null
    formatBrushRef.current = null
    lastFormatBrushRangeRef.current = null
    updateFormatBrushMode(null)
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      SakuBox,
      SakuImagePlaceholder,
      SakuCaption,
      SakuCitation,
      SakuTable
    ],
    content: markdownToHtml(SAMPLE_MARKDOWN),
    editorProps: {
      attributes: {
        class: 'saku-editor-content',
        spellcheck: 'true'
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      setSource(htmlToMarkdown(currentEditor.getHTML()))
      setDirty(true)
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      setSelectionRevision((revision) => revision + 1)
      if (formatBrushApplyingRef.current) return
      const snapshot = formatBrushRef.current
      const mode = formatBrushModeRef.current
      if (!snapshot || !mode) return

      const { from, to } = currentEditor.state.selection
      if (from === to) {
        lastFormatBrushRangeRef.current = null
        return
      }
      if (from === snapshot.sourceFrom && to === snapshot.sourceTo) return
      if (lastFormatBrushRangeRef.current?.from === from && lastFormatBrushRangeRef.current.to === to) return

      if (formatBrushApplyTimer.current) window.clearTimeout(formatBrushApplyTimer.current)
      formatBrushApplyTimer.current = window.setTimeout(() => {
        formatBrushApplyTimer.current = null
        const liveSnapshot = formatBrushRef.current
        const liveMode = formatBrushModeRef.current
        if (!liveSnapshot || !liveMode) return

        const selection = currentEditor.state.selection
        if (selection.empty || (selection.from === liveSnapshot.sourceFrom && selection.to === liveSnapshot.sourceTo)) return

        if (liveMode === 'single') clearFormatBrush()
        else lastFormatBrushRangeRef.current = { from: selection.from, to: selection.to }

        formatBrushApplyingRef.current = true
        let applied = false
        try {
          applied = applyFormatBrush(currentEditor, liveSnapshot)
        } finally {
          formatBrushApplyingRef.current = false
        }
        if (applied) {
          notify(liveMode === 'continuous' ? '格式已应用，连续格式刷仍处于开启状态。' : '格式刷已应用到目标文字。')
        }
      }, 120)
    }
  })

  useEffect(() => {
    window.saku?.setDirtyState(dirty)
  }, [dirty])

  useEffect(() => {
    localStorage.setItem('saku-wechat-favorite-themes', JSON.stringify(favoriteThemes))
  }, [favoriteThemes])

  useEffect(() => {
    if (!formatBrushMode) return
    const cancelWithEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      clearFormatBrush()
    }
    window.addEventListener('keydown', cancelWithEscape)
    return () => window.removeEventListener('keydown', cancelWithEscape)
  }, [formatBrushMode])

  useEffect(
    () => () => {
      if (sourceSyncTimer.current) window.clearTimeout(sourceSyncTimer.current)
      if (formatBrushApplyTimer.current) window.clearTimeout(formatBrushApplyTimer.current)
    },
    []
  )

  const currentHtml = (): string => {
    return markdownToHtml(source)
  }

  const currentMarkdown = (): string => normalizeSakuMarkdown(source)

  const updateSource = (nextSource: string) => {
    setSource(nextSource)
    setDirty(true)
    if (sourceSyncTimer.current) window.clearTimeout(sourceSyncTimer.current)
    sourceSyncTimer.current = window.setTimeout(() => {
      editor?.commands.setContent(markdownToHtml(nextSource), { emitUpdate: false })
      setSelectionRevision((revision) => revision + 1)
    }, 160)
  }

  const handleSourcePaste = (event: ReactClipboardEvent<HTMLTextAreaElement>) => {
    const richHtml = event.clipboardData.getData('text/html')
    if (!richHtml.trim()) return

    event.preventDefault()
    const textarea = event.currentTarget
    const start = textarea.selectionStart
    const markdown = richTextToMarkdown(richHtml)
    const insertion = markdown || event.clipboardData.getData('text/plain')
    const before = source.slice(0, start)
    const after = source.slice(textarea.selectionEnd)
    const prefix = before && !before.endsWith('\n') ? '\n\n' : ''
    const suffix = after && !after.startsWith('\n') ? '\n\n' : ''
    updateSource(`${before}${prefix}${insertion}${suffix}${after}`)
    window.requestAnimationFrame(() => {
      const cursor = start + prefix.length + insertion.length
      textarea.focus()
      textarea.setSelectionRange(cursor, cursor)
    })
    notify('已将富文本智能转换为 Markdown。', 'info')
  }

  const chooseTheme = (themeId: string) => {
    setWechatTheme(getWechatTheme(themeId).id)
    setDirty(true)
  }

  const toggleFavoriteTheme = (event: MouseEvent<HTMLButtonElement>, themeId: string) => {
    event.stopPropagation()
    setFavoriteThemes((current) =>
      current.includes(themeId) ? current.filter((id) => id !== themeId) : [...current, themeId]
    )
  }

  const jumpToOutlineItem = (item: MarkdownOutlineItem) => {
    const textarea = sourceTextareaRef.current
    if (!textarea) return
    setUtilityDrawer(null)
    textarea.focus()
    textarea.setSelectionRange(item.start, item.end)
    const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight) || 23
    textarea.scrollTop = Math.max(0, (item.line - 1) * lineHeight - textarea.clientHeight * 0.28)
  }

  const replaceMarkdownSelection = (
    replacement: (selected: string) => { text: string; selectionStart: number; selectionEnd: number }
  ) => {
    const textarea = sourceTextareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const result = replacement(source.slice(start, end))
    updateSource(`${source.slice(0, start)}${result.text}${source.slice(end)}`)
    window.requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + result.selectionStart, start + result.selectionEnd)
    })
  }

  const wrapMarkdownSelection = (before: string, after: string, placeholder: string) => {
    replaceMarkdownSelection((selected) => {
      const content = selected || placeholder
      return {
        text: `${before}${content}${after}`,
        selectionStart: before.length,
        selectionEnd: before.length + content.length
      }
    })
  }

  const setMarkdownHeading = (level: 0 | 1 | 2 | 3 | 4 | 5) => {
    const textarea = sourceTextareaRef.current
    if (!textarea) return
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const lineStart = source.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1
    const nextBreak = source.indexOf('\n', selectionEnd)
    const lineEnd = nextBreak === -1 ? source.length : nextBreak
    const prefix = level ? `${'#'.repeat(level)} ` : ''
    const transformed = source
      .slice(lineStart, lineEnd)
      .split('\n')
      .map((line) => `${prefix}${line.replace(/^#{1,6}\s+/, '')}`)
      .join('\n')
    updateSource(`${source.slice(0, lineStart)}${transformed}${source.slice(lineEnd)}`)
    window.requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(lineStart, lineStart + transformed.length)
    })
  }

  const prefixMarkdownLines = (kind: 'quote' | 'bullet' | 'ordered') => {
    const textarea = sourceTextareaRef.current
    if (!textarea) return
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const lineStart = source.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1
    const nextBreak = source.indexOf('\n', selectionEnd)
    const lineEnd = nextBreak === -1 ? source.length : nextBreak
    const transformed = source
      .slice(lineStart, lineEnd)
      .split('\n')
      .map((line, index) => {
        const clean = line.replace(/^(?:>\s+|[-*+]\s+|\d+\.\s+)/, '')
        if (kind === 'quote') return `> ${clean}`
        if (kind === 'ordered') return `${index + 1}. ${clean}`
        return `- ${clean}`
      })
      .join('\n')
    updateSource(`${source.slice(0, lineStart)}${transformed}${source.slice(lineEnd)}`)
    window.requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(lineStart, lineStart + transformed.length)
    })
  }

  const insertMarkdownDivider = () => {
    replaceMarkdownSelection(() => ({ text: '\n\n---\n\n', selectionStart: 7, selectionEnd: 7 }))
  }

  const insertMarkdownCodeBlock = () => {
    replaceMarkdownSelection((selected) => {
      const content = selected || 'const message = "Hello WeChat";'
      const fence = content.includes('```') ? '````' : '```'
      const before = `\n\n${fence}\n`
      const after = `\n${fence}\n\n`
      return {
        text: `${before}${content}${after}`,
        selectionStart: before.length,
        selectionEnd: before.length + content.length
      }
    })
  }

  const cleanDirectiveText = (value: string) => value.trim().replaceAll('}}', '')

  const insertFigureCaption = () => {
    const caption = cleanDirectiveText(figureCaption) || '图 1｜图片说明或来源'
    replaceMarkdownSelection(() => {
      const text = `\n\n{{figure-caption:${caption}}}\n\n`
      return { text, selectionStart: text.length, selectionEnd: text.length }
    })
  }

  const insertTableCaption = () => {
    const caption = cleanDirectiveText(tableCaption) || '表 1｜数据说明或来源'
    replaceMarkdownSelection(() => {
      const text = `\n\n{{table-caption:${caption}}}\n\n`
      return { text, selectionStart: text.length, selectionEnd: text.length }
    })
  }

  const insertMarkdownTable = () => {
    const columns = Math.min(8, Math.max(1, Math.round(tableColumns)))
    const rows = Math.min(20, Math.max(1, Math.round(tableRows)))
    const header = `| ${Array.from({ length: columns }, (_, index) => `列 ${index + 1}`).join(' | ')} |`
    const separator = `| ${Array(columns).fill('---').join(' | ')} |`
    const body = Array.from({ length: rows }, () => `| ${Array(columns).fill('内容').join(' | ')} |`).join('\n')
    const caption = cleanDirectiveText(tableCaption) || '表 1｜数据说明或来源'
    replaceMarkdownSelection(() => {
      const text = `\n\n{{table-caption:${caption}}}\n\n${header}\n${separator}\n${body}\n\n`
      return { text, selectionStart: text.length, selectionEnd: text.length }
    })
  }

  const insertAcademicCitation = (appendReference: boolean) => {
    const textarea = sourceTextareaRef.current
    if (!textarea) return
    const number = Math.max(1, Math.round(citationNumber))
    const marker = `{{cite:${number}}}`
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    let nextSource = `${source.slice(0, start)}${marker}${source.slice(end)}`

    if (appendReference && referenceText.trim()) {
      const entry = `${number}. ${referenceText.trim()}`
      nextSource = /^## 参考文献\s*$/m.test(nextSource)
        ? `${nextSource.trimEnd()}\n${entry}\n`
        : `${nextSource.trimEnd()}\n\n## 参考文献\n\n${entry}\n`
      setCitationNumber(number + 1)
    }

    updateSource(nextSource)
    window.requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + marker.length, start + marker.length)
    })
  }

  const importContent = async () => {
    if (!window.saku || !editor) {
      notify('请在 Electron 桌面应用中导入文件。', 'error')
      return
    }

    try {
      const result = await window.saku.importContent()
      if (!result) return

      const html = result.kind === 'docx' ? sanitizeEditorHtml(result.content) : markdownToHtml(result.content)
      editor.commands.setContent(html, { emitUpdate: false })
      setSource(result.kind === 'markdown' ? normalizeSakuMarkdown(result.content) : htmlToMarkdown(html))
      setDocumentTitle(stripExtension(result.name))
      setProjectPath(null)
      setMarkdownPath(result.kind === 'markdown' ? result.path : null)
      setImportedDocumentPath(result.path)
      setProjectCreatedAt(undefined)
      setDirty(true)

      const imageNotice = result.imageCount ? `，${result.imageCount} 张图片已替换为占位符` : ''
      const warning = result.warnings.length ? `，有 ${result.warnings.length} 条转换提示` : ''
      notify(`已导入 ${result.name}${imageNotice}${warning}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : '导入失败。', 'error')
    }
  }

  const openProject = async () => {
    if (!window.saku || !editor) return notify('请在 Electron 桌面应用中打开工程。', 'error')

    try {
      const result = await window.saku.openProject()
      if (!result) return
      const project = parseProject(result.content)
      editor.commands.setContent(project.document.html, { emitUpdate: false })
      setSource(project.document.markdown || htmlToMarkdown(project.document.html))
      setDocumentTitle(project.title)
      setProjectPath(result.path)
      setMarkdownPath(null)
      setImportedDocumentPath(null)
      setProjectCreatedAt(project.createdAt)
      setWechatLineHeight(project.settings.wechatLineHeight)
      setWechatTheme(project.settings.wechatTheme)
      setDirty(false)
      notify(`已打开工程 ${result.name}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : '工程读取失败。', 'error')
    }
  }

  const saveProject = async (saveAs = false) => {
    if (!window.saku || !editor) return notify('请在 Electron 桌面应用中保存工程。', 'error')

    try {
      const html = currentHtml()
      const markdown = currentMarkdown()
      const project = createProject({
        title: documentTitle,
        html,
        markdown,
        createdAt: projectCreatedAt,
        wechatLineHeight,
        wechatTheme
      })
      const result = await window.saku.saveProject({
        content: JSON.stringify(project, null, 2),
        currentPath: projectPath,
        suggestedName: documentTitle,
        sourcePath: importedDocumentPath,
        saveAs
      })
      if (!result) return
      setProjectPath(result.path)
      setProjectCreatedAt(project.createdAt)
      setDirty(false)
      notify(`工程已保存为 ${result.name}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : '工程保存失败。', 'error')
    }
  }

  const exportMarkdown = async (saveAs = false) => {
    if (!window.saku) return notify('请在 Electron 桌面应用中导出 Markdown。', 'error')

    try {
      const result = await window.saku.saveDocument({
        content: currentMarkdown(),
        currentPath: markdownPath,
        suggestedName: documentTitle,
        sourcePath: importedDocumentPath,
        saveAs
      })
      if (!result) return
      setMarkdownPath(result.path)
      notify(`Markdown 已导出为 ${result.name}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Markdown 导出失败。', 'error')
    }
  }

  const copyForWechat = async () => {
    if (!editor) return
    try {
      const html = renderWechatHtml(currentHtml(), { lineHeight: wechatLineHeight, themeId: wechatTheme })
      const textDocument = new DOMParser().parseFromString(html, 'text/html')
      await copyWechatRichText(html, textDocument.body.textContent ?? '')
      notify('已复制微信富文本，可以直接粘贴到公众号后台。')
    } catch (error) {
      notify(error instanceof Error ? error.message : '复制失败。', 'error')
    }
  }

  const exportPdf = async () => {
    if (!window.saku || !editor) return notify('请在 Electron 桌面应用中导出 PDF。', 'error')

    try {
      const html = renderWechatHtml(currentHtml(), { lineHeight: wechatLineHeight, themeId: wechatTheme })
      const result = await window.saku.exportPdf({ html, title: documentTitle })
      if (!result) return
      notify(`排版后 PDF 已导出为 ${result.name}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'PDF 导出失败。', 'error')
    }
  }

  const checkForUpdates = async () => {
    if (!window.saku || checkingForUpdates) {
      if (!window.saku) notify('请在 Electron 桌面应用中检查更新。', 'error')
      return
    }

    setCheckingForUpdates(true)
    try {
      const result = await window.saku.checkForUpdates()
      if (result.status === 'available') notify(`发现新版本 ${result.latestVersion}，可由你决定是否下载。`, 'info')
      if (result.status === 'up-to-date') notify(`当前 ${result.currentVersion} 已是最新版本。`)
      if (result.status === 'error') notify('检查更新失败，应用仍可离线使用。', 'error')
    } finally {
      setCheckingForUpdates(false)
    }
  }

  const handleFormatBrushClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!editor) return
    if (previewMode !== 'visual') {
      notify('请先切换到右侧“可视化编辑”，选取样本文字后再使用格式刷。', 'info')
      return
    }

    if (event.detail >= 2) {
      if (!formatBrushRef.current) formatBrushRef.current = captureFormatBrush(editor)
      lastFormatBrushRangeRef.current = null
      updateFormatBrushMode('continuous')
      notify('连续格式刷已开启，可以依次选择多处目标文字；按 Esc 或再次点击可退出。', 'info')
      return
    }

    if (formatBrushModeRef.current) {
      clearFormatBrush()
      notify('已取消格式刷。', 'info')
      return
    }

    formatBrushRef.current = captureFormatBrush(editor)
    lastFormatBrushRangeRef.current = null
    updateFormatBrushMode('single')
    notify('格式已取样，请选择一处目标文字；双击格式刷可连续使用。', 'info')
  }

  const changePreviewMode = (mode: PreviewMode) => {
    if (mode !== 'visual') {
      clearFormatBrush()
    }
    setPreviewMode(mode)
  }

  const applyBox = (preset: string) => {
    if (!editor) return
    if (editor.isActive('sakuBox')) {
      editor.chain().focus().updateAttributes('sakuBox', { preset }).run()
    } else if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'sakuBox',
          attrs: { preset },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '在这里输入框内文字' }] }]
        })
        .run()
    } else {
      editor.chain().focus().wrapIn('sakuBox', { preset }).run()
    }
    setDirty(true)
  }

  const insertImagePlaceholder = () => {
    if (!editor || !imageId.trim()) return
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'sakuImagePlaceholder',
        attrs: { imageId: imageId.trim(), caption: imageCaption.trim() }
      })
      .insertContent({ type: 'paragraph' })
      .run()
    setDirty(true)
  }

  const textStyle = editor?.getAttributes('textStyle') ?? {}
  const activeColor = /^#[\da-f]{6}$/i.test(textStyle.color ?? '') ? textStyle.color : '#d96b86'
  const selectedTextAlign = editor?.getAttributes('paragraph').textAlign ?? editor?.getAttributes('heading').textAlign
  const activeTextAlign = selectedTextAlign === 'center' || selectedTextAlign === 'right' || selectedTextAlign === 'justify'
    ? selectedTextAlign
    : 'left'
  const canUndo = editor?.can().undo() ?? false
  const canRedo = editor?.can().redo() ?? false
  const selectedTheme = getWechatTheme(wechatTheme)
  const sortedThemes = useMemo(
    () => [...WECHAT_THEMES].sort((a, b) => Number(favoriteThemes.includes(b.id)) - Number(favoriteThemes.includes(a.id))),
    [favoriteThemes]
  )
  const wechatHtml = useMemo(
    () => renderWechatHtml(markdownToHtml(source), { lineHeight: wechatLineHeight, themeId: wechatTheme }),
    [source, wechatLineHeight, wechatTheme]
  )
  const documentOutline = useMemo(() => buildMarkdownOutline(source), [source])
  const wordCount = useMemo(() => {
    if (!editor) return 0
    return editor.getText().replace(/\s/g, '').length
  }, [editor, dirty, selectionRevision])

  return (
    <div className="app-shell">
      <header className="titlebar">
        <div className="titlebar-brand">
          <img className="brand-mark" src={appLogo} alt="SakuWechatCompiler logo" />
          <span className="brand-save-status">{dirty ? '● 未保存' : '已保存'}</span>
        </div>

        <div className="titlebar-document">
          <input
            value={documentTitle}
            aria-label="文章标题"
            onChange={(event) => {
              setDocumentTitle(event.target.value)
              setDirty(true)
            }}
          />
        </div>

        <nav className="top-actions" aria-label="文件操作">
          <button onClick={openProject}>打开工程</button>
          <button onClick={() => void saveProject(false)}>保存工程</button>
          <button onClick={importContent}>导入 MD / DOCX</button>
          <button onClick={() => void exportMarkdown(true)}>导出 MD</button>
          <button onClick={() => void exportPdf()}>导出 PDF</button>
          <button title="只在点击时连接 GitHub Release" disabled={checkingForUpdates} onClick={() => void checkForUpdates()}>
            {checkingForUpdates ? '检查中…' : '检查更新'}
          </button>
          <button
            className={`utility-action theme-action ${utilityDrawer === 'themes' ? 'active' : ''}`}
            onClick={() => setUtilityDrawer((current) => current === 'themes' ? null : 'themes')}
          >
            <span className="action-icon">●</span>主题
          </button>
          <button
            className={`utility-action outline-action ${utilityDrawer === 'outline' ? 'active' : ''}`}
            onClick={() => setUtilityDrawer((current) => current === 'outline' ? null : 'outline')}
          >
            <span className="action-icon">☰</span>目录
          </button>
          <span className="sync-badge">双栏实时同步</span>
          <button className="primary-action" onClick={copyForWechat}>复制到微信</button>
        </nav>
      </header>

      <section className="format-ribbon" aria-label="编辑工具栏">
        <div className="ribbon-group markdown-tools">
          <span className="ribbon-label">Markdown</span>
          <div className="ribbon-buttons">
            <button title="转换为正文" onClick={() => setMarkdownHeading(0)}>正文</button>
            <button title="一级标题：# 标题" onClick={() => setMarkdownHeading(1)}>H1</button>
            <button title="二级标题：## 标题" onClick={() => setMarkdownHeading(2)}>H2</button>
            <button title="三级标题：### 标题" onClick={() => setMarkdownHeading(3)}>H3</button>
            <button title="四级标题：#### 标题" onClick={() => setMarkdownHeading(4)}>H4</button>
            <button title="五级标题：##### 标题" onClick={() => setMarkdownHeading(5)}>H5</button>
            <button title="粗体：**文字**" onClick={() => wrapMarkdownSelection('**', '**', '粗体文字')}><b>B</b></button>
            <button title="斜体：*文字*" onClick={() => wrapMarkdownSelection('*', '*', '斜体文字')}><i>I</i></button>
            <button title="引用：> 文字" onClick={() => prefixMarkdownLines('quote')}>引用</button>
            <button title="无序列表：- 项目" onClick={() => prefixMarkdownLines('bullet')}>• 列表</button>
            <button title="有序列表：1. 项目" onClick={() => prefixMarkdownLines('ordered')}>1. 列表</button>
            <button title="行内代码：`代码`" onClick={() => wrapMarkdownSelection('`', '`', '代码')}>行内代码</button>
            <button title="代码块：```" onClick={insertMarkdownCodeBlock}>代码块</button>
            <button title="链接：[文字](网址)" onClick={() => wrapMarkdownSelection('[', '](https://example.com)', '链接文字')}>链接</button>
            <button title="插入分隔线：---" onClick={insertMarkdownDivider}>分隔线</button>
          </div>
          <small>作用于左侧 Markdown 当前选区</small>
        </div>

        <div className="ribbon-divider" />

        <div className="ribbon-group visual-tools">
          <span className="ribbon-label">文字样式</span>
          <div className="ribbon-controls">
            <label>
              <span>字体</span>
              <select
                aria-label="字体"
                value={textStyle.fontFamily ?? ''}
                onChange={(event) => editor?.chain().focus().setFontFamily(event.target.value).run()}
              >
                <option value="">继承字体</option>
                {FONT_OPTIONS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
              </select>
            </label>
            <label>
              <span>字号</span>
              <select
                aria-label="字号"
                value={textStyle.fontSize ?? ''}
                onChange={(event) => {
                  if (event.target.value) editor?.chain().focus().setFontSize(event.target.value).run()
                  else editor?.chain().focus().unsetFontSize().run()
                }}
              >
                <option value="">默认字号</option>
                {FONT_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <label className="ribbon-color">
              <span>颜色</span>
              <input
                aria-label="文字颜色"
                type="color"
                value={activeColor}
                onChange={(event) => editor?.chain().focus().setColor(event.target.value).run()}
              />
            </label>
            <label>
              <span>微信行距</span>
              <select
                aria-label="微信行距"
                value={wechatLineHeight}
                onChange={(event) => {
                  setWechatLineHeight(Number(event.target.value))
                  setDirty(true)
                }}
              >
                <option value={1.8}>紧凑 · 1.8</option>
                <option value={2}>舒展 · 2.0</option>
                <option value={2.2}>宽松 · 2.2</option>
              </select>
            </label>
            <div className="ribbon-buttons compact" aria-label="文字格式和段落对齐">
              <button
                className="toolbar-icon-button"
                aria-label="撤销"
                title="撤销（⌘Z）"
                disabled={!canUndo}
                onClick={() => editor?.chain().focus().undo().run()}
              >
                <UndoIcon className="toolbar-svg-icon" />
              </button>
              <button
                className="toolbar-icon-button"
                aria-label="重做"
                title="重做（⇧⌘Z）"
                disabled={!canRedo}
                onClick={() => editor?.chain().focus().redo().run()}
              >
                <RedoIcon className="toolbar-svg-icon" />
              </button>
              <span className="toolbar-button-separator" aria-hidden="true" />
              <button className={`toolbar-icon-button ${editor?.isActive('bold') ? 'active' : ''}`} aria-label="粗体" title="粗体" onClick={() => editor?.chain().focus().toggleBold().run()}>
                <span className="toolbar-letter-icon toolbar-bold-icon" aria-hidden="true">B</span>
              </button>
              <button className={`toolbar-icon-button ${editor?.isActive('italic') ? 'active' : ''}`} aria-label="斜体" title="斜体" onClick={() => editor?.chain().focus().toggleItalic().run()}>
                <span className="toolbar-letter-icon toolbar-italic-icon" aria-hidden="true">I</span>
              </button>
              <button className={`toolbar-icon-button ${editor?.isActive('underline') ? 'active' : ''}`} aria-label="下划线" title="下划线" onClick={() => editor?.chain().focus().toggleUnderline().run()}>
                <span className="toolbar-letter-icon toolbar-underline-icon" aria-hidden="true">U</span>
              </button>
              <button className={`toolbar-icon-button ${editor?.isActive('strike') ? 'active' : ''}`} aria-label="删除线" title="删除线" onClick={() => editor?.chain().focus().toggleStrike().run()}>
                <span className="toolbar-letter-icon toolbar-strike-icon" aria-hidden="true">S</span>
              </button>
              <span className="toolbar-button-separator" aria-hidden="true" />
              <button className={`toolbar-icon-button ${activeTextAlign === 'left' ? 'active' : ''}`} aria-label="左对齐" title="左对齐" onClick={() => editor?.chain().focus().setTextAlign('left').run()}>
                <AlignLeftIcon className="toolbar-svg-icon" />
              </button>
              <button className={`toolbar-icon-button ${activeTextAlign === 'center' ? 'active' : ''}`} aria-label="居中对齐" title="居中对齐" onClick={() => editor?.chain().focus().setTextAlign('center').run()}>
                <AlignCenterIcon className="toolbar-svg-icon" />
              </button>
              <button className={`toolbar-icon-button ${activeTextAlign === 'right' ? 'active' : ''}`} aria-label="右对齐" title="右对齐" onClick={() => editor?.chain().focus().setTextAlign('right').run()}>
                <AlignRightIcon className="toolbar-svg-icon" />
              </button>
              <span className="toolbar-button-separator" aria-hidden="true" />
              <button
                aria-pressed={formatBrushMode !== null}
                aria-label={formatBrushMode === 'continuous' ? '连续格式刷已开启' : formatBrushMode === 'single' ? '格式刷已取样，选择目标文字' : '格式刷'}
                className={`toolbar-icon-button format-brush-button ${formatBrushMode ? 'active' : ''} ${formatBrushMode === 'continuous' ? 'continuous' : ''}`}
                title="格式刷：单击使用一次，双击连续使用；按 Esc 或再次点击取消"
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleFormatBrushClick}
              >
                <FormatPainterIcon className="toolbar-svg-icon" />
              </button>
              <button className="toolbar-icon-button" aria-label="清除格式" title="清除格式" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}>
                <ClearFormattingIcon className="toolbar-svg-icon" />
              </button>
            </div>
          </div>
          <small>支持撤销与重做；切换到右侧“可视化编辑”后，格式刷单击一次、双击连续</small>
        </div>
      </section>

      <div className="workspace">
        <aside className="left-panel panel">
          <div className="sidebar-heading">
            <div>
              <span className="eyebrow">INSERT TOOLS</span>
              <h2>插入工具</h2>
            </div>
            <button className="sidebar-theme-shortcut" onClick={() => setUtilityDrawer('themes')}>更换主题</button>
          </div>

          <div className="sidebar-tabs" role="tablist" aria-label="插入工具分类">
            <button className={sidebarTab === 'boxes' ? 'active' : ''} onClick={() => setSidebarTab('boxes')}>彩色框</button>
            <button className={sidebarTab === 'academic' ? 'active' : ''} onClick={() => setSidebarTab('academic')}>图表引文</button>
            <button className={sidebarTab === 'image' ? 'active' : ''} onClick={() => setSidebarTab('image')}>图片</button>
          </div>

          {sidebarTab === 'boxes' && (
            <section className="sidebar-tab-panel" aria-label="彩色框">
              <div className="panel-heading compact-heading">
                <div>
                  <h3>彩色框素材</h3>
                  <p className="panel-hint">选中文字或将光标放在段落中，再选择样式。</p>
                </div>
                {editor?.isActive('sakuBox') && (
                  <button className="text-button" onClick={() => editor.chain().focus().lift('sakuBox').run()}>移除</button>
                )}
              </div>
              <div className="preset-grid">
                {BOX_PRESETS.map((preset) => (
                  <button
                    className="preset-tile"
                    key={preset.id}
                    title={preset.description}
                    onClick={() => applyBox(preset.id)}
                  >
                    <span className="preset-swatch" style={{ background: preset.swatch }} />
                    <strong>{preset.name}</strong>
                  </button>
                ))}
              </div>
            </section>
          )}

          {sidebarTab === 'academic' && (
            <section className="sidebar-tab-panel academic-tools">
              <h3>图表与参考文献</h3>

              <div className="academic-section">
                <strong>图片引文 / 图题</strong>
                <input aria-label="图片引文" value={figureCaption} onChange={(event) => setFigureCaption(event.target.value)} />
                <button onClick={insertFigureCaption}>插入图片引文</button>
              </div>

              <div className="academic-section">
                <strong>表格与表题</strong>
                <input aria-label="表格引文" value={tableCaption} onChange={(event) => setTableCaption(event.target.value)} />
                <div className="dimension-inputs">
                  <label>列 <input type="number" min="1" max="8" value={tableColumns} onChange={(event) => setTableColumns(Number(event.target.value))} /></label>
                  <label>行 <input type="number" min="1" max="20" value={tableRows} onChange={(event) => setTableRows(Number(event.target.value))} /></label>
                </div>
                <div className="academic-actions">
                  <button onClick={insertTableCaption}>仅表题</button>
                  <button onClick={insertMarkdownTable}>插入表格</button>
                </div>
              </div>

              <div className="academic-section">
                <strong>学术引文</strong>
                <label className="citation-number">编号 <input type="number" min="1" value={citationNumber} onChange={(event) => setCitationNumber(Number(event.target.value))} /></label>
                <textarea aria-label="参考文献条目" rows={3} value={referenceText} onChange={(event) => setReferenceText(event.target.value)} />
                <div className="academic-actions">
                  <button onClick={() => insertAcademicCitation(false)}>仅插入引文</button>
                  <button onClick={() => insertAcademicCitation(true)}>引文 + 文献</button>
                </div>
              </div>
            </section>
          )}

          {sidebarTab === 'image' && (
            <section className="sidebar-tab-panel placeholder-form">
              <h3>图片占位符</h3>
              <p className="panel-hint">只记录插图位置和说明，不会嵌入或上传图片。</p>
              <label>标识<input value={imageId} onChange={(event) => setImageId(event.target.value)} /></label>
              <label>说明<input value={imageCaption} onChange={(event) => setImageCaption(event.target.value)} /></label>
              <button onClick={insertImagePlaceholder}>插入占位符</button>
            </section>
          )}
        </aside>

        <main className="editor-stage">
          <div className="dual-editor">
            <section className="source-pane">
              <div className="canvas-toolbar">
                <span>Markdown 文件</span>
                <span>Saku 扩展语法</span>
              </div>
              <div className="source-paper">
                <textarea
                  ref={sourceTextareaRef}
                  className="source-editor"
                  spellCheck={false}
                  value={source}
                  onChange={(event) => updateSource(event.target.value)}
                  onPaste={handleSourcePaste}
                />
              </div>
            </section>

            <section className="preview-pane">
              <div className="canvas-toolbar">
                <span>{previewMode === 'final' ? '微信公众号最终状态' : '可视化编辑'}</span>
                <div className="preview-toolbar-end">
                  <span>{selectedTheme.name} · {wordCount} 字</span>
                  <div className="preview-mode-switch" aria-label="预览模式">
                    <button className={previewMode === 'final' ? 'active' : ''} onClick={() => changePreviewMode('final')}>最终预览</button>
                    <button className={previewMode === 'visual' ? 'active' : ''} onClick={() => changePreviewMode('visual')}>可视化编辑</button>
                  </div>
                </div>
              </div>
              <div
                className={`paper ${previewMode === 'final' ? 'final-mode' : ''}`}
                style={{
                  '--wechat-line-height': wechatLineHeight,
                  '--theme-paper': selectedTheme.background
                } as CSSProperties}
              >
                {previewMode === 'final' ? (
                  <div className="wechat-final-preview" dangerouslySetInnerHTML={{ __html: wechatHtml }} />
                ) : (
                  <EditorContent editor={editor} />
                )}
              </div>
            </section>
          </div>
        </main>

      </div>

      {utilityDrawer && (
        <>
          <button
            className="drawer-backdrop"
            aria-label="关闭侧栏"
            onClick={() => setUtilityDrawer(null)}
          />
          <aside className="utility-drawer" aria-label={utilityDrawer === 'themes' ? '主题选择' : '文章目录'}>
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">{utilityDrawer === 'themes' ? 'WECHAT THEMES' : 'DOCUMENT OUTLINE'}</span>
                <h2>{utilityDrawer === 'themes' ? '选择公众号主题' : '文章目录'}</h2>
              </div>
              <button aria-label="关闭" onClick={() => setUtilityDrawer(null)}>×</button>
            </div>

            {utilityDrawer === 'themes' ? (
              <>
                <p className="drawer-hint">选择后，最终预览、微信复制和 PDF 会同步更新。</p>
                <div className="drawer-theme-list">
                  {sortedThemes.map((theme) => {
                    const favorite = favoriteThemes.includes(theme.id)
                    return (
                      <div
                        className={`drawer-theme-row ${wechatTheme === theme.id ? 'active' : ''}`}
                        key={theme.id}
                        style={{ '--theme-accent': theme.accent, '--theme-bg': theme.background } as CSSProperties}
                      >
                        <button className="drawer-theme-main" onClick={() => chooseTheme(theme.id)}>
                          <span className="drawer-theme-swatch" />
                          <span>
                            <strong>{theme.name}</strong>
                            <small>{theme.group} · {theme.description}</small>
                          </span>
                          {wechatTheme === theme.id && <b>当前</b>}
                        </button>
                        <button
                          className={`drawer-favorite ${favorite ? 'active' : ''}`}
                          aria-label={favorite ? `取消收藏${theme.name}` : `收藏${theme.name}`}
                          onClick={(event) => toggleFavoriteTheme(event, theme.id)}
                        >
                          {favorite ? '★' : '☆'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="drawer-hint">自动读取 Markdown 中的 H1–H5。点击标题可跳到左侧原文。</p>
                {documentOutline.length ? (
                  <nav className="outline-list" aria-label="标题列表">
                    {documentOutline.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => jumpToOutlineItem(item)}
                        style={{ '--outline-level': item.level } as CSSProperties}
                      >
                        <span>H{item.level}</span>
                        <strong>{item.title}</strong>
                        <small>第 {item.line} 行</small>
                      </button>
                    ))}
                  </nav>
                ) : (
                  <div className="outline-empty">
                    <strong>尚未发现标题</strong>
                    <p>使用顶部 H1–H5 按钮或输入“## 标题”后，目录会自动生成。</p>
                  </div>
                )}
              </>
            )}
          </aside>
        </>
      )}

      <footer className="statusbar">
        <span>{projectPath ? `工程 · ${projectPath}` : '尚未保存为工程'}</span>
        <span>{window.saku ? `Electron · ${window.saku.architecture}` : '浏览器预览模式'}</span>
      </footer>

      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}
    </div>
  )
}

export default App
