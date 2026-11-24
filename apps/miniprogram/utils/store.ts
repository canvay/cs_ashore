/** 本地存储（进度/错题/最高分），key 与 Web 端语义一致但相互独立 */
export const BEST_KEY = 'shenlun_best'
export const DONE_KEY = 'shenlun_done'
export const WRONG_KEY = 'shenlun_wrong'

export function getNum(key: string, fallback: number): number {
  const v = wx.getStorageSync(key)
  return v === '' || v === undefined ? fallback : Number(v)
}

export function getIds(key: string): number[] {
  const v = wx.getStorageSync(key)
  return Array.isArray(v) ? v.map(Number) : []
}

export function setStore(key: string, value: number | number[]) {
  wx.setStorageSync(key, value)
}

export function readStats() {
  return {
    best: getNum(BEST_KEY, 0),
    done: getNum(DONE_KEY, 0),
    wrong: getIds(WRONG_KEY).length,
  }
}
