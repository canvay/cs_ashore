// 从题库 JSON 源文件生成 questions.ts（校验字段完整性）。
// 用法：node scripts/extract-questions.mjs [--check]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_JSON = path.join(root, 'packages/heihua-data/data/questions.json')
const OUT = path.join(root, 'packages/heihua-data/src/questions.ts')

const parsed = JSON.parse(fs.readFileSync(SRC_JSON, 'utf8'))
if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('题库为空')
for (const [i, row] of parsed.entries()) {
  if (typeof row.c !== 'string' || typeof row.q !== 'string' || typeof row.a !== 'string')
    throw new Error(`第 ${i} 条字段缺失: ${JSON.stringify(row)}`)
}

const banner = `// 自动生成：来源 data/questions.json（共 ${parsed.length} 条）。勿手改，重跑 scripts/extract-questions.mjs 重新生成。\n`
const body = `export const QUESTIONS_DATA = ${JSON.stringify(parsed, null, 2)} as const\n`

if (process.argv.includes('--check')) {
  const current = fs.readFileSync(OUT, 'utf8')
  const ok = current.startsWith(banner) && current.includes(`共 ${parsed.length} 条`)
  console.log(ok ? `题库校验通过：${parsed.length} 条` : '题库与生成文件不一致，需重新运行提取脚本')
  process.exit(ok ? 0 : 1)
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, banner + body, 'utf8')
console.log(`已写入 ${OUT}（${parsed.length} 条）`)
