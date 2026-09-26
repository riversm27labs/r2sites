import { useCallback, useState } from 'react'

type ToastState = { message: string; kind: 'ok' | 'error' } | null

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null)

  const showToast = useCallback((message: string, kind: 'ok' | 'error' = 'ok') => {
    setToast({ message, kind })
    setTimeout(() => setToast(null), 3200)
  }, [])

  return { toast, showToast }
}
