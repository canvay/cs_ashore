import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { QUESTIONS } from '@cs/heihua-data'
import { readStats } from '@/lib/game'

/** 工具板块：模块注册表。后续新增工具在这里加一条，并在路由里挂对应页面 */
const MODULES = [
  {
    key: 'quiz',
    title: '黑话挑战',
    to: '/tools/heihua',
  },
] as const

export default function ToolsPage() {
  const stats = readStats()
  return (
    <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-xl flex-col px-4 py-6 sm:py-10 md:max-w-3xl lg:max-w-5xl">
      <div className="py-8 text-center sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">选择一个工具开始</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-foreground/60">
          每个工具都是一个小应用，进度保存在本机。
        </p>
      </div>

      <p className="mb-3 text-xs font-medium tracking-widest text-foreground/50">工具列表</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {MODULES.map((m) => (
          <Link
            key={m.key}
            to={m.to}
            className="flex cursor-pointer items-center gap-4 rounded-2xl border border-accent/25 bg-accent/10 p-4 transition-all active:scale-[0.98]"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-lg font-bold text-accent-foreground">
              申
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold">{m.title}</p>
              <p className="mt-0.5 text-xs text-foreground/60">
                {QUESTIONS.length} 题 · 最高 {stats.best} 分
              </p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-accent" />
          </Link>
        ))}
      </div>

      <p className="mt-auto pt-10 text-center text-xs text-foreground/45">
        更多工具筹备中，敬请期待
      </p>
    </div>
  )
}
