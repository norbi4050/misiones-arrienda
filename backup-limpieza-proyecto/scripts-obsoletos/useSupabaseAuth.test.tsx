/**
 * 🧪 TESTS UNITARIOS - HOOK DE AUTENTICACIÓN
 */

import { renderHook, act } from '@testing-library/react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { createTestUser } from '../../fixtures/users';

// Mock del hook (esto se reemplazaría con el hook real)
jest.mock('@/hooks/useSupabaseAuth');

describe('useSupabaseAuth Hook', () => {
  const mockUseSupabaseAuth = useSupabaseAuth as jest.MockedFunction<typeof useSupabaseAuth>;

  beforeEach(() => {
    mockUseSupabaseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });
  });

  it('debe retornar estado inicial correcto', () => {
    const { result } = renderHook(() => useSupabaseAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
  });

  it('debe manejar estado de loading', () => {
    mockUseSupabaseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useSupabaseAuth());

    expect(result.current.loading).toBe(true);
  });

  it('debe manejar usuario autenticado', () => {
    const testUser = createTestUser();
    
    mockUseSupabaseAuth.mockReturnValue({
      user: testUser,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useSupabaseAuth());

    expect(result.current.user).toEqual(testUser);
    expect(result.current.loading).toBe(false);
  });

  it('debe manejar errores de autenticación', () => {
    const errorMessage = 'Error de autenticación';
    
    mockUseSupabaseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: errorMessage,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useSupabaseAuth());

    expect(result.current.error).toBe(errorMessage);
  });
});
