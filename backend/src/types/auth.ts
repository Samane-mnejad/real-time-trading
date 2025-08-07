export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface MockUser extends User {
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    email: 'frank-amankwah@demo.com',
    name: 'Frank Amankwah',
    password: 'demo'
  },
  {
    id: '2',
    email: 'jane-doe@demo.com',
    name: 'Jane Doe',
    password: 'demo123'
  },
]; 