export {}

declare global {
  interface Window {
    saku?: {
      importContent: () => Promise<{
        path: string
        name: string
        kind: 'markdown' | 'docx'
        content: string
        imageCount: number
        warnings: string[]
      } | null>
      saveDocument: (request: {
        content: string
        currentPath?: string | null
        saveAs?: boolean
      }) => Promise<{ path: string; name: string } | null>
      openProject: () => Promise<{
        path: string
        name: string
        content: string
      } | null>
      saveProject: (request: {
        content: string
        currentPath?: string | null
        saveAs?: boolean
      }) => Promise<{ path: string; name: string } | null>
      exportPdf: (request: {
        html: string
        title: string
      }) => Promise<{ path: string; name: string } | null>
      writeRichText: (html: string, text: string) => Promise<boolean>
      setDirtyState: (dirty: boolean) => void
      platform: string
      architecture: string
    }
  }
}
