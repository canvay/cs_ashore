import { ArrowLeft, ArrowRight, Volume2, VolumeX } from 'lucide-react'
import { Button, Chip } from '@heroui/react'
import { QUESTIONS } from '@cs/heihua-data'

interface Props {
  stats: { best: number; done: number; wrong: number }
  soundOn: boolean
  onToggleSound: () => void
  onBack: () => void
  onSelectMode: (mode: 'normal' | 'speed' | 'category' | 'wrong') => void
}

export default function HeihuaHomeView({ stats, soundOn, onToggleSound, onBack, onSelectMode }: Props) {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-xl flex-col px-4 py-6 sm:py-10 md:max-w-3xl lg:max-w-5xl">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label="返回工具列表"
            onPress={onBack}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="grid size-9 place-items-center rounded-xl bg-accent text-base font-bold text-accent-foreground">
            申
          </div>
          <span className="font-bold tracking-tight">申论黑话挑战</span>
        </div>
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          aria-label="切换音效"
          onPress={onToggleSound}
        >
          {soundOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </Button>
      </header>

      <div className="flex flex-col items-center gap-8 py-10 text-center sm:py-14 md:flex-row md:items-start md:gap-12 md:text-left lg:py-16">
        <div className="md:flex-1">
          <Chip variant="soft" color="accent" size="lg" className="rounded-full font-normal">
            考公人的词汇速成手册
          </Chip>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            把大白话，翻译成体制内的表达
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-foreground/60 md:mx-0 md:max-w-none md:text-base">
            看到材料别慌。给你一段场景，选出它的规范表达——答得越多，写得越像。
          </p>
        </div>

        <div className="grid w-full max-w-md grid-cols-4 gap-2 sm:gap-3 md:w-64 md:max-w-none md:shrink-0 md:grid-cols-2 lg:w-72">
          {[
            [QUESTIONS.length, '题库总量'],
            [stats.best, '最高分'],
            [stats.done, '累计作答'],
            [stats.wrong, '错题'],
          ].map(([num, label]) => (
            <div key={label as string} className="rounded-2xl bg-white px-2 py-3 text-center shadow-sm">
              <div className="text-lg font-bold tabular-nums text-accent sm:text-xl">{num}</div>
              <div className="mt-0.5 text-[11px] text-foreground/55">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 mb-3 text-xs font-medium tracking-widest text-foreground/50">选择模式</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ['normal', 'MODE 01', '闯关答题', '20 道题，不限时间。选完即判，连击越高加分越多。'],
            ['speed', 'MODE 02', '60 秒速答', '争分夺秒，题目无限循环。手速和记忆力的双重考验。'],
            ['category', 'MODE 03', '分类专练', '八大主题逐个击破，政治管理、经济发展、文化建设……'],
            ['wrong', 'MODE 04', '错题重做', '只练答错过的题。答对一次就把它从错题本里移除。'],
          ] as const
        ).map(([mode, num, title, desc]) => (
          <div
            key={mode}
            role="button"
            tabIndex={0}
            onClick={() => onSelectMode(mode)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectMode(mode)
            }}
            className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium tracking-widest text-warning">{num}</p>
                <p className="mt-1.5 text-base font-bold">{title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-foreground/60">{desc}</p>
              </div>
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-foreground/30" />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-auto pt-10 text-center text-xs text-foreground/45">
        题库来源：《申论规范表达8页》整理版 · 进度与错题保存在本机浏览器
      </p>
    </div>
  )
}
