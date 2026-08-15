# SakuWechatCompiler 架构

## 进程边界

SakuWechatCompiler 使用 Electron 的本地主进程/渲染进程架构，不启动 HTTP API 服务，也不依赖互联网。

```text
React + Tiptap 渲染进程
        │
        │ contextBridge / IPC
        ▼
Electron 主进程
  ├── macOS 文件对话框
  ├── 工程和内容文件读写
  ├── Mammoth DOCX 转换
  ├── HTML / 纯文本剪贴板
  └── 原生菜单与“关于”对话框
```

渲染进程启用 `contextIsolation` 和 `sandbox`，不启用 `nodeIntegration`。`electron/preload.ts` 只暴露完成产品功能所需的最小 API。

## 内容模型

Tiptap/ProseMirror 是编辑状态的权威模型：

- 标题、段落、列表等是标准块节点。
- `sakuBox` 是容纳一个或多个块的彩色框节点。
- `sakuImagePlaceholder` 是不可编辑的原子块节点。
- `sakuCaption` 保存图片/表格引文，`sakuTable` 保存 Markdown 表格，`sakuCitation` 保存文内编号引文。
- 字体、字号和颜色保存为 `textStyle` mark 属性。

## 转换管线

### Markdown 导入

```text
扩展 Markdown
→ 展开彩色框、图片占位符、图表引文和学术引文语法
→ Marked 解析
→ HTML 白名单清理
→ Tiptap 文档
```

### Markdown 导出

```text
Tiptap HTML
→ HTML 白名单清理
→ Turndown
→ 恢复 :::saku-box、{{image:…}}、图表引文、表格、{{cite:…}} 和安全行内样式
```

### 微信复制

```text
Tiptap HTML
→ 清理危险内容
→ 删除空段落并转换 H1–H5 / HR 为微信稳定块
→ 对四列以上表格启用紧凑固定布局
→ 应用微信保守样式
→ CSS 全部内联
→ 清除编辑器属性
→ Electron clipboard.write({ html, text })
```

## 工程格式

`.sakuwechat` 是带版本号的 UTF-8 JSON：

```json
{
  "format": "saku-wechat-project",
  "version": 1,
  "title": "文章标题",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "document": {
    "html": "<p>编辑器内容</p>",
    "markdown": "扩展 Markdown"
  },
  "settings": {
    "canvasWidth": 677,
    "defaultFont": "系统字体栈"
  }
}
```

解析工程时会验证 `format` 和 `version`，并再次清理 HTML。

## 目录

```text
electron/             Electron 主进程和 preload
resources/            打包资源，包括 UrbanComp Logo
src/editor/            Tiptap 节点和框素材
src/lib/               Markdown、工程和微信转换
src/styles/            桌面界面样式
tests/                 转换与工程格式测试
```
