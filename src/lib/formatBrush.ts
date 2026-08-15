import type { Editor } from '@tiptap/core'

export type FormatBrushSnapshot = {
  sourceFrom: number
  sourceTo: number
  fontFamily?: string
  fontSize?: string
  color?: string
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  textAlign?: 'left' | 'center' | 'right' | 'justify'
}

const readTextAlign = (editor: Editor): FormatBrushSnapshot['textAlign'] => {
  const value = editor.getAttributes('paragraph').textAlign ?? editor.getAttributes('heading').textAlign
  return value === 'left' || value === 'center' || value === 'right' || value === 'justify'
    ? value
    : undefined
}

export const captureFormatBrush = (editor: Editor): FormatBrushSnapshot => {
  const textStyle = editor.getAttributes('textStyle')
  const { from, to } = editor.state.selection

  return {
    sourceFrom: from,
    sourceTo: to,
    fontFamily: typeof textStyle.fontFamily === 'string' ? textStyle.fontFamily : undefined,
    fontSize: typeof textStyle.fontSize === 'string' ? textStyle.fontSize : undefined,
    color: typeof textStyle.color === 'string' ? textStyle.color : undefined,
    bold: editor.isActive('bold'),
    italic: editor.isActive('italic'),
    underline: editor.isActive('underline'),
    strike: editor.isActive('strike'),
    textAlign: readTextAlign(editor)
  }
}

export const applyFormatBrush = (editor: Editor, snapshot: FormatBrushSnapshot): boolean => {
  const { from, to } = editor.state.selection
  if (from === to || (from === snapshot.sourceFrom && to === snapshot.sourceTo)) return false

  let chain = editor.chain().focus()
  chain = snapshot.fontFamily ? chain.setFontFamily(snapshot.fontFamily) : chain.unsetFontFamily()
  chain = snapshot.fontSize ? chain.setFontSize(snapshot.fontSize) : chain.unsetFontSize()
  chain = snapshot.color ? chain.setColor(snapshot.color) : chain.unsetColor()
  chain = snapshot.bold ? chain.setBold() : chain.unsetBold()
  chain = snapshot.italic ? chain.setItalic() : chain.unsetItalic()
  chain = snapshot.underline ? chain.setUnderline() : chain.unsetUnderline()
  chain = snapshot.strike ? chain.setStrike() : chain.unsetStrike()

  chain = snapshot.textAlign ? chain.setTextAlign(snapshot.textAlign) : chain.unsetTextAlign()
  return chain.run()
}
