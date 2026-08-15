import { describe, expect, it } from 'vitest'
import { compareVersions, isSafeReleaseUrl, parseGitHubRelease } from '../src/lib/update'

describe('GitHub Release 更新检查', () => {
  it('比较稳定版、v 前缀和预发布版本', () => {
    expect(compareVersions('v0.2.3', '0.2.2')).toBe(1)
    expect(compareVersions('0.2.3', 'v0.2.3')).toBe(0)
    expect(compareVersions('0.2.3-beta.2', '0.2.3-beta.1')).toBe(1)
    expect(compareVersions('0.2.3', '0.2.3-beta.2')).toBe(1)
  })

  it('只接受项目自己的 GitHub Release 地址并读取 arm64 DMG', () => {
    const release = parseGitHubRelease({
      tag_name: 'v0.2.3',
      name: 'SakuWechatCompiler 0.2.3',
      html_url: 'https://github.com/whuyao/SakuWechatCompiler/releases/tag/v0.2.3',
      body: '更新说明',
      assets: [{
        name: 'SakuWechatCompiler-0.2.3-arm64.dmg',
        browser_download_url: 'https://github.com/whuyao/SakuWechatCompiler/releases/download/v0.2.3/SakuWechatCompiler-0.2.3-arm64.dmg'
      }]
    })

    expect(release.version).toBe('0.2.3')
    expect(release.downloadUrl).toContain('SakuWechatCompiler-0.2.3-arm64.dmg')
    expect(isSafeReleaseUrl('https://example.com/releases/v0.2.3')).toBe(false)
  })

  it('拒绝格式错误或被替换的 Release 页面', () => {
    expect(() => parseGitHubRelease({
      tag_name: 'latest',
      html_url: 'https://github.com/whuyao/SakuWechatCompiler/releases/tag/latest'
    })).toThrow('无法识别版本号')

    expect(() => parseGitHubRelease({
      tag_name: 'v0.2.3',
      html_url: 'https://attacker.example/download'
    })).toThrow('Release 下载地址无效')
  })
})
