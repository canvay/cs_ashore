import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@heroui/react'
import { getArticle, listArticles } from '@/data/guide/articles'
import BlockRenderer from '@/data/guide/BlockRenderer'

export default function GuideArticlePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const article = getArticle(slug ?? '')

  if (!article) {
    return (
      <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-bold">文章不存在</p>
        <p className="text-sm text-foreground/60">它可能还没写出来，或者链接打错了。</p>
        <Button variant="ghost" onPress={() => navigate('/guide')}>
          <ArrowLeft className="size-4" /> 返回指南列表
        </Button>
      </div>
    )
  }

  const sorted = listArticles()
  const idx = sorted.findIndex((a) => a.slug === article.slug)
  const prev = idx > 0 ? sorted[idx - 1] : null
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <Button variant="ghost" size="sm" className="-ml-2" onPress={() => navigate('/guide')}>
        <ArrowLeft className="size-4" /> 考公指南
      </Button>

      <header className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{article.title}</h1>
        <p className="mt-3 text-xs text-foreground/50">
          {article.date} · 约 {article.minutes} 分钟
        </p>
      </header>

      <article className="mt-8">
        {article.blocks.map((b, i) => (
          <BlockRenderer key={i} block={b} first={i === 0} />
        ))}
      </article>

      <nav className="mt-12 border-t border-foreground/10 pt-6">
        {prev && (
          <Link
            to={`/guide/${prev.slug}`}
            className="group flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <ArrowLeft className="size-4 shrink-0 text-foreground/30" />
            <div className="min-w-0">
              <p className="text-xs text-foreground/50">上一篇</p>
              <p className="mt-0.5 truncate text-sm font-bold">{prev.title}</p>
            </div>
          </Link>
        )}
        {next && (
          <Link
            to={`/guide/${next.slug}`}
            className={`group flex items-center justify-end gap-3 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md ${prev ? 'mt-3' : ''}`}
          >
            <div className="min-w-0 text-right">
              <p className="text-xs text-foreground/50">下一篇</p>
              <p className="mt-0.5 truncate text-sm font-bold">{next.title}</p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-foreground/30" />
          </Link>
        )}
      </nav>
    </div>
  )
}
