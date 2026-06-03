import { useEffect, useState } from 'react'
import type { ClickerState } from '../types'

const initial: ClickerState = {
  active: false,
  totalClicks: 0,
  measuredCps: 0,
  startedAt: null,
  capturing: null
}

export function useClickerState() {
  const [state, setState] = useState<ClickerState>(initial)

  useEffect(() => {
    const off = window.api.onStateChange(setState)
    return off
  }, [])

  return state
}
