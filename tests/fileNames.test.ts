import { describe, expect, it } from 'vitest'
import { buildSuggestedFileName, sanitizeFileStem } from '../src/lib/fileNames'

describe('导入文档的建议保存名称', () => {
  it('沿用原文档名称并替换为目标扩展名', () => {
    expect(buildSuggestedFileName('研究报告.docx', '未命名工程', 'sakuwechat')).toBe('研究报告.sakuwechat')
    expect(buildSuggestedFileName('城市网络.md', '未命名工程', '.sakuwechat')).toBe('城市网络.sakuwechat')
  })

  it('清理文件系统不允许的字符并处理空名称', () => {
    expect(sanitizeFileStem('全球/南方:报告?', '未命名工程')).toBe('全球-南方-报告-')
    expect(buildSuggestedFileName('   ', '未命名工程', 'sakuwechat')).toBe('未命名工程.sakuwechat')
  })
})
