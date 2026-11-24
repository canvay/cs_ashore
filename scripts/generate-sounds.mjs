/**
 * 生成小程序答题音效（PCM WAV，16bit 单声道 22050Hz）。
 * Web 端用 Web Audio 实时合成；小程序 <InnerAudioContext> 不支持合成，只能播音频文件。
 * 用法：pnpm sounds
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SR = 22050
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'apps/miniprogram/audio')

function wavFile(samples) {
  const n = samples.length
  const buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + n * 2, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20) // PCM
  buf.writeUInt16LE(1, 22) // mono
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2)
  }
  return buf
}

/** 单段音：freq 可从 from 滑到 to；含 5ms 起音 + 尾部衰减包络 */
function tone(freq, dur, { from = freq, to = freq, amp = 0.5 } = {}) {
  const n = Math.round(SR * dur)
  const out = new Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / n
    const f = from + (to - from) * t
    const env = Math.min(1, i / (SR * 0.005), (n - i) / (SR * 0.06))
    out[i] = Math.sin((2 * Math.PI * f * i) / SR) * env * amp
  }
  return out
}

const sounds = {
  /* 答对：880Hz → 1318Hz 两连上行音（与 Web 端一致的清脆提示） */
  'correct.wav': [...tone(880, 0.09), ...tone(1318.5, 0.16)],
  /* 答错：200Hz → 140Hz 下滑低音 */
  'wrong.wav': tone(200, 0.28, { from: 200, to: 140, amp: 0.55 }),
}

fs.mkdirSync(outDir, { recursive: true })
for (const [name, samples] of Object.entries(sounds)) {
  const out = path.join(outDir, name)
  fs.writeFileSync(out, wavFile(samples))
  console.log(`✓ ${path.relative(root, out)}（${fs.statSync(out).size} bytes）`)
}
