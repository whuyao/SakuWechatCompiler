import { normalizeSakuMarkdown, sanitizeEditorHtml } from './markdown'
import { DEFAULT_WECHAT_THEME_ID, getWechatTheme } from './wechatThemes'

export const PROJECT_FORMAT = 'saku-wechat-project'
export const PROJECT_VERSION = 1

export type SakuProject = {
  format: typeof PROJECT_FORMAT
  version: typeof PROJECT_VERSION
  title: string
  createdAt: string
  updatedAt: string
  document: {
    html: string
    markdown: string
  }
  settings: {
    canvasWidth: number
    defaultFont: string
    wechatLineHeight: number
    wechatTheme: string
  }
}

export const createProject = (input: {
  title: string
  html: string
  markdown: string
  createdAt?: string
  wechatLineHeight?: number
  wechatTheme?: string
}): SakuProject => {
  const now = new Date().toISOString()
  return {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    title: input.title,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
    document: {
      html: sanitizeEditorHtml(input.html),
      markdown: normalizeSakuMarkdown(input.markdown)
    },
    settings: {
      canvasWidth: 677,
      defaultFont: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
      wechatLineHeight: Math.min(2.3, Math.max(1.7, input.wechatLineHeight ?? 2)),
      wechatTheme: getWechatTheme(input.wechatTheme).id
    }
  }
}

export const parseProject = (source: string): SakuProject => {
  const data = JSON.parse(source) as Partial<SakuProject>
  if (data.format !== PROJECT_FORMAT) throw new Error('这不是 SakuWechatCompiler 工程文件。')
  if (data.version !== PROJECT_VERSION) throw new Error(`暂不支持工程格式版本 ${String(data.version)}。`)
  if (!data.document?.html || typeof data.document.html !== 'string') throw new Error('工程缺少文档内容。')

  return {
    ...(data as SakuProject),
    document: {
      html: sanitizeEditorHtml(data.document.html),
      markdown: typeof data.document.markdown === 'string' ? normalizeSakuMarkdown(data.document.markdown) : ''
    },
    settings: {
      canvasWidth: data.settings?.canvasWidth ?? 677,
      defaultFont:
        data.settings?.defaultFont ?? '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
      wechatLineHeight: Math.min(2.3, Math.max(1.7, data.settings?.wechatLineHeight ?? 2)),
      wechatTheme: getWechatTheme(data.settings?.wechatTheme ?? DEFAULT_WECHAT_THEME_ID).id
    }
  }
}
