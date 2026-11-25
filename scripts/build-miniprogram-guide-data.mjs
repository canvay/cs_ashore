/**
 * 把 @cs/guide-data 的源码打包成单文件 CommonJS，供微信原生小程序 require。
 * 与 build-miniprogram-data.mjs 同一模式：小程序不支持 ESM，也不走「构建 npm」
 * （pnpm 的 symlink 与开发者工具不兼容），所以用本脚本做桥接。
 *
 * 由 packages/guide-data 的 build script 末尾调用，文章更新后一条命令双端同步。
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await build({
  entryPoints: [path.join(root, 'packages/guide-data/src/index.ts')],
  bundle: true,
  format: 'cjs',
  target: 'es2018',
  outfile: path.join(root, 'apps/miniprogram/utils/guide-data.js'),
  minify: false,
  logLevel: 'info',
})
