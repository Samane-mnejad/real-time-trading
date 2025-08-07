import { AuthService } from '../services/AuthService';
import { MOCK_USERS } from '../types/auth';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const credentials = {
        email: 'frank-amankwah@demo.com',
        password: 'demo'
      };

      const response = await authService.login(credentials);

      expect(response).toBeDefined();
      expect(response.user).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.user.email).toBe(credentials.email);
      expect(response.user.name).toBe('Frank Amankwah');
      expect(response.user.id).toBe('1');
      // Password should not be in the response
      expect('password' in response.user).toBe(false);
    });

    it('should fail login with invalid email', async () => {
      const credentials = {
        email: 'invalid@example.com',
        password: 'password123'
      };

      await expect(authService.login(credentials)).rejects.toThrow('Username and password are incorrect');
    });

    it('should fail login with invalid password', async () => {
      const credentials = {
        email: 'frank-amankwah@demo.com',
        password: 'wrongpassword'
      };

      await expect(authService.login(credentials)).rejects.toThrow('Username and password are incorrect');
    });

    it('should fail login with empty email', async () => {
      const credentials = {
        email: '',
        password: 'password123'
      };

      await expect(authService.login(credentials)).rejects.toThrow('Username and password are required');
    });

    it('should fail login with empty password', async () => {
      const credentials = {
        email: 'frank-amankwah@demo.com',
        password: ''
      };

      await expect(authService.login(credentials)).rejects.toThrow('Username and password are required');
    });

    it('should generate unique tokens for multiple logins', async () => {
      const credentials = {
        email: 'frank-amankwah@demo.com',
        password: 'demo'
      };

      const response1 = await authService.login(credentials);
      const response2 = await authService.login(credentials);

      expect(response1.token).not.toBe(response2.token);
    });

    it('should simulate API delay', async () => {
      const credentials = {
        email: 'frank-amankwah@demo.com',
        password: 'demo'
      };

      const startTime = Date.now();
      await authService.login(credentials);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(500);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const credentials = {
        email: 'frank-amankwah@demo.com',
        password: 'demo'
      };

      const loginResponse = await authService.login(credentials);
      const user = await authService.verifyToken(loginResponse.token);

      expect(user).toBeDefined();
      expect(user!.email).toBe(credentials.email);
      expect(user!.id).toBe('1');
    });

    it('should return null for invalid token', async () => {
      const user = await authService.verifyToken('invalid-token');
      expect(user).toBeNull();
    });

    it('should return null for empty token', async () => {
      const user = await authService.verifyToken('');
      expect(user).toBeNull();
    });
  });

  describe('logout', () => {
    it('should successfully logout with valid token', async () => {
      const credentials = {
        email: 'frank-amankwah@demo.com',
        password: 'demo'
      };

      const loginResponse = await authService.login(credentials);
      
      // Verify token is valid before logout
      let user = await authService.verifyToken(loginResponse.token);
      expect(user).toBeDefined();

      // Logout
      await authService.logout(loginResponse.token);

      // Verify token is invalid after logout
      user = await authService.verifyToken(loginResponse.token);
      expect(user).toBeNull();
    });

    it('should not throw error for invalid token logout', async () => {
      await expect(authService.logout('invalid-token')).resolves.toBeUndefined();
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh valid token', async () => {
      const credentials = {
        email: 'frank-amankwah@demo.com',
        password: 'demo'
      };

      const loginResponse = await authService.login(credentials);
      const refreshResponse = await authService.refreshToken(loginResponse.token);

      expect(refreshResponse).toBeDefined();
      expect(refreshResponse!.user).toBeDefined();
      expect(refreshResponse!.token).toBeDefined();
      expect(refreshResponse!.token).not.toBe(loginResponse.token);
      expect(refreshResponse!.user.email).toBe(credentials.email);

      // Old token should be invalid
      const userWithOldToken = await authService.verifyToken(loginResponse.token);
      expect(userWithOldToken).toBeNull();

      // New token should be valid
      const userWithNewToken = await authService.verifyToken(refreshResponse!.token);
      expect(userWithNewToken).toBeDefined();
    });

    it('should return null for invalid token refresh', async () => {
      const refreshResponse = await authService.refreshToken('invalid-token');
      expect(refreshResponse).toBeNull();
    });
  });

  describe('session management', () => {
    it('should handle multiple concurrent sessions', async () => {
      const user1Credentials = {
        email: 'frank-amankwah@demo.com',
        password: 'demo'
      };

      const user2Credentials = {
        email: 'jane-doe@demo.com',
        password: 'demo123'
      };

      const login1 = await authService.login(user1Credentials);
      const login2 = await authService.login(user2Credentials);

      // Both tokens should be valid
      const user1 = await authService.verifyToken(login1.token);
      const user2 = await authService.verifyToken(login2.token);

      expect(user1).toBeDefined();
      expect(user2).toBeDefined();
      expect(user1!.email).toBe(user1Credentials.email);
      expect(user2!.email).toBe(user2Credentials.email);

      // Logout one user shouldn't affect the other
      await authService.logout(login1.token);

      const user1AfterLogout = await authService.verifyToken(login1.token);
      const user2AfterLogout = await authService.verifyToken(login2.token);

      expect(user1AfterLogout).toBeNull();
      expect(user2AfterLogout).toBeDefined();
    });
  });
}); 