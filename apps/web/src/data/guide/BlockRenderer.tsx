import { useEffect, useId, useState } from 'react'
import type { GuideBlock } from './types'

/** Mermaid 块：动态加载 mermaid（仅文章用到图时才下载），渲染失败时降级显示源码 */
function MermaidView({ code }: { code: string }) {
  const reactId = useId()
  const [svg, setSvg] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    import('mermaid')
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          /* 与站点主题一致：PingFang/雅黑、亮蓝连线；节点配色由文中 classDef 控制 */
          themeVariables: {
            /* 字体与站点一致：优先苹方、雅黑 */
            fontFamily: '"PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif',
            fontSize: '14px',
            lineColor: '#93c5fd',
            edgeLabelBackground: '#ffffff',
          },
          /* 连线一律用折线（直角） */
          flowchart: { curve: 'step', nodeSpacing: 32, rankSpacing: 56, padding: 10 },
        })
        const { svg } = await mermaid.render(`mermaid-${reactId.replace(/[^a-zA-Z0-9-]/g, '')}`, code)
        if (!cancelled) {
          setSvg(svg)
          setFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSvg('')
          setFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [code, reactId])

  if (failed) {
    return (
      <pre className="mt-5 overflow-x-auto rounded-2xl bg-foreground/5 p-4 text-xs leading-6 text-foreground/60">
        {code}
      </pre>
    )
  }
  if (!svg) {
    return <div className="mt-5 h-40 animate-pulse rounded-2xl bg-foreground/5" />
  }
  /* svg 由 mermaid 在本地从静态语法生成，无外部输入 */
  return (
    <div
      className="mt-5 overflow-x-auto rounded-2xl bg-white p-4 shadow-sm sm:p-6 [&_svg]:mx-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

/** GuideBlock → JSX：与站点主题（纯白底、亮蓝 accent、rounded-2xl 卡片）统一的富文本渲染 */
export default function BlockRenderer({ block, first }: { block: GuideBlock; first?: boolean }) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 className={`${first ? '' : 'mt-10 '}mb-3 text-xl font-bold tracking-tight`}>{block.text}</h2>
      )
    case 'p':
      return <p className={`${first ? '' : 'mt-5 '}text-[15px] leading-8 text-foreground/80`}>{block.text}</p>
    case 'list':
      return (
        <ul className="mt-5 space-y-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-7 text-foreground/80">
              <span className="mt-[11px] size-1.5 shrink-0 rounded-full bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case 'steps':
      return (
        <ol className="mt-5 space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-7 text-foreground/80">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-foreground/10 text-xs font-bold text-foreground/60">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )
    case 'table':
      return (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-foreground/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-foreground/5">
                {block.head.map((h, i) => (
                  <th key={i} className="px-3.5 py-2.5 font-bold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-foreground/10">
                  {row.map((cell, j) => (
                    <td key={j} className={`px-3.5 py-2.5 leading-6 ${j === 0 ? 'font-medium whitespace-nowrap' : 'text-foreground/75'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'mermaid':
      return <MermaidView code={block.code} />
    case 'callout': {
      const toneCls =
        block.tone === 'info' ? 'bg-accent/10 text-accent'
        : block.tone === 'tip' ? 'bg-success/10 text-success'
        : 'bg-warning/10 text-warning'
      return (
        <div className={`mt-5 rounded-2xl p-4 text-sm leading-7 ${toneCls}`}>{block.text}</div>
      )
    }
  }
}
