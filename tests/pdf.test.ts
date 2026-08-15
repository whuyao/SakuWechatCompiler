import { describe, expect, it } from 'vitest'
import { createPrintablePdfHtml } from '../src/lib/pdf'
import { renderWechatHtml } from '../src/lib/wechat'

describe('PDF 打印文档', () => {
  it('生成不含样式表、class 和 CSS 正文的打印文档', () => {
    const result = createPrintablePdfHtml('研究 <报告>', '<section style="color:#123456">正文</section>')

    expect(result).toContain('print-color-adjust:exact')
    expect(result).toContain('<title>研究 &lt;报告&gt;</title>')
    expect(result).toContain('<main style="')
    expect(result).toContain('color:#123456')
    expect(result).not.toContain('<style')
    expect(result).not.toContain('class=')
  })

  it('只输出微信公众号归一化后的最终内容', () => {
    const finalWechatHtml = renderWechatHtml(`
      <style>.internal-layout { color: red; }</style>
      <link rel="stylesheet" href="https://example.com/layout.css">
      <h2 class="internal-layout">最终标题</h2>
      <p>最终正文</p>
    `)
    const result = createPrintablePdfHtml('最终状态', finalWechatHtml)

    expect(result).toContain('最终标题')
    expect(result).toContain('最终正文')
    expect(result).not.toContain('internal-layout')
    expect(result).not.toContain('example.com/layout.css')
    expect(result).not.toContain('<style')
    expect(result).not.toContain('class=')
  })

  it('在 PDF 打印文档中保留用户颜色优先级', () => {
    const finalWechatHtml = renderWechatHtml(
      '<p><span style="color:#c43f5a">普通<strong>粗体</strong><em>斜体</em><a href="https://urbancomp.net">链接</a></span></p>',
      { themeId: 'financial-times' }
    )
    const result = createPrintablePdfHtml('用户颜色', finalWechatHtml)

    expect(result).toContain('color:#c43f5a')
    expect(result.match(/color:inherit;/g)).toHaveLength(3)
    expect(result).not.toContain('<style')
    expect(result).not.toContain('class=')
  })
})
