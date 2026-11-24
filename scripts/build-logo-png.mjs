/**
 * 品牌图标 SVG → PNG 转换（供微信小程序使用，小程序 <image> 不支持 SVG）。
 * 用法：pnpm logo:png
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = resolve(root, 'assets/brand/forashore-icon.svg')
const outPath = resolve(root, 'apps/miniprogram/images/forashore-icon.png')

const svg = readFileSync(svgPath, 'utf8')
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 160 } })
const png = resvg.render().asPng()

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, png)
console.log(`✓ 已生成 ${outPath}（${png.length} bytes）`)
