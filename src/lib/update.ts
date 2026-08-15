export const RELEASES_URL = 'https://github.com/whuyao/SakuWechatCompiler/releases'

export type UpdateCheckResult = {
  status: 'available' | 'up-to-date' | 'error'
  currentVersion: string
  latestVersion?: string
  message?: string
}

export type GitHubRelease = {
  version: string
  title: string
  pageUrl: string
  downloadUrl?: string
  notes: string
}

type ParsedVersion = {
  core: number[]
  prerelease: string[]
}

const parseVersion = (value: string): ParsedVersion => {
  const normalized = value.trim().replace(/^v/i, '').split('+', 1)[0]
  const [coreValue, prereleaseValue = ''] = normalized.split('-', 2)
  const coreParts = coreValue.split('.')

  if (coreParts.length < 2 || coreParts.some((part) => !/^\d+$/.test(part))) {
    throw new Error(`无法识别版本号 ${value}`)
  }

  return {
    core: coreParts.map(Number),
    prerelease: prereleaseValue ? prereleaseValue.split('.') : []
  }
}

export const compareVersions = (left: string, right: string): number => {
  const a = parseVersion(left)
  const b = parseVersion(right)
  const coreLength = Math.max(a.core.length, b.core.length)

  for (let index = 0; index < coreLength; index += 1) {
    const difference = (a.core[index] ?? 0) - (b.core[index] ?? 0)
    if (difference !== 0) return difference > 0 ? 1 : -1
  }

  if (a.prerelease.length === 0 && b.prerelease.length > 0) return 1
  if (a.prerelease.length > 0 && b.prerelease.length === 0) return -1

  const prereleaseLength = Math.max(a.prerelease.length, b.prerelease.length)
  for (let index = 0; index < prereleaseLength; index += 1) {
    const leftPart = a.prerelease[index]
    const rightPart = b.prerelease[index]
    if (leftPart === undefined) return -1
    if (rightPart === undefined) return 1
    if (leftPart === rightPart) continue

    const leftIsNumber = /^\d+$/.test(leftPart)
    const rightIsNumber = /^\d+$/.test(rightPart)
    if (leftIsNumber && rightIsNumber) return Number(leftPart) > Number(rightPart) ? 1 : -1
    if (leftIsNumber !== rightIsNumber) return leftIsNumber ? -1 : 1
    return leftPart.localeCompare(rightPart) > 0 ? 1 : -1
  }

  return 0
}

export const isSafeReleaseUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
      && url.hostname === 'github.com'
      && url.pathname.startsWith('/whuyao/SakuWechatCompiler/releases/')
  } catch {
    return false
  }
}

export const parseGitHubRelease = (value: unknown): GitHubRelease => {
  if (!value || typeof value !== 'object') throw new Error('GitHub Release 返回了无效数据。')
  const release = value as Record<string, unknown>
  const version = typeof release.tag_name === 'string' ? release.tag_name.trim().replace(/^v/i, '') : ''
  const pageUrl = typeof release.html_url === 'string' ? release.html_url : ''

  parseVersion(version)
  if (!isSafeReleaseUrl(pageUrl)) throw new Error('Release 下载地址无效。')

  const assets = Array.isArray(release.assets) ? release.assets : []
  const dmgAsset = assets.find((asset) => {
    if (!asset || typeof asset !== 'object') return false
    const item = asset as Record<string, unknown>
    return typeof item.name === 'string' && /-arm64\.dmg$/i.test(item.name)
  }) as Record<string, unknown> | undefined
  const candidateDownloadUrl = typeof dmgAsset?.browser_download_url === 'string'
    ? dmgAsset.browser_download_url
    : undefined

  return {
    version,
    title: typeof release.name === 'string' && release.name.trim() ? release.name.trim() : `v${version}`,
    pageUrl,
    downloadUrl: candidateDownloadUrl && isSafeReleaseUrl(candidateDownloadUrl)
      ? candidateDownloadUrl
      : undefined,
    notes: typeof release.body === 'string' ? release.body.trim() : ''
  }
}
