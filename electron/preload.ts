import { contextBridge, ipcRenderer } from 'electron'

const api = {
  importContent: () => ipcRenderer.invoke('content:import'),
  saveDocument: (request: { content: string; currentPath?: string | null; saveAs?: boolean }) =>
    ipcRenderer.invoke('document:save', request),
  openProject: () => ipcRenderer.invoke('project:open'),
  saveProject: (request: { content: string; currentPath?: string | null; saveAs?: boolean }) =>
    ipcRenderer.invoke('project:save', request),
  exportPdf: (request: { html: string; title: string }) =>
    ipcRenderer.invoke('document:export-pdf', request),
  writeRichText: (html: string, text: string) =>
    ipcRenderer.invoke('clipboard:write-rich-text', html, text),
  setDirtyState: (dirty: boolean) => ipcRenderer.send('app:set-dirty', dirty),
  checkForUpdates: () => ipcRenderer.invoke('app:check-for-updates'),
  platform: process.platform,
  architecture: process.arch
}

contextBridge.exposeInMainWorld('saku', api)
