import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  Menu,
  type MenuItemConstructorOptions,
  nativeImage,
  shell
} from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import * as mammoth from 'mammoth'
import { createPrintablePdfHtml } from '../src/lib/pdf'

type SaveRequest = {
  content: string
  currentPath?: string | null
  saveAs?: boolean
}

type PdfExportRequest = {
  html: string
  title: string
}

app.setName('SakuWechatCompiler')

const dirtyWindows = new Map<number, boolean>()

const productIconPath = (): string =>
  app.isPackaged
    ? join(process.resourcesPath, 'app-icon-1024.png')
    : join(app.getAppPath(), 'resources/app-icon-1024.png')

const showAboutDialog = async (): Promise<void> => {
  const logoPath = app.isPackaged
    ? join(process.resourcesPath, 'urbancomp-logo.png')
    : join(app.getAppPath(), 'resources/urbancomp-logo.png')
  const logo = nativeImage.createFromPath(logoPath)
  const result = await dialog.showMessageBox({
    type: 'info',
    title: '关于 SakuWechatCompiler',
    message: 'SakuWechatCompiler',
    detail: `版本 ${app.getVersion()}\n\n由 UrbanComp 团队制作\nhttps://urbancomp.net`,
    icon: logo.isEmpty() ? undefined : logo,
    buttons: ['访问 UrbanComp 官网', '关闭'],
    defaultId: 1,
    cancelId: 1,
    noLink: true
  })

  if (result.response === 0) await shell.openExternal('https://urbancomp.net')
}

const installApplicationMenu = (): void => {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'SakuWechatCompiler',
      submenu: [
        { label: '关于 SakuWechatCompiler', click: () => void showAboutDialog() },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: '文件',
      submenu: [{ role: 'close' }]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: '显示',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools', visible: !app.isPackaged },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' }]
    },
    {
      label: '帮助',
      submenu: [
        { label: 'UrbanComp 官网', click: () => void shell.openExternal('https://urbancomp.net') },
        { label: '关于 SakuWechatCompiler', click: () => void showAboutDialog() }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

const createWindow = (): void => {
  const window = new BrowserWindow({
    width: 1500,
    height: 960,
    minWidth: 1320,
    minHeight: 720,
    show: false,
    title: 'SakuWechatCompiler',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    backgroundColor: '#f5f2eb',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  const windowId = window.id

  window.on('close', (event) => {
    if (!dirtyWindows.get(windowId)) return

    const response = dialog.showMessageBoxSync(window, {
      type: 'warning',
      title: '尚未保存工程',
      message: '当前工程还有未保存的修改。',
      detail: '你可以直接退出，不需要先保存工程。',
      buttons: ['取消', '不保存并退出'],
      defaultId: 1,
      cancelId: 0,
      noLink: true
    })

    if (response === 0) event.preventDefault()
  })

  window.on('closed', () => dirtyWindows.delete(windowId))

  window.once('ready-to-show', () => {
    window.maximize()
    window.show()
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const registerIpc = (): void => {
  ipcMain.on('app:set-dirty', (event, dirty: boolean) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) dirtyWindows.set(window.id, Boolean(dirty))
  })

  ipcMain.handle('content:import', async () => {
    const result = await dialog.showOpenDialog({
      title: '导入 Markdown 或 DOCX 文档',
      properties: ['openFile'],
      filters: [
        { name: 'Markdown 与 DOCX', extensions: ['md', 'markdown', 'docx'] },
        { name: 'Markdown', extensions: ['md', 'markdown'] },
        { name: 'DOCX 文档', extensions: ['docx'] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const path = result.filePaths[0]
    const extension = extname(path).toLowerCase()

    if (extension === '.docx') {
      let imageCount = 0
      const conversion = await mammoth.convertToHtml(
        { buffer: await readFile(path) },
        {
          styleMap: [
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Subtitle'] => h2:fresh",
            "p[style-name='Quote'] => blockquote:fresh"
          ],
          convertImage: mammoth.images.imgElement(async () => {
            imageCount += 1
            return { src: `saku-word-image-placeholder:${imageCount}` }
          })
        }
      )
      return {
        path,
        name: basename(path),
        kind: 'docx',
        content: conversion.value,
        imageCount,
        warnings: conversion.messages.map((message) => message.message)
      }
    }

    return {
      path,
      name: basename(path),
      kind: 'markdown',
      content: await readFile(path, 'utf8'),
      imageCount: 0,
      warnings: []
    }
  })

  ipcMain.handle('document:save', async (_event, request: SaveRequest) => {
    let path = request.currentPath ?? null

    if (!path || request.saveAs) {
      const result = await dialog.showSaveDialog({
        title: '保存 Markdown 文件',
        defaultPath: path ? join(dirname(path), basename(path)) : '未命名文章.md',
        filters: [{ name: 'Markdown', extensions: ['md'] }]
      })
      if (result.canceled || !result.filePath) return null
      path = result.filePath
    }

    await writeFile(path, request.content, 'utf8')
    return { path, name: basename(path) }
  })

  ipcMain.handle('project:open', async () => {
    const result = await dialog.showOpenDialog({
      title: '打开 SakuWechatCompiler 工程',
      properties: ['openFile'],
      filters: [{ name: 'SakuWechatCompiler 工程', extensions: ['sakuwechat'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const path = result.filePaths[0]
    return {
      path,
      name: basename(path),
      content: await readFile(path, 'utf8')
    }
  })

  ipcMain.handle('project:save', async (_event, request: SaveRequest) => {
    let path = request.currentPath ?? null
    if (!path || request.saveAs) {
      const result = await dialog.showSaveDialog({
        title: '保存 SakuWechatCompiler 工程',
        defaultPath: path ? join(dirname(path), basename(path)) : '未命名工程.sakuwechat',
        filters: [{ name: 'SakuWechatCompiler 工程', extensions: ['sakuwechat'] }]
      })
      if (result.canceled || !result.filePath) return null
      path = result.filePath
    }

    await writeFile(path, request.content, 'utf8')
    return { path, name: basename(path) }
  })

  ipcMain.handle('document:export-pdf', async (_event, request: PdfExportRequest) => {
    const safeTitle = request.title.trim().replace(/[\\/:*?"<>|]/g, '-') || '未命名文章'
    const result = await dialog.showSaveDialog({
      title: '导出排版后 PDF',
      defaultPath: `${safeTitle}.pdf`,
      filters: [{ name: 'PDF 文档', extensions: ['pdf'] }]
    })
    if (result.canceled || !result.filePath) return null

    const pdfWindow = new BrowserWindow({
      width: 794,
      height: 1123,
      show: false,
      backgroundColor: '#ffffff',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        javascript: false
      }
    })

    try {
      const printableHtml = createPrintablePdfHtml(request.title, request.html)
      await pdfWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(printableHtml)}`)
      const pdf = await pdfWindow.webContents.printToPDF({
        pageSize: 'A4',
        preferCSSPageSize: false,
        printBackground: true,
        margins: {
          top: 0.63,
          right: 0.59,
          bottom: 0.71,
          left: 0.59
        }
      })
      await writeFile(result.filePath, pdf)
    } finally {
      if (!pdfWindow.isDestroyed()) pdfWindow.destroy()
    }

    return { path: result.filePath, name: basename(result.filePath) }
  })

  ipcMain.handle('clipboard:write-rich-text', (_event, html: string, text: string) => {
    clipboard.write({ html, text })
    return true
  })
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    const productIcon = nativeImage.createFromPath(productIconPath())
    if (!productIcon.isEmpty()) app.dock.setIcon(productIcon)
  }
  installApplicationMenu()
  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
