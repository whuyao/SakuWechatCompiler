import { Editor } from '@tiptap/core'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import TextAlign from '@tiptap/extension-text-align'
import { FontSize, TextStyle } from '@tiptap/extension-text-style'
import StarterKit from '@tiptap/starter-kit'
import { afterEach, describe, expect, it } from 'vitest'
import { applyFormatBrush, captureFormatBrush } from '../src/lib/formatBrush'

const editors: Editor[] = []

const createEditor = () => {
  const editor = new Editor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: '<p>样本文字</p><p>目标文字</p>'
  })
  editors.push(editor)
  return editor
}

afterEach(() => editors.splice(0).forEach((editor) => editor.destroy()))

describe('可视化编辑格式刷', () => {
  it('复制文字样式与段落对齐，但不复制内容', () => {
    const editor = createEditor()
    editor
      .chain()
      .setTextSelection({ from: 1, to: 5 })
      .setFontFamily('Songti SC, serif')
      .setFontSize('20px')
      .setColor('#c43f5a')
      .setBold()
      .setItalic()
      .setUnderline()
      .setStrike()
      .setLink({ href: 'https://urbancomp.net' })
      .setTextAlign('center')
      .run()

    const snapshot = captureFormatBrush(editor)
    editor.commands.setTextSelection({ from: 7, to: 11 })

    expect(applyFormatBrush(editor, snapshot)).toBe(true)
    expect(editor.getText()).toBe('样本文字\n\n目标文字')
    expect(editor.getAttributes('textStyle')).toMatchObject({
      fontFamily: 'Songti SC, serif',
      fontSize: '20px',
      color: '#c43f5a'
    })
    expect(editor.isActive('bold')).toBe(true)
    expect(editor.isActive('italic')).toBe(true)
    expect(editor.isActive('underline')).toBe(true)
    expect(editor.isActive('strike')).toBe(true)
    expect(editor.isActive('link')).toBe(false)
    expect(editor.getAttributes('paragraph').textAlign).toBe('center')
  })

  it('从普通文字取样时清除目标的局部样式', () => {
    const editor = createEditor()
    editor
      .chain()
      .setTextSelection({ from: 7, to: 11 })
      .setColor('#123456')
      .setBold()
      .setTextAlign('right')
      .run()
    editor.commands.setTextSelection({ from: 1, to: 5 })
    const snapshot = captureFormatBrush(editor)
    editor.commands.setTextSelection({ from: 7, to: 11 })

    expect(applyFormatBrush(editor, snapshot)).toBe(true)
    expect(editor.isActive('bold')).toBe(false)
    expect(editor.getAttributes('textStyle').color).toBeUndefined()
    expect(editor.getAttributes('paragraph').textAlign).not.toBe('right')
  })

  it('忽略空选区和原取样选区', () => {
    const editor = createEditor()
    editor.commands.setTextSelection({ from: 1, to: 5 })
    const snapshot = captureFormatBrush(editor)

    expect(applyFormatBrush(editor, snapshot)).toBe(false)
    editor.commands.setTextSelection(7)
    expect(applyFormatBrush(editor, snapshot)).toBe(false)
  })
})
