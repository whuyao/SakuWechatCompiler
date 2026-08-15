import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  Menu,
  type MenuItemConstructorOptions,
  nativeImage,
  net,
  shell
} from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import * as mammoth from 'mammoth'
import { createPrintablePdfHtml } from '../src/lib/pdf'
import { compareVersions, parseGitHubRelease, type UpdateCheckResult } from '../src/lib/update'

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

const GITHUB_LATEST_RELEASE_API = 'https://api.github.com/repos/whuyao/SakuWechatCompiler/releases/latest'

const checkForUpdates = async (parentWindow?: BrowserWindow): Promise<UpdateCheckResult> => {
  const currentVersion = app.getVersion()

  try {
    const response = await net.fetch(GITHUB_LATEST_RELEASE_API, {
      signal: AbortSignal.timeout(12_000),
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': `SakuWechatCompiler/${currentVersion}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    if (!response.ok) throw new Error(`GitHub API 返回 ${response.status}`)

    const release = parseGitHubRelease(await response.json())
    if (compareVersions(release.version, currentVersion) <= 0) {
      await dialog.showMessageBox(parentWindow ?? undefined, {
        type: 'info',
        title: '检查更新',
        message: '当前已是最新版本',
        detail: `当前版本：${currentVersion}\n最新版本：${release.version}`,
        buttons: ['好'],
        noLink: true
      })
      return { status: 'up-to-date', currentVersion, latestVersion: release.version }
    }

    const notes = release.notes.length > 1200 ? `${release.notes.slice(0, 1200)}…` : release.notes
    const result = await dialog.showMessageBox(parentWindow ?? undefined, {
      type: 'info',
      title: '发现新版本',
      message: `SakuWechatCompiler ${release.version} 可以更新`,
      detail: `当前版本：${currentVersion}\n最新版本：${release.version}${notes ? `\n\n更新说明\n${notes}` : ''}\n\n更新不会自动安装；选择下载后，请打开 DMG 完成替换。`,
      buttons: ['下载更新', '稍后'],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    })

    if (result.response === 0) await shell.openExternal(release.downloadUrl ?? release.pageUrl)
    return { status: 'available', currentVersion, latestVersion: release.version }
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    await dialog.showMessageBox(parentWindow ?? undefined, {
      type: 'warning',
      title: '无法检查更新',
      message: '暂时无法连接 GitHub Release。',
      detail: `${message}\n\n应用仍可离线正常使用，请稍后重试。`,
      buttons: ['好'],
      noLink: true
    })
    return { status: 'error', currentVersion, message }
  }
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
        {
          label: '检查更新…',
          click: () => void checkForUpdates(BrowserWindow.getFocusedWindow() ?? undefined)
        },
        { type: 'separator' },
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

  ipcMain.handle('app:check-for-updates', async (event) => {
    return checkForUpdates(BrowserWindow.fromWebContents(event.sender) ?? undefined)
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
