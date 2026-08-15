import { describe, expect, it } from 'vitest'
import {
  htmlToMarkdown,
  markdownToHtml,
  normalizeSakuMarkdown,
  richTextToMarkdown,
  sanitizeEditorHtml
} from '../src/lib/markdown'
import { renderWechatHtml } from '../src/lib/wechat'

describe('Saku 扩展 Markdown', () => {
  it('解析彩色框、局部样式和图片占位符', () => {
    const markdown = `# 标题

普通<span style="color:#d96b86;font-size:20px">彩色文字</span>。

:::saku-box preset="matcha-card"
框内有 **重点**。
:::

{{image:figure-01|产品截图}}
`
    const html = markdownToHtml(markdown)

    expect(html).toContain('data-saku-box="matcha-card"')
    expect(html).toContain('style="color:#d96b86;font-size:20px"')
    expect(html).toContain('data-saku-image-id="figure-01"')
    expect(html).toContain('<strong>重点</strong>')
  })

  it('将编辑器内容往返序列化为可读的扩展 Markdown', () => {
    const html = `
      <h2>小标题</h2>
      <section data-saku-box="amber-frame"><p>框内文字</p></section>
      <p>普通<span style="color:#123456;font-size:18px">重点</span></p>
      <div data-saku-image-id="figure-02" data-saku-image-caption="示意图"></div>
    `
    const markdown = htmlToMarkdown(html)
    const restored = markdownToHtml(markdown)

    expect(markdown).toContain(':::saku-box preset="amber-frame"')
    expect(markdown).toContain('{{image:figure-02|示意图}}')
    expect(markdown).toContain('<span style="color:#123456;font-size:18px">重点</span>')
    expect(restored).toContain('data-saku-box="amber-frame"')
    expect(restored).toContain('data-saku-image-id="figure-02"')
  })

  it('清除脚本、远程图片和危险属性', () => {
    const html = sanitizeEditorHtml(`
      <script>alert(1)</script>
      <p onclick="alert(1)">安全文字</p>
      <a href="javascript:alert(1)">链接</a>
      <img src="https://example.com/a.jpg" alt="Word 图片" />
    `)

    expect(html).not.toContain('script')
    expect(html).not.toContain('onclick')
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('<img')
    expect(html).toContain('data-saku-image-id="word-image-01"')
    expect(html).toContain('data-saku-image-caption="Word 图片"')
  })

  it('解析并往返图题、表题、表格和学术引文', () => {
    const markdown = `{{figure-caption:图 1｜研究区域}}

{{table-caption:表 1｜样本统计}}

| 城市 | 数量 |
| --- | --- |
| 东京 | 12 |

结论见文献{{cite:1}}。
`
    const html = markdownToHtml(markdown)
    const restored = htmlToMarkdown(html)

    expect(html).toContain('data-saku-caption="figure"')
    expect(html).toContain('data-saku-caption="table"')
    expect(html).toContain('<table>')
    expect(html).toContain('data-saku-citation="1"')
    expect(restored).toContain('{{figure-caption:图 1｜研究区域}}')
    expect(restored).toContain('{{table-caption:表 1｜样本统计}}')
    expect(restored).toContain('| 城市 | 数量 |')
    expect(restored).toContain('{{cite:1}}')
  })

  it('解析并往返行内代码和围栏代码块', () => {
    const markdown = '运行 `pnpm build`。\n\n```ts\nconst answer = 42\n```\n'
    const html = markdownToHtml(markdown)
    const restored = htmlToMarkdown(html)

    expect(html).toContain('<code>pnpm build</code>')
    expect(html).toContain('<pre><code>const answer = 42')
    expect(restored).toContain('`pnpm build`')
    expect(restored).toContain('```')
    expect(restored).toContain('const answer = 42')
  })

  it('将来自 Word、飞书或 Notion 的富文本智能转换为干净 Markdown', () => {
    const markdown = richTextToMarkdown(`
      <div class="notion-page">
        <h2 style="font-family:Arial">研究结论</h2>
        <p><strong>重点</strong>与<em>说明</em></p>
        <ul><li>第一项</li><li>第二项</li></ul>
        <table><tr><th>城市</th><th>数量</th></tr><tr><td>东京</td><td>12</td></tr></table>
      </div>
    `)

    expect(markdown).toContain('## 研究结论')
    expect(markdown).toContain('**重点**')
    expect(markdown).toContain('- 第一项')
    expect(markdown).toContain('| 城市 | 数量 |')
    expect(markdown).not.toContain('class=')
    expect(markdown).not.toContain('saku-format')
  })

  it('稳定导入 Word 粗体边界，并允许粗体继续叠加斜体', () => {
    const cases = [
      '<p>前文<strong>粗体</strong>后文</p>',
      '<p>前文<strong>粗体 </strong>后文</p>',
      '<p><strong>粗体</strong>，后文</p>',
      '<p><b>旧式粗体</b>与<i>旧式斜体</i></p>',
      '<p><strong><em>粗斜体</em></strong>后文</p>'
    ]

    cases.forEach((sourceHtml) => {
      const markdown = richTextToMarkdown(sourceHtml)
      const restored = markdownToHtml(markdown)
      const sourceText = new DOMParser().parseFromString(sourceHtml, 'text/html').body.textContent
      const restoredDocument = new DOMParser().parseFromString(restored, 'text/html')

      expect(restoredDocument.body.textContent?.trim()).toBe(sourceText?.trim())
      expect(markdown).not.toMatch(/\*\*[^*\n]*\s\*\*/)
      expect(markdown.match(/\*\*/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
      expect(restoredDocument.querySelector('strong')).not.toBeNull()
    })

    const combined = richTextToMarkdown('<p>前文<strong><em>组合格式</em></strong>后文</p>')
    const combinedHtml = markdownToHtml(combined)

    expect(combined).toContain('***组合格式***')
    expect(combinedHtml).toMatch(/<(strong|em)><(em|strong)>组合格式<\/\2><\/\1>/)
  })

  it('安全往返包含引号的全部字体选项，不把 span 标签显示为正文', () => {
    const fontFamilies = [
      '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
      '"PingFang SC", sans-serif',
      '"Songti SC", STSong, serif',
      '"Heiti SC", STHeiti, sans-serif',
      'SFMono-Regular, Menlo, Monaco, monospace'
    ]

    fontFamilies.forEach((fontFamily) => {
      const markdown = htmlToMarkdown(
        `<p><span style='font-family:${fontFamily};font-size:18px;color:#c0392b'>字体测试</span></p>`
      )
      const restored = markdownToHtml(markdown)
      const finalHtml = renderWechatHtml(restored)
      const text = new DOMParser().parseFromString(finalHtml, 'text/html').body.textContent ?? ''

      expect(markdown).not.toMatch(/style="[^"]*font-family:[^"]*"[^>]*">/)
      expect(restored).toContain('font-size:18px')
      expect(restored).toContain('color:#c0392b')
      expect(text.trim()).toBe('字体测试')
      expect(text).not.toContain('<span')
    })
  })

  it('完整保留组合字形与段落、标题对齐到最终微信预览', () => {
    const editorHtml = `
      <p style="text-align:center">
        <span style='font-family:"Songti SC", STSong, serif;font-size:20px;color:#c0392b;letter-spacing:.08em'>
          <strong><em><u><s>组合文字样式</s></u></em></strong>
        </span>
      </p>
      <h2 style="text-align:right"><span style="font-size:22px;color:#245c7d">右对齐标题</span></h2>
    `
    const markdown = htmlToMarkdown(editorHtml)
    const restored = markdownToHtml(markdown)
    const finalHtml = renderWechatHtml(restored)
    const finalText = new DOMParser().parseFromString(finalHtml, 'text/html').body.textContent ?? ''

    expect(markdown).toContain('font-family:&quot;Songti SC&quot;, STSong, serif')
    expect(restored).toContain('text-align:center')
    expect(restored).toContain('text-align:right')
    expect(restored).toContain('<strong><em><u><s>组合文字样式</s></u></em></strong>')
    expect(finalHtml).toContain('text-align:center')
    expect(finalHtml).toContain('text-align:right')
    expect(finalHtml).toContain('font-size:20px')
    expect(finalHtml).toContain('color:#c0392b')
    expect(finalHtml).toContain('letter-spacing:.08em')
    expect(finalHtml).toContain('color:inherit')
    expect(finalText).not.toContain('<span')
  })

  it('自动修复旧版本生成的未转义字体 span', () => {
    const broken = '<span style="font-family:"Songti SC", STSong, serif">旧工程文字</span>'
    const normalized = normalizeSakuMarkdown(broken)
    const restored = markdownToHtml(broken)

    expect(normalized).toContain('font-family:&quot;Songti SC&quot;, STSong, serif')
    expect(restored).toContain('font-family:&quot;Songti SC&quot;, STSong, serif')
    expect(new DOMParser().parseFromString(restored, 'text/html').body.textContent?.trim()).toBe('旧工程文字')
  })

  it('在标题、列表和引用中稳定往返字体与字形组合', () => {
    const editorHtml = `
      <h1><span style='font-family:"Songti SC", STSong, serif;font-size:24px;color:#8d3f53'><strong>组合标题</strong></span></h1>
      <blockquote><p><span style='font-family:"PingFang SC", sans-serif;font-size:16px'><em>组合引用</em></span></p></blockquote>
      <ul><li><p><span style='font-family:"Heiti SC", STHeiti, sans-serif;color:#245c7d'><u>组合列表</u></span></p></li></ul>
    `
    const firstMarkdown = htmlToMarkdown(editorHtml)
    const restored = markdownToHtml(firstMarkdown)
    const secondMarkdown = htmlToMarkdown(restored)
    const finalHtml = renderWechatHtml(markdownToHtml(secondMarkdown))
    const text = new DOMParser().parseFromString(finalHtml, 'text/html').body.textContent ?? ''

    expect(firstMarkdown).toContain('&quot;Songti SC&quot;')
    expect(secondMarkdown).toContain('&quot;Songti SC&quot;')
    expect(secondMarkdown).not.toContain('&amp;quot;Songti SC')
    expect(finalHtml).toContain('<strong')
    expect(finalHtml).toContain('<em')
    expect(finalHtml).toContain('<u')
    expect(text).toContain('组合标题')
    expect(text).toContain('组合引用')
    expect(text).toContain('组合列表')
    expect(text).not.toContain('<span')
  })
})
