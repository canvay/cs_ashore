/** 音效开关与播放（Web 端用 Web Audio 实时合成；小程序播放预生成的 wav，见 scripts/generate-sounds.mjs） */
const SOUND_KEY = 'shenlun_sound'

export function getSoundOn(): boolean {
  return wx.getStorageSync(SOUND_KEY) !== 0
}

export function setSoundOn(on: boolean) {
  wx.setStorageSync(SOUND_KEY, on ? 1 : 0)
}

export function playAnswerSound(ok: boolean) {
  if (!getSoundOn()) return
  try {
    const ctx = wx.createInnerAudioContext()
    ctx.src = ok ? '/audio/correct.wav' : '/audio/wrong.wav'
    ctx.onEnded(() => ctx.destroy())
    ctx.onError(() => ctx.destroy())
    ctx.play()
  } catch {
    /* ignore */
  }
}
