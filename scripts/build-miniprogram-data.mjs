/**
 * 把 @cs/heihua-data 的源码打包成单文件 CommonJS，供微信原生小程序 require。
 * 微信小程序不支持 ESM，dist 里的 ESM 产物无法直接消费；也不走「构建 npm」
 * （pnpm 的 symlink 与开发者工具不兼容），所以用本脚本做桥接。
 *
 * 由 packages/heihua-data 的 build script 末尾调用，数据更新后一条命令双端同步。
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await build({
  entryPoints: [path.join(root, 'packages/heihua-data/src/index.ts')],
  bundle: true,
  format: 'cjs',
  target: 'es2018',
  outfile: path.join(root, 'apps/miniprogram/utils/heihua-data.js'),
  minify: false,
  logLevel: 'info',
})
