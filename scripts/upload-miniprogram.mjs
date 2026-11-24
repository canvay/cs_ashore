/**
 * 小程序 CI 上传（miniprogram-ci）。
 *
 * 环境变量：
 * - MP_UPLOAD_KEY：小程序代码上传密钥（mp.weixin.qq.com → 开发管理 → 开发设置 → 生成，密钥文件原样内容）
 * - MP_VERSION：版本号，默认 1.0.0
 * - MP_DESC：版本描述
 * - MP_ROBOT：机器人编号 1-30，默认 1（对应后台「版本管理」里不同的上传者）
 *
 * 用法：node scripts/upload-miniprogram.mjs
 */
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import ci from 'miniprogram-ci'

const APPID = 'wxbd044e3304264f53'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const key = process.env.MP_UPLOAD_KEY
if (!key) {
  console.error('✗ 缺少环境变量 MP_UPLOAD_KEY（小程序代码上传密钥内容，需包含 -----BEGIN RSA PRIVATE KEY----- 头尾行）')
  process.exit(1)
}

/* 密钥写到临时文件（miniprogram-ci 只接受 privateKeyPath），密钥必须是完整 PEM 文件内容 */
const keyPath = path.join(mkdtempSync(path.join(tmpdir(), 'mp-key-')), 'private.key')
writeFileSync(keyPath, key.replace(/\r\n/g, '\n').trimEnd() + '\n')

const project = new ci.Project({
  appid: APPID,
  type: 'miniProgram',
  projectPath: path.join(root, 'apps/miniprogram'),
  privateKeyPath: keyPath,
  ignores: ['node_modules/**/*'],
})

const version = process.env.MP_VERSION || '0.1.0'
const desc = (process.env.MP_DESC || 'GitHub Actions 自动上传').slice(0, 100)

const result = await ci.upload({
  project,
  version,
  desc,
  setting: { es6: true, es7: true, minify: true, autoPrefix: true },
  robot: Number(process.env.MP_ROBOT || 1),
})

console.log(`✓ 上传成功：版本 ${version}，包大小 ${(result.subPackageInfo?.[0]?.size ?? 0)} 字节（${desc}）`)
