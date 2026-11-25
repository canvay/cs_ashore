/* ---------- 本地存储 ---------- */
export const LS = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return fallback
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* ignore */
    }
  },
}
/** localStorage key 前缀沿用 shenlun_*，老用户进度无缝保留 */
export const BEST_KEY = 'shenlun_best'
export const DONE_KEY = 'shenlun_done'
export const WRONG_KEY = 'shenlun_wrong'
export const SOUND_KEY = 'shenlun_sound'
