import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { listArticles } from '@/data/guide/articles'

export default function GuideListPage() {
  const articles = listArticles()
  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-10 md:max-w-3xl lg:max-w-5xl">
      <div className="py-6 text-center sm:py-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">考公指南</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-foreground/60">
          从「考公是什么」开始：认识考试的本质，和要考的科目。
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {articles.map((a) => (
          <Link
            key={a.slug}
            to={`/guide/${a.slug}`}
            className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start gap-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-lg font-bold text-accent">
                {a.order}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold">{a.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-foreground/60">{a.summary}</p>
                <p className="mt-2 text-xs text-foreground/45">
                  {a.date} · 约 {a.minutes} 分钟
                </p>
              </div>
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-foreground/30" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
