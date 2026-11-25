import { Button, Chip } from '@heroui/react'
import type { GameState } from '@/lib/game'

interface Props {
  g: GameState
  onRestart: () => void
  onHome: () => void
}

export default function ResultView({ g, onRestart, onHome }: Props) {
  const total = g.correct + g.wrong
  const acc = total ? Math.round((g.correct / total) * 100) : 0
  const rank = acc >= 90 ? '黑话十级学者' : acc >= 75 ? '申论笔杆子' : acc >= 60 ? '渐入佳境' : '仍需修炼'
  return (
    <div className="mx-auto min-h-svh max-w-xl px-4 py-12 md:max-w-3xl">
      <div className="text-center">
        <p className="text-xs tracking-widest text-foreground/50">本局得分</p>
        <p className="mt-2 text-7xl font-bold tabular-nums text-accent sm:text-8xl">{g.score}</p>
        <Chip variant="primary" color="accent" size="lg" className="mt-4 rounded-full px-4 py-3 text-sm font-bold">
          {rank}
        </Chip>
      </div>

      <div className="mx-auto mt-8 grid max-w-md grid-cols-4 gap-2">
        {[
          [g.correct, '答对'],
          [g.wrong, '答错'],
          [`${acc}%`, '正确率'],
          [g.maxCombo, '最高连击'],
        ].map(([num, label]) => (
          <div key={label as string} className="rounded-2xl bg-white px-2 py-3 text-center shadow-sm">
            <div className="text-lg font-bold tabular-nums">{num}</div>
            <div className="mt-0.5 text-[11px] text-foreground/55">{label}</div>
          </div>
        ))}
      </div>

      {g.mistakes.length > 0 && (
        <div className="mx-auto mt-8 max-w-md rounded-2xl bg-white p-5 shadow-sm md:max-w-2xl">
          <p className="text-sm font-bold">本局错题回顾</p>
          <div className="mt-3">
            {g.mistakes.map((q) => (
              <div key={q.id} className="border-t border-dashed border-foreground/15 py-2.5 text-[13px] leading-relaxed first:border-t-0 first:pt-0">
                <p className="text-foreground/60">{q.q}</p>
                <p className="font-bold text-success">→ {q.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Button onPress={onRestart}>再来一局</Button>
        <Button variant="ghost" onPress={onHome}>返回主菜单</Button>
      </div>
    </div>
  )
}
