import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Wrench } from 'lucide-react'
import { QUESTIONS } from '@cs/heihua-data'
import { listArticles } from '@/data/guide/articles'

export default function HomePage() {
  const articles = listArticles().slice(0, 3)
  return (
    <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-xl flex-col px-4 py-6 sm:max-w-2xl sm:py-10">
      <div className="py-10 text-center sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          考公指南 + 刷题工具，都在这一站
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-foreground/60">
          从零认识公务员考试，再到上手就练的轻量工具。所有进度保存在本机。
        </p>
      </div>

      <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
        {/* 指南板块 */}
        <section>
          <p className="mb-3 text-xs font-medium tracking-widest text-foreground/50">指南</p>
          <Link
            to="/guide"
            className="group flex cursor-pointer flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="grid size-11 place-items-center rounded-xl bg-accent/10 text-accent">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-base font-bold">考公指南</p>
              <p className="mt-1 text-[13px] leading-6 text-foreground/60">
                {articles[0]?.summary}
              </p>
            </div>
            <div className="mt-auto flex items-center gap-1.5 text-xs font-medium text-accent">
              开始阅读
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </section>

        {/* 工具板块 */}
        <section>
          <p className="mb-3 text-xs font-medium tracking-widest text-foreground/50">工具</p>
          <Link
            to="/tools"
            className="group flex cursor-pointer flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="grid size-11 place-items-center rounded-xl bg-accent/10 text-accent">
              <Wrench className="size-5" />
            </div>
            <div>
              <p className="text-base font-bold">备考工具箱</p>
              <p className="mt-1 text-[13px] leading-6 text-foreground/60">
                申论黑话挑战 · {QUESTIONS.length} 题，闯关 / 速答 / 错题重做
              </p>
            </div>
            <div className="mt-auto flex items-center gap-1.5 text-xs font-medium text-accent">
              打开工具
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </section>
      </div>

      <p className="mt-auto pt-10 text-center text-xs text-foreground/45">
        何以上岸 · ForAshore
      </p>
    </div>
  )
}
