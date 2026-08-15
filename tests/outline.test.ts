import { describe, expect, it } from 'vitest'
import { buildMarkdownOutline } from '../src/lib/outline'

describe('Markdown 文章目录', () => {
  it('提取 H1 到 H5 并保留层级和定位信息', () => {
    const source = `# 总标题

## 第一部分

### **重点**与[链接](https://example.com)

##### 五级标题
`
    const outline = buildMarkdownOutline(source)

    expect(outline.map((item) => [item.level, item.title])).toEqual([
      [1, '总标题'],
      [2, '第一部分'],
      [3, '重点与链接'],
      [5, '五级标题']
    ])
    expect(source.slice(outline[1].start, outline[1].end)).toBe('## 第一部分')
    expect(outline[1].line).toBe(3)
  })

  it('忽略代码块中的井号标题', () => {
    const outline = buildMarkdownOutline('# 正文标题\n\n```md\n## 代码示例\n```\n\n## 正文小节')
    expect(outline.map((item) => item.title)).toEqual(['正文标题', '正文小节'])
  })
})
