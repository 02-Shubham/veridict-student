import { create } from 'zustand'
import type { AppScreen } from '../types'

interface UIState {
  screen: AppScreen
  error: string | null
  isLoading: boolean
  setScreen: (screen: AppScreen) => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  screen: 'LOGIN',
  error: null,
  isLoading: false,
  setScreen: (screen) => set({ screen, error: null }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading })
}))
