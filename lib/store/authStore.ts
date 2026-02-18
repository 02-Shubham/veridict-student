import { create } from 'zustand'
import type { Student } from '../types'

interface AuthState {
  user: Student | null
  isAuthenticated: boolean
  setUser: (user: Student | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false })
}))
