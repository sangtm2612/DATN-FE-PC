import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { decodeTokenExp, tryRefreshOrLogout } from '@/lib/auth'

/**
 * Tự động logout / refresh token khi JWT sắp hoặc đã hết hạn.
 *
 * Xử lý 3 trường hợp:
 * 1. App khởi động với token đã expire → refresh ngay
 * 2. Token sẽ expire trong lúc dùng → setTimeout refresh trước 60s
 * 3. Tab/app ngủ rồi wake up (visibilitychange) → re-check ngay
 */
export function useAutoLogout() {
  const accessToken = useAuthStore(s => s.accessToken)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    const exp = decodeTokenExp(accessToken)
    if (!exp) return

    const msUntilExpiry = exp * 1000 - Date.now()

    if (msUntilExpiry <= 0) {
      // Token đã expire → thử refresh ngay
      tryRefreshOrLogout()
      return
    }

    // Schedule refresh trước 60s khi token sắp hết hạn
    const delay = Math.max(msUntilExpiry - 60_000, 0)
    const timer = setTimeout(() => {
      tryRefreshOrLogout()
    }, delay)

    // Re-check khi user quay lại tab (sau khi ngủ/background)
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      const { accessToken: tok, isAuthenticated: auth } = useAuthStore.getState()
      if (!auth || !tok) return
      const tokenExp = decodeTokenExp(tok)
      if (tokenExp && Date.now() / 1000 > tokenExp - 30) {
        tryRefreshOrLogout()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [accessToken, isAuthenticated])
}
