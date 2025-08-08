import { User, LoginCredentials, AuthResponse, MOCK_USERS } from '../types/auth';

export class AuthService {
  private sessions: Map<string, User> = new Map();

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate input
    if (!credentials.email || !credentials.password) {
      throw new Error('Username and password are required');
    }

    // Find user by email
    const mockUser = MOCK_USERS.find(u => u.email === credentials.email);
    
    if (!mockUser) {
      throw new Error('Username and password are incorrect');
    }

    // Validate password
    if (mockUser.password !== credentials.password) {
      throw new Error('Username and password are incorrect');
    }

    // Convert MockUser to User (remove password from response)
    const user: User = {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      avatar: mockUser.avatar
    };

    // Generate mock token
    const token = this.generateMockToken(user);
    
    // Store session
    this.sessions.set(token, user);

    return {
      user,
      token
    };
  }

  async verifyToken(token: string): Promise<User | null> {
    // In a real app, you'd verify JWT signature here
    const user = this.sessions.get(token);
    return user || null;
  }

  async logout(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async refreshToken(oldToken: string): Promise<AuthResponse | null> {
    const user = this.sessions.get(oldToken);
    
    if (!user) {
      return null;
    }

    // Remove old session
    this.sessions.delete(oldToken);
    
    // Create new token
    const token = this.generateMockToken(user);
    this.sessions.set(token, user);

    return {
      user,
      token
    };
  }

  private generateMockToken(user: User): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `mock-token-${user.id}-${timestamp}-${random}`;
  }
} 