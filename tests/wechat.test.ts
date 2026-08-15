import { describe, expect, it } from 'vitest'
import { renderWechatHtml } from '../src/lib/wechat'
import { WECHAT_THEMES } from '../src/lib/wechatThemes'

describe('微信富文本输出', () => {
  it('将主题样式内联并移除编辑器属性', () => {
    const result = renderWechatHtml(`
      <h2>标题</h2>
      <section data-saku-box="ocean-line"><p>框内文字</p></section>
      <p><span style="color:#c0392b;font-size:20px">局部样式</span></p>
      <div data-saku-image-id="figure-01" data-saku-image-caption="配图"></div>
    `)

    expect(result).toContain('max-width:100%')
    expect(result).toContain('font-size:20px')
    expect(result).not.toContain('<h2')
    expect(result).toContain('border-top:2px solid #4f8ea8')
    expect(result).toContain('page-break-after:avoid')
    expect(result).toContain('color:#c0392b')
    expect(result).toContain('图片占位 · figure-01')
    expect(result).not.toContain('data-saku-')
    expect(result).not.toContain('class=')
  })

  it('清理空段落并生成微信稳定的分隔线和紧凑表格', () => {
    const result = renderWechatHtml(`
      <p><br /></p>
      <h5>五级标题</h5>
      <hr />
      <table>
        <thead><tr><th>一</th><th>二</th><th>三</th><th>四</th></tr></thead>
        <tbody><tr><td>较长内容</td><td>内容</td><td>内容</td><td>内容</td></tr></tbody>
      </table>
    `)

    expect(result).not.toContain('<h5')
    expect(result).not.toContain('<hr')
    expect(result).not.toContain('<p><br')
    expect(result).toContain('font-size:15px')
    expect(result).toContain('table-layout:fixed')
    expect(result).toContain('padding:5px 4px')
    expect(result).toContain('word-break:break-all')
  })

  it('使用明确的 em 单位输出可调整的正文行距', () => {
    const result = renderWechatHtml('<p>第一行<br>第二行</p><ul><li>列表项</li></ul>', {
      lineHeight: 2.2
    })

    expect(result).toContain('line-height:2.2em')
    expect(result).toContain('line-height:2.05em')
    expect(result).toContain('margin:0 0 17px')
  })

  it('将代码转换成不依赖 pre 和 code 标签的微信稳定结构', () => {
    const result = renderWechatHtml(`
      <pre><code>const answer = 42;\n  return answer;\n\nconsole.log(answer);\n</code></pre>
      <p>运行 <code>pnpm build</code> 完成构建。</p>
    `)

    expect(result).not.toContain('<pre')
    expect(result).not.toContain('<code')
    expect(result).toContain('background-color:#ff5f57')
    expect(result).toContain('background-color:#f6f8fa')
    expect(result).toContain('&nbsp;&nbsp;')
    expect(result).toContain('return</span> answer;')
    expect(result).toContain('background-color:#f3f1ed')
    expect(result).toContain('pnpm build')
    expect(result).toContain('color:#7a4aa0')
    expect(result).not.toContain('data-saku-wechat-code')
  })

  it('全局移除外部样式依赖并转换微信不稳定的结构标签', () => {
    const result = renderWechatHtml(`
      <style>.danger { color:red }</style>
      <link rel="stylesheet" href="https://example.com/style.css">
      <h1 class="title">标题</h1>
      <blockquote class="quote"><p>引用 <strong>重点</strong></p></blockquote>
      <ul class="list"><li>项目一</li><li>项目二 <code>inline</code></li></ul>
      <ol><li>第一项</li><li>第二项</li></ol>
      <p><em>斜体</em><u>下划线</u><s>删除线</s></p>
    `)

    expect(result).not.toMatch(/<(?:style|link|h1|blockquote|ul|ol|li|pre|code)\b/i)
    expect(result).not.toContain('class=')
    expect(result).not.toContain('data-saku-')
    expect(result).not.toContain('example.com/style.css')
    expect(result).toContain('display:table')
    expect(result).toContain('border-left:4px solid #d7a4b1')
    expect(result).toContain('font-weight:700')
    expect(result).toContain('font-style:italic')
    expect(result).toContain('text-decoration:underline')
    expect(result).toContain('text-decoration:line-through')
  })

  it('按主题生成完整内联样式并保持微信安全结构', () => {
    const classic = renderWechatHtml('<h2>标题</h2><blockquote><p>引用</p></blockquote><table><tr><th>列</th></tr><tr><td>值</td></tr></table>')
    const ft = renderWechatHtml('<h2>标题</h2><blockquote><p>引用</p></blockquote><table><tr><th>列</th></tr><tr><td>值</td></tr></table>', {
      themeId: 'financial-times'
    })

    expect(ft).not.toBe(classic)
    expect(ft).toContain('background-color:#fff1e5')
    expect(ft).toContain('border-left:5px solid #990f3d')
    expect(ft).toContain('background-color:#990f3d')
    expect(ft).not.toContain('class=')
    expect(ft).not.toContain('<style')
  })

  it('所有主题都让用户显式颜色覆盖粗体、斜体和链接强调色', () => {
    for (const theme of WECHAT_THEMES) {
      const result = renderWechatHtml(
        '<p><span style="color:#c43f5a">普通<strong>粗体</strong><em>斜体</em><a href="https://urbancomp.net">链接</a></span></p>',
        { themeId: theme.id }
      )

      expect(result, theme.name).toContain('color:#c43f5a')
      expect(result, theme.name).toMatch(/<strong style="[^"]*color:inherit;/)
      expect(result, theme.name).toMatch(/<em style="[^"]*color:inherit;/)
      expect(result, theme.name).toMatch(/<a href="https:\/\/urbancomp\.net" style="[^"]*color:inherit;/)
    }
  })
})
