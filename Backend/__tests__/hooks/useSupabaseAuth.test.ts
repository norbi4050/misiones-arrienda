import { renderHook, act } from '@testing-library/react'
import { useSupabaseAuth } from '../../src/hooks/useSupabaseAuth'

// Mock next/navigation
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh
  })
}))

// Mock Supabase client
const mockSignInWithPassword = jest.fn()
const mockSignOut = jest.fn()
const mockSignUp = jest.fn()
const mockGetSession = jest.fn()
const mockOnAuthStateChange = jest.fn()

jest.mock('../../src/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      signUp: mockSignUp,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  })
}))

describe('useSupabaseAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  })

  it('should call router.refresh after successful login', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: '1' }, session: {} },
      error: null
    })

    const { result } = renderHook(() => useSupabaseAuth())

    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })

    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('should call router.refresh after successful logout', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useSupabaseAuth())

    await act(async () => {
      await result.current.logout()
    })

    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('should call router.refresh after successful registration', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: '1', email_confirmed_at: null }, session: {} },
      error: null
    })

    const { result } = renderHook(() => useSupabaseAuth())

    await act(async () => {
      await result.current.register('test@example.com', 'password')
    })

    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('should call router.refresh after successful registration with confirmed email', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: '1', email_confirmed_at: new Date().toISOString() }, session: {} },
      error: null
    })

    const { result } = renderHook(() => useSupabaseAuth())

    await act(async () => {
      await result.current.register('test@example.com', 'password')
    })

    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('should not call router.refresh on login error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' }
    })

    const { result } = renderHook(() => useSupabaseAuth())

    await act(async () => {
      await result.current.login('test@example.com', 'wrongpassword')
    })

    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('should not call router.refresh on logout error', async () => {
    mockSignOut.mockResolvedValue({
      error: { message: 'Logout failed' }
    })

    const { result } = renderHook(() => useSupabaseAuth())

    await act(async () => {
      await result.current.logout()
    })

    expect(mockRefresh).toHaveBeenCalledTimes(1) // Still called even on error for cleanup
  })

  it('should not call router.refresh on registration error', async () => {
    mockSignUp.mockResolvedValue({
      data: null,
      error: { message: 'Registration failed' }
    })

    const { result } = renderHook(() => useSupabaseAuth())

    await act(async () => {
      await result.current.register('test@example.com', 'password')
    })

    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
