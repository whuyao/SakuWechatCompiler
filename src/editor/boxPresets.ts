export type BoxPreset = {
  id: string
  name: string
  description: string
  swatch: string
  style: string
}

export const BOX_PRESETS: BoxPreset[] = [
  {
    id: 'sakura-note',
    name: '樱花便笺',
    description: '柔粉背景与左侧强调线',
    swatch: '#d96b86',
    style:
      'margin:20px 0;padding:18px 20px;border-left:4px solid #d96b86;border-radius:4px 12px 12px 4px;background:#fff3f6;color:#4b3339;line-height:1.8;'
  },
  {
    id: 'matcha-card',
    name: '抹茶卡片',
    description: '清爽绿色圆角卡片',
    swatch: '#6e9b77',
    style:
      'margin:20px 0;padding:20px;border:1px solid #a9c9ae;border-radius:14px;background:#f2f8f3;color:#304a35;line-height:1.8;box-shadow:0 5px 16px rgba(70,110,78,.10);'
  },
  {
    id: 'amber-frame',
    name: '琥珀边框',
    description: '温暖双层感边框',
    swatch: '#c88b32',
    style:
      'margin:20px 0;padding:18px 20px;border:2px solid #d5a75f;border-radius:6px;background:#fffbf1;color:#554329;line-height:1.8;box-shadow:inset 0 0 0 4px #fff4d8;'
  },
  {
    id: 'ocean-line',
    name: '海盐蓝线',
    description: '简洁的上下蓝色边线',
    swatch: '#4f8ea8',
    style:
      'margin:20px 0;padding:18px 16px;border-top:2px solid #4f8ea8;border-bottom:2px solid #4f8ea8;background:#f3fafc;color:#294653;line-height:1.8;'
  },
  {
    id: 'violet-dash',
    name: '紫藤虚线',
    description: '轻盈的紫色虚线框',
    swatch: '#8a72ad',
    style:
      'margin:20px 0;padding:18px 20px;border:1.5px dashed #9a84b8;border-radius:12px;background:#faf7ff;color:#483d59;line-height:1.8;'
  },
  {
    id: 'ink-quote',
    name: '墨色摘录',
    description: '适合结论和重要引用',
    swatch: '#30343b',
    style:
      'margin:20px 0;padding:20px 22px;border-radius:2px;background:#30343b;color:#f8f4ea;line-height:1.9;box-shadow:6px 6px 0 #d8cdbd;'
  },
  {
    id: 'coral-corner',
    name: '珊瑚角标',
    description: '醒目的珊瑚色卡片',
    swatch: '#e56f5a',
    style:
      'margin:20px 0;padding:20px;border-top:5px solid #e56f5a;border-right:1px solid #f1b7ad;border-bottom:1px solid #f1b7ad;border-left:1px solid #f1b7ad;border-radius:8px;background:#fff8f6;color:#5c3832;line-height:1.8;'
  },
  {
    id: 'mono-paper',
    name: '黑白纸张',
    description: '克制的编辑手记风格',
    swatch: '#707070',
    style:
      'margin:20px 0;padding:20px;border:1px solid #b8b8b8;border-radius:0;background:#fbfbf9;color:#303030;line-height:1.85;box-shadow:4px 4px 0 #e5e2dc;'
  }
]

export const getBoxPreset = (id: string): BoxPreset =>
  BOX_PRESETS.find((preset) => preset.id === id) ?? BOX_PRESETS[0]
