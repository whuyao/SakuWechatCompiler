export type WechatThemeStyles = {
  container: string
  h1: string
  h2: string
  h3: string
  h4: string
  h5: string
  paragraph: string
  strong: string
  emphasis: string
  link: string
  quote: string
  list: string
  listMarker: string
  codeBlock: string
  codeHeader: string
  inlineCode: string
  rule: string
  table: string
  tableHead: string
  tableCell: string
  placeholder: string
  caption: string
}

export type WechatTheme = {
  id: string
  name: string
  group: '经典' | '媒体' | '现代'
  description: string
  accent: string
  background: string
  foreground: string
  styles: WechatThemeStyles
}

const base: WechatThemeStyles = {
  container:
    'box-sizing:border-box;width:100%;max-width:100%;margin:0;padding:4px 2px 24px;font-family:-apple-system-font,BlinkMacSystemFont,"Helvetica Neue","PingFang SC","Hiragino Sans GB","Microsoft YaHei UI",Arial,sans-serif;font-size:15px;letter-spacing:.025em;color:#2f3337;background-color:#ffffff;word-break:break-word;overflow-wrap:anywhere;text-size-adjust:100%;-webkit-text-size-adjust:100%;',
  h1: 'margin:34px 0 18px;padding:0;font-size:24px;line-height:1.45;font-weight:750;color:#202326;text-align:left;',
  h2: 'margin:28px 0 15px;padding:2px 0 2px 12px;border-left:4px solid #d96b86;font-size:20px;line-height:1.5;font-weight:700;color:#262a2e;text-align:left;',
  h3: 'margin:24px 0 13px;padding:0;font-size:18px;line-height:1.55;font-weight:700;color:#34383c;text-align:left;',
  h4: 'margin:21px 0 11px;padding:0;font-size:16px;line-height:1.6;font-weight:700;color:#a34f62;text-align:left;',
  h5: 'margin:18px 0 10px;padding:0;font-size:15px;line-height:1.65;font-weight:700;color:#555b60;text-align:left;letter-spacing:.04em;',
  paragraph: 'margin:0 0 17px;font-size:15px;color:#2f3337;text-align:justify;word-break:break-word;overflow-wrap:anywhere;',
  strong: 'font-weight:700;color:#202326;',
  emphasis: 'font-style:italic;color:#6e6265;',
  link: 'color:#3f7892;text-decoration:none;border-bottom:1px solid #8eb1c1;',
  quote: 'box-sizing:border-box;width:100%;margin:20px 0;padding:13px 16px;border-left:4px solid #d7a4b1;background-color:#fbf5f6;color:#675d60;font-size:15px;text-align:left;word-break:break-word;overflow-wrap:anywhere;',
  list: 'box-sizing:border-box;width:100%;margin:0 0 17px;padding:0;color:#2f3337;',
  listMarker: 'display:table-cell;width:1.75em;margin:0;padding:0 .4em 0 0;color:#b45f76;font-weight:700;text-align:right;vertical-align:top;',
  codeBlock: 'box-sizing:border-box;width:100%;margin:20px 0;padding:0 15px 14px;border:1px solid #dfe3e6;border-radius:8px;background-color:#f6f8fa;color:#263238;text-align:left;word-break:break-all;overflow-wrap:anywhere;',
  codeHeader: 'height:28px;padding-top:10px;font-size:0;line-height:0;text-align:left;',
  inlineCode: 'margin:0 2px;padding:2px 5px;border:1px solid #e4e1dc;border-radius:4px;background-color:#f3f1ed;color:#b4495b;font-family:Menlo,Monaco,Consolas,"Courier New",monospace;font-size:13px;line-height:1.6em;letter-spacing:0;word-break:break-all;overflow-wrap:anywhere;',
  rule: 'box-sizing:border-box;width:72px;height:1px;margin:32px auto;background-color:#dedbd4;font-size:0;line-height:0;',
  table: 'box-sizing:border-box;width:100%;max-width:100%;margin:12px 0 22px;border-collapse:collapse;table-layout:fixed;font-size:13px;line-height:1.55;',
  tableHead: 'box-sizing:border-box;padding:7px 8px;border:1px solid #cbc8c0;background-color:#f2efe8;font-size:13px;font-weight:700;line-height:1.5;text-align:center;vertical-align:middle;word-break:break-all;overflow-wrap:anywhere;white-space:normal;',
  tableCell: 'box-sizing:border-box;padding:7px 8px;border:1px solid #d8d5ce;background-color:#ffffff;font-size:13px;font-weight:400;line-height:1.55;text-align:left;vertical-align:top;word-break:break-all;overflow-wrap:anywhere;white-space:normal;',
  placeholder: 'margin:24px 0;padding:25px 16px;border:1.5px dashed #b8aca1;border-radius:10px;background-color:#faf8f4;color:#80756d;text-align:center;font-size:14px;line-height:1.7;',
  caption: 'margin:8px 0 19px;color:#666d72;font-size:13px;line-height:1.65;text-align:center;'
}

