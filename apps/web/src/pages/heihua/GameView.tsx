import { ArrowLeft } from 'lucide-react'
import { Button, Chip, ProgressBar } from '@heroui/react'
import { MODE_LABELS, type GameState } from '@/lib/game'

interface Props {
  g: GameState
  onBack: () => void
  onAnswer: (i: number) => void
  onNext: () => void
}

export default function GameView({ g, onBack, onAnswer, onNext }: Props) {
  const barPercent = g.mode === 'speed' ? (g.left / 60) * 100 : (g.idx / Math.max(g.queue.length, 1)) * 100
  const timerLow = g.mode === 'speed' && g.left <= 10
  const ok = g.locked && g.current && g.options[g.picked] === g.current.a
  return (
    <div className="mx-auto min-h-svh max-w-xl px-4 py-6 md:max-w-3xl">
      <header className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onPress={onBack}>
          <ArrowLeft className="size-4" /> 退出
        </Button>
        <Chip variant="soft" color="accent">
          {MODE_LABELS[g.mode]}{g.category && ` · ${g.category}`}
        </Chip>
        <div className="ml-auto flex items-center gap-4 text-right text-xs text-foreground/55">
          <div>
            <span className="text-base font-bold tabular-nums text-foreground">{g.score}</span> 分
          </div>
          <div>
            <span className="text-base font-bold tabular-nums text-foreground">
              {g.mode === 'speed' ? `第 ${g.idx + 1} 题` : `${g.idx + 1}/${g.queue.length}`}
            </span>
            <br />
            {g.mode === 'speed' ? (
              <>
                <span className={`font-bold tabular-nums ${timerLow ? 'text-danger' : ''}`}>{g.left}</span> 秒
              </>
            ) : (
              '进度'
            )}
          </div>
        </div>
      </header>

      <ProgressBar aria-label="进度" value={barPercent} className="mt-4">
        <ProgressBar.Track className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
          <ProgressBar.Fill className={`rounded-full ${timerLow ? 'bg-danger' : 'bg-accent'}`} />
        </ProgressBar.Track>
      </ProgressBar>

      <div className="mt-3 h-6 text-center">
        {g.combo >= 2 && (
          <span key={g.combo} className="text-sm font-bold text-accent">
            连击 × {g.combo} {'★'.repeat(Math.min(g.combo, 5))}
          </span>
        )}
      </div>

      {g.current && (
        <div className="mt-2 rounded-2xl bg-white p-5 shadow-sm sm:p-6 md:p-8">
          <Chip size="sm" variant="soft" color="accent" className="w-fit">{g.current.c}</Chip>
          <p className="mt-4 text-lg leading-relaxed font-semibold sm:text-xl md:text-2xl">{g.current.q}</p>
          <p className="mt-1.5 text-[13px] text-foreground/55">上面这种情况，对应的规范表达是？</p>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-2 md:mt-6 md:gap-3">
            {g.options.map((o, i) => {
              const isCorrect = g.locked && o === g.current!.a
              const isWrong = g.locked && i === g.picked && o !== g.current!.a
              return (
                <Button
                  key={`${g.idx}-${i}`}
                  variant="outline"
                  isDisabled={g.locked}
                  onPress={() => onAnswer(i)}
                  className={`h-auto min-h-14 w-full justify-start gap-3 px-4 py-3 text-left font-normal tracking-normal normal-case ${
                    isCorrect ? 'border-success bg-success/10' : isWrong ? 'border-danger bg-danger/10' : ''
                  }`}
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                      isCorrect ? 'bg-success text-success-foreground' : isWrong ? 'bg-danger text-danger-foreground' : 'bg-foreground/10 text-foreground/60'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="whitespace-normal leading-relaxed">{o}</span>
                </Button>
              )
            })}
          </div>

          {g.locked && g.current && (
            <div className={`mt-5 flex-col items-stretch gap-2 rounded-xl p-4 ${ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              <div className="w-full">
                <p className="font-bold">
                  {ok ? '答对了！' : '正确答案'}
                  {g.mode === 'wrong' && ok ? ' · 已从错题本移除' : ''}
                </p>
                {!ok && <p className="mt-1">{g.current.a}</p>}
              </div>
              <Button variant="secondary" size="sm" className="w-full sm:w-auto" onPress={onNext}>
                {g.mode === 'speed' ? '下一题' : '继续'} →
              </Button>
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-foreground/45">按键盘 1 / 2 / 3 / 4 快速选项，Enter 下一题</p>
    </div>
  )
}
