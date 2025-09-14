/**
 * 🧪 FIXTURES DE USUARIOS PARA TESTING
 */

import { User } from '@/types';

export const testUsers: User[] = [
  {
    id: 'user-1',
    email: 'inquilino@test.com',
    name: 'Juan Inquilino',
    role: 'USER',
    user_type: 'inquilino',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'dueno@test.com',
    name: 'María Dueña',
    role: 'USER',
    user_type: 'dueno_directo',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-3',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'ADMIN',
    user_type: 'inmobiliaria',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

export const createTestUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
  user_type: 'inquilino',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});