const mergeStyles = (overrides: Partial<WechatThemeStyles>): WechatThemeStyles => ({ ...base, ...overrides })

export const WECHAT_THEMES: WechatTheme[] = [
  {
    id: 'saku-classic',
    name: '樱序经典',
    group: '经典',
    description: '温和、清晰，适合多数公众号文章',
    accent: '#d96b86',
    background: '#ffffff',
    foreground: '#2f3337',
    styles: mergeStyles({})
  },
  {
    id: 'deep-reading',
    name: '深度阅读',
    group: '经典',
    description: '沉稳红黑，适合长文和评论',
    accent: '#b23632',
    background: '#ffffff',
    foreground: '#1e1f20',
    styles: mergeStyles({
      container: `${base.container}font-size:16px;color:#1e1f20;`,
      h1: 'margin:38px 0 19px;padding:0 0 11px;border-bottom:3px solid #b23632;font-size:26px;line-height:1.4;font-weight:750;color:#161718;',
      h2: 'margin:32px 0 17px;padding:10px 15px;border:0;border-radius:3px;background-color:#b23632;color:#ffffff;font-size:20px;line-height:1.45;font-weight:700;',
      h3: 'margin:27px 0 14px;padding-left:12px;border-left:4px solid #b23632;font-size:18px;line-height:1.55;font-weight:700;color:#b23632;',
      h4: 'margin:23px 0 12px;padding:6px 10px;border-left:3px solid #dd7e78;background-color:#f7f5f3;font-size:16px;line-height:1.6;font-weight:700;color:#252627;',
      paragraph: 'margin:0 0 19px;font-size:16px;color:#1e1f20;text-align:justify;word-break:break-word;overflow-wrap:anywhere;',
      strong: 'font-weight:750;color:#a62e2b;',
      quote: 'box-sizing:border-box;width:100%;margin:22px 0;padding:14px 18px;border-left:4px solid #b23632;border-radius:3px;background-color:#f6f4f2;color:#494949;font-size:15px;',
      listMarker: `${base.listMarker}color:#b23632;`,
      codeBlock: `${base.codeBlock}border-left:4px solid #b23632;background-color:#2b2b2b;color:#f4f4f4;`,
      inlineCode: `${base.inlineCode}border-color:#ead8d6;background-color:#f8efee;color:#a62e2b;`,
      tableHead: `${base.tableHead}border-color:#b23632;background-color:#b23632;color:#ffffff;`,
      rule: `${base.rule}width:120px;background-color:#b23632;`
    })
  },
  {
    id: 'technical-blue',
    name: '技术蓝图',
    group: '经典',
    description: '蓝灰层次，突出代码与结构',
    accent: '#286f9b',
    background: '#ffffff',
    foreground: '#263746',
    styles: mergeStyles({
      container: `${base.container}color:#263746;`,
      h1: 'margin:34px 0 18px;padding:0 0 10px;border-bottom:2px solid #286f9b;font-size:25px;line-height:1.4;font-weight:750;color:#17384e;',
      h2: 'margin:29px 0 15px;padding:8px 12px;border:0;border-radius:4px;background-color:#eaf3f8;font-size:20px;line-height:1.5;font-weight:700;color:#1e638d;',
      h3: 'margin:24px 0 13px;padding-left:10px;border-left:3px solid #4d92b9;font-size:18px;line-height:1.55;font-weight:700;color:#245c7d;',
      paragraph: `${base.paragraph}color:#263746;`,
      strong: 'font-weight:700;color:#1c628d;',
      link: 'color:#176e9f;text-decoration:none;border-bottom:1px solid #6ba5c4;',
      quote: `${base.quote}border-color:#6aa4c2;background-color:#f0f6f9;color:#456270;`,
      listMarker: `${base.listMarker}color:#286f9b;`,
      codeBlock: `${base.codeBlock}border-color:#263746;background-color:#202b33;color:#dce7ed;`,
      inlineCode: `${base.inlineCode}border-color:#cedfe8;background-color:#edf5f8;color:#176e9f;`,
      tableHead: `${base.tableHead}border-color:#aecbd9;background-color:#eaf3f8;color:#245c7d;`,
      rule: `${base.rule}background-color:#73a6bf;`
    })
  },
  {
    id: 'magazine',
    name: '编辑部',
    group: '媒体',
    description: '杂志式标题，适合人物与文化内容',
    accent: '#c13e39',
    background: '#fffef9',
    foreground: '#2c2c2c',
    styles: mergeStyles({
      container: `${base.container}padding:8px 6px 30px;font-family:Georgia,"Songti SC",STSong,serif;color:#2c2c2c;background-color:#fffef9;`,
      h1: 'margin:38px 0 20px;padding:0;font-family:Georgia,"Songti SC",serif;font-size:30px;line-height:1.3;font-weight:650;color:#c13e39;text-align:center;',
      h2: 'margin:32px 0 17px;padding:9px 0;border-top:1px solid #c13e39;border-bottom:1px solid #c13e39;font-family:Georgia,"Songti SC",serif;font-size:23px;line-height:1.45;font-weight:650;color:#2c2c2c;text-align:center;',
      h3: 'margin:27px 0 14px;padding:0;font-family:Georgia,"Songti SC",serif;font-size:20px;line-height:1.5;font-weight:650;color:#2c2c2c;',
      h4: 'margin:23px 0 12px;padding:0;font-size:16px;line-height:1.6;font-weight:750;color:#c13e39;letter-spacing:.08em;',
      paragraph: `${base.paragraph}font-family:Georgia,"Songti SC",STSong,serif;font-size:16px;color:#2c2c2c;`,
      strong: 'font-weight:750;color:#c13e39;',
      quote: 'box-sizing:border-box;width:92%;margin:26px auto;padding:4px 20px;border:0;border-left:1px solid #c13e39;border-right:1px solid #c13e39;background-color:#fffef9;color:#5a5149;font-family:Georgia,"Songti SC",serif;font-size:16px;font-style:italic;text-align:center;',
      listMarker: `${base.listMarker}color:#c13e39;`,
      tableHead: `${base.tableHead}border-color:#c13e39;background-color:#c13e39;color:#ffffff;`,
      tableCell: `${base.tableCell}border-color:#ddd3c8;background-color:#fffef9;`,
      rule: `${base.rule}width:44px;background-color:#c13e39;`
    })
  },
  {
    id: 'financial-times',
    name: '金融时报',
    group: '媒体',
    description: '暖米色与酒红，适合商业分析',
    accent: '#990f3d',
    background: '#fff1e5',
    foreground: '#33302e',
    styles: mergeStyles({
      container: `${base.container}padding:10px 10px 30px;font-family:Georgia,"Songti SC",STSong,serif;font-size:16px;color:#33302e;background-color:#fff1e5;`,
      h1: 'margin:40px 0 21px;padding:0 0 12px;border-bottom:4px solid #990f3d;font-family:Georgia,"Songti SC",serif;font-size:30px;line-height:1.3;font-weight:700;color:#111111;',
      h2: 'margin:34px 0 18px;padding-left:15px;border-left:5px solid #990f3d;font-family:Georgia,"Songti SC",serif;font-size:24px;line-height:1.4;font-weight:700;color:#990f3d;',
      h3: 'margin:28px 0 14px;padding:0 0 7px;border-bottom:1px solid #cec6b9;font-family:Georgia,"Songti SC",serif;font-size:20px;line-height:1.5;font-weight:700;color:#33302e;',
      paragraph: `${base.paragraph}font-family:Georgia,"Songti SC",STSong,serif;font-size:16px;color:#33302e;`,
      strong: 'font-weight:750;color:#990f3d;',
      link: 'color:#0d7680;text-decoration:none;border-bottom:1px solid #0d7680;',
      quote: 'box-sizing:border-box;width:100%;margin:23px 0;padding:14px 19px;border-left:5px solid #990f3d;background-color:#fffaf5;color:#990f3d;font-family:Georgia,"Songti SC",serif;font-size:16px;font-style:italic;',
      listMarker: `${base.listMarker}color:#990f3d;`,
      codeBlock: `${base.codeBlock}border:0;border-left:4px solid #990f3d;border-radius:0;background-color:#fffaf5;color:#33302e;`,
      inlineCode: `${base.inlineCode}border-color:#d8c1b5;background-color:#fffaf5;color:#990f3d;`,
      tableHead: `${base.tableHead}border-color:#990f3d;background-color:#990f3d;color:#ffffff;`,
      tableCell: `${base.tableCell}border-color:#cec6b9;background-color:#fffaf5;color:#33302e;`,
      placeholder: `${base.placeholder}border-color:#b98094;background-color:#fffaf5;color:#7b4057;`,
      rule: `${base.rule}width:80px;height:2px;background-color:#990f3d;`
    })
  },
  {
    id: 'medium-reading',
    name: 'Medium 长文',
    group: '现代',
    description: '克制留白，适合连续阅读',
    accent: '#242424',
    background: '#ffffff',
    foreground: '#242424',
    styles: mergeStyles({
      container: `${base.container}padding:8px 4px 32px;font-family:Georgia,"Songti SC",STSong,serif;font-size:16px;color:#242424;letter-spacing:0;`,
      h1: 'margin:38px 0 19px;padding:0;font-family:Georgia,"Songti SC",serif;font-size:29px;line-height:1.3;font-weight:750;color:#242424;',
      h2: 'margin:33px 0 17px;padding:0;border:0;font-family:Georgia,"Songti SC",serif;font-size:24px;line-height:1.4;font-weight:750;color:#242424;',
      h3: 'margin:28px 0 14px;padding:0;font-family:Georgia,"Songti SC",serif;font-size:20px;line-height:1.5;font-weight:750;color:#242424;',
      paragraph: `${base.paragraph}font-family:Georgia,"Songti SC",STSong,serif;font-size:16px;color:#242424;letter-spacing:0;`,
      strong: 'font-weight:750;color:#242424;',
      quote: 'box-sizing:border-box;width:100%;margin:23px 0;padding:0 18px;border-left:3px solid #242424;background-color:#ffffff;color:#393939;font-family:Georgia,"Songti SC",serif;font-size:16px;font-style:italic;',
      listMarker: `${base.listMarker}color:#242424;`,
      tableHead: `${base.tableHead}border:0;border-bottom:2px solid #3d3d3d;background-color:#ffffff;color:#242424;`,
      tableCell: `${base.tableCell}border:0;border-bottom:1px solid #e3e3e3;color:#242424;`,
      rule: `${base.rule}width:160px;background-color:#dedede;`
    })
  },
  {
    id: 'apple-minimal',
    name: 'Apple 极简',
    group: '现代',
    description: '冷静留白，适合产品与品牌内容',
    accent: '#0066cc',
    background: '#fbfbfd',
    foreground: '#6e6e73',
    styles: mergeStyles({
      container: `${base.container}padding:10px 6px 34px;font-size:16px;color:#6e6e73;background-color:#fbfbfd;letter-spacing:0;`,
      h1: 'margin:40px 0 20px;padding:0;font-size:30px;line-height:1.25;font-weight:700;color:#1d1d1f;letter-spacing:-.02em;',
      h2: 'margin:34px 0 17px;padding:0;border:0;font-size:24px;line-height:1.35;font-weight:700;color:#1d1d1f;letter-spacing:-.015em;',
      h3: 'margin:28px 0 14px;padding:0;font-size:20px;line-height:1.45;font-weight:650;color:#1d1d1f;',
      h4: `${base.h4}color:#1d1d1f;`,
      h5: `${base.h5}color:#1d1d1f;`,
      paragraph: `${base.paragraph}font-size:16px;color:#6e6e73;letter-spacing:0;`,
      strong: 'font-weight:700;color:#1d1d1f;',
      emphasis: 'font-style:normal;color:#6e6e73;',
      link: 'color:#0066cc;text-decoration:none;',
      quote: 'box-sizing:border-box;width:90%;margin:28px auto;padding:0;border:0;background-color:#fbfbfd;color:#1d1d1f;font-size:18px;line-height:1.55;text-align:center;',
      listMarker: `${base.listMarker}color:#0066cc;`,
      codeBlock: `${base.codeBlock}border:0;border-radius:10px;background-color:#f1f1f3;color:#37373a;`,
      inlineCode: `${base.inlineCode}border:0;border-radius:6px;background-color:#eeeeef;color:#515154;`,
      tableHead: `${base.tableHead}border:0;background-color:#eeeeef;color:#1d1d1f;`,
      tableCell: `${base.tableCell}border:0;border-top:1px solid #d2d2d7;background-color:#fbfbfd;color:#6e6e73;`,
      placeholder: `${base.placeholder}border-color:#b8b8bd;background-color:#f1f1f3;color:#6e6e73;`,
      rule: `${base.rule}width:48px;background-color:#d2d2d7;`
    })
  },
  {
    id: 'claude-paper',
    name: '陶土纸页',
    group: '现代',
    description: '陶土橙与纸张质感，温暖现代',
    accent: '#c15f3c',
    background: '#faf9f7',
    foreground: '#2b2b2b',
    styles: mergeStyles({
      container: `${base.container}padding:10px 8px 34px;font-size:16px;color:#2b2b2b;background-color:#faf9f7;letter-spacing:0;`,
      h1: 'margin:38px 0 19px;padding:0;font-size:29px;line-height:1.3;font-weight:700;color:#c15f3c;letter-spacing:-.015em;',
      h2: 'margin:33px 0 17px;padding:0 0 8px;border:0;border-bottom:2px solid #d7a08c;font-size:24px;line-height:1.4;font-weight:700;color:#c15f3c;',
      h3: 'margin:28px 0 14px;padding:0;font-size:20px;line-height:1.5;font-weight:700;color:#2b2b2b;',
      paragraph: `${base.paragraph}font-size:16px;color:#2b2b2b;letter-spacing:0;`,
      strong: 'font-weight:750;color:#c15f3c;',
      link: 'color:#9a4a31;text-decoration:none;border-bottom:1px solid #d8a08d;',
      quote: 'box-sizing:border-box;width:100%;margin:23px 0;padding:14px 18px;border-left:4px solid #c15f3c;border-radius:5px;background-color:#f1ece7;color:#594b46;font-size:16px;',
      listMarker: `${base.listMarker}color:#c15f3c;`,
      codeBlock: `${base.codeBlock}border-color:#d8cdc6;background-color:#2f2d2b;color:#f5efe9;`,
      inlineCode: `${base.inlineCode}border-color:#dfc9c0;background-color:#f2e9e5;color:#a34d31;`,
      tableHead: `${base.tableHead}border-color:#c15f3c;background-color:#c15f3c;color:#ffffff;`,
      tableCell: `${base.tableCell}border-color:#d8cdc6;background-color:#faf9f7;`,
      placeholder: `${base.placeholder}border-color:#cc9b88;background-color:#f2ece8;color:#8b5844;`,
      rule: `${base.rule}width:66px;background-color:#c15f3c;`
    })
  }
]

export const DEFAULT_WECHAT_THEME_ID = 'saku-classic'

export const getWechatTheme = (id?: string): WechatTheme =>
  WECHAT_THEMES.find((theme) => theme.id === id) ?? WECHAT_THEMES[0]
