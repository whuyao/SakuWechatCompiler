import { describe, expect, it } from 'vitest'
import { createProject, parseProject, PROJECT_FORMAT } from '../src/lib/project'

describe('工程文件', () => {
  it('保存并恢复完整工程数据', () => {
    const project = createProject({
      title: '测试文章',
      html: '<h1>标题</h1><p>正文</p>',
      markdown: '# 标题\n\n正文'
    })
    const restored = parseProject(JSON.stringify(project))

    expect(restored.format).toBe(PROJECT_FORMAT)
    expect(restored.title).toBe('测试文章')
    expect(restored.document.html).toContain('<h1>标题</h1>')
    expect(restored.document.markdown).toContain('# 标题')
    expect(restored.settings.canvasWidth).toBe(677)
    expect(restored.settings.wechatLineHeight).toBe(2)
    expect(restored.settings.wechatTheme).toBe('saku-classic')
  })

  it('保存公众号主题并在主题无效时回退默认值', () => {
    const project = createProject({
      title: '主题测试',
      html: '<p>正文</p>',
      markdown: '正文',
      wechatTheme: 'financial-times'
    })

    expect(parseProject(JSON.stringify(project)).settings.wechatTheme).toBe('financial-times')

    const invalid = JSON.parse(JSON.stringify(project))
    invalid.settings.wechatTheme = 'unknown-theme'
    expect(parseProject(JSON.stringify(invalid)).settings.wechatTheme).toBe('saku-classic')
  })

  it('保存微信行距并兼容没有该设置的旧工程', () => {
    const project = createProject({
      title: '行距测试',
      html: '<p>正文</p>',
      markdown: '正文',
      wechatLineHeight: 2.2
    })

    expect(parseProject(JSON.stringify(project)).settings.wechatLineHeight).toBe(2.2)

    const legacy = JSON.parse(JSON.stringify(project))
    delete legacy.settings.wechatLineHeight
    expect(parseProject(JSON.stringify(legacy)).settings.wechatLineHeight).toBe(2)
  })

  it('拒绝未知格式', () => {
    expect(() => parseProject('{"format":"other","version":1}')).toThrow('不是 SakuWechatCompiler')
  })

  it('保存和读取时自动修复旧版损坏的字体 Markdown', () => {
    const broken = '<span style="font-family:"Songti SC", STSong, serif">正文</span>'
    const project = createProject({
      title: '旧工程修复',
      html: '<p><span style="font-family:&quot;Songti SC&quot;, STSong, serif">正文</span></p>',
      markdown: broken
    })

    expect(project.document.markdown).toContain('font-family:&quot;Songti SC&quot;, STSong, serif')
    expect(project.document.markdown).not.toContain('font-family:"Songti SC"')

    const legacy = JSON.parse(JSON.stringify(project))
    legacy.document.markdown = broken
    expect(parseProject(JSON.stringify(legacy)).document.markdown).toContain(
      'font-family:&quot;Songti SC&quot;, STSong, serif'
    )
  })
})
