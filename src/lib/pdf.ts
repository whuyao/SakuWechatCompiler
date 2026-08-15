const escapeHtml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

export const createPrintablePdfHtml = (title: string, articleHtml: string): string => `<!doctype html>
<html lang="zh-CN" style="margin:0;padding:0;background:#fff;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="box-sizing:border-box;margin:0;padding:0;background:#fff;color:#2f3337;font-family:-apple-system,BlinkMacSystemFont,&quot;PingFang SC&quot;,&quot;Helvetica Neue&quot;,sans-serif;-webkit-font-smoothing:antialiased;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
    <main style="box-sizing:border-box;width:100%;max-width:677px;margin:0 auto;padding:0;">${articleHtml}</main>
  </body>
</html>`
