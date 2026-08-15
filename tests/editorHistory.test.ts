import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { afterEach, describe, expect, it } from 'vitest'

const editors: Editor[] = []

const createEditor = () => {
  const editor = new Editor({
    extensions: [StarterKit],
    content: '<p>原始内容</p>'
  })
  editors.push(editor)
  return editor
}

afterEach(() => editors.splice(0).forEach((editor) => editor.destroy()))

describe('可视化编辑历史记录', () => {
  it('支持撤销和重做，并正确报告按钮可用状态', () => {
    const editor = createEditor()
    expect(editor.can().undo()).toBe(false)
    expect(editor.can().redo()).toBe(false)

    editor.chain().focus('end').insertContent('新增文字').run()
    expect(editor.getText()).toBe('原始内容新增文字')
    expect(editor.can().undo()).toBe(true)

    expect(editor.chain().focus().undo().run()).toBe(true)
    expect(editor.getText()).toBe('原始内容')
    expect(editor.can().redo()).toBe(true)

    expect(editor.chain().focus().redo().run()).toBe(true)
    expect(editor.getText()).toBe('原始内容新增文字')
  })
})
