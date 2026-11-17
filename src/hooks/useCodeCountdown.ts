import { useEffect, useState } from 'react'
import type { CodeTiming } from '../services/auth.service'

export function formatCodeCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function useCodeCountdown() {
  const [now, setNow] = useState(Date.now)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [resendAt, setResendAt] = useState<number | null>(null)

  useEffect(() => {
    if (expiresAt === null && resendAt === null) return
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [expiresAt, resendAt])

  function start(timing: CodeTiming) {
    const startedAt = Date.now()
    setNow(startedAt)
    setExpiresAt(startedAt + Math.max(0, timing.expires_in_seconds) * 1000)
    setResendAt(startedAt + Math.max(0, timing.resend_after_seconds) * 1000)
  }

  function reset() {
    setNow(Date.now())
    setExpiresAt(null)
    setResendAt(null)
  }

  const expiresInSeconds = expiresAt === null ? null : Math.max(0, Math.ceil((expiresAt - now) / 1000))
  const resendInSeconds = resendAt === null ? null : Math.max(0, Math.ceil((resendAt - now) / 1000))

  return { start, reset, expiresInSeconds, resendInSeconds }
}
