import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button, Chip } from '@heroui/react'
import { CATS, countByCat } from '@cs/heihua-data'

interface Props {
  onBack: () => void
  onStart: (category: string) => void
}

export default function CategoriesView({ onBack, onStart }: Props) {
  return (
    <div className="mx-auto min-h-svh max-w-xl px-4 py-6 md:max-w-3xl">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onPress={onBack}>
          <ArrowLeft className="size-4" /> 返回
        </Button>
        <Chip variant="soft" color="accent">分类专练</Chip>
      </header>
      <p className="mt-8 mb-3 text-xs font-medium tracking-widest text-foreground/50">选择一个主题</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATS.map((c) => (
          <div
            key={c}
            role="button"
            tabIndex={0}
            onClick={() => onStart(c)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onStart(c)
            }}
            className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold">{c}</p>
              <span className="flex items-center gap-1 text-xs text-foreground/55">
                {countByCat(c)} 题
                <ArrowRight className="size-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
