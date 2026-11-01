import type { User } from '../../src/users/user'

export const createUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  active: true,
  ...overrides,
})
